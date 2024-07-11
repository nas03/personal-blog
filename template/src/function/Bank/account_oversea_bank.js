const { contentUpdate, category, statusCode, errorMessageCodeConstant } = require('constant')
const utility = require('utility')
const { axios } = require('helper')

const { countryRepository, currencyRepository, errorLogRepository,
  accountOverseaBankRepository, usersBasicDataRepository } = require('repository')

const { createListOperationHistory } = require('../History/operation_history.js')

const _ = require('lodash')

const getFinancialInstitution = async (event) => {
  try {
    const [country, currency] = await Promise.all([
      countryRepository.getCountryFinancialInstitution(),
      currencyRepository.getAllCurrency(),
    ])
    return utility.createResponse(true, { country: country, currency: currency })
  } catch (error) {
    console.error(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getAllBranchBank = async (event) => {
  try {
    const listPage = [1, 2, 3, 4, 5, 6]
    const queryString = event.queryStringParameters
    event.user_id = queryString?.user_id || null
    const listBank = []
    const result = await Promise.all(listPage.map((page) => {
      return axios({
        method: 'GET',
        url: `${process.env.URL_APILAYER}/bank_data/all`,
        headers: {
          'apikey': process.env.APIKEY_APILAYER,
        },
        params: {
          country: queryString.country_code,
          per_page: 5000,
          page: page,
        },
      })
    }))

    // handle data
    if (queryString.country_code.toUpperCase() === 'US') {
      result.forEach((item) => {
        item.data.forEach((element) => {
          listBank.push({
            name: element.bank_data.name,
            city: element.bank_data.city,
            swift: element.us_routing,
          })
        })
      })
    } else {
      result.forEach((item) => {
        item.data.forEach((element) => {
          listBank.push({
            branch: element.swift_data.branch,
            swift: element.swift_data.swift,
            name: element.swift_data.name,
            city: element.swift_data.city,
          })
        })
      })
    }
    return utility.createResponse(true, listBank)
  } catch (error) {
    console.error(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const updateOverseasBank = async (event) => {
  try {
    const userId = event.pathParameters.user_id
    event.user_id = userId
    const staff_id = utility.getUserIdByToken(event)
    const bodyData = JSON.parse(event.body)
    // validate data account oversea bank
    if (
      !bodyData.account_id ||
      !bodyData.country_code ||
      !bodyData.currency ||
      !bodyData.bank_name ||
      !bodyData.swift_code ||
      (!bodyData.branch_name && (!bodyData.bank_address_line || !bodyData.bank_state || !bodyData.bank_city || !bodyData.bank_zip_postal_code))
    ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    const userInfo = await usersBasicDataRepository.getUserInfo(userId)

    // check account status
    if ( userInfo.account_status_code === statusCode.CLOSED ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UPDATE_OVERSEAS_BANK.ACCOUNT_CLOSE])
    }

    const checkAccountEXist = await accountOverseaBankRepository.checkExistAccountOverseaBank(bodyData.account_id, userId )
    if (!checkAccountEXist) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // check account oversea bank existed
    if (bodyData.account_number && bodyData.bank_name) {
      // check existed account overseas bank
      const isExistedAccount = await accountOverseaBankRepository.checkDuplicateAccountOverseaBank({
        account_number: bodyData.account_number,
        bank_name: bodyData.bank_name,
        user_id: userId,
        account_id: bodyData.account_id,
      })

      if (isExistedAccount) {
        return await errorLogRepository.createResponseAndLog(event, null, null,
          [errorMessageCodeConstant.UPDATE_OVERSEAS_BANK.ACCOUNT_NUMBER_EXISTED])
      }
    } else if (bodyData.iban_number) {
      // check existed iban number
      const isExistedIban = await accountOverseaBankRepository.checkDuplicateAccountOverseaBank({
        iban_number: bodyData.iban_number,
        user_id: userId,
        account_id: bodyData.account_id,
      })

      if (isExistedIban) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UPDATE_OVERSEAS_BANK.IBAN_EXISTED])
      }
    }

    // check iban
    const isCheckIban = await checkCountryUseIban(bodyData.country_code)
    const iban = isCheckIban.iban_number
    if ((iban && !bodyData.iban_number) || (!iban && !bodyData.account_number)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }
    if (iban) {
      const isCheck = await validateIban(event, bodyData.iban_number)
      if (!isCheck) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UPDATE_OVERSEAS_BANK.IBAN_INVALID])
      }
    }

    const payload = {
      bank_country: bodyData.country_id,
      currency: bodyData.currency,
      bank_name: bodyData.bank_name,
      bank_address_line: bodyData.bank_address_line ? bodyData.bank_address_line : null,
      bank_address_line2: bodyData.bank_address_line2 ? bodyData.bank_address_line2 : null,
      bank_state: bodyData.bank_state ? bodyData.bank_state : null,
      bank_city: bodyData.bank_city ? bodyData.bank_city : null,
      bank_zip_postal_code: bodyData.bank_zip_postal_code ? bodyData.bank_zip_postal_code : null,
      branch_name: bodyData.branch_name ? bodyData.branch_name : null,
      swift_code: bodyData.swift_code,
      iban_number: bodyData.iban_number ? bodyData.iban_number : null,
      account_number: bodyData.account_number ? bodyData.account_number : null,
      clearing_code: bodyData.clearing_code ? bodyData.clearing_code : null,
      intermediary_bank: bodyData.intermediary_bank ? bodyData.intermediary_bank : null,
      intermediary_swift_code: bodyData.intermediary_swift_code ? bodyData.intermediary_swift_code : null,
    }

    const accountBankAfter = _.omit(
      {
        ...checkAccountEXist,
        ...payload,
      }, [
        'id',
        'ts_update',
      ],
    )

    const isUpdate = await accountOverseaBankRepository.updateAccount(bodyData.account_id, userId, accountBankAfter )

    if (!isUpdate) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UPDATE_OVERSEAS_BANK.UPDATE_FAILED_DB])
    }

    const fieldUpdate = _.pickBy(accountBankAfter, (value, key) => checkAccountEXist[key] !== value)
    delete fieldUpdate.branch_name_flag
    const listHistory = []

    // eslint-disable-next-line guard-for-in
    for (const item in fieldUpdate) {
      listHistory.push({
        site_id: userInfo.site_id,
        category_id: category.WALLET_MANAGEMENT,
        content_update: _renderContentUpdate(item),
        before_update: _renderDataUpdate(item, checkAccountEXist),
        after_update: _renderDataUpdate(item, accountBankAfter),
      })
    }

    // create operation history
    await createListOperationHistory(
      userId,
      listHistory,
      event,
      staff_id,
    )

    return utility.createResponse(true)
  } catch (error) {
    console.error(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [
      error.isAxiosError ?
        errorMessageCodeConstant.UPDATE_OVERSEAS_BANK.CALL_API_CHECK_IBAN_FAIL :
        errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR,
    ])
  }
}

