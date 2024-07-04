const _ = require('lodash')
const db = require('db').helper
const request = require('request-promise')
const { code, message, dateFormat, characterKatakana, resCheck, commonSiteId, displayDateTime, color,
  verificationStatusSiftApi, eventTypeSiftApi, standardTimezone, brokerWinterTimezone, timeExpires, statusCode,
  brokerSummerTimezone, brokerStandardTimezone, resultDetailMessages, maskingDataType } = require('constant')

const secretKeyRecaptcha = process.env.SECRET_KEY_RECAPTCHA
const defaultId = -99
const FormData = require('form-data')
const moment = require('moment')
const jwt = require('jsonwebtoken')
const { axios, aws } = require('helper')
const rax = require('retry-axios')
const uuid = require('uuid')
const generator = require('generate-password')

const addAutoField = (object, isInsert = true, isDelete = false) => {
  const clone = _.clone(object, true)
  // eslint-disable-next-line max-len
  if (isInsert) {
    clone['ts_regist'] = db.now()
  }
  clone['ts_update'] = db.now()
  clone['delete_flag'] = isDelete
  return clone
}

const createResponse = (isSuccess = true, data = {}, code, message) => {
  const response = {}
  if (isSuccess === true) {
    response['status'] = 'success'
    response['data'] = data
  } else if (message) {
    response['status'] = 'error'
    response['message'] = message
    if (code) response['code'] = code
    if (data) response['data'] = data
  } else {
    response['status'] = 'fail'
    response['data'] = data
  }
  return {
    statusCode: isSuccess === 'error' ? 500 : 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: isSuccess === resCheck.OK ? resCheck.OK : JSON.stringify(response),
  }
}

const createResponseError = (isSuccess = true, data, messages, code) => {
  const response = {}
  if (isSuccess === true) {
    response['status'] = 'success'
    response['data'] = data
  } else {
    response['status'] = 'error'
    response['data'] = data
    response['messages'] = messages
  }

  return {
    statusCode: isSuccess === true ? 200 : (code ? code : 500),
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(response),
  }
}

const getPagination = (obj) => {
  const objParam = obj || {}
  const sort = objParam.sort || 'id,DESC'
  const sortArr = [
    {
      column: sort.split(',')[0],
      order: sort.split(',').length > 1 ? sort.split(',')[1] : 'DESC',
    },
  ]
  const pagination = {
    currentPage: objParam.page || 1,
    perPage: (objParam.size && objParam.size >= 1) ? objParam.size : 20,
    sort: sortArr,
    isLengthAware: true,
  }
  return pagination
}

