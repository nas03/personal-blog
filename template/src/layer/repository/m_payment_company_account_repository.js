/* eslint-disable require-jsdoc */
const db = require('db').helper

async function getListCompanyAccByDetailId(paymentDetailId, paymentType, siteId) {
  const result =
    await db('m_payment_company_account')
      .select(
        'id',
        'ja_company_name',
        'en_company_name',
        'cn_company_name',
        'kr_company_name',
        'account_name',
        'ja_account_name',
        'en_account_name',
        'cn_account_name',
        'kr_account_name',
        'payment_type',
      )
      .where({
        site_id: siteId,
        payment_type: paymentType,
        payment_detail_id: paymentDetailId,
      })

  return result
}

async function getCompanyAccById(id, siteId) {
  const result =
    await db('m_payment_company_account as c')
      .leftJoin('m_payment_service_account_no as s', 's.payment_company_account_id', 'c.id')
      .select(
        'c.id',
        'c.account_name',
        'c.en_company_name',
        's.en_service_name',
      )
      .where('c.id', id)
      .where('c.site_id', siteId)

  return result
}

module.exports = {
  getListCompanyAccByDetailId,
  getCompanyAccById,
}