const getStatusIban = async (event) => {
  try {
    const queryString = event.queryStringParameters
    event.user_id = queryString?.user_id || null
    const ischeck = await checkCountryUseIban(queryString.country_code)

    return utility.createResponse(true, ischeck)
  } catch (error) {
    console.error(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [
      error.isAxiosError ?
        errorMessageCodeConstant.GET_STATUS_IBAN.CALL_API_CHECK_IBAN_FAIL :
        errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR,
    ])
  }
}

const checkIban = async (event) => {
  try {
    const queryString = event.queryStringParameters
    event.user_id = queryString?.user_id || null
    const isCheck = await validateIban(event, queryString.iban_number)
    if (!isCheck) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.CHECK_IBAN.IBAN_INVAILD])
    }
    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [error.isAxiosError ?
      errorMessageCodeConstant.CHECK_IBAN.VALIDATE_IBAN :
      errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const checkAccountOverseaBankExisted = async (event) => {
  try {
    const { account_id, account_number, bank_name, iban_number, user_id } = JSON.parse(event.body)
    event.user_id = user_id
    if (account_number && bank_name) {
      // check existed account overseas bank
      const isExistedAccount = await accountOverseaBankRepository.checkDuplicateAccountOverseaBank({
        account_number,
        bank_name,
        user_id,
        account_id,
      })

      if (isExistedAccount) {
        return await errorLogRepository.createResponseAndLog(event, null, null,
          [errorMessageCodeConstant.CHECK_ACCOUNT_OVERSEAS.ACCOUNT_NUMBER_EXISTED])
      }
    } else if (iban_number) {
      // check existed iban number
      const isExistedIban = await accountOverseaBankRepository.checkDuplicateAccountOverseaBank({
        iban_number,
        user_id,
        account_id,
      })
      if (isExistedIban) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.CHECK_ACCOUNT_OVERSEAS.IBAN_EXISTED])
      }
    } else {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    return utility.createResponse(true)
  } catch (error) {
    console.error(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const validateIban = async (event, iban_number) => {
  const api = {
    method: 'GET',
    url: `${process.env.URL_VALIDATE_IBAN}/clients/api/v4/iban/`,
    params: {
      api_key: process.env.APIKEY_VALIDATE_IBAN,
      iban: iban_number,
      format: 'json',
    },
  }

  const checkIban = await axios(api)
  const config = {
    message: checkIban.errors[0]?.message,
    url: api.url,
    data: {
      body: null,
      query: api.params,
    } }
  if (!checkIban.validations.iban) {
    throw Object.assign(new Error(config.message), { isAxiosError: true, config: config })
  } else {
    return checkIban.validations.iban.code === '202' ? false : true
  }
}

const checkCountryUseIban = async (country_code) => {
  try {
    await axios({
      method: 'GET',
      url: `${process.env.URL_APILAYER}/bank_data/iban_fields`,
      headers: {
        'apikey': process.env.APIKEY_APILAYER,
      },
      params: {
        country: country_code,
      },
    })
    return { iban_number: true, account_number: false }
  } catch (error) {
    if (error.response?.status === 422) {
      return { iban_number: false, account_number: true }
    }
    throw error
  }
}

const _renderContentUpdate = (item) => {
  switch (item) {
    case 'account_number':
      return contentUpdate.CHANGE_ACCOUNT_NUMBER
    case 'bank_country':
      return contentUpdate.CHANGE_BANK_COUNTRY
    case 'currency':
      return contentUpdate.CHANGE_ACCOUNT_CURRENCY
    case 'bank_name':
      return contentUpdate.CHANGE_BENEFICIARY_BANK_NAME
    case 'swift_code':
      return contentUpdate.CHANGE_SWIFT_CODE
    case 'branch_name':
      return contentUpdate.CHANGE_BRANCH_NAME
    case 'bank_address_line':
    case 'bank_address_line2':
    case 'bank_state':
    case 'bank_city':
    case 'bank_zip_postal_code':
      return contentUpdate.CHANGE_BANK_ADDRESS
    case 'iban_number':
      return contentUpdate.CHANGE_IBAN_CODE
    case 'clearing_code':
      return contentUpdate.CHANGE_CLEARING_CODE
    case 'intermediary_bank':
      return contentUpdate.CHANGE_INTERMEDIARY_BANK_NAME
    case 'intermediary_swift_code':
      return contentUpdate.CHANGE_INTERMEDIARY_BANK_SWIFT_CODE
    default:
      break
  }
}

const _renderDataUpdate = (item, data) => {
  if (item === 'bank_country') {
    return `${data[item]}/$/countries`
  } else if ( data[item] ) {
    return data[item]
  } else {
    return '-'
  }
}

module.exports = {
  getFinancialInstitution,
  getAllBranchBank,
  updateOverseasBank,
  getStatusIban,
  checkIban,
  checkAccountOverseaBankExisted,
}