const escapeSql = (term) => {
  return (term || '').toLowerCase().replace(/\\/g, '\\\\').replace('%', '\\%').replace('_', '\\_').replace(/"/g, '\\"')
}

const setObjAccessHistory = (directIpAddress, directUserAgent, isSuccess,
  responseFraudAlert = null, user_id = null, related_access_id = defaultId) => {
  let fraudAlertJson = ''
  try {
    fraudAlertJson = JSON.parse(responseFraudAlert)
  } catch (error) {
    fraudAlertJson = responseFraudAlert
  }
  return {
    relatedAccessId: related_access_id,
    staffId: user_id ? user_id : defaultId,
    accessIp: directIpAddress,
    accessAgent: directUserAgent,
    accessTime: moment().utc().format(dateFormat.DATE),
    suspiciousLevel: fraudAlertJson ? fraudAlertJson.relativeSuspiciousValue : 0,
    fraudAlertJson: fraudAlertJson || '',
    isSuccess: isSuccess,
  }
}


const verifyRecaptcha = async (recaptchaToken) => {
  const THRESHOLD = 0.2

  /*
  ----SAMPLE RESPONSE SUCCESS----
    const resRecaptcha = JSON.stringify({
    "success": true,
    "challenge_ts": "2024-01-02T02:51:55Z",
    "hostname": "myforex.org",
    "score": 0.9,
    "action": "login"
  ----SAMPLE RESPONSE FAIL----
    const resRecaptcha = JSON.stringify({
    "success": false,
    "error-codes": [
      "timeout-or-duplicate"
    ]
  })
  */
  const data = new FormData()
  data.append('secret', secretKeyRecaptcha)
  data.append('response', recaptchaToken)
  const resRecaptcha = await axios({
    url: 'https://www.google.com/recaptcha/api/siteverify',
    method: 'POST',
    data: data,
    headers: {
      ...data.getHeaders(),
    },
  })

  console.log(recaptchaToken, resRecaptcha)

  let result = {}
  if (!resRecaptcha || !resRecaptcha.success || !resRecaptcha.score || Number(resRecaptcha.score) <= THRESHOLD) {
    result = { success: false }
  } else {
    result = { success: true }
  }

  result.res_recaptcha = resRecaptcha

  return JSON.stringify(result)
}

const loginFraudAlert = async (event, email, userId, sessionId, directIpAddress, directUserAgent, isSuccess = true, reason) => {
  const url = `${process.env.SIFT_API_ENDPOINT}/events?return_workflow_status=true&return_route_info=true`
  const location = await getLocationByIp(directIpAddress)
  const { SUCCESS, FAILURE } = verificationStatusSiftApi
  const bodyData = {
    '$type': eventTypeSiftApi.LOGIN,
    '$api_key': process.env.API_KEY_SIFT,
    '$user_id': `${process.env.SIFT_PREFIX_ENV.toLowerCase()}_${userId}`,
    '$login_status': isSuccess ? SUCCESS : FAILURE,
    '$session_id': sessionId,
    '$user_email': email,
    '$site_country': location ? location.countryCode : '',
    '$browser': {
      '$user_agent': directUserAgent,
      '$accept_language': event.headers['Accept-Language'],
      '$content_language': event.headers['Content-Language'],
    },
    '$ip': directIpAddress,
  }

  if (reason) {
    bodyData['$failure_reason'] = reason
  }

  return await axios({
    url,
    method: 'POST',
    data: bodyData,
  })
}

const verifyLoginFraudAlert = async (event, userId, sessionId, status) => {
  const url = `${process.env.SIFT_API_ENDPOINT}/events`
  const bodyData = {
    '$type': eventTypeSiftApi.VERIFICATION,
    '$api_key': process.env.API_KEY_SIFT,
    '$user_id': `${process.env.SIFT_PREFIX_ENV.toLowerCase()}_${userId}`,
    '$session_id': sessionId,
    '$verified_event': eventTypeSiftApi.LOGIN,
    '$status': status,
    '$verification_type': '$email',
    '$browser': {
      '$user_agent': event.headers['User-Agent'],
      '$accept_language': event.headers['Accept-Language'],
      '$content_language': event.headers['Content-Language'],
    },
    '$ip': event.requestContext.identity.sourceIp,
    '$reason': '$automated_rule',
  }

  return await axios({
    url,
    method: 'POST',
    data: bodyData,
  })
}

const setToken = (result, accessHistoryId = -99, staySignIn = false, isFraudAlert = false) => {
  return jwt.sign({
    user_id: result.id,
    user_email: result.email,
    user_name: result.fullName,
    user_first_name: result.firstName,
    user_last_name: result.lastName,
    user_role_id: result.authorizationId,
    user_role: result.authorizationName,
    related_access_id: accessHistoryId,
  },
  process.env.JWT_SECRET,
  {
    expiresIn: isFraudAlert ?
      timeExpires.JWT_FRAUD_ALERT :
      !staySignIn ?
        timeExpires.JWT :
        timeExpires.JWT_STAY_SIGN_IN,
  })
}

const getLocationByIp = async (ipAddress) => {
  try {
    const url = `https://pro.ip-api.com/json/${ipAddress}?key=${process.env.API_KEY_IP}`
    const res = await request.get(url)
    if (res?.status === 'fail') {
      return null
    }
    return JSON.parse(res)
  } catch (error) {
    console.log(error)
    return null
  }
}
const getUserIdByToken = (event) => {
  const Authorization = event.headers?.Authorization || event.headers?.authorization
  if (Authorization && Authorization.split(' ').length > 1) {
    try {
      return jwt.verify(Authorization.split(' ')[1], process.env.JWT_SECRET).user_id
    } catch (error) {
      console.log(error)
    }
  }

  const error = new Error(message.access_token_invalid)
  error.code = code.AUTHORIZATION
  throw error
}

const checkFieldRequired = (obj, listRequired) => {
  if (
    listRequired.every((r) => Object.keys(obj).includes(r)) &&
    !hasFieldBlank(obj, listRequired)
  ) {
    return true
  } else {
    return false
  }
}

const hasFieldBlank = (obj, listRequired) => {
  let check = false
  listRequired.forEach((el) => {
    if (obj[el] === null || obj[el] === '') {
      check = true
    }
  })
  return check
}

const checkFalsyExceptZero = (value) => {
  if (value || value === 0) {
    return true
  } else {
    return false
  }
}

const requestPortfolioMyforex = async (
  method,
  url,
  headers,
  data = null,
) => {
  rax.attach()
  const res = await axios({
    method,
    url,
    headers: {
      'X-API-Public': 0,
      ...headers,
    },
    data,
    raxConfig: {
      retry: process.env.RETRY_COUNT,
      noResponseRetries: process.env.RETRY_COUNT,
      httpMethodsToRetry: ['GET', 'POST', 'PUT'],
    },
    timeout: process.env.RETRY_TIMEOUT,
  })
  return res
}

const requestRetry = async (
  method,
  url,
  data = null,
) => {
  rax.attach()
  const res = await axios({
    method,
    url,
    data,
    raxConfig: {
      retry: process.env.RETRY_COUNT,
      noResponseRetries: process.env.RETRY_COUNT,
      httpMethodsToRetry: ['GET', 'POST', 'PUT'],
    },
    timeout: process.env.RETRY_TIMEOUT,
  })
  return res
}

const flagValidate = (value) => {
  if (!value && value !== 0) return false

  const arrayFlag = [0, 1]

  return arrayFlag.includes(value)
}

function convertToHalfWidthKatakana(string) {
  const characters = string.split('')
  let halfWidthString = ''
  characters.forEach((character) => {
    let newCharacter
    if (typeof characterKatakana[character] === 'undefined') {
      newCharacter = character
    } else {
      newCharacter = characterKatakana[character]
    }
    halfWidthString += newCharacter
  })

  return halfWidthString.replace(/[！-～]/g, (r) =>
    String.fromCharCode(r.charCodeAt(0) - 0xfee0),
  )
}

const renderTransactionId = () => {
  return Date.now() + Math.floor(10 + Math.random() * 90).toString()
}


const setTokenForRedirectSite = (data) => {
  return jwt.sign(
    {
      user_basic_data_id: data.id,
      member_id: data.member_id,
      site_id: data.site_id,
      target_id: data.portfolio_id,
      staff_id: data.staff_id,
    },
    data.site_id === commonSiteId.FXT ? ((data.staff_id && data.portfolio_id) ? process.env.JWT_SECRET_ADMIN_REDIRECT_FXON :
      process.env.JWT_SECRET_FXON ) :
      ((data.staff_id && data.portfolio_id) ? process.env.JWT_SECRET_ADMIN_REDIRECT_MYFOREX : process.env.JWT_SECRET_MYFOREX ),
    {
      expiresIn: (data.staff_id && data.portfolio_id) ? timeExpires.JWT_ADMIN_REDIRECT : timeExpires.JWT,
    },
  )
}

const roundNumber = (number, decimalPart) => {
  return Math.round(number * Math.pow(10, decimalPart)) / Math.pow(10, decimalPart)
}

const paginatedItems = (items, page = 1, perPage = 20) => {
  const totalPages = Math.ceil(items.length / perPage)
  const listData = items.slice(perPage * (page - 1), perPage * page)
  const nextPage = (totalPages > page) ? page + 1 : null
  const prevPage = page - 1 ? page - 1 : null
  return {
    data: listData,
    pagination: {
      from: perPage * (page - 1) ? perPage * (page - 1) : 0,
      to: nextPage ? perPage * page : items.length,
      currentPage: page,
      nextPage: nextPage,
      prevPage: prevPage,
      perPage: perPage,
      total: items.length,
      lastPage: totalPages,
    },
  }
}

const formatDigitsToInt = (digits) => {
  if (digits > 0 && digits < 1) {
    const arrDigits = digits.toString().split('.')
    return arrDigits[1].length
  }

  return 0
}

const getMTURL = (env_param, platform, api_name) => {
  return `${process.env.MGR_API}/${platform}/${api_name}`
}

const getJwtSecretBySiteId = (token) => {
  const decodeToken = jwt.decode(token)
  const { user_id, personal_id, site_id, iat, exp } = decodeToken
  console.log('Decode Token:', user_id, personal_id, site_id, iat, exp)
  switch (site_id) {
    case commonSiteId.MY_FOREX:
      return process.env.JWT_SECRET_MYFOREX
    case commonSiteId.ICPAY:
      return process.env.JWT_SECRET_ICPAY
    case commonSiteId.FXT:
      return process.env.JWT_SECRET_FXON
    case commonSiteId.FXS_XEM:
      return process.env.JWT_SECRET_FXS_XEM
    default:
      return process.env.JWT_SECRET_MYFOREX
  }
}

const verifyToken = (token) => {
  const jwtSecretKey = getJwtSecretBySiteId(token)
  const verifyToken = jwt.verify(token, jwtSecretKey, function(err, decoded) {
    if (err) return { status: false, data: err.message }
    else return { status: true, data: decoded }
  })
  return verifyToken
}

const createAuthorizationKey = (time, unit) => ({
  key: uuid.v4(),
  expiresIn: moment().utc().add(time, unit).format(dateFormat.DATE_TIME),
})

const getDateTimeFormatted = (date_time, display_date_time, utc, special_time) => {
  let formatDisplay
  switch (display_date_time) {
    case displayDateTime.MM_DD_YYYY:
      formatDisplay = special_time ? `${dateFormat.DATE_2} ${special_time}` : dateFormat.DATE_TIME_5
      break
    case displayDateTime.DD_MM_YYYY:
      formatDisplay = special_time ? `${dateFormat.DATE_3} ${special_time}` : dateFormat.DATE_TIME_6
      break
    default:
      formatDisplay = special_time ? `${dateFormat.DATE_1} ${special_time}` : dateFormat.DATE_TIME_4
      break
  }

  const utcHours = utc ? utc.replace(/\(|UTC|\)/g, '') : '0'
  return moment(date_time, dateFormat.DATE_TIME_ZONE).add(utcHours, 'hours').format(formatDisplay)
}

const generateMemberId = () => {
  return generator.generate({
    length: 6,
    numbers: true,
    lowercase: true,
    uppercase: false,
    strict: true,
  })
}

const getEnvConfig = async (listENV, site) => {
  let site_name
  switch (site) {
    case commonSiteId.P2TECH:
      site_name = 'p2t'
      break

    case commonSiteId.FXT:
      site_name = 'fxon'
      break

    case commonSiteId.ICPAY:
      site_name = 'icpay'
      break

    case commonSiteId.MY_FOREX:
      site_name = 'myforex'
      break

    default:
      site_name = 'p2t/multisite'
      break
  }
  const envArr = listENV.map((el) => `/${site_name}/${process.env.NODE_ENV.toLowerCase()}/${el}`)
  const parameters = await aws.getParameters(envArr)
  const envs = {}
  parameters.Parameters.forEach((el) => {
    envs[el.Name.split('/').pop()] = el.Value
  })
  return envs
}

const colorRandom = () => {
  return color[
    Object.keys(color)[Math.floor(Math.random() * Object.keys(color).length)]
  ]
}

const generateSqsMessage = (parentBatchLogId, resultDetailId) => {
  const sqsMessage = {
    parent_batch_log_id: parentBatchLogId,
    result_detail: {
      total_count: 0,
      result_count: 0,
      process_start_time: moment().utc().format(dateFormat.DATE_TIME_ZONE),
      process_end_time: moment().utc().format(dateFormat.DATE_TIME_ZONE),
      result_detail: {
        result_detail_message: resultDetailMessages[`E_${resultDetailId}`],
      },
    },
    result_detail_id: resultDetailId,
  }

  return JSON.stringify(sqsMessage)
}

const getStrTimezoneAndDisplay = (timezone, display_date_time) => {
  let display
  switch (display_date_time) {
    case displayDateTime.MM_DD_YYYY:
      display = '%m.%d.%Y'
      break
    case displayDateTime.DD_MM_YYYY:
      display = '%d.%m.%Y'
      break
    default:
      display = '%Y.%m.%d'
      break
  }

  return {
    utc: (timezone || '').replace(/[()UTC]/g, '') || '+00:00',
    display,
  }
}

const renderEmail = (parameters, templateEmail, mailLang) => {
  const emailContent = templateEmail[`${mailLang}_content`]
  parameters.base_domain = process.env.WF_DOMAIN_FXON
  const htmlContent = emailContent?.replace(/{{(.*?)}}/g, (match, key) => _.isNil(parameters[key]) ? match : parameters[key])

  const footerParameters = {
    current_year: moment.utc().format('YYYY'),
    base_domain: process.env.WF_DOMAIN_FXON,
  }

  const containerParameters = {
    header: templateEmail[`${mailLang}_header`],
    footer: templateEmail[`${mailLang}_footer`]?.replace(/{{(.*?)}}/g,
      (match, key) => _.isNil(footerParameters[key]) ? match : footerParameters[key]),
    content: htmlContent,
    subject: templateEmail.subject,
  }

  return templateEmail[`${mailLang}_container`]?.replace(/{{(.*?)}}/g,
    (match, key) => _.isNil(containerParameters[key]) ? match : containerParameters[key])
}

const getValidSiteByAdmin = (adminSites, querySites) =>{
  // ALL SITE OWNED BY ADMIN
  if (!Array.isArray(adminSites)) {
    adminSites = adminSites?.split(',').map(Number) || []
  }

  // SITES SELECTED IN PULLDOWN
  if (!Array.isArray(querySites)) {
    querySites = querySites?.split(',').map(Number) || []
  }

  if (!querySites.length) return adminSites

  return querySites.filter((site) => adminSites.includes(site))
}

const divideNumber = (a, b) => {
  return a / b
}

const toFixedNumber = (number, length) => {
  return Number.isInteger(number) ? Number(number).toFixed(length) : number
}

const getFirstSundayOfMonth = async (year, month) => {
  try {
    const firstDayOfMonth = moment(`${year}-${month}-1`, dateFormat.DATE)
    const dayOfWeek = firstDayOfMonth.day()
    const dayOfFirstSunday = dayOfWeek === 0 ? 1 : (7 - dayOfWeek + 1)
    return moment(`${year}-${month}-${dayOfFirstSunday}`, dateFormat.DATE).format(dateFormat.DATE)
  } catch (error) {
    console.error(error)
    return false
  }
}

const getSecondSundayOfMonth = async (year, month) => {
  try {
    const firstDayOfMonth = moment(`${year}-${month}-1`, dateFormat.DATE)
    const dayOfWeek = firstDayOfMonth.day()
    const dayOfSecondSunday = (dayOfWeek === 0 ? 1 : ((7 - dayOfWeek) + 1)) + 7
    return moment(`${year}-${month}-${1 + dayOfSecondSunday}`, dateFormat.DATE).format(dateFormat.DATE)
  } catch (error) {
    console.error(error)
    return false
  }
}

const getLastSundayOfMonth = async (year, month) => {
  try {
    const firstDayOfMonth = moment(`${year}-${month}-1`, dateFormat.DATE)
    return firstDayOfMonth.endOf('month').day(0).format(dateFormat.DATE)
  } catch (error) {
    console.error(error)
    return false
  }
}

const getStartDateOfSummer = async (year, standard) => {
  try {
    if (standard === standardTimezone.US) {
      const date = await getSecondSundayOfMonth(year, 3)
      return moment(`${date} 02:00:00`, dateFormat.DATE_TIME)
    }
    const date = await getLastSundayOfMonth(year, 3)
    return moment(`${date} 01:00:00`, dateFormat.DATE_TIME)
  } catch (error) {
    console.error(error)
    return false
  }
}

const getLastDateOfSummer = async (year, standard) => {
  try {
    if (standard === standardTimezone.US) {
      const date = await getFirstSundayOfMonth(year, 11)
      return moment(`${date} 02:00:00`, dateFormat.DATE_TIME)
    }
    const date = await getLastSundayOfMonth(year, 10)
    return moment(`${date} 01:00:00`, dateFormat.DATE_TIME)
  } catch (error) {
    console.error(error)
    return false
  }
}

const normalizeTime = async (time, broker) => {
  try {
    const standard = brokerStandardTimezone[broker]
    const timeMoment = moment(time)
    if (!standard) {
      if (standard === standardTimezone.NON) {
        const timezone = brokerSummerTimezone[broker] || brokerWinterTimezone[broker]
        return timeMoment.clone().subtract(timezone, 'hours').format(dateFormat.DATE_TIME)
      }
      return time
    }

    const startDateOfSummer = await getStartDateOfSummer(timeMoment.year(), standard)
    const lastDateOfSummer = await getLastDateOfSummer(timeMoment.year(), standard)
    if (timeMoment >= startDateOfSummer && timeMoment < lastDateOfSummer) {
      const summerTimezone = brokerSummerTimezone[broker]
      return timeMoment.clone().subtract(summerTimezone, 'hours').format(dateFormat.DATE_TIME)
    }

    const winterTimezone = brokerWinterTimezone[broker]
    return timeMoment.clone().subtract(winterTimezone, 'hours').format(dateFormat.DATE_TIME)
  } catch (error) {
    console.error(error)
    return error
  }
}

const renderStatusHistory = (data) => {
  switch (data) {
    case statusCode.REQUIRED:
      return `${statusCode.REQUIRED}/$/status`
    case statusCode.PROCESSING:
      return `${statusCode.PROCESSING}/$/status`
    case statusCode.APPROVED:
      return `${statusCode.APPROVED}/$/status`
    case statusCode.REJECTED:
      return `${statusCode.REJECTED}/$/status`
    case statusCode.CLOSED:
      return `${statusCode.CLOSED}/$/status`
    default:
      return ''
  }
}

/**
 * Masks the input data based on its type.
 *
 * @param {string|number} input - The data to be masked.
 * @param {string} type - The type of the data. It can be 'number' or 'string'.
 * @return {string} The masked data. If the type is 'number', all digits before the decimal point are replaced with '*'.
 * If there is a decimal part, it is also replaced with '*'. If the type is 'string', all characters except the last one are replaced with '*'.
 * If the type is not 'number' or 'string', the input is returned as is.
 */
const maskingData = (input, type) => {
  switch (type) {
    case maskingDataType.NUMBER:
      const parts = `${input}`.trim().split('.')
      return '*'.repeat(parts[0].length) + (parts[1] ? '*' + '*'.repeat(parts[1].length) : '')
    case maskingDataType.STRING:
      const strTrim = `${input}`.trim()
      if (!strTrim) return input
      return '*'.repeat(strTrim.length - 1) + strTrim.slice(-1)
    default:
      return input
  }
}

const renderRandomId = () => {
  return generator.generate({
    length: 20,
    numbers: true,
    lowercase: true,
    uppercase: true,
    strict: true,
  })
}

const useWarmUp = (f) => {
  return async function(event, context) {
    if (context?.clientContext?.custom?.source === 'lambda-warmer') {
      await new Promise((r) => setTimeout(r, 25))
      console.log('WarmUp - Lambda is warm!')
      return 'Lambda is warm!'
    }
    return await f(event, context)
  }
}


module.exports = {
  addAutoField,
  createResponse,
  createResponseError,
  setObjAccessHistory,
  verifyRecaptcha,
  loginFraudAlert,
  verifyLoginFraudAlert,
  getPagination,
  escapeSql,
  setToken,
  getLocationByIp,
  getUserIdByToken,
  checkFieldRequired,
  checkFalsyExceptZero,
  flagValidate,
  requestRetry,
  convertToHalfWidthKatakana,
  renderTransactionId,
  setTokenForRedirectSite,
  roundNumber,
  requestPortfolioMyforex,
  formatDigitsToInt,
  getMTURL,
  verifyToken,
  createAuthorizationKey,
  getDateTimeFormatted,
  generateMemberId,
  getEnvConfig,
  colorRandom,
  paginatedItems,
  generateSqsMessage,
  getStrTimezoneAndDisplay,
  getValidSiteByAdmin,
  renderEmail,
  divideNumber,
  toFixedNumber,
  normalizeTime,
  renderStatusHistory,
  maskingData,
  renderRandomId,
  useWarmUp,

}
