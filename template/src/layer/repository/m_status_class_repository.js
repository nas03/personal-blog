/* eslint-disable require-jsdoc */
const db = require('db').helper
const { flag } = require('constant')

const getListStatusClass = async () => {
  const result = await db('m_status_class')
    .select(
      'id',
      'en_name',
      'ja_name',
      'cn_name',
      'kr_name',
      'en_description',
      'ja_description',
      'cn_description',
      'kr_description',
      'display_order',
      'delete_flag',
    )
    .where({
      delete_flag: flag.FALSE,
    })
    .orderBy('display_order', 'asc')
  return result
}

module.exports = {
  getListStatusClass,
}
