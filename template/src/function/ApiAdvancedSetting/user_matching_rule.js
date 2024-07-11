/* constant */
const { flag, conditionValue, keyValue, bankApi, errorMessageCodeConstant } = require('constant')
const utility = require('utility')

const { userMatchingRuleRepository, errorLogRepository } = require('repository')

const userMatchingRule = async (event) => {
  try {
    const staffId = utility.getUserIdByToken(event)

    const { apiAdvancedSetting, userMatchingRule } = JSON.parse(event.body) || {}

    if (!apiAdvancedSetting.bankApiId || !userMatchingRule) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // Check match_api_response and transfer_name_check input
    if (!Object.values(flag).includes(userMatchingRule.matchApiResponse) ||
      userMatchingRule.matchApiResponse && (!Object.values(flag).includes(userMatchingRule.transferNameCheck))) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    if (!Object.values(flag).includes(userMatchingRule.ignoreHonorific) ||
    !Object.values(flag).includes(userMatchingRule.checkCorporateNameRegistered) ||
    !Object.values(flag).includes(userMatchingRule.checkCorporateNameEnglish) ||
    !Object.values(flag).includes(userMatchingRule.checkCorporateNameKatakana)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    if (userMatchingRule.ignoreHonorific === flag.TRUE && userMatchingRule.checkCorporateNameRegistered === flag.FALSE &&
      userMatchingRule.checkCorporateNameKatakana === flag.FALSE && userMatchingRule.checkCorporateNameEnglish === flag.FALSE) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    if (userMatchingRule.ignoreHonorific === flag.FALSE && (userMatchingRule.checkCorporateNameEnglish === flag.TRUE ||
      userMatchingRule.checkCorporateNameKatakana === flag.TRUE || userMatchingRule.checkCorporateNameRegistered === flag.TRUE)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    if (userMatchingRule.matchApiResponse) {
      for (let index = 0; index < userMatchingRule.matchingConditions.length; index++) {
        if (apiAdvancedSetting.bankApiId === bankApi.FXT_MAXCONNECT &&
            (!Object.values(keyValue).includes(userMatchingRule.matchingConditions[index].key) ||
            userMatchingRule.matchingConditions[index].key === keyValue.MEMBER_ID)) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        if (apiAdvancedSetting.bankApiId === bankApi.FXT_INFINITAS &&
            userMatchingRule.matchingConditions[index].key !== keyValue.MEMBER_ID) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        if (
          index === userMatchingRule.matchingConditions.length - 1 && userMatchingRule.matchingConditions[index].condition !== null ||
          index !== userMatchingRule.matchingConditions.length - 1 &&
          !Object.values(conditionValue).includes(userMatchingRule.matchingConditions[index].condition)
        ) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }
      }
    }

    // get current settings
    const currentSetting = await userMatchingRuleRepository.getUserMatchingRule(apiAdvancedSetting.bankApiId)
    if (!currentSetting) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    let payload = {
      match_api_response: userMatchingRule.matchApiResponse,
      staff_id: staffId,
    }

    if (userMatchingRule.matchApiResponse === flag.TRUE) {
      payload = {
        ...payload,
        matching_conditions: JSON.stringify(userMatchingRule.matchingConditions),
        transfer_name_check: userMatchingRule.transferNameCheck,
        ignore_honorific: userMatchingRule.ignoreHonorific,
        check_corporate_name_registered: userMatchingRule.checkCorporateNameRegistered,
        check_corporate_name_english: userMatchingRule.checkCorporateNameEnglish,
        check_corporate_name_katakana: userMatchingRule.checkCorporateNameKatakana,
      }
    }

    // update user matching rule
    const result = await userMatchingRuleRepository.updateUserMatchingRule(currentSetting.id, payload)

    if (!result) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.USER_MATCHING_RULE.UPDATE_FAIL_DB])
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  userMatchingRule,
}
