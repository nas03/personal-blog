const { flag } = require('constant')

// DB
const db = require('db').helper

async function createTransactionProcess(obj) {
  try {
    const result = await db.transaction(async (trx) => {
      const isCreate = await trx('transaction_process').insert(obj)
      if (!isCreate.length) {
        return false
      }
      return isCreate[0]
    })
    return result || false
  } catch (error) {
    console.log(error)
    return false
  }
}

const updateById = async (id, payload) => {
  try {
    const result = await db('transaction_process')
      .update(payload)
      .where('process_id', id)
      .where('delete_flag', flag.FALSE)
    return result ? true : false
  } catch (error) {
    console.log(error)
    return false
  }
}

module.exports = {
  createTransactionProcess,
  updateById,
}
