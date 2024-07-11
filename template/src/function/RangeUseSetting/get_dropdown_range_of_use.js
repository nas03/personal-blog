const { paymentDetailRepository, paymentCategoryRepository, siteRepository, ruleTemplateRepository,
  rangeUseSettingRepository, tradingAccountRepository, messageUnavailableRepository,
  paymentServiceAccountNoRepository, paymentMethodRepository, paymentCompanyAccRepository, errorLogRepository } = require('repository')
const { platform, paymentMethod, typeSearch, errorMessageCodeConstant } = require('constant')
const utility = require('utility')

const getDropDownRangeOfUse = async (event) => {
  try {
    // validate param
    if (!event.queryStringParameters || !event.queryStringParameters.search || !event.queryStringParameters.siteId) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }
    const search = event.queryStringParameters.search
    let siteId = event.queryStringParameters.siteId

    siteId = Number(siteId)

    // get search by type
    switch (search) {
      case typeSearch.METHOD:
      {
        // get array Method by site id
        const response = await paymentMethodRepository.getListPaymentMethod(siteId)

        return utility.createResponse(true, response)
      }
      case typeSearch.PRIORITY:
      {
        const type = event.queryStringParameters.type
        // get array Priority
        const response = await rangeUseSettingRepository.countRangeUseSetting(siteId)

        const count = type === typeSearch.UPDATE_RULE ? response[0].count : response[0].count + 1
        const arrayPriority = []

        for (let i = 1; i <= count; i++) {
          arrayPriority.push(i)
        }
        return utility.createResponse(true, arrayPriority)
      }
      case typeSearch.CATEGORY:
      {
        let methodId = event.queryStringParameters.methodId

        if (!methodId) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
        }
        methodId = Number(methodId)
        // get array category by id method
        const response = await paymentCategoryRepository.getListCategoryByMethodId(methodId, siteId)

        return utility.createResponse(true, response)
      }
      case typeSearch.DETAIL:
      {
        let categoryId = event.queryStringParameters.categoryId

        if (!categoryId) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
        }
        categoryId = Number(categoryId)
        // get array detail by category id
        const response = await paymentDetailRepository.getListDetailByCategoryId(categoryId, siteId)

        return utility.createResponse(true, response)
      }
      case typeSearch.COMPANY_ACC:
      {
        let detailId = event.queryStringParameters.detailId
        let paymentType = event.queryStringParameters.paymentType

        if (!paymentType || !detailId) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
        }
        detailId = Number(detailId)
        paymentType = Number(paymentType)

        // get array company acc
        const response = await paymentCompanyAccRepository.getListCompanyAccByDetailId(detailId, paymentType, siteId)

        return utility.createResponse(true, response)
      }
      case typeSearch.SERVICE:
      {
        // validate required
        let paymentType = event.queryStringParameters.paymentType
        let methodId = event.queryStringParameters.methodId
        let companyAccId = event.queryStringParameters.companyAccId
        let siteId = event.queryStringParameters.siteId

        if (!paymentType || !methodId || !companyAccId || !siteId) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
        }
        methodId = Number(methodId)
        paymentType = Number(paymentType)
        companyAccId = Number(companyAccId)
        siteId = Number(siteId)

        // get array service acc
        let response = null

        if (methodId !== paymentMethod.ACCOUNT_FXT) {
          response = await paymentServiceAccountNoRepository.getListServiceByCompanyAccId(companyAccId, paymentType, siteId)
        } else {
          const itemAcc = await paymentCompanyAccRepository.getCompanyAccById(companyAccId, siteId)

          if (!itemAcc[0] || !itemAcc[0].account_name) {
            return utility.createResponse(true, response)
          }
          const accountName = itemAcc[0].account_name
          const platformCurrency = accountName.split(' ')

          // get trading acc
          if (platformCurrency[0].toLowerCase() === platform.MT4 || platformCurrency[0].toLowerCase() !== platform.MT5) {
            const platform = platformCurrency[0]
            const currency = platformCurrency[1]

            response = await tradingAccountRepository.getTradingAccountsByPlatformAndCurrency(platform, currency, siteId)
          }
        }

        return utility.createResponse(true, response)
      }
      default:
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getDefaultRangeOfUse = async (event) => {
  try {
    // get list dropdown default range of use
    const response = {
      lstSite: [],
      lstMessageUnavailable: [],
      lstTemplate: [],
    }
    const promisesArray = [
      siteRepository.getSites(),
      messageUnavailableRepository.getListMessageUnavailable(),
      ruleTemplateRepository.getListTemplate(),
    ]
    const results = await Promise.all(promisesArray)

    response.lstSite = results[0]
    response.lstMessageUnavailable = results[1]
    response.lstTemplate = results[2]

    return utility.createResponse(true, response)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  getDropDownRangeOfUse,
  getDefaultRangeOfUse,
}
