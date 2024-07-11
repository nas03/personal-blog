'use strict'

/* library */
const moment = require('moment')

/* constant */
const defaultId = -99
const { dataStatus, message, flag, dateFormat, category, commonSiteId, categoryChangeProfile,
  errorMessageCodeConstant } = require('constant')

const utility = require('utility')
const { errorLogRepository, usersBasicDataRepository } = require('repository')

/* DB */
const operationHistoryRepository = require('repository').operationHistoryRepository

const createOperationHistory = async (
  userId = defaultId,
  siteId,
  categoryId,
  contentTypeId,
  beforeUpdate,
  afterUpdate,
  ipAddress,
  deviceBrowser,
  authorizedPerson,
  target = null,
  trading_account_id = null,
) => {
  try {
    const location = await utility.getLocationByIp(ipAddress)
    const objOperationHistory = {
      id: utility.renderRandomId(),
      user_basic_data_id: userId ? userId : defaultId,
      site_id: siteId,
      category_id: categoryId,
      content: contentTypeId,
      before_update: beforeUpdate,
      after_update: afterUpdate,
      ip_address: ipAddress,
      access_country: location ? location.countryCode : null,
      device_browser: deviceBrowser,
      authorized_person: authorizedPerson,
      admin_flag: flag.TRUE,
      target,
      trading_account_id,
    }
    await operationHistoryRepository.createOperationHistory(objOperationHistory)
    return { status: dataStatus.COMPLETE }
  } catch (error) {
    console.log(error)
    return { status: dataStatus.FAIL, errorMessage: message.server_error }
  }
}

const initOperationHistory = async (
  userId = defaultId,
  siteId,
  categoryId,
  contentTypeId,
  beforeUpdate,
  afterUpdate,
  ipAddress,
  deviceBrowser,
  authorizedPerson,
  location,
  msAddMoment = 0,
  target = null,
  trading_account_id = null,
) => {
  const objOperationHistory = {
    id: utility.renderRandomId(),
    user_basic_data_id: userId ? userId : defaultId,
    site_id: siteId,
    category_id: categoryId,
    content: contentTypeId,
    before_update: beforeUpdate,
    after_update: afterUpdate,
    ip_address: ipAddress,
    access_country: location ? location.countryCode : null,
    device_browser: deviceBrowser,
    authorized_person: authorizedPerson,
    admin_flag: flag.TRUE,
    target,
    trading_account_id,
  }
  return objOperationHistory
}

const getListOperationHistory = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}
    queryString.userId = event.pathParameters.userId || null
    event.user_id = queryString?.userId || null
    const isValidDate = (date) => moment(date, dateFormat.DATE, true).isValid()

    if ((queryString.tsRegistFrom && !isValidDate(queryString.tsRegistFrom)) ||
        (queryString.tsRegistTo && !isValidDate(queryString.tsRegistTo))) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // Get staff display date time and handle timezone
    const staffId = utility.getUserIdByToken(event)
    const staffInfo = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': staffId })
    queryString.utc = staffInfo.timezone || null


    const pagination = utility.getPagination(queryString)
    const result = await operationHistoryRepository.findAll(pagination, queryString)

    if (result.status === dataStatus.COMPLETE) {
      result.data.data.forEach((item) => {
        if (item.category_id === category.BASIC_INFORMATION_PERSON_OR_CORPORATE && item.site_id === commonSiteId.MY_FOREX) {
          item.ja_category_name = categoryChangeProfile.JA_NAME
          item.en_category_name = categoryChangeProfile.EN_NAME
          item.cn_category_name = categoryChangeProfile.CN_NAME
          item.kr_category_name = categoryChangeProfile.KR_NAME
        }
      })
      return utility.createResponse(true, result.data)
    } else {
      return await errorLogRepository.createResponseAndLog(event, result.errorMessage, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
    }
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getDetailOperationHistory = async (event) => {
  try {
    const result = await operationHistoryRepository.findById(event.pathParameters.id)
    if (result.status === dataStatus.COMPLETE) {
      if (result.data.category_id === category.BASIC_INFORMATION_PERSON_OR_CORPORATE &&
        result.data.site_id === commonSiteId.MY_FOREX
      ) {
        result.data.ja_category_name = categoryChangeProfile.JA_NAME
        result.data.en_category_name = categoryChangeProfile.EN_NAME
        result.data.cn_category_name = categoryChangeProfile.CN_NAME
        result.data.kr_category_name = categoryChangeProfile.KR_NAME
      }
      return utility.createResponse(true, result.data)
    } else {
      throw new Error(result.errorMessage)
    }
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const createListOperationHistory = async (
  userId,
  listInsert,
  event,
  authorizedPerson,
  target = null,
  trading_account_id = null,
) => {
  try {
    const ipAddress = event.requestContext.identity.sourceIp
    const deviceBrowser = {
      userAgent: event.headers['User-Agent'],
      mobileDeviceName: event.headers.access_device_name,
      mobileDeviceType: event.headers.access_device_type,
    }
    const location = await utility.getLocationByIp(ipAddress)
    const listHistory = await listInsert.map((el, index) => {
      const objOperationHistory = {
        id: utility.renderRandomId(),
        user_basic_data_id: userId ? userId : defaultId,
        site_id: el.site_id,
        category_id: el.category_id,
        content: el.content_update,
        before_update: el.before_update,
        after_update: el.after_update,
        ip_address: ipAddress,
        access_country: location ? location.countryCode : null,
        device_browser: deviceBrowser.userAgent,
        device_browser_name: deviceBrowser.mobileDeviceName ? deviceBrowser.mobileDeviceName : null,
        authorized_person: authorizedPerson,
        admin_flag: flag.TRUE,
        target: target ? target : (el.target ? el.target : null),
        trading_account_id: trading_account_id ? trading_account_id : (el.trading_account_id ? el.trading_account_id : null),
      }

      return objOperationHistory
    })

    await operationHistoryRepository.createOperationHistory(listHistory)

    return true
  } catch (error) {
    console.error(error)
    return false
  }
}

module.exports = {
  createOperationHistory,
  initOperationHistory,
  getListOperationHistory,
  getDetailOperationHistory,
  createListOperationHistory,
}
