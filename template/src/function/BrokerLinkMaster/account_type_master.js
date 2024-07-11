/* constant */
const utility = require('utility')
const { flag, sequenceAction, baseCurrency, uncheckALL, errorMessageCodeConstant, errorKeyServer } = require('constant')
/* DB */
const { errorLogRepository, accountTypeRepository, brokerRepository } = require('repository')

const getListAccount = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}
    // param of checkbox
    if (queryString.brokerId) {
      queryString.brokerId = queryString.brokerId.split(',')
    }
    // get pagination
    const pagination = utility.getPagination(queryString)

    // CHECK CASE SELECT BOX UNCHECK ALL
    if (Number(queryString.brokerId) === uncheckALL) {
      const res = utility.paginatedItems([], pagination.currentPage, pagination.perPage)
      return utility.createResponse(true, res)
    }

    // get max min account type sequence
    const maxMinSequence = await accountTypeRepository.checkMaxMinSequenceByBrokerId()
    // query data
    const data = await accountTypeRepository.getAccountTypeList(queryString, pagination)

    const dataFormat = data.data.map((item)=> {
      for (const obj of maxMinSequence) {
        if (item.broker_id === obj.broker_id) {
          return {
            ...item,
            is_min_account_type_sequence: item.account_type_sequence === obj.minSequence ? flag.TRUE : flag.FALSE,
            is_max_account_type_sequence: item.account_type_sequence === obj.maxSequence ? flag.TRUE : flag.FALSE,
          }
        }
      }
    })

    return utility.createResponse(true, { data: dataFormat, pagination: data.pagination })
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const updateAccountTypeIndex = async (event) => {
  try {
    const { field_name, field_data } = JSON.parse(event.body)

    const { id } = event.pathParameters

    if (!field_name) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }
    // check account type
    const accountType = await accountTypeRepository.getAccountById(id)


    // check account id is exist
    if (!accountType) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_ACCOUNT_TYPE_INDEX.NOT_IS_EXIST.ACCOUNT_TYPE])
    }

    switch (field_name) {
      case 'enable_flag':
        if (!Object.values(flag).includes(field_data)) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        const isUpdate = await accountTypeRepository.updateEnableFlag(id, { enable_flag: field_data })
        if (!isUpdate) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.UPDATE_ACCOUNT_TYPE_INDEX.UPDATE.ENABLE_FLAG])
        }
        return utility.createResponse(true)

      case 'account_type_sequence':
        // validate request data
        if (Object.values(sequenceAction).includes(field_data) ) {
          const maxMinSequence = await accountTypeRepository.checkSequenceByBrokerId(accountType.broker_id)
          if (field_data === sequenceAction.UP &&
            maxMinSequence.minSequence === accountType.account_type_sequence ||
          field_data === sequenceAction.DOWN &&
          maxMinSequence.maxSequence === accountType.account_type_sequence) {
            return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
          }

          const result = await accountTypeRepository.updateSequence(field_data, accountType)
          if (result.isError) {
            return await errorLogRepository.createResponseAndLog(event, result.error, null,
              [errorMessageCodeConstant.UPDATE_ACCOUNT_TYPE_INDEX.UPDATE.SEQUENCE])
          }
          return utility.createResponse(true)
        } else {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }
      default:
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const createNewAccountType = async (event) => {
  try {
    const bodyData = JSON.parse(event.body) || {}

    // validate fields
    if (!bodyData.broker_id || !bodyData.account_type_name || !bodyData.account_type_code ||
      !Object.values(flag).includes(bodyData.platform_mt4) || !Object.values(flag).includes(bodyData.platform_mt5) ||
      !Object.values(flag).includes(bodyData.base_currency_usd) || !Object.values(flag).includes(bodyData.base_currency_jpy) ||
      !Object.values(flag).includes(bodyData.base_currency_eur) || !Object.values(flag).includes(bodyData.base_currency_sgd) ||
      !Object.values(flag).includes(bodyData.base_currency_aud) || !Object.values(flag).includes(bodyData.base_currency_nzd) ||
      !Object.values(flag).includes(bodyData.base_currency_gbp) || !Object.values(flag).includes(bodyData.base_currency_zar) ||
      !Object.values(flag).includes(bodyData.base_currency_huf) || !Object.values(flag).includes(bodyData.base_currency_chf) ||
      ![baseCurrency.USD, baseCurrency.JPY, baseCurrency.EUR].includes(bodyData.rebates_currency)
    ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // check data in DB
    const isExistBroker = await brokerRepository.getBrokerById(bodyData.broker_id)
    if (!isExistBroker) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.CREATE_ACCOUNT_TYPE.BROKER.NOT_EXIST])
    }
    if (isExistBroker.enable_flag === flag.FALSE) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.CREATE_ACCOUNT_TYPE.BROKER.DISABLED])
    }

    const isExistData = await accountTypeRepository.existFieldData(bodyData.account_type_name, bodyData.account_type_code, bodyData.broker_id)
    if (isExistData.isError) {
      switch (isExistData.codeError) {
        case errorKeyServer.EXIST.ACCOUNT_TYPE_NAME_AND_ACCOUNT_TYPE_CODE: {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.CREATE_ACCOUNT_TYPE.EXIST.ACCOUNT_TYPE_NAME,
              errorMessageCodeConstant.CREATE_ACCOUNT_TYPE.EXIST.ACCOUNT_TYPE_CODE])
        }
        case errorKeyServer.EXIST.ACCOUNT_TYPE_NAME: {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.CREATE_ACCOUNT_TYPE.EXIST.ACCOUNT_TYPE_NAME])
        }
        case errorKeyServer.EXIST.ACCOUNT_TYPE_CODE: {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.CREATE_ACCOUNT_TYPE.EXIST.ACCOUNT_TYPE_CODE])
        }
      }
    }

    let account_type_sequence
    const accountTypeSequence = await accountTypeRepository.checkSequenceByBrokerId(bodyData.broker_id)
    if (accountTypeSequence) {
      account_type_sequence = accountTypeSequence.maxSequence + 1
    }

    const payload = {
      broker_id: bodyData.broker_id,
      account_type_code: bodyData.account_type_code,
      account_type_name: bodyData.account_type_name,
      account_type_sequence: account_type_sequence,
      platform_mt4: bodyData.platform_mt4,
      platform_mt5: bodyData.platform_mt5,
      base_currency_usd: bodyData.base_currency_usd,
      base_currency_jpy: bodyData.base_currency_jpy,
      base_currency_eur: bodyData.base_currency_eur,
      base_currency_sgd: bodyData.base_currency_sgd,
      base_currency_aud: bodyData.base_currency_aud,
      base_currency_nzd: bodyData.base_currency_nzd,
      base_currency_gbp: bodyData.base_currency_gbp,
      base_currency_zar: bodyData.base_currency_zar,
      base_currency_huf: bodyData.base_currency_huf,
      base_currency_chf: bodyData.base_currency_chf,
      rebates_currency: bodyData.rebates_currency,
    }

    // save DB
    await accountTypeRepository.createNewAccountType(payload)
    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getAccountTypeDetail = async (event)=>{
  try {
    const { account_type_id } = event.pathParameters || {}
    if (!account_type_id) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }
    // get detail
    const data = await accountTypeRepository.getAccountTypeDetailById(account_type_id)

    return utility.createResponse(true, data)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const updateAccountType = async (event) =>{
  try {
    const { account_type_id } = event.pathParameters || {}
    const bodyData = JSON.parse(event.body) || {}

    if (!account_type_id || !bodyData.broker_id || !bodyData.account_type_name || !bodyData.account_type_code ||
      !Object.values(flag).includes(bodyData.platform_mt4) || !Object.values(flag).includes(bodyData.platform_mt5) ||
      !Object.values(flag).includes(bodyData.base_currency_usd) || !Object.values(flag).includes(bodyData.base_currency_jpy) ||
      !Object.values(flag).includes(bodyData.base_currency_eur) || !Object.values(flag).includes(bodyData.base_currency_sgd) ||
      !Object.values(flag).includes(bodyData.base_currency_aud) || !Object.values(flag).includes(bodyData.base_currency_nzd) ||
      !Object.values(flag).includes(bodyData.base_currency_gbp) || !Object.values(flag).includes(bodyData.base_currency_zar) ||
      !Object.values(flag).includes(bodyData.base_currency_huf) || !Object.values(flag).includes(bodyData.base_currency_chf)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }
    // check account type exist in DB
    const accountTypedata = await accountTypeRepository.getAccountTypeDetailById(account_type_id)
    if (!accountTypedata) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
    }
    // check broker exist in DB
    const isExistBroker = await brokerRepository.getBrokerById(bodyData.broker_id)
    if (!isExistBroker) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UPDATE_ACCOUNT_TYPE.BROKER_NOT_EXIST])
    }
    const isExistData = await accountTypeRepository.existFieldDataForUpdate(
      bodyData.account_type_name,
      bodyData.account_type_code,
      bodyData.broker_id,
      account_type_id,
    )

    if (isExistData.isError) {
      switch (isExistData.codeError) {
        case errorKeyServer.EXIST.ACCOUNT_TYPE_NAME_AND_ACCOUNT_TYPE_CODE: {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.UPDATE_ACCOUNT_TYPE.EXIST.ACCOUNT_TYPE_NAME,
              errorMessageCodeConstant.UPDATE_ACCOUNT_TYPE.EXIST.ACCOUNT_TYPE_CODE])
        }
        case errorKeyServer.EXIST.ACCOUNT_TYPE_NAME: {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.UPDATE_ACCOUNT_TYPE.EXIST.ACCOUNT_TYPE_NAME])
        }
        case errorKeyServer.EXIST.ACCOUNT_TYPE_CODE: {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.UPDATE_ACCOUNT_TYPE.EXIST.ACCOUNT_TYPE_CODE])
        }
      }
    }
    let new_account_type_sequence
    if (bodyData.broker_id !== accountTypedata.broker_id ) {
      // update current account type
      const maxSequenceAccountType = await accountTypeRepository.maxSequenceByBrokerId(bodyData.broker_id)
      if (maxSequenceAccountType) {
        new_account_type_sequence = maxSequenceAccountType.account_type_sequence + 1
      } else {
        new_account_type_sequence = 1
      }
    } else {
      new_account_type_sequence = null
    }

    const payload = {
      broker_id: bodyData.broker_id,
      account_type_name: bodyData.account_type_name,
      account_type_code: bodyData.account_type_code,
    }

    // eslint-disable-next-line guard-for-in
    for (const key in bodyData) {
      switch (key) {
        case 'platform_mt4':
        case 'platform_mt5':
        case 'base_currency_usd':
        case 'base_currency_jpy':
        case 'base_currency_eur':
        case 'base_currency_sgd':
        case 'base_currency_aud':
        case 'base_currency_nzd':
        case 'base_currency_gbp':
        case 'base_currency_zar':
        case 'base_currency_huf':
        case 'base_currency_chf':
          if (!Object.values(flag).includes(bodyData[key])) {
            return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
          }
          payload[key] = bodyData[key]
          break

        case 'rebates_currency':
          if ( ![baseCurrency.USD, baseCurrency.JPY, baseCurrency.EUR].includes(bodyData[key])) {
            return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
          }
          payload[key] = bodyData[key]
          break

        default:
          break
      }
    }
    // update DB
    const update = await accountTypeRepository.updateAccountTypeSequence(account_type_id, payload, new_account_type_sequence, accountTypedata)

    if (!update) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UPDATE_ACCOUNT_TYPE.UPDATE_SEQUENCE_FAIL])
    }
    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  getListAccount,
  updateAccountTypeIndex,
  createNewAccountType,
  getAccountTypeDetail,
  updateAccountType,
}
