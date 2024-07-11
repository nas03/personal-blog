const utility = require('utility')
const { contentUpdate, statusRule, uncheckALL, errorMessageCodeConstant } = require('constant')
const { rangeUseSettingRepository, rangeUseSettingHistoryRepository, errorLogRepository, usersBasicDataRepository } = require('repository')
const rangeUseSettingHistory = require('../History/range_use_setting_history')

const getListRangeUseSetting = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}
    const pagination = utility.getPagination(queryString)

    // CASE SELECT UNCHECK BOX ALL
    if (Number(queryString.siteIds) === uncheckALL) {
      const res = utility.paginatedItems([], pagination.currentPage, pagination.perPage)
      return utility.createResponse(true, res)
    }

    const staffId = utility.getUserIdByToken(event)
    const staffInfo = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': staffId })

    // GET VALID SITES USING QUERY
    queryString.siteIds = utility.getValidSiteByAdmin(staffInfo.admin_with_site_id, queryString.siteIds)


    const result = await rangeUseSettingRepository.getListRangeUseSetting(pagination, queryString)
    return utility.createResponse(true, result)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const updateRangeUseSetting = async (event) => {
  try {
    const { field_name, field_data } = JSON.parse(event.body)

    const { id } = event.pathParameters

    const staff_id = utility.getUserIdByToken(event)

    const rangeOfUse = await rangeUseSettingRepository.getRangeUseSettingById(id)
    if (!rangeOfUse) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_RANGE_USE_SETTING.GET_RANGE_USE_SETTING])
    }

    switch (field_name) {
      case 'enable':
        if ((field_data !== 0 && field_data !== 1) || field_data === rangeOfUse.enable) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        // update range_use_setting
        const isUpdate = await rangeUseSettingRepository.updateRangeUseSetting(id, { enable: field_data })

        if (isUpdate.isError) {
          return await errorLogRepository.createResponseAndLog(event, isUpdate.error, null,
            [errorMessageCodeConstant.UPDATE_RANGE_USE_SETTING.UPDATE_RANGE_USE_SETTING_FAILED])
        }

        // save history
        await rangeUseSettingHistory.createHistory(
          staff_id,
          id,
          contentUpdate.ENABLE_RULE_UPDATE,
          rangeOfUse.enable === 0 ? statusRule.DISABLE : statusRule.ENABLE,
          field_data === 0 ? statusRule.DISABLE : statusRule.ENABLE,
        )

        return utility.createResponse(true)
      case 'priority':
        const { type } = JSON.parse(event.body)

        // validate input , check priority have value is min or max
        if (type !== 'up' && type !== 'down' ||
          (type === 'up' && await rangeUseSettingRepository.checkPriorityById('min', id, rangeOfUse.site_id)) ||
          (type === 'down' && await rangeUseSettingRepository.checkPriorityById('max', id, rangeOfUse.site_id))
        ) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        // update priority range_use_setting
        const result = await rangeUseSettingRepository.updatePriority(type, rangeOfUse)
        if (result.isError) {
          return await errorLogRepository.createResponseAndLog(event, result.error, null,
            [errorMessageCodeConstant.UPDATE_RANGE_USE_SETTING.UPDATE_PRIORITY_FAILED])
        }

        // save history
        const payload = result.data.map((el, index) =>
          rangeUseSettingHistory.initObjHistory(
            staff_id,
            el.range_use_setting_id,
            contentUpdate.UPDATE_PRIORITY,
            el.before_update,
            el.after_update,
            index,
          ))

        await rangeUseSettingHistoryRepository.createHistory(payload)
        return utility.createResponse(true)
      case 'delete_flag':
        const response = await rangeUseSettingRepository.deleteRangeUseSetting(rangeOfUse)

        if (!response) {
          return await errorLogRepository.createResponseAndLog(event, response.error, null,
            [errorMessageCodeConstant.UPDATE_RANGE_USE_SETTING.DELETE_RANGE_USE_SETTING_FAILED])
        }

        // save history
        const arrObjHistory = response.data.map((el, index) =>
          rangeUseSettingHistory.initObjHistory(
            staff_id,
            el.range_use_setting_id,
            index === 0 ? contentUpdate.DELETE_RULE : contentUpdate.UPDATE_PRIORITY,
            el.before_update,
            el.after_update,
            index,
          ))

        await rangeUseSettingHistoryRepository.createHistory(arrObjHistory)
        return utility.createResponse(true)
      default:
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  getListRangeUseSetting,
  updateRangeUseSetting,
}
