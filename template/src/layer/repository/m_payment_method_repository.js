/* eslint-disable require-jsdoc */
const db = require('db').helper

async function getListPaymentMethod(siteId) {
  const result = await db('m_payment_method')
    .select(
      'id',
      'ja_name',
      'en_name',
      'cn_name',
      'kr_name',
    ).where('site_id', siteId)

  return result
}


async function getPaymentMethodDropdown() {
  const result = await db('m_payment_method')
    .select(
      'ja_name',
      'en_name',
      'cn_name',
      'kr_name',
    ).distinct(
      'ja_name',
      'en_name',
      'cn_name',
      'kr_name',
    ).orderBy('id', 'asc')
  return result
}

module.exports = {
  getListPaymentMethod,
  getPaymentMethodDropdown,
}
