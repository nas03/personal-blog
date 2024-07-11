/* eslint-disable no-unused-vars */
/* eslint-disable linebreak-style */
'use strict'

/* library */
const moment = require('moment')
const passwordHash = require('password-hash')
const buffer = require('buffer')
const uuid = require('uuid')

/* func && const */
const { mailer, template } = require('helper')
const { message, dateFormat, flag, statusCode, onetimeAuthorityClass, commonSiteId, twoFactorAuthentication, decisionIdSiftApi,
  tokenAuthorityClass, verificationStatusSiftApi, failureLoginReasonSiftApi, keySplitUrl, urlImageBase, timeExpires,
  errorMessageCodeConstant } = require('constant')
const { errorLogRepository, onetimeAuthorityRepository, usersPortalDataRepository, usersBasicDataRepository,
  tokenAuthorityRepository } = require('repository')
const { verifyRecaptcha, createResponse, getMultilingualism, setToken, getLocationByIp, getDateTimeFormatted,
  loginFraudAlert, verifyLoginFraudAlert } = require('utility')
const utilityTwilio = require('../Twilio/utility_twilio.js')
const { createAccessHistory } = require('../History/user_access_history.js')

const defaultId = -99

/*
CALL API LOGIN PASSWORD => RETURN TOKEN
CALL API LOGIN 2FA => CALL API 2FA SMS or EMAIL => RETURN TOKEN
*/

const login = async (event) => {
  try {
    const { email, password, recaptchaToken, sessionId } = JSON.parse(event.body)
    // eslint-disable-next-line no-unused-vars
    const userHash = defaultId + email

    const directIpAddress = event.requestContext.identity.sourceIp
    const directUserAgent = {
      userAgent: event.headers['User-Agent'],
      mobileDeviceType: event.headers.access_device_type,
      mobileDeviceName: event.headers.access_device_name,
    }

    // CHECK REQUIRED
    if (!recaptchaToken || !email || !password) {
      await createAccessHistory(directIpAddress, directUserAgent, 0)
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // VERIFY RECAPTCHA
    const responseRecaptcha = ''
    /* const jsonRecaptcha = await verifyRecaptcha(recaptchaToken)
    const responseRecaptcha = jsonRecaptcha ? JSON.parse(jsonRecaptcha) : ''
    if (!responseRecaptcha || !responseRecaptcha.success) {
      const responseFraudAlert = await loginFraudAlert(
        event,
        email,
        userHash,
        sessionId,
        directIpAddress,
        directUserAgent.userAgent,
        false,
        failureLoginReasonSiftApi.ACCOUNT_UNKNOWN,
      )
      await createAccessHistory(directIpAddress, directUserAgent, 0, responseFraudAlert)
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.LOGIN.RECAPTCHA_IS_NOT_VERIFY])
    }
 */
    // GET STAFF INFO
    const staffData = await usersBasicDataRepository.getUserLoginData({
      email: email,
      site_id: commonSiteId.P2TECH,
    })

    // EMAIL NOT EXIST
    if (!staffData) {
      await createAccessHistory(directIpAddress, directUserAgent, 0)
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.LOGIN.EMAIL_IS_NOT_EXIST])
    }

    const { id, phone_number, twofa_flag, twofa_method_class, hash_password, account_status_code } = staffData

    // ACCOUNT IS NOT APPROVED
    /* if (account_status_code !== statusCode.APPROVED) {
      const responseFraudAlert = await loginFraudAlert(
        event,
        email,
        id,
        sessionId,
        directIpAddress,
        directUserAgent.userAgent,
        false,
        failureLoginReasonSiftApi.ACCOUNT_SUSPENDED,
      )
      await createAccessHistory(directIpAddress, directUserAgent, 0, responseFraudAlert)
      if (account_status_code === statusCode.REGISTERED || account_status_code === statusCode.ACTIVATED) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.LOGIN.ACCOUNT_IS_NOT_ACTIVE])
      } else if (account_status_code === statusCode.PENDING || account_status_code === statusCode.CLOSED) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.LOGIN.ACCOUNT_IS_CLOSE])
      }
    } */


    // PASSWORD INCORRECT
    /* if (!passwordHash.verify(password, hash_password)) {
      const responseFraudAlert = await loginFraudAlert(
        event,
        email,
        id,
        sessionId,
        directIpAddress,
        directUserAgent.userAgent,
        false,
        failureLoginReasonSiftApi.WRONG_PASSWORD,
      )
      await createAccessHistory(directIpAddress, directUserAgent, 0, responseFraudAlert)
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.LOGIN.WRONG_PASSWORD])
    }

    // VERIFY FRAUD_ALERT
    const responseFraudAlert = await loginFraudAlert(
      event,
      email,
      id,
      sessionId,
      directIpAddress,
      directUserAgent.userAgent,
    )

    const decisionId = responseFraudAlert?.score_response.workflow_statuses[0]?.history[0]?.config?.decision_id

    if (decisionId === decisionIdSiftApi.SESSION_LOOKS_BAD) {
      await verifyLoginFraudAlert(event, staffData.id, sessionId, verificationStatusSiftApi.PENDING)
      const accessHistoryId = (await createAccessHistory(directIpAddress, directUserAgent, 0, responseFraudAlert, staffData.id)).data
      const responseSendMail = await sendEmailFraudAlert(staffData, responseFraudAlert, directIpAddress, directUserAgent, accessHistoryId)
      if (responseSendMail.isError) {
        return await errorLogRepository.createResponseAndLog(event, responseSendMail, null,
          [errorMessageCodeConstant.LOGIN.SEND_MAIL_ERROR])
      }
      return createResponse(true, message.please_check_mail_confirm)
    }
 */
    // UPDATE LOGIN BASE FLAG = 1 WHEN LOGIN BY PASSWORD SUCCESSFULLY
    await usersPortalDataRepository.updateUserPortalData(id, { pass_login_base_flag: flag.TRUE })

    // CREATE RESPONSE
    const response = {
      methodLogin: twofa_method_class,
      phoneNumber: phone_number,
      accessToken: null,
    }

    // CREATE ACCESS TOKEN
    // if (!twofa_flag && twofa_method_class === twoFactorAuthentication.PASSWORD) {
    const accessTokenResponse = await createAccessToken(event, staffData)
    // if (!accessTokenResponse.status) {
    // return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.LOGIN.CREATE_TOKEN_FAIL])
    // }
    response.accessToken = accessTokenResponse.data
    // }
    return createResponse(true, response)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [
      error.isAxiosError ?
        errorMessageCodeConstant.LOGIN.LOGIN_FRAUD_ALERT :
        errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR,
    ])
  }
}

