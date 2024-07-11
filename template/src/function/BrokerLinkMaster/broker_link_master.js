/* library */
const utility = require('utility')

/* DB */
const {
  errorLogRepository,
  brokerRepository,
  productTypeRepository,
  accountTypeRepository,
} = require('repository')

/* constant */
const { brokersLinkMasterType, flag, sequenceAction, uncheckALL, errorMessageCodeConstant,
  errorKeyServer } = require('constant')

const getBrokerLinkMasterDropdown = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}
    const { type } = queryString

    if (!type) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    let listData
    switch (type) {
      case brokersLinkMasterType.BROKER:
        listData = await brokerRepository.getAll(queryString.isShowOnlyEnable)
        break
      case brokersLinkMasterType.PRODUCT_TYPE:
        listData = await productTypeRepository.getAll(queryString.isShowOnlyEnable, queryString.isDistinct)
        break
      case brokersLinkMasterType.ACCOUNT_TYPE:
        listData = await accountTypeRepository.getAll(queryString.isShowOnlyEnable)
        break
      default:
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    return utility.createResponse(true, listData)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getBrokerList = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}

    if (queryString.broker) {
      queryString.broker = queryString.broker.split(',')
    }
    // get pagination
    const pagination = utility.getPagination(queryString)

    // CHECK CASE SELECT BOX UNCHECK ALL
    if (Number(queryString.broker) === uncheckALL) {
      const res = utility.paginatedItems([], pagination.currentPage, pagination.perPage)
      return utility.createResponse(true, res)
    }

    // get max min broker sequence
    const maxMinSequence = await brokerRepository.checkBrokerSequence()

    // query data
    const result = await brokerRepository.getBrokerList(queryString, pagination)

    const dataFormat = result.data.map((item)=> {
      return {
        ...item,
        is_min_broker_sequence: item.broker_sequence === maxMinSequence.min_broker_sequence ? flag.TRUE : flag.FALSE,
        is_max_broker_sequence: item.broker_sequence === maxMinSequence.max_broker_sequence ? flag.TRUE : flag.FALSE,
      }
    })

    return utility.createResponse(true, { data: dataFormat, pagination: result.pagination })
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const updateBrokerIndex = async (event) => {
  try {
    const { field_update, field_data } = JSON.parse(event.body) || {}
    const { broker_id } = event.pathParameters || {}

    if (!field_update) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // check broker
    const broker = await brokerRepository.getBrokerById(broker_id)

    if (!broker) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UPDATE_BROKER_INDEX.BROKER_NOT_EXIST])
    }

    // update db
    switch (field_update) {
      case 'enable_flag':
        if (!Object.values(flag).includes(field_data)) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        // update data
        const result = await brokerRepository.updateBroker(broker_id, { enable_flag: field_data })
        if (result.isError) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.UPDATE_BROKER_INDEX.UPDATE.BROKER_ENABLE_FLAG])
        }

        return utility.createResponse(true)
      case 'broker_sequence':
        // validate request data
        if (Object.values(sequenceAction).includes(field_data)) {
          const checkBroker = await brokerRepository.checkBrokerSequence()

          if (field_data === sequenceAction.UP && checkBroker.min_broker_sequence === broker.broker_sequence ||
              field_data === sequenceAction.DOWN && checkBroker.max_broker_sequence === broker.broker_sequence
          ) {
            return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
          }

          // update data
          const update = await brokerRepository.updateBrokerSequence(broker_id, broker.broker_sequence, field_data)

          if (update.isError) {
            return await errorLogRepository.createResponseAndLog(event, update.error, null,
              [errorMessageCodeConstant.UPDATE_BROKER_INDEX.UPDATE.BROKER_SEQUENCE])
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
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
  }
}

