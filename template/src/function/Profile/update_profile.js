/* function */
const utility = require('utility')
const { _renderDataUpdate } = require('./update_personal_info')
const { createListOperationHistory } = require('../History/operation_history')

/* constant */
const { platform, accountBaseCurrencies, flag,
  commonSiteId, category, contentUpdate, statusItemsConstant, typeProfile, errorMessageCodeConstant,
  statusCode,
} = require('constant')

/* repository */
const { errorLogRepository, usersFinanceRepository, fxsXemAddDataRepository } = require('repository')

const updateUserFinance = async (event) => {
  try {
    const id = event.pathParameters.userFinanceId
    const eventBody = JSON.parse(event.body) || {}

    const userFinance = await usersFinanceRepository.getProfileByFinanceId(id, eventBody.type_profile)
    event.user_id = userFinance?.user_id
    if (!userFinance) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    if (userFinance.account_status_code === statusCode.CLOSED) {
      return await errorLogRepository.createResponseAndLog(
        event,
        null,
        null,
        [errorMessageCodeConstant.UPDATE_PROFILE_FINANCE.ACCOUNT_CLOSED],
      )
    }

    if (userFinance.site_id !== commonSiteId.FXS_XEM) {
      const payload = {}
      const payloadOperationHistory = []
      const authorizedPerson = utility.getUserIdByToken(event)
      const { site_id, user_id } = userFinance
      const statusItems = JSON.parse(userFinance.status_items)

      for (const item of Object.keys(eventBody)) {
        const financeValue = userFinance[item]
        if (financeValue !== undefined && financeValue !== eventBody[item]) {
          // prepare payload to update corporate with changed value
          payload[item] = eventBody[item]

          // handle status items
          statusItems[item] = statusItemsConstant.CONFIRMED_CANNOT_BE_CHANGED

          let categoryId
          let content_update
          const isUpdateTaxObligations = item === 'us_tax_obligations'
          const isUpdateTaxPayer = item === 'us_taxpayer_number'
          if (isUpdateTaxObligations || isUpdateTaxPayer) {
            if (!userFinance.corporate_flag) {
              categoryId = category.BASIC_INFORMATION_PERSON_OR_CORPORATE
              content_update = isUpdateTaxObligations ?
                contentUpdate.CHANGE_US_TAX_OBLIGATIONS :
                contentUpdate.CHANGE_US_TAXPAYER
            } else {
              if (eventBody.type_profile === typeProfile.CORPORATE) {
                categoryId = category.BASIC_INFORMATION_PERSON_OR_CORPORATE
                content_update = isUpdateTaxObligations ?
                  contentUpdate.CHANGE_US_TAX_OBLIGATIONS :
                  contentUpdate.CHANGE_US_TAXPAYER
              } else if (eventBody.type_profile === typeProfile.TRANSACTION_PERSON) {
                categoryId = category.TRANSACTION_INFORMATION
                content_update = isUpdateTaxObligations ?
                  contentUpdate.CHANGE_US_TAX_OBLIGATIONS_TRANSACTION :
                  contentUpdate.CHANGE_US_TAXPAYER_TRANSACTION
              } else if (eventBody.type_profile === typeProfile.REPRESENTATIVE_PERSON) {
                categoryId = category.REPRESENTATIVE_INFORMATION
                content_update = isUpdateTaxObligations ?
                  contentUpdate.CHANGE_US_TAX_OBLIGATIONS_REPRESENTATIVE :
                  contentUpdate.CHANGE_US_TAXPAYER_REPRESENTATIVE
              }
            }
          } else {
            categoryId = category.INVESTOR_INFORMATION
            content_update = _renderFinance(item, userFinance.site_id, eventBody.type_profile)
          }

          // prepare payload to update operation history
          payloadOperationHistory.push( {
            site_id,
            category_id: categoryId,
            content_update,
            before_update: _renderDataUpdate(item, userFinance[item], site_id, userFinance),
            after_update: _renderDataUpdate(item, eventBody[item], site_id, userFinance, eventBody),
          } )
        }
      }

      if (Object.keys(payload).length) {
        const updated = await usersFinanceRepository.updateFinanceById(id, payload)
        if (!updated) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UPDATE_PROFILE_FINANCE.OTHER])
        }

        // Insert operation history
        await createListOperationHistory(user_id, payloadOperationHistory, event, authorizedPerson)
      }
    } else {
      const updated = await usersFinanceRepository.updateFinanceById(id, {
        occupation_id: eventBody.occupation_id,
        funding_source_id: eventBody.funding_source_id,
        industry_id: eventBody.industry_id,
        annual_income: eventBody.annual_income,
        net_worth: eventBody.net_worth,
        planned_annual_investment: eventBody.planned_annual_investment,
        purpose_of_investment: eventBody.purpose_of_investment,
      })

      if (!updated) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UPDATE_PROFILE_FINANCE.FXS_XEM])
      }
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const updateProfileTradingAccount = async (event) => {
  try {
    const id = event.pathParameters.accountId
    const eventBody = JSON.parse(event.body) || {}

    const userIsClosed = await fxsXemAddDataRepository.checkAccountStatusClosed(id)
    event.user_id = userIsClosed?.user_id

    if (!userIsClosed || userIsClosed.account_status_code === statusCode.CLOSED) {
      return await errorLogRepository.createResponseAndLog(
        event,
        null,
        null,
        [errorMessageCodeConstant.UPDATE_PROFILE_TRADING_ACCOUNT.ACCOUNT_CLOSED],
      )
    }

    let payload = {}
    if (eventBody.address_in_english !== undefined) {
      payload.address_in_english = eventBody.address_in_english
    } else {
      const currencyValues = accountBaseCurrencies.map((objCurrency) => objCurrency.value)

      if (!Object.values(platform).includes(eventBody.platform) ||
        !currencyValues.includes(eventBody.currency) ||
        isNaN(eventBody.account_leverage_id) ||
        !Object.values(flag).includes(eventBody.trading_bonus_flag)
      ) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
      }

      payload = {
        platform: eventBody.platform,
        currency: eventBody.currency,
        account_leverage_id: eventBody.account_leverage_id,
        trading_bonus_flag: eventBody.trading_bonus_flag,
      }
    }

    const updated = await fxsXemAddDataRepository.updateDataById(id, payload)
    if (!updated) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_PROFILE_TRADING_ACCOUNT.UPDATE_FAILED_DB])
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const _renderFinance = (field, siteId, type = null) => {
  switch (field) {
    case 'industry_id':
      return siteId === commonSiteId.FXT ? contentUpdate.CHANGE_INDUSTRY_FXT : contentUpdate.CHANGE_INDUSTRY_ICPAY
    case 'occupation_id':
      return siteId === commonSiteId.FXT ? contentUpdate.CHANGE_OCCUPATIONAL_FORM_FXT : contentUpdate.CHANGE_OCCUPATIONAL_FORM_ICPAY
    case 'funding_source_id':
      return siteId === commonSiteId.FXT ? contentUpdate.CHANGE_FUNDING_SOURCE_FXT : contentUpdate.CHANGE_FUNDING_SOURCE_ICPAY
    case 'purpose_of_investment':
      return siteId === commonSiteId.FXT ? contentUpdate.CHANGE_PURPOSE_OF_INVESTMENT_FXT : contentUpdate.CHANGE_PURPOSE_OF_USE_ICPAY
    case 'annual_income':
      return type === typeProfile.CORPORATE ? contentUpdate.CHANGE_COMPANY_ANNUAL_SALES_FXT : contentUpdate.CHANGE_ANNUAL_INCOME_FXT
    case 'net_worth':
      return contentUpdate.CHANGE_NET_WORTH_FXT
    case 'planned_annual_investment':
      return contentUpdate.CHANGE_PLANNED_ANNUAL_INVESTMENT_FXT
  }
}

module.exports = {
  updateUserFinance,
  updateProfileTradingAccount,
}
