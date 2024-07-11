const { flag, errorMessageCodeConstant } = require('constant')
const { errorLogRepository, symbolNameRepository } = require('repository')
const utility = require('utility')

const getAllSymbolNameMaster = async (event)=> {
  try {
    const queryString = event.queryStringParameters || {}

    const pagination = utility.getPagination(queryString)

    // query data
    const data = await symbolNameRepository.getAllSymbolNameMaster(queryString, pagination)

    return utility.createResponse(true, data)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const updateSymbolNameFlag = async (event) => {
  try {
    const { symbol_name_id } = event.pathParameters || {}
    const { enable_flag } = JSON.parse(event.body) || {}

    // check symbol is exist
    const symbolNameData = await symbolNameRepository.getSymbolNameById(symbol_name_id)
    if (!symbolNameData) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // validate data
    if (!_existValue(enable_flag)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    if (!Object.values(flag).includes(enable_flag)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // update data
    const update = await symbolNameRepository.updateSymbolName(symbol_name_id, { enable_flag })
    if (!update) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_SYMBOL_NAME.UPDATE_FAIL])
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const createNewSymbolName = async (event) => {
  try {
    const eventBody = JSON.parse(event.body) || {}

    // validate data
    if (!eventBody.symbol_code || !eventBody.ja_symbol_name || !eventBody.en_symbol_name ||
      !eventBody.kr_symbol_name || !eventBody.cn_symbol_name) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // check if data is exist
    const isExist = await symbolNameRepository.checkSymbolCode(eventBody.symbol_code)
    if (isExist) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.CREATE_NEW_SYMBOL_NAME.IS_EXISTED.SYMBOL_CODE])
    }

    // create payload
    const payload = {
      symbol_code: eventBody.symbol_code,
      ja_symbol_name: eventBody.ja_symbol_name,
      en_symbol_name: eventBody.en_symbol_name,
      cn_symbol_name: eventBody.cn_symbol_name,
      kr_symbol_name: eventBody.kr_symbol_name,
    }

    await symbolNameRepository.createSymbolName(payload)

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getDetailSymbolName = async (event) => {
  try {
    const { symbol_name_id } = event.pathParameters || {}

    const data = await symbolNameRepository.getSymbolNameById(symbol_name_id)

    return utility.createResponse(true, data)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}
const updateSymbolNameMaster = async (event) => {
  try {
    const { symbol_name_id } = event.pathParameters || {}
    const eventBody = JSON.parse(event.body) || {}

    // check symbol id is exist
    const symbolData = await symbolNameRepository.getSymbolNameById(symbol_name_id)

    if (!symbolData) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_SYMBOL_NAME_MASTER.NOT_EXIST.SYMBOL_DATA])
    }

    // check body data
    const payload = {}

    // eslint-disable-next-line guard-for-in
    for (const key in eventBody) {
      switch (key) {
        case 'symbol_code':
          if (!eventBody[key]) {
            return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
          }
          // check if data is exist
          const isExist = await symbolNameRepository.checkSymbolCodeForUpdate(symbol_name_id, eventBody[key])
          if (isExist) {
            return await errorLogRepository.createResponseAndLog(event, null, null,
              [errorMessageCodeConstant.UPDATE_SYMBOL_NAME_MASTER.IS_EXIST.SYMBOL_CODE])
          }

          payload[key] = eventBody[key]
          break
        case 'ja_symbol_name':
        case 'en_symbol_name':
        case 'cn_symbol_name':
        case 'kr_symbol_name':
          if (!eventBody[key]) {
            return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
          }
          payload[key] = eventBody[key]

          break
        default:
          break
      }
    }

    // update data
    const update = await symbolNameRepository.updateSymbolName(symbol_name_id, payload)

    if (!update) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_SYMBOL_NAME_MASTER.UPDATE_FAIL.SYMBOL_CODE])
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const _existValue = (value) => {
  if (value === null || value === undefined) {
    return false
  }
  return true
}

module.exports = {
  getAllSymbolNameMaster,
  updateSymbolNameFlag,
  createNewSymbolName,
  getDetailSymbolName,
  updateSymbolNameMaster,
}