const createNewBroker = async (event) => {
  try {
    const bodyData = JSON.parse(event.body) || {}

    // validate broker name and short name
    if (!bodyData.broker_name || ! bodyData.broker_code) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // check data in DB
    const isExitData = await brokerRepository.existFieldData(bodyData.broker_name, bodyData.broker_code)

    if (isExitData.status) {
      switch (isExitData.codeError) {
        case errorKeyServer.EXIST.BROKER_NAME_AND_SHORT_NAME: {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.CREATE_BROKER.EXIST.BROKER_NAME, errorMessageCodeConstant.CREATE_BROKER.EXIST.BROKER_SHORT_NAME])
        }
        case errorKeyServer.EXIST.BROKER_NAME: {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.CREATE_BROKER.EXIST.BROKER_NAME])
        }
        case errorKeyServer.EXIST.BROKER_SHORT_NAME: {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.CREATE_BROKER.EXIST.BROKER_SHORT_NAME])
        }
      }
    }

    // eslint-disable-next-line guard-for-in
    for (const key in bodyData) {
      switch (key) {
        case 'premium_broker':
          if (!_isExistValue(bodyData[key])) {
            return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
          }

          if (!Object.values(flag).includes(bodyData[key])) {
            return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
          }
          break
        case 'ja_broker_name':
        case 'en_broker_name':
        case 'cn_broker_name':
        case 'kr_broker_name':
          if (!bodyData[key]) {
            return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
          }

          break
        default:
          break
      }
    }

    // get max broker sequence
    const checkBrokerSequence = await brokerRepository.checkBrokerSequence()
    // create payload
    const payload = {
      broker_code: bodyData.broker_code,
      broker_name: bodyData.broker_name,
      premium_broker: bodyData.premium_broker,
      ja_broker_name: bodyData.ja_broker_name,
      en_broker_name: bodyData.en_broker_name,
      cn_broker_name: bodyData.cn_broker_name,
      kr_broker_name: bodyData.kr_broker_name,
      broker_sequence: checkBrokerSequence.max_broker_sequence ? checkBrokerSequence.max_broker_sequence + 1 : 1,
    }

    // save DB
    const result = await brokerRepository.createNewBroker(payload)

    if (!result) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getBrokerDetail = async (event)=>{
  try {
    const { broker_id } = event.pathParameters || {}
    if (!broker_id) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.ACCESS_TOKEN_INVALID])
    }

    // get detail
    const data = await brokerRepository.getBrokerById(broker_id)

    return utility.createResponse(true, data)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const updateBroker = async (event) => {
  try {
    const { broker_id } = event.pathParameters || {}
    const bodyData = JSON.parse(event.body) || {}

    // check broker exist in DB
    const brokerData = await brokerRepository.getBrokerById(broker_id)
    if (!brokerData) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UPDATE_BROKER.BROKER_NOT_EXIST])
    }

    let isExistBrokerName = false
    let isExistBrokerCode = false
    const payload = {}
    // validate broker name
    if (bodyData.broker_name) {
      // check exist
      isExistBrokerName = await brokerRepository.checkDataExistForUpdate(broker_id, 'broker_name', bodyData.broker_name)
      payload.broker_name = bodyData.broker_name
    }

    // validate broker code
    if (bodyData.broker_code) {
      // check exist
      isExistBrokerCode = await brokerRepository.checkDataExistForUpdate(broker_id, 'broker_code', bodyData.broker_code)
      payload.broker_code = bodyData.broker_code
    }

    // if exist in DB return error
    if (isExistBrokerCode && isExistBrokerName) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_BROKER.EXIST.BROKER_NAME, errorMessageCodeConstant.UPDATE_BROKER.EXIST.BROKER_SHORT_NAME])
    } else if (isExistBrokerName) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UPDATE_BROKER.EXIST.BROKER_NAME])
    } else if (isExistBrokerCode) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UPDATE_BROKER.EXIST.BROKER_SHORT_NAME])
    }

    // eslint-disable-next-line guard-for-in
    for (const key in bodyData) {
      switch (key) {
        case 'premium_broker':
          if (!Object.values(flag).includes(bodyData[key])) {
            return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
          }
          payload.premium_broker = bodyData[key]
          break
        case 'ja_broker_name':
        case 'en_broker_name':
        case 'cn_broker_name':
        case 'kr_broker_name':
          payload[key] = bodyData[key]
          break
        default:
          break
      }
    }

    // update DB
    const update = await brokerRepository.updateBroker(broker_id, payload)

    if (update.isError) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UPDATE_BROKER.UPDATE_BROKER_FAIL])
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const _isExistValue = (value) =>{
  if (value === null || value === undefined) {
    return false
  }
  return true
}

module.exports = {
  getBrokerLinkMasterDropdown,
  getBrokerList,
  updateBrokerIndex,
  createNewBroker,
  getBrokerDetail,
  updateBroker,
}
