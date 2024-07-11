'use strict'

/* library */
const moment = require('moment')

/* constant */
const utility = require('utility')
const { dateFormat, errorMessageCodeConstant } = require('constant')

/* DB */
const userAccessHistoryRepository = require('repository').userAccessHistoryRepository
const { errorLogRepository, usersBasicDataRepository } = require('repository')

module.exports.getListUserAccessHistory = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}
    queryString.userId = event.pathParameters.userId || null
    event.user_id = queryString?.userId
    if (queryString.accessTimeFrom && !moment(queryString.accessTimeFrom, dateFormat.DATE, true).isValid()) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    } else if (queryString.accessTimeTo && !moment(queryString.accessTimeTo, dateFormat.DATE, true).isValid()) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }
    // Get staff display date time and handle timezone
    const staffId = utility.getUserIdByToken(event)
    const staffInfo = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': staffId })
    queryString.utc = staffInfo.timezone || null
    queryString.display_date_time = staffInfo.display_date_time || null

    const pagination = utility.getPagination(queryString)
    const result = await userAccessHistoryRepository.findAll(pagination, queryString)
    return utility.createResponse(true, result)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}
