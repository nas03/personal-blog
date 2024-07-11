/* constant */
const { flag } = require('constant')
const _ = require('lodash')
const utility = require('utility')

/* DB */
const db = require('db').helper

const getAll = async (isShowOnlyEnable) => {
  const query = db('m_symbol')
    .select(
      'id',
      'broker_id',
      'account_type_id',
      'product_type_id',
      'platform',
      'formal_symbol',
      'symbol_name',
      'margin_currency',
      'profit_currency',
      'enable_flag',
    )
    .where({
      delete_flag: flag.FALSE,
    })
  if (isShowOnlyEnable === 'true' || isShowOnlyEnable === true) {
    query.where('enable_flag', flag.TRUE)
  }
  return await query
}

const getListSymbolsMaster = async (queryString, pagination, isExport) => {
  try {
    const query = db('m_symbol as ms')
      .leftJoin('m_broker as mb', 'ms.broker_id', 'mb.id')
      .leftJoin('m_account_type as mat', 'ms.account_type_id', 'mat.id')
      .leftJoin('m_product_type as mpt', 'ms.product_type_id', 'mpt.id')
      .select(
        'ms.id',
        'ms.broker_id',
        'mb.broker_name',
        'mb.ja_broker_name',
        'mb.en_broker_name',
        'mb.cn_broker_name',
        'mb.kr_broker_name',
        'mb.broker_sequence',
        'ms.account_type_id',
        'mat.account_type_name',
        'mat.account_type_sequence',
        'ms.product_type_id',
        'mpt.ja_division as ja_product_type_name',
        'mpt.en_division as en_product_type_name',
        'mpt.cn_division as cn_product_type_name',
        'mpt.kr_division as kr_product_type_name',
        'mpt.product_sequence',
        'mpt.division_sequence',
        'ms.platform',
        'ms.formal_symbol',
        'ms.symbol_name',
        'ms.contract_size',
        'ms.digit_size',
        db.raw('CAST(ms.digit_size AS CHAR) AS digit_size_csv'),
        db.raw('CASE WHEN ms.digit_size > 0 AND ms.digit_size < 1 THEN (LENGTH(CAST(ms.digit_size AS CHAR)) - 2) ELSE 0 END AS digit_size_number'),
        'ms.margin_currency',
        'ms.profit_currency',
        'ms.enable_flag',
        'ms.ts_regist',
        'ms.ts_update',
      )
      .where('ms.delete_flag', flag.FALSE)
      .where('mb.delete_flag', flag.FALSE)
      .where('mb.enable_flag', flag.TRUE)
      .where('mpt.delete_flag', flag.FALSE)
      .where('mpt.enable_flag', flag.TRUE)
      .where('mat.delete_flag', flag.FALSE)
      .where('mat.enable_flag', flag.TRUE)

    /* Handle queryString */
    if (queryString.symbol && queryString.symbol.trim()) {
      const symbolSearch = utility.escapeSql(queryString.symbol.trim())
      query.where((builder) =>
        builder
          .whereILike('ms.formal_symbol', `%${symbolSearch}%`)
          .orWhereILike('ms.symbol_name', `%${symbolSearch}%`),
      )
    }

    if (queryString.broker) {
      query.whereIn('ms.broker_id', queryString.broker.split(','))
    }

    if (queryString.product_type) {
      query.whereIn('ms.product_type_id', queryString.product_type.split(','))
    }

    if (queryString.platform) {
      query.where('ms.platform', queryString.platform.toLowerCase())
    }

    /* Handle show valid only */
    if (queryString.show_valid === '1') {
      query.where('ms.enable_flag', flag.TRUE)
    }

    /* Handle sort and paginate */
    let orderArr = [
      { column: 'mb.broker_sequence', order: 'ASC' },
      { column: 'mpt.product_sequence', order: 'ASC' },
      { column: 'mat.account_type_sequence', order: 'ASC' },
      { column: 'ms.platform', order: 'ASC' },
      { column: 'ms.symbol_name', order: 'ASC' },
    ]
    if (queryString.sort) {
      const sortArr = queryString.sort.split(',')
      if (sortArr && sortArr[0] === 'product_sequence') {
        orderArr = [
          { column: 'mpt.division_sequence', order: sortArr[1] },
          ...orderArr,
        ]
      }
      orderArr = [...pagination.sort, ...orderArr]
    }

    if (isExport) {
      return await query.orderBy(orderArr)
    }

    return await query.orderBy(orderArr).paginate(pagination)
  } catch (error) {
    console.log(error)
    return null
  }
}

const getSymbolMaster = async (id) => {
  return await db('m_symbol')
    .select(
      'id',
      'broker_id',
      'account_type_id',
      'product_type_id',
      'platform',
      'formal_symbol',
      'symbol_name',
      'contract_size',
      'digit_size',
      'margin_currency',
      'profit_currency',
      'enable_flag',
    )
    .where('id', id)
    .where('delete_flag', flag.FALSE)
    .first()
}