const sendEmailFraudAlert = async (userData, responseFraudAlert, directIpAddress, directUserAgent, accessHistoryId) => {
  const { id, email, first_name_romaji, last_name_romaji, language_email } = userData
  // SEND MAIL
  const to = email
  const clientName = `${first_name_romaji} ${last_name_romaji}`
  const fraudAlertKey = uuid.v4()
  const fraudAlertExpire = moment()
    .utc()
    .add(timeExpires.TIME_FRAUD_ALERT, 'minutes')
    .format(dateFormat.DATE_TIME)
  const faKey = fraudAlertKey + keySplitUrl + accessHistoryId

  // encode key
  const encodeFaKey = buffer.Buffer.from(faKey, 'utf8').toString('base64')

  await tokenAuthorityRepository.createTokenAuthority({
    target_id: id,
    site_id: commonSiteId.P2TECH,
    activation_key: fraudAlertKey,
    activation_key_expire_datetime: fraudAlertExpire,
    action_class: tokenAuthorityClass.FRAUD_ALERT,
  })

  const lang = await getMultilingualism(process.env.LOCALES_SOURCE, language_email)
  const faLang = lang.email.fraud_alert
  const title = [faLang.title_a, faLang.title_b]
  const tableTitle = faLang.table_title

  const portalLang = userData.language_portal
  const urlToken = `${process.env.URL_FE}/one-time-path/?lang=${portalLang}&faKey=${encodeFaKey}`
  const content = {
    type: 'link',
    data: urlToken,
  }
  const footer = [faLang.footer]
  const html = template.templateP2T(lang.email.common, language_email, clientName, title, tableTitle, content, footer)
  return await mailer.sendMail(to, faLang.subject, '', html)
}

