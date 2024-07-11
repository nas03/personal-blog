const { flag } = require('constant')

/* eslint-disable require-jsdoc */
const db = require('db').helper
/* func */
const utility = require('utility')

const { getlistSymbolByRebate } = require('./m_symbol_repository')

const getRebateDetailById = async (condition, sortArr) => {
  let { id, textSearch, isShowOnlyEnable } = condition
  const result = await db('m_rebates AS r')
    .leftJoin('m_broker as b', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('r.broker_id', 'b.id')
        .on('b.delete_flag', flag.FALSE)
    })
    .leftJoin('m_account_type AS a', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('r.account_type_id', 'a.id')
    })
    .leftJoin('m_ib_rank AS i', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('r.ib_rank_id', 'i.id')
    })
    .leftJoin('m_product_type AS p', function() {
      /* eslint-disable no-invalid-this */
      this
        .on(db.raw('SUBSTRING_INDEX(r.product_type_id, \',\', 1)'), 'p.id')
    })
    .leftJoin('m_rebate_details AS d', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('d.rebate_id', 'r.id')
        .on('d.delete_flag', flag.FALSE)
        .on('d.enable_flag', flag.FALSE)
    })
    .select(
      'r.id',
      'b.broker_name',
      'b.broker_code',
      'r.broker_id',
      'r.account_type_id',
      'r.product_type_id',
      'r.platform',
      'a.account_type_name',
      'a.account_type_code',
      'i.id AS ib_rank_id',
      'i.ib_rank',
      'i.ib_rank_name',
      'p.ja_product_type',
      'p.en_product_type',
      'p.cn_product_type',
      'p.kr_product_type',
      'r.master_name',
      'r.ts_start',
      'r.ts_end',
      'r.ts_regist',
      'r.description',
    )
    .count('d.rebate_id AS total_record_disable')
    .where('r.delete_flag', flag.FALSE)
    .where('r.id', id)
    .groupBy('r.id')
    .first()

  if (!result) {
    return {}
  }


  const query = db('m_rebate_details AS d')
    .leftJoin('m_rebates AS r', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('r.id', 'd.rebate_id')
        .on('r.delete_flag', flag.FALSE)
    })
    .leftJoin('m_symbol AS s', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('s.id', 'd.symbol_id')
        .on('s.delete_flag', flag.FALSE)
    })
    .leftJoin('m_product_type AS p', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('p.id', 's.product_type_id')
        .on('p.delete_flag', flag.FALSE)
    })
    .select(
      'd.id',
      'd.rebate_id',
      'd.enable_flag',
      'd.formal_symbol',
      'd.symbol_name',
      'd.contract_size',
      'd.digit_size',
      'd.margin_currency',
      db.raw(`${null} AS product_type_id`),
      db.raw(`${null} AS symbol_id`),
      'p.ja_product_type',
      'p.en_product_type',
      'p.cn_product_type',
      'p.kr_product_type',
      'd.profit_currency',
      'd.lot_rebate',
      'd.lot_rebate_currency',
      'd.cb_rebate',
      'd.cb_rebate_currency',
      'd.ts_regist AS ts_regist',
      'd.ts_update AS ts_update',
    )
    .where('d.rebate_id', id)
    .where('d.delete_flag', flag.FALSE)
    .where((builder) => {
      if (isShowOnlyEnable === 'true') {
        builder.where('d.enable_flag', flag.TRUE)
      }
    })

  if (textSearch) {
    query.where((builder) => {
      textSearch = utility.escapeSql(textSearch)

      builder.whereILike('d.formal_symbol', `%${textSearch}%`)
        .orWhereILike('d.symbol_name', `%${textSearch}%`)
        .orWhereILike('p.ja_product_type', `%${textSearch}%`)
        .orWhereILike('p.en_product_type', `%${textSearch}%`)
        .orWhereILike('p.cn_product_type', `%${textSearch}%`)
        .orWhereILike('p.kr_product_type', `%${textSearch}%`)
        .orWhereILike('d.contract_size', `%${textSearch}%`)
        .orWhereILike('d.profit_currency', `%${textSearch}%`)
        .orWhereILike('lot_rebate', `%${textSearch}%`)
        .orWhereILike('lot_rebate_currency', `%${textSearch}%`)
        .orWhereILike('cb_rebate', `%${textSearch}%`)
        .orWhereILike('cb_rebate_currency', `%${textSearch}%`)
    })
  }

  const [listRebateDetail, listSymbol] = await Promise.all([
    query.orderBy(sortArr),
    getlistSymbolByRebate(result),
  ])

  result.is_show_popup = listSymbol.length ? true : false
  result.rebate_detail = listRebateDetail

  return result
}

const getRebateDetailBySymbolId = async (symbol_id)=>{
  return await db('m_rebate_details')
    .select('id')
    .where({
      symbol_id,
      delete_flag: flag.FALSE,
    })
}

module.exports = {
  getRebateDetailById,
  getRebateDetailBySymbolId,
}
