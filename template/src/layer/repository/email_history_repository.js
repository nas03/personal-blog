const { flag } = require('constant')

const db = require('db').helper

async function getEmailHistoryByUser(user_id) {
  const emailHistory = await db('email_history as h')
    .leftJoin('users_basic_data as admin', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('h.send_by_admin_id', 'admin.id')
        .on('admin.delete_flag', flag.FALSE)
    })
    .where({
      'h.user_basic_data_id': user_id,
      'h.delete_flag': flag.FALSE,
    })
    .select(
      'h.id',
      'h.user_basic_data_id',
      'h.email_from',
      'h.email_to',
      'h.subject',
      'h.ts_regist',
      'h.send_by_admin_id',
      'admin.first_name_romaji',
      'admin.last_name_romaji',
    )
    .orderBy('h.ts_regist', 'desc')

  return emailHistory
}

async function getEmailHistoryById(id) {
  const emailHistory = await db('email_history as h')
    .leftJoin('m_email_detail_content as c', function() {
      this
        .on('h.email_detail_content_id', 'c.id')
        .on('c.delete_flag', flag.FALSE)
    })
    .leftJoin('m_email_common_content as t', function() {
      this
        .on('c.email_common_content_id', 't.id')
        .on('t.delete_flag', flag.FALSE)
    })
    .where({
      'h.id': id,
      'h.delete_flag': flag.FALSE,
    })
    .select(
      'h.id',
      'h.content',
      'c.site_name',
      't.site_id',
      'h.email_from',
      'h.email_to',
      'h.email_bcc',
      'h.subject',
      'h.send_by_admin_id',
      'h.ts_regist',
      'h.email_detail_content_id',
      'c.env_email_from_setting',
      'c.env_email_bcc_setting',
    )
    .first()
  return emailHistory
}


async function createEmailHistory(payload) {
  const ibMailNew = await db('email_history')
    .insert(payload)

  return ibMailNew[0] || null
}


module.exports = {
  getEmailHistoryByUser,
  createEmailHistory,
  getEmailHistoryById,
}
