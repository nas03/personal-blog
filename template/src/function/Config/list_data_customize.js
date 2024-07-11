const { errorMessageCodeConstant, financeInfo, flag } = require('constant')
const utility = require('utility')
const { countryRepository, prefecturesRepository, financeInfoRepository, errorLogRepository, statusMasterRepository,
  kycDocumentRepository } = require('repository')
module.exports.listDataCustomize = async (event) => {
  try {
    const response = {
      countries: [],
      nationalities: [],
      prefectures: [],
      occupations: [],
      fundingSources: [],
      industries: [],
      usingPurposeICPAY: [],
      investmentPurposeFXT: [],
      moneyRangePersonFXT: [],
      moneyRangeCompanyICPAY: [],
      moneyRangeCompanyFXT: [],
      kyc_documents: [],
    }
    const financePromise = function() {
      return financeInfoRepository.findByTypeData([
        financeInfo.OCCUPATIONS,
        financeInfo.FUNDING_SOURCES,
        financeInfo.INDUSTRIES,
        financeInfo.USING_PURPOSE,
        financeInfo.MONEY_RANGE_PERSON_FXT,
        financeInfo.MONEY_RANGE_COMPANY_ICPAY,
        financeInfo.INVESTMENT_PURPOSE,
        financeInfo.MONEY_RANGE_COMPANY_FXT,
      ])
    }
    const arrPromise = [
      countryRepository.getAll(),
      prefecturesRepository.findAll(),
      financePromise(),
      statusMasterRepository.getStatusMaster({
        status_label_number: flag.FALSE,
        enable_flag: flag.TRUE,
      }),
      kycDocumentRepository.getAllKycDocument(),
    ]
    const result = await Promise.all(arrPromise)
    response.countries = result[0]
    response.nationalities = result[0]
    response.status = result[3]

    response.prefectures = result[1]
    result[2].forEach((element) => {
      if (element.type_data === financeInfo.OCCUPATIONS) {
        response.occupations.push(element)
      } else if (element.type_data === financeInfo.FUNDING_SOURCES) {
        response.fundingSources.push(element)
      } else if (element.type_data === financeInfo.INDUSTRIES) {
        response.industries.push(element)
      } else if (element.type_data === financeInfo.INVESTMENT_PURPOSE) {
        response.investmentPurposeFXT.push(element)
      } else if (element.type_data === financeInfo.USING_PURPOSE) {
        response.usingPurposeICPAY.push(element)
      } else if (element.type_data === financeInfo.MONEY_RANGE_PERSON_FXT) {
        response.moneyRangePersonFXT.push(element)
      } else if (element.type_data === financeInfo.MONEY_RANGE_COMPANY_ICPAY) {
        response.moneyRangeCompanyICPAY.push(element)
      } else if (element.type_data === financeInfo.MONEY_RANGE_COMPANY_FXT) {
        response.moneyRangeCompanyFXT.push(element)
      }
    })
    response.kyc_documents = result[4]

    return utility.createResponse(true, response)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}
