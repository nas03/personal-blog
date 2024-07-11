'use strict'

/* library */
const admin = require('firebase-admin')
const serviceAccount = require('../../../service_account_key.json')

/* func && const */
const { createResponse, loginFraudAlert, verifyLoginFraudAlert, verifyRecaptcha: checkCaptcha } = require('utility')
const { message, statusCode, commonSiteId, decisionIdSiftApi,
  failureLoginReasonSiftApi, verificationStatusSiftApi, errorMessageCodeConstant } = require('constant')
const { createAccessToken } = require('./login')
const { createAccessHistory } = require('../History/user_access_history')
const { sendEmailFraudAlert } = require('./login')

/* db */
const { usersBasicDataRepository, errorLogRepository } = require('repository')

/* init firebase */
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })

const verifyRecaptcha = async (event) => {
  try {
    const directIpAddress = event.requestContext.identity.sourceIp
    const directUserAgent = event.headers['User-Agent']

    const recaptchaToken = JSON.parse(event.body).recaptchaToken

    // check input
    if (!recaptchaToken) {
      await createAccessHistory(directIpAddress, directUserAgent, 0)
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // verify recaptcha
    const jsonRecaptcha = await checkCaptcha(recaptchaToken)
    const responseRecaptcha = jsonRecaptcha ? JSON.parse(jsonRecaptcha) : ''
    if (!responseRecaptcha || !responseRecaptcha.success) {
      await createAccessHistory(directIpAddress, directUserAgent, 0)
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.VERIFY_RECAPTCHA.CAPTCHA_IS_NOT_VERIFY])
    }
    return createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [
      error.isAxiosError ?
        errorMessageCodeConstant.VERIFY_RECAPTCHA.VERIFY_CAPTCHA_FAIL :
        errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR,
    ])
  }
}

const loginSns = async (event) => {
  try {
    const directIpAddress = event.requestContext.identity.sourceIp
    const directUserAgent = {
      userAgent: event.headers['User-Agent'],
      mobileDeviceType: event.headers.access_device_type,
      mobileDeviceName: event.headers.access_device_name,
    }
    const { accessToken, sessionId, locale } = JSON.parse(event.body)

    // CHECK REQUIRED
    if (!accessToken || !sessionId || !locale) {
      await createAccessHistory(directIpAddress, directUserAgent, 0)
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // VERIFY TOKEN SNS
    const verify = await admin.auth().verifyIdToken(accessToken)
    if (!verify) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.LOGIN_SNS.VERIFY_TOKEN_FAIL])
    }
    if (!verify.email) {
      await createAccessHistory(directIpAddress, directUserAgent, 0)
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.LOGIN_SNS.EMAIL_IS_NOT_EXIST])
    }

    // GET STAFF INFO
    const staffData = await usersBasicDataRepository.getUserLoginData({
      email: verify.email,
      site_id: commonSiteId.P2TECH,
    })

    // EMAIL NOT EXIST
    if (!staffData) {
      await createAccessHistory(directIpAddress, directUserAgent, 0)
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.LOGIN_SNS.WRONG_EMAIL])
    }

    const { id, email, google_sso_flag, account_status_code } = staffData
    // ACCOUNT IS NOT APPROVED
    if (account_status_code !== statusCode.APPROVED) {
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
        return await errorLogRepository.createResponseAndLog(event, null, null,
          [errorMessageCodeConstant.LOGIN_SNS.ACCOUNT_STATUS.ACCOUNT_IS_NOT_ACTIVE])
      } else if (account_status_code === statusCode.PENDING || account_status_code === statusCode.CLOSED) {
        return await errorLogRepository.createResponseAndLog(event, null, null,
          [errorMessageCodeConstant.LOGIN_SNS.ACCOUNT_STATUS.ACCOUNT_CLOSE])
      }
    }


    // CHECK GOOGLE SSO ENABLE
    if (!google_sso_flag) {
      await createAccessHistory(directIpAddress, directUserAgent, 0)
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.LOGIN_SNS.GOOGLE_SSO_DISABLE])
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
      // SEND MAIL
      const responseSendMail = await sendEmailFraudAlert(staffData, responseFraudAlert, directIpAddress, directUserAgent, accessHistoryId)
      if (responseSendMail.isError) {
        return await errorLogRepository.createResponseAndLog(event, responseSendMail, null, [errorMessageCodeConstant.LOGIN_SNS.SEND_MAIL_ERROR])
      }
      return createResponse(true, message.please_check_mail_confirm)
    }

    // CREATE ACCESS_TOKEN
    const createToken = await createAccessToken(event, staffData)
    if (!createToken.status) {
      return await errorLogRepository.createResponseAndLog(event, createToken, null, [errorMessageCodeConstant.LOGIN_SNS.CREATE_TOKEN_FAIL])
    }

    return createResponse(true, { accessToken: createToken.data })
  } catch (error) {
    console.error(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  verifyRecaptcha,
  loginSns,
}
