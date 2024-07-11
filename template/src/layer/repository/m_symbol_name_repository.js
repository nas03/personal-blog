/* constant */
const { flag } = require('constant')
const { escapeSql } = require('utility')

/* DB */
const db = require('db').helper

const getAllSymbolNameMaster = async (queryString, pagination) => {
  const query = db('m_symbol_name')
    .select(
      'id',
      'symbol_code',
      'ja_symbol_name',
      'en_symbol_name',
      'cn_symbol_name',
      'kr_symbol_name',
      'enable_flag',
      'ts_update',
      'ts_regist',
    )
    .where({
      delete_flag: flag.FALSE,
    })

  if (queryString.currency_name && queryString.currency_name.trim()) {
    const escapeSearch = escapeSql(queryString.currency_name.trim())
    query.whereILike('symbol_code', `%${escapeSearch}%`)
  }

  if (queryString.show_valid_only === 'true') {
    query.where({
      enable_flag: flag.TRUE,
    })
  }

  const orderArr = [...pagination.sort, { column: 'ts_regist', order: 'DESC' }]
  const result = await query.orderBy(orderArr).paginate(pagination)

  return result
}

const updateSymbolName = async (symbol_name_id, payload) => {
  return await db('m_symbol_name')
    .update(payload)
    .where({
      'id': symbol_name_id,
      'delete_flag': flag.FALSE,
    })
}


const getSymbolNameById = async (symbol_name_id) => {
  const result = await db('m_symbol_name')
    .select(
      'id',
      'symbol_code',
      'ja_symbol_name',
      'en_symbol_name',
      'cn_symbol_name',
      'kr_symbol_name',
      'enable_flag',
      'ts_update',
      'ts_regist',
    )
    .where({
      delete_flag: flag.FALSE,
      id: symbol_name_id,
    })
    .first()

  return result
}

const checkSymbolCode = async (symbol_code) => {
  const isExist = await db('m_symbol_name')
    .select('id')
    .where({
      symbol_code: symbol_code,
      delete_flag: flag.FALSE,
    }).first()

  if (isExist) {
    return true
  }

  return false
}

const createSymbolName = async (payload) => {
  return await db('m_symbol_name').insert(payload)
}

const checkSymbolCodeForUpdate = async (symbol_id, symbol_code) => {
  const isExist = await db('m_symbol_name')
    .select('id')
    .whereNot('id', symbol_id)
    .where({
      symbol_code: symbol_code,
      delete_flag: flag.FALSE,
    }).first()

  if (isExist) {
    return true
  }

  return false
}


module.exports = {
  getAllSymbolNameMaster,
  updateSymbolName,
  getSymbolNameById,
  checkSymbolCode,
  createSymbolName,
  checkSymbolCodeForUpdate,
}
