const { getUserIdByToken } = require('utility')
const { errorLogRepository } = require('repository')

const setErrorLog = async (event, userInfo, error ) => {
  try {
    let dataError
    if (error.isAxiosError) {
      let staff_id
      try {
        staff_id = getUserIdByToken(event)
      } catch (error) {
        staff_id = null
      }
      let responseData
      if (error.response) {
        responseData = error.response.data
      }
      const errorJson = JSON.stringify(error)
      const errorConvert = JSON.parse(errorJson)
      const error_log = {
        ...errorConvert,
        response_error: responseData ? responseData : null,
      }
      dataError = {
        user_basic_data_id: userInfo.user_id,
        staff_id,
        site_id: userInfo.site_id,
        api_url_root: event?.path,
        api_url_error: error.config.url,
        response_info: JSON.stringify(error_log),
        request_param: error.config.data ? error.config.data : null,
      }
      if (!error.response) {
        dataError.error_code = error.code
      } else {
        dataError.error_code = error.response.status
      }
    } else if (error.checkError) {
      let staff_id
      try {
        staff_id = getUserIdByToken(event)
      } catch (error) {
        staff_id = null
      }
      let responseData
      if (error.response) {
        responseData = error.response.data
      }
      const errorJson = JSON.stringify(error)
      const errorConvert = JSON.parse(errorJson)
      const error_log = {
        ...errorConvert,
        message: error.message,
        response_error: responseData ? responseData : null,
      }

      const param = {
        body: event?.body || event,
        query: event?.queryStringParameters || event,
      }

      dataError = {
        user_basic_data_id: userInfo.user_id,
        staff_id,
        site_id: userInfo.site_id,
        api_url_root: event?.headers?.Origin || event?.path,
        api_url_error: error?.config?.url || event?.path,
        response_info: JSON.stringify(error_log),
        request_param: JSON.stringify(param),
      }
      if (!error.response) {
        dataError.error_code = error.code
      } else {
        dataError.error_code = error.response.status
      }
    }
    const idError = await errorLogRepository.createErrorLog(dataError)
    return idError
  } catch (error) {
    console.log(error)
  }
}

module.exports = {
  setErrorLog,
}
