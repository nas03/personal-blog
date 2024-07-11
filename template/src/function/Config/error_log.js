'use strict'

/* constant */
const utility = require('utility')
const { errorMessageCodeConstant } = require('constant')

/* DB */
const { errorLogRepository } = require('repository')

const createLogFromFrontEnd = async (event) => {
  try {
    const bodyData = JSON.parse(event.body) || {}

    const payloads = bodyData.map((item) => {
      return {
        m_error_message_code: item.error_message_code,
        user_basic_data_id: item.user_basic_data_id,
        staff_id: item.staff_id,
        error_site_id: item.error_site_id,
        url_root: item.url_root,
        root_request_param: item.root_request_param ? JSON.stringify(item.root_request_param) : null,
        url_error: item.url_error,
        error_request_param: item.error_request_param ? JSON.stringify(item.error_request_param) : null,
        error_code: item.error_code,
        error_detail: item.error_request_param ? JSON.stringify(item.error_detail) : null,
      }
    })

    const result = await errorLogRepository.createErrorLogFE(payloads)

    return utility.createResponse(true, { messages: result })
  } catch (error) {
    console.log('Request body: ', JSON.parse(event.body))
    console.error(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  createLogFromFrontEnd,
}
