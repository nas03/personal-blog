const db = require('db').helper
const { flag } = require('constant')

async function updateAmountShareholders(id, payload) {
  return await db('users_ubo')
    .update(payload)
    .where({
      id: id,
      delete_flag: flag.FALSE,
    })
}

module.exports = {
  updateAmountShareholders,
}
