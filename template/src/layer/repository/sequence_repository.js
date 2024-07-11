const db = require('db').helper

const updateAndGetBatchId = async ()=>{
  try {
    const result = await db.transaction(async (trx)=> {
      await trx.raw('UPDATE sequence SET batch_id = LAST_INSERT_ID(batch_id + 1);')
      return await trx.raw('SELECT LAST_INSERT_ID() as lastInsertId;')
    })

    if (!result) {
      return false
    }

    return result[0][0].lastInsertId
  } catch (error) {
    console.log(error)
    return false
  }
}

module.exports = {
  updateAndGetBatchId,
}
