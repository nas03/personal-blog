const db = require('db').helper
const moment = require('moment')
const _ = require('lodash')
const utility = require('utility')
const { errorLogType, dateFormat, commonSiteId, errorMessageCodeConstant } = require('constant')

const createErrorLog = async (payload) => {
  try {
    const result = await db.transaction(async (trx) => {
      // Create new error log
      const insertErrorLog = await trx('error_log').insert(payload)
      if (!insertErrorLog.length) {
        return false
      }
      return insertErrorLog[0]
    })
    return result
  } catch (error) {
    console.log(error)
    return false
  }
}

const createResponseAndLog = async (event, error, data, errorCodes, messageParams = null, httpStatus = null) => {
  try {
    // Get mater data
    const errorDetails = await db('m_error_message')
      .select(
        'id',
        'code',
        'ja_message',
        'en_message',
        'cn_message',
        'kr_message',
        'log_level',
        'message_display_type',
      )
      .whereIn('code', errorCodes)

    // Save Error Log
    let staff_id
    try {
      staff_id = utility.getUserIdByToken(event)
    } catch (err) {
      staff_id = null
    }
    const payloads = []
    errorDetails.forEach((messageMaster) => {
      const protocol = 'https'
      const host = event.headers.Host || event.headers.host
      const fullPath = `${protocol}://${host}${event.path}`
      const rootRequestParam = JSON.stringify({ body: event?.body || null, query: event?.queryStringParameters || null })
      const userId = Number.parseInt(event?.user_id || error?.user_id || null)

      let errorRequestParam = rootRequestParam
      let urlError = fullPath
      if (error?.isAxiosError) {
        errorRequestParam = JSON.stringify({ body: error.config?.data || null, query: error.config?.params || null })
        urlError = error.config?.url
      }

      // Create payload
      const payload = {
        user_basic_data_id: userId && Number.isInteger(userId) ? userId : null,
        staff_id: staff_id,
        error_message_id: messageMaster.id,
        error_site_id: commonSiteId.P2TECH,
        url_root: fullPath,
        root_request_param: rootRequestParam,
        url_error: urlError,
        error_request_param: errorRequestParam,
        error_code: httpStatus || 500,
        error_detail: JSON.stringify({ message: error?.sqlMessage || error?.message || null, data: error || null }),
      }

      payloads.push(payload)
    })

    // Insert error log
    let errorLogIDs
    if (payloads.length) {
      errorLogIDs = await Promise.all(payloads.map((payload) => db('error_log').insert(payload)))
    }

    // Create message data
    const messages = errorDetails.map((item, index) => {
      return {
        code: item.code,
        ja_message: item.ja_message?.replace(/{{(.*?)}}/g, (match, key) => _.isNil(messageParams[key]) ? match : messageParams[key]),
        en_message: item.en_message?.replace(/{{(.*?)}}/g, (match, key) => _.isNil(messageParams[key]) ? match : messageParams[key]),
        cn_message: item.cn_message?.replace(/{{(.*?)}}/g, (match, key) => _.isNil(messageParams[key]) ? match : messageParams[key]),
        kr_message: item.kr_message?.replace(/{{(.*?)}}/g, (match, key) => _.isNil(messageParams[key]) ? match : messageParams[key]),
        log_level: item.log_level,
        message_display_type: item.message_display_type,
        error_log_id: errorLogIDs[index][0],
      }
    })

    // Create response
    return utility.createResponseError(false, data, messages)
  } catch (error) {
    console.log(error)
    // Return error default
    return utility.createResponseError(false, null, [
      {
        code: errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR,
        ja_message: 'System Error',
        en_message: 'System Error',
        cn_message: 'System Error',
        kr_message: 'System Error',
      },
    ])
  }
}

const clearErrorLog = async (settingClearErrorLog) => {
  if (!settingClearErrorLog.length) {
    return 0
  }

  // Delete records created more than 2 months old
  const query = db('error_log')
    .innerJoin('m_error_message', 'error_log.error_message_id', 'm_error_message.id')

  for (const item of settingClearErrorLog) {
    const date_time = moment.utc().subtract(item.retention_weeks * 7, 'days').format(dateFormat.DATE_TIME)
    query.orWhere((builder) => {
      builder
        .where('error_log.error_site_id', item.site_id)
        .where('m_error_message.log_level', item.log_level)
        .where('error_log.ts_regist', '<', date_time)

      return
    })
  }

  return await query.del()
}

const createErrorLogFE = async (payloads) => {
  // Get mater data
  const errorDetails = await db('m_error_message')
    .select(
      'id',
      'code',
      'ja_message',
      'en_message',
      'cn_message',
      'kr_message',
      'log_level',
      'message_display_type',
    )
    .whereIn('code', payloads.map((item) => item.m_error_message_code))

  const filterPayloads = []
  errorDetails.forEach((item) => {
    const findPayload = payloads.find((payload) => payload.m_error_message_code === item.code)
    delete findPayload.m_error_message_code
    findPayload.error_message_id = item.id
    filterPayloads.push(findPayload)
  })

  // Insert error log
  let errorLogIDs
  if (payloads.length) {
    errorLogIDs = await Promise.all(filterPayloads.map((payload) => db('error_log').insert(payload)))
  }

  // Create message data
  const messages = errorDetails.map((item, index) => {
    return {
      code: item.code,
      ja_message: item.ja_message,
      en_message: item.en_message,
      cn_message: item.cn_message,
      kr_message: item.kr_message,
      log_level: item.log_level,
      message_display_type: item.message_display_type,
      error_log_id: errorLogIDs[index][0],
    }
  })

  // Create response
  return messages
}

const createSystemLog = async (event, responseCode, responseMessage, data, log_type = null) => {
  try {
    const payload = {
      log_type: log_type ? log_type : errorLogType.WRITE_FROM_BE,
      user_basic_data_id: event?.headers?.Authorization ? utility.getUserIdByToken(event) : null,
      site_id: 0,
      api_url_root: event?.path,
      api_url_error: event?.path,
      request_param: JSON.stringify({ body: event?.body, query: event?.queryStringParameters }),
      response_info: JSON.stringify({ message: responseMessage, errorMessage: data?.message, data: data }),
      error_code: responseCode,
    }
    // Create new error log
    return await db('error_log').insert(payload)
  } catch (error) {
    console.error(error)
  }
}

module.exports = {
  createErrorLog,
  clearErrorLog,
  createErrorLogFE,
  createSystemLog,
  createResponseAndLog,
}
