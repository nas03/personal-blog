'use strict'

/* constant */
const utility = require('utility')
const { dataStatus, commonSiteId, category, categoryChangeProfile, errorMessageCodeConstant } = require('constant')

/* DB */
const { categoryRepository, errorLogRepository } = require('repository')
const getListCategory = async (event) => {
  try {
    const { site_id } = event.queryStringParameters || -1
    const result = await categoryRepository.findAll()
    if (result.status === dataStatus.COMPLETE) {
      result.data.forEach((item) => {
        if (item.id === category.BASIC_INFORMATION_PERSON_OR_CORPORATE && Number(site_id) === commonSiteId.MY_FOREX) {
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

module.exports = {
  getListCategory,
}
