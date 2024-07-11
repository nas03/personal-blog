/* constant */
const { apiSettingTab, flag, errorMessageCodeConstant } = require('constant')

/* DB */
const { bankApiRepository, merchantSettingRepository, merchantAssignMethodRepository, userMatchingRuleRepository,
  autoStatusChangeRuleRepository,
  apiAdvancedSettingRepository,
  errorLogRepository,
  usersBasicDataRepository } = require('repository')

/* func */
const utility = require('utility')

const getListBankApi = async (event) => {
  try {
    const { siteId } = event.pathParameters || {}
    if (!siteId) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    const staffId = utility.getUserIdByToken(event)
    const staffInfo = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': staffId })

    // GET VALID SITES USING QUERY
    const validSiteIds = utility.getValidSiteByAdmin(staffInfo.admin_with_site_id, siteId)
    const result = await bankApiRepository.getListBankApi(validSiteIds)
    return utility.createResponse(true, result)
  } catch (err) {
    console.log(err)
    return await errorLogRepository.createResponseAndLog(event, err, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getDetailSetting = async (event) => {
  try {
    const staffId = utility.getUserIdByToken(event)
    const { bankApiId, tab } = event.queryStringParameters || {}
    if (!bankApiId || !tab) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    const bankApi = await bankApiRepository.getById(bankApiId)
    const tabInt = parseInt(tab)
    if (!Object.values(apiSettingTab).includes(tabInt) || !bankApi) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    const result = await apiAdvancedSettingRepository.createDefaultIfNotExists(bankApi.id, bankApi.site_id, staffId)
    if (result.isError) {
      return await errorLogRepository.createResponseAndLog(event, result.error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
    }

    switch (tabInt) {
      case apiSettingTab.TAB_1:
        const listMerchant = await merchantSettingRepository.getListMerchantSetting(bankApiId)
        return utility.createResponse(true, listMerchant)
      case apiSettingTab.TAB_2:
        const merchantAssignMethod = await merchantAssignMethodRepository.getMerchantAssignMethod(bankApiId)

        if (merchantAssignMethod && merchantAssignMethod.apply_latest_transaction === flag.FALSE) {
          merchantAssignMethod.depend_deposit_amount = merchantAssignMethod.depend_deposit_amount_new
          merchantAssignMethod.in_chronological_order = merchantAssignMethod.in_chronological_order_new
        }

        if (merchantAssignMethod) {
          merchantAssignMethod.depend_deposit_amount = JSON.parse(merchantAssignMethod.depend_deposit_amount)
          delete merchantAssignMethod.depend_deposit_amount_new
          delete merchantAssignMethod.in_chronological_order_new
        }

        return utility.createResponse(true, merchantAssignMethod)
      case apiSettingTab.TAB_3:
        const userMatchingRule = await userMatchingRuleRepository.getUserMatchingRule(bankApiId)

        if (userMatchingRule) {
          userMatchingRule.matching_conditions = JSON.parse(userMatchingRule.matching_conditions)
        }

        return utility.createResponse(true, userMatchingRule)
      case apiSettingTab.TAB_4:
        const itemAutoChangeStatus = await autoStatusChangeRuleRepository.getAutoStatusChangeRuleByBankApiId(bankApiId)

        return utility.createResponse(true, itemAutoChangeStatus)
      default:

        return utility.createResponse(true, {})
    }
  } catch (err) {
    console.log(err)
    return await errorLogRepository.createResponseAndLog(event, err, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  getListBankApi,
  getDetailSetting,
}
