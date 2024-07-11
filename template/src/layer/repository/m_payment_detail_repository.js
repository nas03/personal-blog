/* eslint-disable require-jsdoc */
const db = require('db').helper

async function getListDetailByCategoryId(paymentCategoryId, siteId) {
  const result = await db('m_payment_detail')
    .select(
      'id',
      'ja_name',
      'en_name',
      'cn_name',
      'kr_name',
    )
    .where({
      site_id: siteId,
      payment_category_id: paymentCategoryId,
    })

  return result
}

async function getPaymentDetailById(id) {
  const result = await db('m_payment_detail')
    .leftJoin('m_payment_category', 'm_payment_category.id', 'm_payment_detail.payment_category_id')
    .select(
      'm_payment_detail.en_name as detail_enName',
      'm_payment_category.en_name as category_enName',
    )
    .where({
      'm_payment_detail.id': id,
    })
    .first()

  return result
}

async function getPaymentDetailDropdown() {
  const result = await db('m_payment_detail')
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
  getListDetailByCategoryId,
  getPaymentDetailById,
  getPaymentDetailDropdown,
}