const unusualLoginByEmail = async (event) => {
  try {
    const { faKey, sessionId } = JSON.parse(event.body)
    if (!faKey || !sessionId) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // DECODE FA KEY
    const decodeFaKey = buffer.Buffer.from(faKey, 'base64').toString('utf8')
    const fraudAlertKey = decodeFaKey.split(keySplitUrl)[0]
    const relatedAccessId = decodeFaKey.split(keySplitUrl)[1]

    // VERIFY FRAUD_ALERT KEY
    const verify = await tokenAuthorityRepository.verifyTokenAuthority({
      site_id: commonSiteId.P2TECH,
      action_class: tokenAuthorityClass.FRAUD_ALERT,
      activation_key: fraudAlertKey,
    })
    if (!verify) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UNUSUAL_LOGIN_BY_EMAIL.LINK_EXPIRED])
    }

    // GET STAFF INFO
    const staffData = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': verify.target_id })
    if (!staffData) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UNUSUAL_LOGIN_BY_EMAIL.LINK_EXPIRED])
    }

    // CREATE UNUSUAL ACCESS TOKEN
    const accessTokenResponse = await createAccessToken(event, staffData, relatedAccessId, true)
    if (!accessTokenResponse.status) {
      if (accessTokenResponse.data === message.account_is_not_active) {
        return await errorLogRepository.createResponseAndLog(
          event,
          null,
          null,
          [errorMessageCodeConstant.UNUSUAL_LOGIN_BY_EMAIL.ACCOUNT_IS_NOT_ACTIVE])
      }

      throw new Error(accessTokenResponse.message)
    }

    await verifyLoginFraudAlert(event, staffData.id, sessionId, verificationStatusSiftApi.SUCCESS)

    // DELETE FRAUD_ALERT KEY
    await tokenAuthorityRepository.deleteTokenAuthority(verify.id)

    return createResponse(true, { accessToken: accessTokenResponse.data })
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const createAccessToken = async (event, userData, relatedAccessId = undefined, isFraudAlert = false) => {
  try {
    const directIpAddress = event.requestContext.identity.sourceIp
    const directUserAgent = {
      userAgent: event.headers['User-Agent'],
      mobileDeviceType: event.headers.access_device_type,
      mobileDeviceName: event.headers.access_device_name,
    }
    const { staySignIn } = JSON.parse(event.body)
    const { id, email, first_name_romaji, last_name_romaji, authorization_id, authorization_name, account_status_code } = userData

    // ACCOUNT IS NOT APPROVED
    if (account_status_code === statusCode.PENDING || account_status_code === statusCode.CLOSED) {
      return { status: false, data: message.account_is_not_active }
    }

    // CREATE ACCESS HISTORY
    const accessHistory = await createAccessHistory(directIpAddress, directUserAgent, 1, null, id, relatedAccessId)

    // CREATE_ACCESS_TOKEN
    const accessToken = setToken(
      {
        id: id,
        email: email,
        firstName: first_name_romaji,
        lastName: last_name_romaji,
        fullName: first_name_romaji + last_name_romaji,
        authorizationId: authorization_id,
        authorizationName: authorization_name,
      },
      accessHistory.data || null,
      staySignIn,
      isFraudAlert,
    )

    // UPDATE LOGIN DATA
    const timeUTC = (userData.timezone || '0').replace(/\(|UTC|\)/g, '')
    const tsLogin = getDateTimeFormatted(moment().utc(), userData.display_date_time, timeUTC)
    await usersPortalDataRepository.updateUserPortalData(id, { pass_login_base_flag: flag.FALSE })

    if (userData.login_notify_flag) {
      await sendMailLoginNotify(userData, tsLogin, directIpAddress, { browser: accessHistory.deviceBrower, type: accessHistory.deviceType })
    }
    return { status: true, data: accessToken }
  } catch (error) {
    return { status: false, message: error.sqlMessage || error.message }
  }
}

