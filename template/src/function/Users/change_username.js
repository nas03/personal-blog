'use strict'

/* constant */
const { contentUpdate, category, statusCode, errorMessageCodeConstant } = require('constant')

/* function */
const utility = require('utility')

/* DB */
const { errorLogRepository, usersBasicDataRepository } = require('repository')

const { userNameValidator } = require('helper').regex
const operationHistory = require('../History/operation_history').createOperationHistory

const changeUsername = async (event) => {
  try {
    const { user_name } = JSON.parse(event.body) || {}
    const userId = event.pathParameters.userId

    if (!user_name) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    if (user_name.length > 50 || user_name.includes(' ') || userNameValidator(user_name) ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    const userInfo = await usersBasicDataRepository.getUserInfo(userId)

    if (!userInfo) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.CHANGE_USERNAME.UPDATE_FAILED.USER_NOT_FOUND])
    }

    // check account status
    if ( userInfo.account_status_code === statusCode.CLOSED ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.CHANGE_USERNAME.UPDATE_FAILED.ACCOUNT_CLOSED])
    }

    // check username exist system
    const existUsername = await usersBasicDataRepository.isDuplicateField({ user_name, site_id: userInfo.site_id })

    if (existUsername) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.CHANGE_USERNAME.USER_NAME_EXIST])
    }

    // update username
    const updateUserName = await usersBasicDataRepository.updateUserById(userId, { 'user_name': user_name })

    if (!updateUserName) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.CHANGE_USERNAME.UPDATE_FAILED.UPDATE_DB])
    }

    const staffId = utility.getUserIdByToken(event)

    // create operation history
    const ipAddress = event.requestContext.identity.sourceIp
    const deviceBrowser = {
      userAgent: event.headers['User-Agent'],
      mobileDeviceName: event.headers.access_device_name,
    }

    await operationHistory(
      userId,
      userInfo.site_id,
      category.BASIC_INFORMATION_PERSON_OR_CORPORATE,
      contentUpdate.CHANGE_USER_NAME,
      userInfo.user_name,
      user_name,
      ipAddress,
      deviceBrowser,
      staffId,
    )

    return utility.createResponse(true)
  } catch (error) {
    console.error(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  changeUsername,
}
