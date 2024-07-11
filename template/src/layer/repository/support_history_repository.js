const db = require('db').helper
const { flag, userBasicClass } = require('constant')
const { getUserAccountStatus } = require('./users_basic_data_repository')

const getSupportHistoriesByUserId = async (user_basic_data_id) => {
  return await db('support_history')
    .leftJoin('users_basic_data', 'users_basic_data.id', 'support_history.support_by_admin_id')
    .select(
      'support_history.id',
      'support_history.support_comment',
      'support_history.support_by_admin_id',
      'users_basic_data.first_name_romaji',
      'users_basic_data.last_name_romaji',
      'support_history.ts_regist',
    )
    .where({
      'support_history.user_basic_data_id': user_basic_data_id,
      'support_history.delete_flag': flag.FALSE,
    })
    .whereIn('users_basic_data.admin_flag', [userBasicClass.ADMIN, userBasicClass.MASTER_ADMIN])
    .orderBy('support_history.ts_regist', 'desc')
    .orderBy('support_history.id', 'desc')
}

const createSupportHistory = async (payload) => {
  return await db('support_history').insert(payload)
}

const updateSupportHistory = async (support_id, payload) => {
  return await db('support_history')
    .where('id', support_id)
    .update(payload)
}

const getUserBySupportHistoryId = async (id) => {
  return await db('support_history')
    .join('users_basic_data', 'users_basic_data.id', 'support_history.user_basic_data_id')
    .join(getUserAccountStatus(), 'gsh.target_id', 'users_basic_data.id')
    .select(
      'users_basic_data.id as user_id',
      'support_history.id',
      'gsh.status_code as account_status_code',
    )
    .where({
      'support_history.id': id,
      'support_history.delete_flag': flag.FALSE,
    })
    .first()
}

module.exports = {
  getSupportHistoriesByUserId,
  createSupportHistory,
  updateSupportHistory,
  getUserBySupportHistoryId,
}
