'use strict'

const { financeInfo, accountBaseCurrencies, flag, configBroker, fxsXemFinanceInfoRels, errorMessageCodeConstant } = require('constant')

const utility = require('utility')
const _ = require('lodash')

const {
  countryRepository,
  prefecturesRepository,
  financeInfoRepository,
  errorLogRepository,
  accountTypeRepository,
  accountLeverageRepository,
} = require('repository')

module.exports.getCorporatePersonDropdown = async (event) => {
  try {
    const response = {
      nationalities: [],
      prefectures: [],
    }

    // get master data countries
    const nationalitiesData = await countryRepository.getAll()

    // get master data prefectures
    const prefecturesData = await prefecturesRepository.findAll()

    response.nationalities = nationalitiesData
    response.prefectures = prefecturesData

    return utility.createResponse(true, response)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports.getDropdownPersonal = async (event) => {
  try {
    const response = {
      countries: [],
      prefectures: [],
      occupations: [],
      fundingSources: [],
      industries: [],
      usingPurposeICPAY: [],
      investmentPurposeFXT: [],
      moneyRange: [],
    }
    const financePromise = function() {
      return financeInfoRepository.findByTypeData([
        financeInfo.OCCUPATIONS,
        financeInfo.FUNDING_SOURCES,
        financeInfo.INDUSTRIES,
        financeInfo.INVESTMENT_PURPOSE,
        financeInfo.MONEY_RANGE_PERSON_FXT,
        financeInfo.USING_PURPOSE,
      ])
    }
    const arrPromise = [countryRepository.getAll(), prefecturesRepository.findAll(), financePromise()]
    const result = await Promise.all(arrPromise)
    response.countries = result[0]
    response.prefectures = { data: result[1] }
    result[2].forEach((element) => {
      if (element.type_data === financeInfo.OCCUPATIONS) {
        response.occupations.push(element)
      } else if (element.type_data === financeInfo.FUNDING_SOURCES) {
        response.fundingSources.push(element)
      } else if (element.type_data === financeInfo.INDUSTRIES) {
        response.industries.push(element)
      } else if (element.type_data === financeInfo.INVESTMENT_PURPOSE) {
        response.investmentPurposeFXT.push(element)
      } else if (element.type_data === financeInfo.MONEY_RANGE_PERSON_FXT) {
        response.moneyRange.push(element)
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

// API PT0075
module.exports.getAccountTypeDropdown = async (event) => {
  try {
    // Get account types data from XEM Broker
    const accountTypes = await accountTypeRepository.getAccountTypesByBrokerId(configBroker.XM_TRADING.ID)

    // Prepare account type ids for where in
    const accountTypeIds = accountTypes.map((data) => data.id)

    // Get leverage from account type XEM broker
    const accountLeverages = await accountLeverageRepository.getAccountLeverageIn(accountTypeIds)

    // Group leverage by account type
    const mAccountLeverage = _.groupBy(accountLeverages, (data) => data.account_type_id)

    // Format response
    const response = accountTypes.map((accountType) => ({
      id: accountType.id,
      broker_id: accountType.broker_id,
      account_type_code: accountType.account_type_code,
      account_type_name: accountType.account_type_name,
      account_type_sequence: accountType.account_type_sequence,
      platform_mt4: accountType.platform_mt4,
      platform_mt5: accountType.platform_mt5,
      leverages: mAccountLeverage[accountType.id] || [],
      currencies: accountBaseCurrencies
        .filter((baseCurrency) => accountType[baseCurrency.name] === flag.TRUE)
        .map((baseCurrency) => baseCurrency.value),
    }))

    return utility.createResponse(true, response)
  } catch (error) {
    console.log(error.message)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

// API PT0077
module.exports.getInvestorProfileXEMDropdown = async (event) => {
  try {
    const { occupations_id } = event.queryStringParameters || {}

    const listTypeData = [
      financeInfo.OCCUPATIONS_FXS_XEM,
      financeInfo.FUNDING_SOURCES_FXS_XEM,
      financeInfo.INDUSTRIES_FXS_XEM,
      financeInfo.ESTIMATED_ANNUAL_INCOME_FXS_XEM,
      financeInfo.NET_ASSETS_FXS_XEM,
      financeInfo.PLANNED_ANNUAL_INVESTMENT_FXS_XEM,
      financeInfo.PURPOSE_OPENING_ACCOUNT_FXS_XEM,
    ]

    // Get finance info from type FXS XEM
    const results = await financeInfoRepository.findByTypeData(listTypeData)

    // Group results by type data
    const response = _.groupBy(results, (data) => data.type_data)

    if (occupations_id) {
      _getPullDownByOccupationsId(occupations_id, response, listTypeData)
    }

    return utility.createResponse(true, response)
  } catch (error) {
    console.log(error.message)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const _getPullDownByOccupationsId = (occupationsId, response, arr) => {
  const financeInfoRel = fxsXemFinanceInfoRels[occupationsId]

  for (const key in arr) {
    // ignore if key is OCCUPATIONS
    if (arr[key] === financeInfo.OCCUPATIONS_FXS_XEM) {
      continue
    }

    if (financeInfoRel.hasOwnProperty(arr[key])) {
      if (financeInfoRel[arr[key]].length) {
        response[arr[key]] = response[arr[key]].filter((e) => financeInfoRel[arr[key]].includes(e.id))
      }
    } else {
      // remove if financeInfoRel has not property
      delete response[arr[key]]
    }
  }
}
