'use strict'

/* constant */
const {
  code,
  message,
  commonSiteId,
  dateFormat,
  timeExpires,
  errorMessageCodeConstant,
} = require('constant')

/* func */
const utility = require('utility')
const utilityTwilio = require('./utility_twilio.js')
const moment = require('moment')

/* db */
const {
  usersBasicDataRepository,
  onetimeAuthorityRepository,
  errorLogRepository,
} = require('repository')

const getCodeSms = async (event) => {
  try {
    const res = await getOtpCode(event, 'sms')
    if (!res.status) {
      switch (res.message) {
        case message.fields_cannot_blank:
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
        case message.captcha_is_not_verify:
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.GET_CODE_SMS.CAPTCHA_IS_NOT_VERIFY])
        case message.wrong_phone_number:
          return await errorLogRepository.createResponseAndLog(event, res.error, null, [errorMessageCodeConstant.GET_CODE_SMS.WRONG_PHONE_NUMBER])

        default:
          break
      }
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [
      error.isAxiosError ?
        errorMessageCodeConstant.GET_CODE_SMS.VERIFY_CAPTCHA_FAIL :
        errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR,
    ])
  }
}

const getOtpCode = async (event, type) => {
  const { email, phoneNumber, recaptchaToken, actionClass } = JSON.parse(event.body)
  const ipAddress = event.requestContext.identity.sourceIp

  if (!email, !phoneNumber || !recaptchaToken || !actionClass) {
    return {
      status: false,
      code: code.ERROR,
      message: message.fields_cannot_blank,
      error: null,
    }
  }

  // GET STAFF INFO
  const staffData = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.email': email })
  const languageEmail = staffData.language_email || 'ja'

  // verify recaptcha
  const jsonRecaptcha = await utility.verifyRecaptcha(recaptchaToken)
  const recaptcha = jsonRecaptcha ? JSON.parse(jsonRecaptcha) : ''
  if (!recaptcha || !recaptcha.success) {
    return {
      status: false,
      code: code.ERROR,
      message: message.captcha_is_not_verify,
      error: null,
    }
  }

  let res
  if (type === 'sms') {
    res = await utilityTwilio.getCodeSms(phoneNumber, languageEmail, ipAddress)
  } else {
    // get voice code
    res = await utilityTwilio.getVoiceCode(phoneNumber, languageEmail)
  }

  if (!res.status) {
    if (res.error.status === 400 && res.error.code === 21211) {
      return {
        status: false,
        code: code.ERROR,
        message: message.wrong_phone_number,
        error: res.error,
      }
    }

    throw res.error
  }

  await onetimeAuthorityRepository.createOneTimeAuthorityCode({
    site_id: commonSiteId.P2TECH,
    action_class: actionClass,
    email: email,
    phone_number: phoneNumber,
    code: res.code,
    code_expire_datetime: moment().utc().add(Number(timeExpires.SMS), 'minutes').format(dateFormat.DATE_TIME),
  })

  return {
    status: true,
  }
}

module.exports = {
  getCodeSms,
}
