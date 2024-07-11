const { apiAdvancedSettingRepository, merchantSettingRepository, errorLogRepository } = require('repository')
const utility = require('utility')
const { flag, errorMessageCodeConstant } = require('constant')

const createMerchantSetting = async (event) => {
  try {
    const staffId = utility.getUserIdByToken(event)
    const { bankApiId, merchantId, enable } = JSON.parse(event.body) || {}
    if (!bankApiId || !merchantId) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // Check bankApiId
    const apiSetting = await apiAdvancedSettingRepository.getApiSettingByBankApiId(bankApiId)
    if (!apiSetting || !merchantId.match(/^[0-9]{5}$/) || !Object.values(flag).includes(enable)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // Check merchant_id exist
    const isExist = await merchantSettingRepository.checkMerchantIdExist(merchantId, apiSetting.id)
    if (isExist) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.CREATE_MERCHANT_SETTING.MERCHANT_ID_EXISTED])
    }

    const maxDisplayOrder = await merchantSettingRepository.getMaxMerchantDisplayOrder(apiSetting.id)

    // Create a merchant_id but don't enable
    if (maxDisplayOrder === 0 && enable === flag.FALSE) {
      return await errorLogRepository.createResponseAndLog(
        event,
        null,
        null,
        [errorMessageCodeConstant.CREATE_MERCHANT_SETTING.CANNOT_DISABLE_MERCHANT_ID],
      )
    }

    // Create a new merchant_id
    const result = await merchantSettingRepository.createMerchantSetting({
      api_advanced_setting_id: apiSetting.id,
      merchant_id: merchantId,
      enable: enable,
      display_order: maxDisplayOrder + 1,
      default_id: maxDisplayOrder ? flag.FALSE : flag.TRUE,
      staff_id: staffId,
    })

    if (!result) {
      throw new Error('merchant_setting not found')
    }

    return utility.createResponse(true, result)
  } catch (err) {
    console.log(err)
    return await errorLogRepository.createResponseAndLog(event, err, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const deleteMerchantSetting = async (event) => {
  try {
    const { id } = event.pathParameters || {}
    if (!id) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    const merchantSetting = await merchantSettingRepository.getMerchantSetting(id)

    if (!merchantSetting) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.DELETE_MERCHANT_SETTING.UPDATE_FAIL.NOT_FOUND])
    }

    if (merchantSetting.default_id === flag.TRUE) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    if (merchantSetting.enable) {
      // Check the number of merchant_id enabled
      const count = await merchantSettingRepository.countMerchantSettingEnable(merchantSetting.api_advanced_setting_id)
      if (count <= 1) {
        return await errorLogRepository.createResponseAndLog(event, null, null,
          [errorMessageCodeConstant.DELETE_MERCHANT_SETTING.UPDATE_FAIL.CANNOT_DELETE])
      }
    }

    const result = await merchantSettingRepository.deleteMerchantSetting(merchantSetting)

    if (!result) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.DELETE_MERCHANT_SETTING.UPDATE_FAIL.UPDATE_FAIL_DB])
    }

    return utility.createResponse(true)
  } catch (err) {
    console.log(err)
    return await errorLogRepository.createResponseAndLog(event, err, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const updateMerchantSetting = async (event) => {
  try {
    const { id } = event.pathParameters || {}
    const { enable } = JSON.parse(event.body) || {}
    if (!id) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    if (!Object.values(flag).includes(enable)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    const merchantSetting = await merchantSettingRepository.getMerchantSetting(id)
    if (!merchantSetting) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_MERCHANT_SETTING.UPDATE_FAIL.NOT_FOUND])
    }

    // If the status does not change, return success
    if (merchantSetting.enable === enable) {
      return utility.createResponse(true, merchantSetting)
    }

    // Check the number of merchant_id enabled
    const count = await merchantSettingRepository.countMerchantSettingEnable(merchantSetting.api_advanced_setting_id)
    if (enable === flag.FALSE && count <= 1) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_MERCHANT_SETTING.UPDATE_FAIL.CANNOT_DISABLE])
    }

    const result = await merchantSettingRepository.updateMerchantSetting(id, enable)

    if (!result) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_MERCHANT_SETTING.UPDATE_FAIL.UPDATE_FAIL_DB])
    }

    return utility.createResponse(true, result)
  } catch (err) {
    console.log(err)
    return await errorLogRepository.createResponseAndLog(event, err, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  createMerchantSetting,
  deleteMerchantSetting,
  updateMerchantSetting,
}
