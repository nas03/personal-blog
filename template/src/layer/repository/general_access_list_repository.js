// DB
const db = require('db').helper

// CONSTANT
const { flag } = require('constant')


const getAccessListEmail = (payload) => {
  const { email, list_type, list_classification, site_id, access_type } = payload
  const domainEmail = email?.split('@')[1] || ''

  return db('general_access_list')
    .where((builder) =>
      builder
        .where('target', email)
        .orWhere('target', `{{user-name}}@${domainEmail}`),
    )
    .where('list_type', list_type)
    .where('list_classification', list_classification)
    .where('access_type', access_type)
    .where('site_id', site_id)
    .where('delete_flag', flag.FALSE)
    .where('active_flag', flag.TRUE)
    .first()
}

const getUserAccessListRecord = async (userId, option) => {
  const result = await db('general_access_list').
    select(
      'id',
      'user_basic_data_id',
      'site_id',
      'target',
      'list_classification',
      'access_type',
      'active_flag',
      'list_type',
      'delete_flag',
    ).where({
      user_basic_data_id: userId,
      ...option,
    })
  return result
}

module.exports = {
  getAccessListEmail,
  getUserAccessListRecord,
}
