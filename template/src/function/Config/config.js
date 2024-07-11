'use strict'

// library
const utility = require('utility')
const { authorizationRepository, errorLogRepository, statusMasterRepository, siteSettingRepository, sequenceRepository,
  batchLogRepository, errorLogRetentionRepository } = require('repository')

const { statusClassConstant, flag, errorMessageCodeConstant, settingClass, displayFlagSiteSetting, enableFlagSiteSetting,
  batchTypes, resultTypes, dateFormat, resultDetailMessages, resultDetailIds } = require('constant')

const _ = require('lodash')
const moment = require('moment')

const { commonGetAdminData } = require('./sites')

const aws = require('helper').aws

const config = async (event) => {
  try {
    const adminId = utility.getUserIdByToken(event)

    const [adminData, listAuthorization] = await Promise.all([
      commonGetAdminData(adminId),
      authorizationRepository.getAuthorizations(),
    ])

    return utility.createResponse(true, {
      sites: adminData.admin_with_sites,
      authorizations: listAuthorization,
    })
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const scheduleClearErrorLog = async (event) => {
  let parentBatchLogId
  let total_count = 0
  const processStartTime = moment.utc().format(dateFormat.DATE_TIME_ZONE)
  try {
    console.log('====== Start clear error log ======')
    parentBatchLogId = await sequenceRepository.updateAndGetBatchId()
    parentBatchLogId && await batchLogRepository.createNewBatchLogBegin(parentBatchLogId, batchTypes.CLEAR_ERROR_LOG)

    const sqsMessage = utility.generateSqsMessage(parentBatchLogId, resultDetailIds.E_1030002)

    parentBatchLogId && await aws.sendSqsMessage(sqsMessage, 30)

    const settingClearErrorLog = await errorLogRetentionRepository.getSettingClearErrorLog()

    total_count = await errorLogRepository.clearErrorLog(settingClearErrorLog)

    parentBatchLogId && await batchLogRepository.createNewBatchLogProcessResult(
      parentBatchLogId,
      batchTypes.CLEAR_ERROR_LOG,
      resultTypes.SUCCESS,
      {
        total_count: total_count,
        result_count: total_count,
        process_start_time: processStartTime,
        process_end_time: moment.utc().format(dateFormat.DATE_TIME_ZONE),
        result_detail: {},
      },
    )
    return utility.createResponse(true)
  } catch (error) {
    console.error(error)

    parentBatchLogId && await batchLogRepository.createNewBatchLogProcessResult(
      parentBatchLogId,
      batchTypes.CLEAR_ERROR_LOG,
      resultTypes.ERROR,
      {
        total_count: total_count,
        result_count: 0,
        process_start_time: processStartTime,
        process_end_time: moment.utc().format(dateFormat.DATE_TIME_ZONE),
        result_detail: {
          // eslint-disable-next-line new-cap
          result_detail_message: resultDetailMessages.E_1030001(error.sqlMessage || error.message),
        },
      },
      resultDetailIds.E_1030001,
    )

    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  } finally {
    parentBatchLogId && await batchLogRepository.createNewBatchLogEnd(parentBatchLogId, batchTypes.CLEAR_ERROR_LOG)
  }
}

// API PT0076
const getStatusDropDown = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}
    // Validate required
    if (_.isEmpty(queryString.statusClass)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    let { statusClass, site_id } = queryString
    const statusClassIds = statusClass.split(',')
    site_id = parseInt(site_id)

    // Validate format
    if (_.some(queryString.statusClassIds, isNaN)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // Get data form m_status
    const statusData = await statusMasterRepository.getListStatusByClass(statusClassIds)

    const settingNotificationMail = site_id ?
      await siteSettingRepository.getSiteSetting(
        {
          setting_class: settingClass.SEND_MAIL_SETTING,
          site_id: site_id,
        },
        statusClassIds,
      ) :
      []

    // Format response with object key is status class name
    const response = {}
    if (statusData) {
      for (const statusClassId of statusClassIds) {
        const statusClassName = _renderStatusClassName(statusClassId)
        if (statusClassName) {
          response[statusClassName] = statusData
            .filter((obj) => obj.status_with_class_id.includes(statusClassId) && obj.status_label_number === flag.FALSE)
            .map((statusMaster) =>{
              const { display_flag, enable_flag, default_value } =
                settingNotificationMail.find(
                  (el) =>
                    el.status_code === statusMaster.status_code &&
                    el.status_class_id === Number(statusClassId),
                ) || {}
              const send_mail_display_class = renderSendMailDisplayClass(display_flag, enable_flag)
              return {
                ...statusMaster,
                status_labels: statusData.filter((obj) =>
                  obj.status_code === statusMaster.status_code &&
                Number(obj.status_label_number ) !== Number(flag.FALSE)),
                send_mail_display_class: send_mail_display_class || send_mail_display_class === 0 ? send_mail_display_class : undefined,
                default_send_mail_value: parseInt(default_value) || parseInt(default_value) === 0 ? parseInt(default_value) : undefined,
              }
            })
        }
      }
    }

    return utility.createResponse(true, response)
  } catch (error) {
    console.log(error.message)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const _renderStatusClassName = (statusClassId) => {
  switch (Number(statusClassId)) {
    case statusClassConstant.ACCOUNT_STATUS:
      return 'account_status'
    case statusClassConstant.MT_STATUS:
      return 'mt_status'
    case statusClassConstant.DOCUMENT_STATUS:
      return 'document_status'
    case statusClassConstant.PAYMENT_MATCHING_STATUS:
      return 'payment_matching_status'
    case statusClassConstant.PAYMENT_STATUS:
      return 'payment_status'
    case statusClassConstant.PAYMENT_OPERATION_STATUS:
      return 'payment_operation_status'
    case statusClassConstant.USER_MATCHING_PROCESS_STATUS:
      return 'user_matching_process_status'
    case statusClassConstant.WALLET_STATUS:
      return 'wallet_status'
    case statusClassConstant.SUPPORT_STATUS:
      return 'support_status'
    case statusClassConstant.IT_STATUS:
      return 'it_status'
    case statusClassConstant.REBATE_HISTORY_STATUS:
      return 'rebate_history_status'
  }
}

const renderSendMailDisplayClass = (display_flag, enable_flag) =>{
  switch (display_flag) {
    case displayFlagSiteSetting.OFF:
      return 0
    case displayFlagSiteSetting.ON:
      if ( enable_flag === enableFlagSiteSetting.ON) return 1
      else if (enable_flag === enableFlagSiteSetting.OFF) return 2
    default:
      return null
  }
}


module.exports = {
  config,
  scheduleClearErrorLog,
  getStatusDropDown,
  renderSendMailDisplayClass,
}
