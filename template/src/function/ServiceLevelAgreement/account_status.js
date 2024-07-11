// constant
const { flag, triggerConditionClass, errorMessageCodeConstant } = require('constant')

// function
const utility = require('utility')

// repository
const { errorLogRepository, serviceLevelAgreementRepository, siteRepository, usersBasicDataRepository } = require('repository')

const getAccountStatusTrigger = async (event) =>{
  try {
    const { site_id } = event.pathParameters || ''

    // VALIDATE
    if (!site_id) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    const staffId = utility.getUserIdByToken(event)
    const staffInfo = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': staffId })

    // GET VALID SITES USING QUERY
    const querySites = utility.getValidSiteByAdmin(staffInfo.admin_with_site_id, site_id)

    // VALIDATE SITE IS DISABLED
    const enableSites = await siteRepository.getSites()

    if (!enableSites.some((el) => el.code === Number(site_id))) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    const accountStatusTrigger = await serviceLevelAgreementRepository.getAccountStatusTrigger(querySites)

    if (!accountStatusTrigger) {
      throw new Error('Account status trigger not found')
    }

    const res = {
      id: accountStatusTrigger ? accountStatusTrigger.id : null,
      site_id: accountStatusTrigger ? accountStatusTrigger.site_id : null,
      trigger_condition_class: accountStatusTrigger ? accountStatusTrigger.trigger_condition_class : null,
      trigger_minute_number: accountStatusTrigger ? accountStatusTrigger.trigger_minute_number : null,
      enable_setting_flag: accountStatusTrigger ? accountStatusTrigger.enable_setting_flag : null,
      configured_flag: accountStatusTrigger ? true : false,
    }

    return utility.createResponse(true, res)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const saveAccountStatusTrigger = async (event) =>{
  try {
    const { site_id, trigger_condition_class, trigger_minute_number, enable_setting_flag } = JSON.parse(event.body)

    // VALIDATE FIELD BLANK
    if (
      !site_id || !trigger_condition_class ||
      (!trigger_minute_number && trigger_minute_number !== 0) ||
      (!enable_setting_flag && enable_setting_flag !== 0)
    ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    const enableSites = await siteRepository.getSites()
    // VALIDATE FIELD INVALID
    if (
      !Object.values(triggerConditionClass).includes(trigger_condition_class) ||
     !Object.values(flag).includes(enable_setting_flag) ||
     trigger_minute_number < 0 ||
     trigger_minute_number > 999 ||
     !enableSites.some((el) => el.code === Number(site_id))
    ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    await serviceLevelAgreementRepository.saveAccountStatusTrigger({
      site_id: site_id,
      trigger_condition_class: trigger_condition_class,
      trigger_minute_number: trigger_minute_number,
      enable_setting_flag: enable_setting_flag,
    })

    return utility.createResponse(true)
  } catch (error) {
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const scheduleChangeAccSttRequired = async (event) =>{
  try {
    console.log('===== START SCHEDULE CHANGE ACCOUNT STATUS TO REQUIRED =====')
    await serviceLevelAgreementRepository.scheduleChangeAccountStatus()
    console.log('===== END SCHEDULE CHANGE ACCOUNT STATUS TO REQUIRED =====')
    return utility.createResponse(true)
  } catch (error) {
    console.log('REASON_UPDATE_FAIL', error)
    console.log('===== END SCHEDULE CHANGE ACCOUNT STATUS TO REQUIRED =====')
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}


module.exports = {
  getAccountStatusTrigger,
  saveAccountStatusTrigger,
  scheduleChangeAccSttRequired,
}
