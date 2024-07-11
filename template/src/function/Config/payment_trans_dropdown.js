'use strict'

/* library */
const { errorMessageCodeConstant } = require('constant')
const utility = require('utility')

// repository
const { paymentMethodRepository, paymentCategoryRepository, paymentDetailRepository, siteRepository, errorLogRepository } = require('repository')

const getPaymentTransDropdown = async (event) =>{
  try {
    const [payment_method, payment_category, payment_detail, m_site] =
        await Promise.all([
          paymentMethodRepository.getPaymentMethodDropdown(),
          paymentCategoryRepository.getPaymentCategoryDropdown(),
          paymentDetailRepository.getPaymentDetailDropdown(),
          siteRepository.getSites(),
        ])

    return utility.createResponse(true, { payment_method, payment_category, payment_detail, m_site })
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  getPaymentTransDropdown,
}
