/* eslint-disable require-jsdoc */
const db = require('db').helper

async function getListCategoryByMethodId(paymentMethodId, siteId) {
  const result = await db('m_payment_category')
    .select(
      'id',
      'ja_name',
      'en_name',
      'cn_name',
      'kr_name',
    )
    .where({
      site_id: siteId,
      payment_method_id: paymentMethodId,
    })

  return result
}

async function getPaymentCategoryDropdown() {
  const result = await db('m_payment_category')
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
  getListCategoryByMethodId,
  getPaymentCategoryDropdown,
}
