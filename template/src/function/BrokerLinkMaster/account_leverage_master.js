/* constant */
const utility = require('utility')
const { flag, sequenceAction, constantKey, uncheckALL, errorMessageCodeConstant } = require('constant')

/* DB */
const { errorLogRepository, brokerRepository, accountTypeRepository, accountLeverageRepository } = require('repository')

const createNewAccountLeverage = async (event) => {
  try {
    const bodyData = JSON.parse(event.body) || {}
    // validate fields
    if (!bodyData.broker_id || !bodyData.account_type_id || !bodyData.is_unlimited && !bodyData.account_leverage) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    if (!Object.values(flag).includes(bodyData.is_unlimited)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // Set value unlimited
    bodyData.account_leverage = bodyData.is_unlimited ? constantKey.LEVERAGE_UNLIMITED : bodyData.account_leverage

    // check data in DB
    const isExistBroker = await brokerRepository.getBrokerById(bodyData.broker_id)
    if (!isExistBroker) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.CREATE_ACCOUNT_LEVERAGE.BROKER.IS_NOT_EXIST])
    }

    const accountTypeObj = await accountTypeRepository.checkAccountType(bodyData.broker_id, bodyData.account_type_id)
    if (!accountTypeObj) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.CREATE_ACCOUNT_LEVERAGE.ACCOUNT_TYPE.NOT_FOUND])
    }

    if (isExistBroker.enable_flag === flag.FALSE) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.CREATE_ACCOUNT_LEVERAGE.BROKER.DISABLED])
    }

    if (accountTypeObj.enable_flag === flag.FALSE) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.CREATE_ACCOUNT_LEVERAGE.ACCOUNT_TYPE.DISABLED])
    }

    const isExistAccountLeverage = await accountLeverageRepository.existData(accountTypeObj.id, bodyData.account_leverage)
    if (isExistAccountLeverage) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.CREATE_ACCOUNT_LEVERAGE.ACCOUNT_LEVERAGE.IS_EXIST])
    }

    const accountLeverageSequence = await accountLeverageRepository.checkSequenceByAccountTypeId(accountTypeObj.id)

    const account_leverage_sequence = accountLeverageSequence.maxAccountLeverageSequence ? accountLeverageSequence.maxAccountLeverageSequence + 1 : 1

    const payload = {
      account_type_id: accountTypeObj.id,
      account_leverage_sequence: account_leverage_sequence,
      account_leverage: bodyData.account_leverage,
    }
    // save DB
    await accountLeverageRepository.createNewAccountLeverage(payload)

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getAccountLeverageList = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}
    // param of checkbox
    if (queryString.brokerId) {
      queryString.brokerId = queryString.brokerId.split(',')
    }

    if (queryString.accountTypeId) {
      queryString.accountTypeId = queryString.accountTypeId.split(',')
    }

    // get pagination
    const pagination = utility.getPagination(queryString)

    // CHECK CASE SELECT BOX UNCHECK ALL
    if ([Number(queryString.brokerId), Number(queryString.accountTypeId)].includes(uncheckALL)) {
      const res = utility.paginatedItems([], pagination.currentPage, pagination.perPage)
      return utility.createResponse(true, res)
    }

    // get max min account leverage sequence
    const maxMinSequence = await accountLeverageRepository.checkMaxMinSequenceByAccountTypeId()

    // query data
    const data = await accountLeverageRepository.getAccountLeverageList(queryString, pagination)

    const dataFormat = data.data.map((item)=> {
      for (const obj of maxMinSequence) {
        if (item.account_type_id === obj.account_type_id) {
          return {
            ...item,
            is_min_account_leverage_sequence: item.account_leverage_sequence === obj.minSequence ? flag.TRUE : flag.FALSE,
            is_max_account_leverage_sequence: item.account_leverage_sequence === obj.maxSequence ? flag.TRUE : flag.FALSE,
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

const updateAccountLeverageIndex = async (event) => {
  try {
    const { field_name, field_data } = JSON.parse(event.body)

    const { id } = event.pathParameters

    if (!field_name) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    const accountLeverage = await accountLeverageRepository.getAccountLeverageById(id)

    // check account id is exist
    if (!accountLeverage) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_ACCOUNT_LEVERAGE_INDEX.ACCOUNT_LEVERAGE.IS_NOT_EXIST])
    }

    switch (field_name) {
      case 'enable_flag':
        if (!Object.values(flag).includes(field_data)) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        const isUpdate = await accountLeverageRepository.updateAccountLeverage(id, { enable_flag: field_data })
        if (!isUpdate) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.UPDATE_ACCOUNT_LEVERAGE_INDEX.ACCOUNT_LEVERAGE.UPDATE_FAIL])
        }
        return utility.createResponse(true)
      case 'account_leverage_sequence':
        if (Object.values(sequenceAction).includes(field_data) ) {
          const maxMinSequence = await accountLeverageRepository.checkSequenceByAccountTypeId(accountLeverage.account_type_id)
          if (field_data === sequenceAction.UP &&
            maxMinSequence.minAccountLeverageSequence === accountLeverage.account_leverage_sequence ||
          field_data === sequenceAction.DOWN &&
          maxMinSequence.maxAccountLeverageSequence === accountLeverage.account_leverage_sequence) {
            return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
          }

          const result = await accountLeverageRepository.updateSequence(field_data, accountLeverage)
          if (result.isError) {
            return await errorLogRepository.createResponseAndLog(event, result.error, null,
              [errorMessageCodeConstant.UPDATE_ACCOUNT_LEVERAGE_INDEX.UPDATE_SEQUENCE_FAIL])
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

const updateAccountLeverage = async (event) => {
  try {
    const { id } = event.pathParameters || {}
    const bodyData = JSON.parse(event.body) || {}

    if (!id || !bodyData.broker_id || !bodyData.account_type_id || !bodyData.is_unlimited && !bodyData.account_leverage) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    if (!Object.values(flag).includes(bodyData.is_unlimited)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // Set value unlimited
    bodyData.account_leverage = bodyData.is_unlimited ? constantKey.LEVERAGE_UNLIMITED : bodyData.account_leverage

    // check account leverage exist in DB
    const accountLeveragedata = await accountLeverageRepository.getAccountLeverageDetailById(id)
    if (!accountLeveragedata) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_ACCOUNT_LEVERAGE.NOT_EXIST.ACCOUNT_LEVERAGE])
    }
    // check data in DB
    const isExistBroker = await brokerRepository.getBrokerById(bodyData.broker_id)
    if (!isExistBroker) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_ACCOUNT_LEVERAGE.NOT_EXIST.BROKER])
    }

    const accountTypeObj = await accountTypeRepository.checkAccountType(bodyData.broker_id, bodyData.account_type_id)
    if (!accountTypeObj) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_ACCOUNT_LEVERAGE.ACCOUNT_TYPE_NOT_FOUND])
    }

    const isExistData = await accountLeverageRepository.existFieldDataForUpdate(bodyData.account_type_id, bodyData.account_leverage, id)
    if (isExistData) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_ACCOUNT_LEVERAGE.ACCOUNT_LEVERAGE_IS_EXISTED])
    }
    let new_account_leverage_sequence
    if (Number(bodyData.account_type_id) !== accountLeveragedata.account_type_id) {
      const maxAccountLeverageSequence = await accountLeverageRepository.maxSequenceByAccountTypeId(bodyData.account_type_id)
      if (maxAccountLeverageSequence.account_leverage_sequence) {
        new_account_leverage_sequence = maxAccountLeverageSequence.account_leverage_sequence + 1
      } else {
        new_account_leverage_sequence = 1
      }
    } else {
      new_account_leverage_sequence = null
    }

    const payload = {
      account_leverage: bodyData.account_leverage,
    }
    if (new_account_leverage_sequence) {
      payload.account_leverage_sequence = new_account_leverage_sequence
    }

    const result = await accountLeverageRepository.updateInputAccountLeverage(
      id,
      payload,
      bodyData.account_type_id,
      new_account_leverage_sequence,
      accountLeveragedata )
    if (!result) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_ACCOUNT_LEVERAGE.UPDATE_FAIL.INPUT_ACCOUNT_LEVERAGE])
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  createNewAccountLeverage,
  getAccountLeverageList,
  updateAccountLeverageIndex,
  updateAccountLeverage,
}
