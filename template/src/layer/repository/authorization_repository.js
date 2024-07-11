/* eslint-disable require-jsdoc */
const db = require('db').helper
const { flag } = require('constant')

async function checkIdExist(id) {
  const result = await db('m_authorization')
    .where('id', id)
  return result
}

async function getAuthorizations() {
  const result = await db('m_authorization')
    .where('delete_flag', flag.FALSE)
    .whereNotNull('display_order')
    .select(
      'id',
      'authorization_name as display_name',
      'ja_description as ja_display_name',
      'en_description as en_display_name',
      'cn_description as cn_display_name',
      'kr_description as kr_display_name',
      'display_order',
    )
  return result
}

module.exports = {
  checkIdExist,
  getAuthorizations,
}

