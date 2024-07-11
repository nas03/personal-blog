const { autoStatusChangeRuleRepository, errorLogRepository } = require('repository')
const { statusCode, errorMessageCodeConstant } = require('constant')
const utility = require('utility')
const addRangeUseSetting = require('../RangeUseSetting/add_range_use')

const editAutoStatusChangeRule = async (event) => {
  try {
    const eventBody = JSON.parse(event.body)
    const staffId = utility.getUserIdByToken(event)

    if (!utility.flagValidate(eventBody.pending_matching_rule)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    let objStatusChange = null
    let isValid = false
    let lstSegmentUser = ''

    if (eventBody.pending_matching_rule) {
      objStatusChange = {
        pending_matching_rule: eventBody.pending_matching_rule,
        p_status_change_exception: eventBody.p_status_change_exception,
        p_enable_compare_deposit_amount: eventBody.p_enable_compare_deposit_amount,
        p_compare_deposit_amount: eventBody.p_compare_deposit_amount,
        p_enable_compare_specific_user: eventBody.p_enable_compare_specific_user,
        p_compare_specific_user: eventBody.p_compare_specific_user,
        p_enable_compare_user_status: eventBody.p_enable_compare_user_status,
        p_compare_user_status: eventBody.p_compare_user_status,
        staff_id: staffId,
      }

      isValid = utility.flagValidate(objStatusChange.p_enable_compare_deposit_amount) &&
        utility.flagValidate(objStatusChange.p_enable_compare_specific_user) &&
        utility.flagValidate(objStatusChange.p_enable_compare_user_status) &&
        Object.values(statusCode).includes(objStatusChange.p_compare_user_status)

      if (!isValid) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
      }

      lstSegmentUser = eventBody.p_compare_specific_user
    } else {
      objStatusChange = {
        pending_matching_rule: eventBody.pending_matching_rule,
        a_status_change_exception: eventBody.a_status_change_exception,
        a_enable_compare_deposit_amount: eventBody.a_enable_compare_deposit_amount,
        a_compare_deposit_amount: eventBody.a_compare_deposit_amount,
        a_enable_compare_same_transaction_num: eventBody.a_enable_compare_same_transaction_num,
        a_compare_same_transaction_num: eventBody.a_compare_same_transaction_num,
        a_enable_compare_day_num: eventBody.a_enable_compare_day_num,
        a_compare_day_num: eventBody.a_compare_day_num,
        a_compare_total_deposit_amount: eventBody.a_compare_total_deposit_amount,
        a_enable_compare_specific_user: eventBody.a_enable_compare_specific_user,
        a_compare_specific_user: eventBody.a_compare_specific_user,
        a_enable_compare_user_attention: eventBody.a_enable_compare_user_attention,
        staff_id: staffId,
      }

      isValid = utility.flagValidate(objStatusChange.a_enable_compare_deposit_amount) &&
        utility.flagValidate(objStatusChange.a_enable_compare_same_transaction_num) &&
        utility.flagValidate(objStatusChange.a_enable_compare_day_num) &&
        utility.flagValidate(objStatusChange.a_enable_compare_specific_user) &&
        utility.flagValidate(objStatusChange.a_enable_compare_user_attention)

      if (!isValid) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
      }

      lstSegmentUser = eventBody.a_compare_specific_user
    }

    // validate segment user
    const listUserNotExists = await addRangeUseSetting.getSegmentUserNotExists(lstSegmentUser)

    if (listUserNotExists.length > 0) {
      return await errorLogRepository.createResponseAndLog(
        event,
        null,
        listUserNotExists,
        [errorMessageCodeConstant.EDIT_AUTO_STATUS_CHANGE_RULE.SEGMENT_USER_NOT_EXIST],
      )
    }

    // check exists auto status by bank api id
    const autoStatusSetting = await autoStatusChangeRuleRepository.getAutoStatusChangeRuleByBankApiId(eventBody.bank_api_id)

    if (!autoStatusSetting) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // update auto status change
    const response = await autoStatusChangeRuleRepository.updateAutoStatusChangeRule(objStatusChange, autoStatusSetting.id)
    if (!response) {
      return await errorLogRepository.createResponseAndLog(
        event,
        null,
        null,
        [errorMessageCodeConstant.EDIT_AUTO_STATUS_CHANGE_RULE.UPDATE_FAILED],
      )
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  editAutoStatusChangeRule,
}