const auth2FaSms = async (event) => {
  try {
    const directIpAddress = event.requestContext.identity.sourceIp
    const directUserAgent = {
      userAgent: event.headers['User-Agent'],
      mobileDeviceType: event.headers.access_device_type,
      mobileDeviceName: event.headers.access_device_name,
    }
    const { email, phoneNumber, code2fa, sessionId } = JSON.parse(event.body)

    // CHECK REQUIRED
    if (!email || !phoneNumber || !sessionId || !code2fa) {
      await createAccessHistory(directIpAddress, directUserAgent, 0)
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // GET STAFF INFO
    const userData = await usersBasicDataRepository.getUserLoginData({
      email: email,
      site_id: commonSiteId.P2TECH,
    })

    const { pass_login_base_flag } = userData

    // VERIFY CODE SMS
    const verify = await utilityTwilio.verifyCodeSms(email, phoneNumber, code2fa, onetimeAuthorityClass.LOGIN_2FA_SMS)
    if (!verify.status) {
      // const fraudAlert = await verifyFraudAlert(id, siteId, sessionId, apiKey, directIpAddress, directUserAgent, false)
      // await createAccessHistory(directIpAddress, directUserAgent, 0, fraudAlert, id)
      const messageCode = verify.error === message.wrong_code ?
        errorMessageCodeConstant.AUTH_2FA_SMS.WRONG_CODE :
        errorMessageCodeConstant.AUTH_2FA_SMS.EXPIRED_CODE

      return await errorLogRepository.createResponseAndLog(event, null, null, [messageCode])
    }

    // CHECK PASS LOGIN BASE
    if (!pass_login_base_flag) {
      // const fraudAlert = await verifyFraudAlert(id, siteId, sessionId, apiKey, directIpAddress, directUserAgent, false)
      // await createAccessHistory(directIpAddress, directUserAgent, 0, fraudAlert, id)
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.AUTH_2FA_SMS.WRONG_EMAIL])
    }

    // CREATE ACCESS TOKEN
    const accessTokenResponse = await createAccessToken(event, userData)
    if (!accessTokenResponse.status) {
      if (accessTokenResponse.data === message.account_is_not_active) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.AUTH_2FA_SMS.ACCOUNT_IS_NOT_ACTIVE])
      }

      throw new Error(accessTokenResponse.message)
    }
    return createResponse(true, { accessToken: accessTokenResponse.data })
  } catch (error) {
    console.error(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const auth2FaEmail = async (event) => {
  try {
    const { email, code2fa, sessionId } = JSON.parse(event.body)

    // CHECK REQUIRED
    if (!email || !sessionId || !code2fa) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // GET STAFF INFO
    const userData = await usersBasicDataRepository.getUserLoginData({
      email: email,
      site_id: commonSiteId.P2TECH,
    })
    const { pass_login_base_flag } = userData

    // VERIFY CODE EMAIL
    const verify = await onetimeAuthorityRepository.verifyOneTimeAuthorityCode({
      site_id: commonSiteId.P2TECH,
      action_class: onetimeAuthorityClass.LOGIN_2FA_EMAIL,
      email: email,
      code: code2fa,
    })
    if (!verify.status) {
      // const fraudAlert = await verifyFraudAlert(id, siteId, sessionId, apiKey, directIpAddress, directUserAgent, false)
      // await createAccessHistory(directIpAddress, directUserAgent, 0, fraudAlert, id)
      const messageCode = verify.message === message.wrong_code ?
        errorMessageCodeConstant.AUTH_2FA_EMAIL.WRONG_CODE :
        errorMessageCodeConstant.AUTH_2FA_EMAIL.EXPIRED_CODE
      return await errorLogRepository.createResponseAndLog(event, null, null, [messageCode])
    }

    // CHECK PASS LOGIN BASE
    if (!pass_login_base_flag) {
      // const fraudAlert = await verifyFraudAlert(id, siteId, sessionId, apiKey, directIpAddress, directUserAgent, false)
      // await createAccessHistory(directIpAddress, directUserAgent, 0, fraudAlert, id)
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.AUTH_2FA_EMAIL.WRONG_EMAIL])
    }

    // CREATE ACCESS TOKEN
    const accessTokenResponse = await createAccessToken(event, userData)
    if (!accessTokenResponse.status) {
      if (accessTokenResponse.data === message.account_is_not_active) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.AUTH_2FA_EMAIL.ACCOUNT_IS_NOT_ACTIVE])
      }

      throw new Error(accessTokenResponse.message)
    }
    // DELETE ONETIME AUTHORITY CODE
    await onetimeAuthorityRepository.deleteOneTimeAuthorityCode(verify.data.id)
    return createResponse(true, { accessToken: accessTokenResponse.data })
  } catch (error) {
    console.error(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getCodeEmail = async (event) => {
  try {
    // CHECK REQUIRED
    const { email, recaptchaToken, actionClass } = JSON.parse(event.body)
    if (!email || !recaptchaToken || !actionClass) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // VERIFY RECAPTCHA
    const jsonRecaptcha = await verifyRecaptcha(recaptchaToken)
    const recaptcha = jsonRecaptcha ? JSON.parse(jsonRecaptcha) : ''
    if (!recaptcha || !recaptcha.success) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.GET_CODE_EMAIL.CAPTCHA_IS_NOT_VERIFY])
    }

    // CREATE CODE EMAIL
    const oneTimeCode = Math.floor(100000 + Math.random() * 900000)
    const oneTimeCodeExpireIn = moment().utc().add(60, 'minutes').format(dateFormat.DATE_TIME)
    await onetimeAuthorityRepository.createOneTimeAuthorityCode({
      site_id: commonSiteId.P2TECH,
      action_class: actionClass,
      email: email,
      code: oneTimeCode,
      code_expire_datetime: oneTimeCodeExpireIn,
    })

    // GET STAFF INFO
    const userData = await usersBasicDataRepository.getUserLoginData({
      email: email,
      site_id: commonSiteId.P2TECH,
    })
    const { language_email, full_name } = userData

    // SEND MAIL
    const to = email
    const lang = await getMultilingualism(process.env.LOCALES_SOURCE, language_email)
    const twoFaLoginLang = lang.email.two_fa_login
    const subject = twoFaLoginLang.subject
    const title = [twoFaLoginLang.title]
    const tableTitle = twoFaLoginLang.table_title
    const content = { data: oneTimeCode }
    const footer = [twoFaLoginLang.footer_a, twoFaLoginLang.footer_b]
    const urlLogin = `${process.env.URL_FE}/login/`
    const html = template.templateP2T(lang.email.common, language_email, full_name, title, tableTitle, content, footer, urlLogin)

    const responseSendMail = await mailer.sendMail(to, subject, '', html)
    if (responseSendMail.isError) {
      return await errorLogRepository.createResponseAndLog(event, responseSendMail, null, [errorMessageCodeConstant.GET_CODE_EMAIL.SEND_MAIL_ERROR])
    }
    return createResponse(true)
  } catch (error) {
    console.error(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [
      error.isAxiosError ?
        errorMessageCodeConstant.GET_CODE_EMAIL.VERIFY_CAPTCHA_FAIL :
        errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR,
    ])
  }
}

