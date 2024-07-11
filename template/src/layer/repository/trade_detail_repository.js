const { flag } = require('constant')

const db = require('db').helper

const createTradeDetail = async (listId, objInsert) => {
  try {
    if (listId.length === 0) return true
    const result = await db.transaction(async (trx) => {
      const isInsert = await trx('trade_detail')
        .insert(objInsert)
      if (!isInsert) {
        throw new Error('insert trade data error')
      }
      const isUpdate = await trx('cashback_management')
        .update({ trade_detail_transfer_status: flag.TRUE })
        .whereIn('id', listId)
      if (!isUpdate) {
        throw new Error('update cashback fail')
      }
      return true
    })
    return result
  } catch (error) {
    console.error(error)
    return false
  }
}

module.exports = {
  createTradeDetail,
}
