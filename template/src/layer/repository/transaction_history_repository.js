const db = require('db').helper

const { transactionType } = require('constant')

async function createTransactionHistory(payload) {
  try {
    const result = await db('transaction_history').insert(payload)
    return result.length ? true : false
  } catch (error) {
    console.log(error)
    return false
  }
}

const getTransactionHistoryByTransactionId = async (transactionId, userId) => {
  try {
    const result = await db('transaction_history')
      .select(
        'amount',
        'transaction_object_id',
      )
      .where({
        transaction_id: transactionId,
        user_basic_data_id: userId,
        transaction_type: transactionType.WITHDRAW,
      })
    return result
  } catch (error) {
    console.log(error)
    return false
  }
}

module.exports = {
  createTransactionHistory,
  getTransactionHistoryByTransactionId,
}