const sendMailLoginNotify = async (userData, dateTime, ipAddress, device) => {
  try {
    const { email, language_email, full_name } = userData
    const location = await getLocationByIp(ipAddress)

    // ICON
    const iconPaths = {
      desktop: 'icon-pc.png',
      tablet: 'icon_tab.png',
      mobile: 'icon_mobile_phone.png',
      default: 'icon_question_simple.png',
    }

    // SEND MAIL
    const to = email
    const lang = await getMultilingualism(process.env.LOCALES_SOURCE, language_email)
    const loginNotifyLang = lang.email.login_notify
    const title = [loginNotifyLang.title]
    const tableTitle = loginNotifyLang.table_title
    const content = {
      type: 'table',
      data: [
        {
          title: loginNotifyLang.content_title.date_time,
          data: `${dateTime} ${userData.timezone}`,
        },
        {
          title: loginNotifyLang.content_title.ip_address,
          data: ipAddress,
        },
        {
          title: loginNotifyLang.content_title.country,
          data: location && location.country ? location.country : '',
        },
        {
          title: loginNotifyLang.content_title.device,
          img: `${urlImageBase.MAIL_P2T}/${iconPaths[device.type] || iconPaths.default}`,
          data: device.browser,
        },
      ],
    }
    const footer = [
      loginNotifyLang.footer,
    ]
    const urlLogin = `${process.env.URL_FE}/login/`
    const html = template.templateP2T(lang.email.common, language_email, full_name, title, tableTitle, content, footer, urlLogin)
    await mailer.sendMail(to, loginNotifyLang.subject, '', html)
  } catch (error) {
    console.error(error)
  }
}

module.exports = {
  login,
  unusualLoginByEmail,
  auth2FaSms,
  auth2FaEmail,
  getCodeEmail,
  createAccessToken,
  sendEmailFraudAlert,
}
