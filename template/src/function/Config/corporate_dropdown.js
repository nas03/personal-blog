'use strict'

/* library */
const { financeInfo, errorMessageCodeConstant } = require('constant')
const utility = require('utility')

/* DB */
const {
  countryRepository,
  prefecturesRepository,
  financeInfoRepository,
  errorLogRepository,
} = require('repository')

const getCorporateDropdown = async (event) => {
  try {
    const response = {
      countries: [],
      prefectures: [],
      industries: [],
      moneyRangeCompanyFXT: [],
      moneyRangeCompanyICPAY: [],
      investmentPurposeFXT: [],
      usingPurposeICPAY: [],
    }

    const promisesArray = [
      countryRepository.getAll(),
      prefecturesRepository.findAll(),
      financeInfoRepository.findByTypeData([
        financeInfo.INDUSTRIES,
        financeInfo.MONEY_RANGE_COMPANY_FXT,
        financeInfo.MONEY_RANGE_COMPANY_ICPAY,
        financeInfo.INVESTMENT_PURPOSE,
        financeInfo.USING_PURPOSE,
      ]),
    ]

    const results = await Promise.all(promisesArray)

    response.countries = results[0]
    response.prefectures = { data: results[1] }
    results[2].forEach((element) => {
      if (element.type_data === financeInfo.INDUSTRIES) {
        response.industries.push(element)
      } else if (element.type_data === financeInfo.MONEY_RANGE_COMPANY_FXT) {
        response.moneyRangeCompanyFXT.push(element)
      } else if (element.type_data === financeInfo.MONEY_RANGE_COMPANY_ICPAY) {
        response.moneyRangeCompanyICPAY.push(element)
      } else if (element.type_data === financeInfo.INVESTMENT_PURPOSE) {
        response.investmentPurposeFXT.push(element)
      } else if (element.type_data === financeInfo.USING_PURPOSE) {
        response.usingPurposeICPAY.push(element)
      }
    })

    return utility.createResponse(true, response)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  getCorporateDropdown,
}
