
/* eslint-disable require-jsdoc */
const db = require('db').helper

async function getListServiceByCompanyAccId(paymentCompanyAccId, paymentType, siteId) {
  const result =
    await db('m_payment_service_account_no')
      .select(
        'id',
        'ja_service_name',
        'en_service_name',
        'cn_service_name',
        'kr_service_name',
        'payment_type',
      )
      .where({
        site_id: siteId,
        payment_type: paymentType,
        payment_company_account_id: paymentCompanyAccId,
      })

  return result
}

module.exports = {
  getListServiceByCompanyAccId,
}