const updateSymbolsMaster = async (updateData, id) => {
  return await db.transaction(async (trx) => {
    // Handle update 1 record
    if (id) {
      const isUpdate = await trx('m_symbol').where({ id }).update(updateData)
      if (!isUpdate) return false

      // soft delete all symbol in rebate_detail
      if (updateData.enable_flag === flag.FALSE) {
        await trx('m_rebate_details')
          .update({
            delete_flag: flag.TRUE,
          })
          .where({
            symbol_id: id,
            delete_flag: flag.FALSE,
          })
      }

      return true
    }

    // Handle update multi record with its data
    const chunkedUpdateData = _.chunk(updateData, 10)
    await Promise.all(
      chunkedUpdateData.map((chunk) => {
        const updatePromises = chunk.map((data) =>
          trx('m_symbol')
            .where({ id: data.id })
            .update(data),
        )
        return Promise.all(updatePromises)
      }),
    )

    return true
  })
}

const getListForCheckImport = async () => {
  return await db('m_symbol')
    .select(
      'id',
      'broker_id',
      'account_type_id',
      'platform',
      'product_type_id',
      'formal_symbol',
      'symbol_name',
      'contract_size',
      'digit_size',
      'margin_currency',
      'profit_currency',
    )
    .where('delete_flag', flag.FALSE)
}

const createSymbolMaster = async (payload) => {
  return await db.transaction(async (trx) => {
    const insert = await trx('m_symbol').insert(payload)
    if (!insert.length) {
      return false
    }
    return insert[0]
  })
}

const getDefaultSymbol = async (brokerId, accountTypeId, productTypeId, platform, pagination, queryString) => {
  const defaultSort = [{ column: 'division_sequence', order: 'ASC' }, { column: 'symbol_name', order: 'ASC' }, { column: 'symbol_id', order: 'DESC' }]
  const orderBy = queryString.sort ? [...pagination.sort, ...defaultSort] : defaultSort

  return await db('m_symbol')
    .leftJoin(
      'm_product_type',
      'm_symbol.product_type_id',
      'm_product_type.id',
    )
    .select(
      'm_symbol.id as symbol_id',
      'm_symbol.broker_id',
      'm_symbol.account_type_id',
      'm_symbol.product_type_id',
      'm_symbol.platform',
      'm_symbol.formal_symbol',
      'm_symbol.symbol_name',
      'm_symbol.margin_currency',
      'm_symbol.profit_currency',
      'm_symbol.contract_size',
      'm_symbol.digit_size',
      'm_product_type.ja_product_type',
      'm_product_type.en_product_type',
      'm_product_type.cn_product_type',
      'm_product_type.kr_product_type',
      'm_product_type.division_sequence',
      'm_product_type.ja_division',
      'm_product_type.en_division',
      'm_product_type.cn_division',
      'm_product_type.kr_division',
    )
    .where('m_symbol.broker_id', brokerId)
    .where('m_symbol.account_type_id', accountTypeId)
    .whereIn('m_symbol.product_type_id', productTypeId)
    .where('m_symbol.platform', platform)
    .where('m_symbol.delete_flag', flag.FALSE)
    .where('m_symbol.enable_flag', flag.TRUE)
    .orderBy(orderBy)
}

const getlistSymbolByRebate = (rebate) => {
  return db('m_symbol as s')
    .select(
      db.raw(`${rebate.id} AS rebate_id`),
      db.raw('0 AS enable_flag'),
      's.formal_symbol',
      's.symbol_name',
      's.contract_size',
      's.digit_size',
      's.margin_currency',
      's.id AS symbol_id',
      's.profit_currency',
      's.product_type_id',
      db.raw('0 AS lot_rebate'),
      db.raw('\'USD\' AS lot_rebate_currency'),
      db.raw('0 AS cb_rebate'),
      db.raw('\'USD\' AS cb_rebate_currency'),
    )
    .leftJoin('m_product_type AS p', 's.product_type_id', 'p.id')
    .leftJoin('m_account_type AS ac', 's.account_type_id', 'ac.id')
    .leftJoin('m_broker AS b', 's.broker_id', 'b.id')
    .leftJoin('m_rebate_details AS d', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('s.id', 'd.symbol_id')
        .on('d.delete_flag', flag.FALSE)
        .on('d.rebate_id', rebate.id)
    })
    .where('s.broker_id', rebate.broker_id)
    .where('s.platform', rebate.platform)
    .where('s.account_type_id', rebate.account_type_id)
    .where( 's.delete_flag', flag.FALSE )
    .where('p.en_product_type', rebate.en_product_type)
    .where('p.enable_flag', flag.TRUE )
    .where( 'p.delete_flag', flag.FALSE )
    .where('b.enable_flag', flag.TRUE)
    .where( 'b.delete_flag', flag.FALSE )
    .where('ac.enable_flag', flag.TRUE)
    .where('ac.delete_flag', flag.FALSE)
    .where('s.enable_flag', flag.TRUE )
    .whereNull('d.id')
}

module.exports = {
  getAll,
  getListSymbolsMaster,
  updateSymbolsMaster,
  getSymbolMaster,
  getListForCheckImport,
  createSymbolMaster,
  getDefaultSymbol,
  getlistSymbolByRebate,
}
