const db = require('db').helper

const updateByUserId = async (userId, payload) =>{
  return await db('users_management_data')
    .where('user_basic_data_id', userId)
    .update(payload)
}

module.exports = {
  updateByUserId,
}

