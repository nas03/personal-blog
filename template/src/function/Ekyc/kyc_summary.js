// UTILITY
const { createResponse, createAuthorizationKey, getMultilingualism, verifyRecaptcha } = require('utility')

// CONSTANT
const {
  message, flag, tokenAuthorityClass, commonSiteId, listTypeGeneralAccessList, timeExpires, kycProcessStep, accessTypeGeneralAccessList,
  errorMessageCodeConstant,
} = require('constant')

// REPOSITORY
const { errorLogRepository, ekycRepository, tokenAuthorityRepository, generalAccessListRepository } = require('repository')

// FUNCTION
const { getKycProcessCheck } = require('./kyc_process')
const uuid = require('uuid')
const { getKycInfoByPersonal } = require('./kyc_menu_tab')

// HELPER
const { template, mailer } = require('helper')

const getKycSummaryModeAdmin = async (event) => {
  try {
    const { ekyc_id, ekyc_id_face } = event.queryStringParameters || {}
    const ekycId = parseInt(ekyc_id)
    const ekycIdFace = parseInt(ekyc_id_face)
    const userInfo = await ekycRepository.getUserInfoByEkycId(ekycId)
    event.user_id = userInfo?.user_id || null

    const { status, data } = await getSummaryKyc(ekycId, ekycIdFace) || {}
    if (!status) {
      if (data === message.incomplete_kyc) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.ADMIN_SUMMARY.INCOMPLETE_KYC])
      } else {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
      }
    }

    return createResponse(true, data)
  } catch (error) {
    console.log(error.message)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

// TODO 2.0.1
const getKycSummaryModeBroker = async (event) => {
  try {
    const { summary_key, activation_key, recaptchaToken } = event.queryStringParameters || {}
    const jsonRecaptcha = await verifyRecaptcha(recaptchaToken)
    const recaptcha = jsonRecaptcha ? JSON.parse(jsonRecaptcha) : ''

    if (!recaptcha || !recaptcha.success) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.BROKER_SUMMARY.VERIFY_CAPTCHA])
    }

    if (!summary_key || !activation_key) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }
    // GET KYC INFO
    const kyc = await ekycRepository.getEKyc({ 'ekyc.summary_key': summary_key })
    event.user_id = kyc?.user_basic_data_id || null
    // GET EMAIL AND TIME EXPIRED OF TOKEN
    const tokenAuthority = await commonVerifySessionKycSummary(summary_key, activation_key)
    const kycInfo = await getKycManagementInfo(kyc.ekyc_id, kyc.user_basic_data_id, kyc.user_personal_id)
    const kycSummary = await getSummaryKyc(kyc?.ekyc_id, kyc?.ekyc_id_face)

    if (!kycSummary.status) {
      if (kycSummary.data === message.incomplete_kyc) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.BROKER_SUMMARY.INCOMPLETE_KYC])
      } else {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
      }
    }

    return createResponse(true, {
      ...kycSummary.data,
      urlBlock: undefined,
      token_authority: tokenAuthority.data,
      ...kycInfo,
    })
  } catch (error) {
    console.log(error)
    // Check axios error
    if (error.isAxiosError) {
      return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.BROKER_SUMMARY.CALL_API_VERIFY_CAPTCHA_FAIL])
    }

    switch (error.message) {
      case message.kyc_summary_authentication_error:
        return await errorLogRepository.createResponseAndLog(event, error, null,
          [errorMessageCodeConstant.BROKER_SUMMARY.KYC_SUMMARY_AUTHENTICATION_ERROR])
      case message.kyc_summary_session_timeout:
        return await errorLogRepository.createResponseAndLog(event, error, null,
          [errorMessageCodeConstant.BROKER_SUMMARY.KYC_SUMMARY_SESSION_TIMEOUT])
      default:
        return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
    }
  }
}

const getSummaryKyc = async (ekycId, ekycFaceId) => {
  try {
    const kycCheckData = await getKycProcessCheck(ekycId, ekycFaceId, false)
    if (!kycCheckData.status) {
      return {
        status: false,
        data: kycCheckData.data,
      }
    }

    const { step_check } = kycCheckData.data.step_1
    if (step_check !== kycProcessStep.STEP_COMPLETED) {
      return {
        status: false,
        data: message.incomplete_kyc,
      }
    }

    const kycInfo = kycCheckData.data.step_1.kyc

    const images = kycInfo[0]?.trimming_documents?.length ?
      kycInfo[0]?.trimming_documents :
      kycInfo[0].documents.filter((el) => !el.is_video && !el.is_preview)

    let faceImages = []
    if (ekycFaceId) {
      faceImages = kycInfo[1]?.trimming_documents?.length ?
        kycInfo[1]?.trimming_documents :
        kycInfo[1].documents.filter((el) => !el.is_video && !el.is_preview)
    }

    const urlBlock = {
      url: kycCheckData.data.step_1.summary_key ? `${process.env.URL_FE_P2T_KYC}/public-documentcheck/${kycCheckData.data.step_1.summary_key}/` : '-',
      enable_flag: kycCheckData.data.step_1.enable_summary_url_flag,
    }

    return {
      status: true,
      data: {
        images_block: images,
        images_face_block: faceImages,
        ...kycCheckData.data.step_2,
        m_kyc_documents: kycCheckData.data.m_kyc_documents,
        url_block: urlBlock,
      },
    }
  } catch (error) {
    console.log(error.message)
    return {
      status: false,
      data: message.server_error,
    }
  }
}

const toggleSummaryKey = async (event) => {
  try {
    const { ekyc_id, status } = JSON.parse(event.body) || {}
    const ekyc = await ekycRepository.getSummaryKey({ 'ekyc.id': ekyc_id })
    let summary_key = ekyc.summary_key
    let payload = { enable_summary_url_flag: status }

    if (!ekyc.summary_key) {
      summary_key = uuid.v4(),
      payload = {
        summary_key,
        ...payload,
      }
    }

    await ekycRepository.updateEkyc(ekyc_id, payload)
    const urlBlock = {
      url: `${process.env.URL_FE_P2T_KYC}/public-documentcheck/${summary_key}/`,
      enable_flag: status,
    }

    return createResponse(true, urlBlock)
  } catch (error) {
    console.log(error.message)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

// TODO 2.0.1
const createActivationKey = async (event) => {
  try {
    const { summary_key, email, language } = JSON.parse(event.body) || {}
    if (!summary_key || !email || !language) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.CREATE_ACTIVATION_KEY.KYC_SUMMARY_AUTHENTICATION_ERROR.FIELDS_CANNOT_BLANK])
    }

    const ekyc = await ekycRepository.getSummaryKey({
      summary_key,
      enable_summary_url_flag: flag.TRUE,
    })

    if (!ekyc) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.CREATE_ACTIVATION_KEY.KYC_SUMMARY_AUTHENTICATION_ERROR.NOT_FOUND_SUMMARY_KEY])
    }
    event.user_id = ekyc.user_id || null
    // CHECK EMAIL BROKER
    const generalEmail = await generalAccessListRepository.getAccessListEmail({
      email,
      list_type: listTypeGeneralAccessList.KYC_SUMMARY,
      list_classification: flag.TRUE,
      site_id: ekyc.site_id,
      access_type: accessTypeGeneralAccessList.EMAIL,
    })

    if (!generalEmail) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.CREATE_ACTIVATION_KEY.KYC_SUMMARY_AUTHENTICATION_ERROR.GET_GENERAL_EMAIL_FAIL])
    }

    const { key, expiresIn } = createAuthorizationKey(timeExpires.KYC_ACTIVATION_KEY, 'hour')
    const payload = {
      target_id: ekyc.id,
      email,
      site_id: commonSiteId.P2TECH,
      action_class: tokenAuthorityClass.KYC_SUMMARY,
      activation_key: key,
      activation_key_expire_datetime: expiresIn,
    }

    await tokenAuthorityRepository.createTokenAuthority(payload)

    // SEND MAIL
    const language_email = 'ja'
    const language_portal = language
    const clientName = email
    const to = email
    const lang = await getMultilingualism(process.env.LOCALES_SOURCE, language_email)
    const rsLang = lang.email.summary_email
    const title = []
    if (rsLang.title) {
      for (const item in rsLang.title) {
        if (rsLang.title.hasOwnProperty(item)) {
          title.push(rsLang.title[`${item}`])
        }
      }
    }
    const tableTitle = rsLang.table_title
    const content = {
      type: 'link',
      data: `${process.env.URL_FE_P2T_KYC}/public-documentcheck/${summary_key}/${key}/?lang=${language_portal}`,
    }
    const footer = [rsLang.footer]
    const html = template.templateP2T(lang.email.common, language_email, clientName, title, tableTitle, content, footer, null)
    const responseSendMail = await mailer.sendMail(to, rsLang.subject, '', html)

    if (responseSendMail.isError) {
      return await errorLogRepository.createResponseAndLog(event, responseSendMail, null,
        [errorMessageCodeConstant.CREATE_ACTIVATION_KEY.SEND_MAIL_ERROR])
    }

    return createResponse(true, message.please_check_mail_confirm)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const commonVerifySessionKycSummary = async (summary_key, activation_key) => {
  try {
    const ekyc = await ekycRepository.getSummaryKey({
      summary_key,
      enable_summary_url_flag: flag.TRUE,
    })

    if (!ekyc) {
      throw new Error(message.kyc_summary_authentication_error)
    }

    const verify = await tokenAuthorityRepository.verifyTokenAuthority({
      target_id: ekyc.id,
      site_id: commonSiteId.P2TECH,
      action_class: tokenAuthorityClass.KYC_SUMMARY,
      activation_key: activation_key,
    })

    if (!verify) {
      throw new Error(message.kyc_summary_session_timeout)
    }

    return {
      status: true,
      data: {
        email: verify.email,
        activation_key_expire_datetime: verify.activation_key_expire_datetime,
        id: verify.id,
        created: verify.ts_update,
      },
    }
  } catch (error) {
    throw new Error(error.message)
  }
}

const verifySummaryKey = async (event) => {
  try {
    const { summary_key } = event.queryStringParameters || {}
    const ekyc = await ekycRepository.getSummaryKey({
      summary_key,
      enable_summary_url_flag: flag.TRUE,
    })
    if (!ekyc) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.VERIFY_SUMMARY_KEY.KYC_SUMMARY_AUTHENTICATION_ERROR])
    }

    return createResponse(true)
  } catch (error) {
    console.log(error.message)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const sessionOut = async (event) => {
  try {
    const { summary_key, activation_key } = JSON.parse(event.body) || {}
    if (!summary_key || !activation_key) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }
    const tokenAuthority = await commonVerifySessionKycSummary(summary_key, activation_key)
    const deleteToken = await tokenAuthorityRepository.deleteTokenAuthority(tokenAuthority.data.id)

    if (!deleteToken) {
      throw new Error('The token cannot be deleted')
    }

    return createResponse(true)
  } catch (error) {
    console.log(error.message)

    switch (error.message) {
      case message.kyc_summary_authentication_error:
        return await errorLogRepository.createResponseAndLog(event, error, null,
          [errorMessageCodeConstant.SESSION_OUT.KYC_SUMMARY_AUTHENTICATION_ERROR])
      case message.kyc_summary_session_timeout:
        return await errorLogRepository.createResponseAndLog(event, error, null,
          [errorMessageCodeConstant.SESSION_OUT.KYC_SUMMARY_SESSION_TIMEOUT])
      default:
        return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
    }
  }
}

const getKycManagementInfo = async (kyc_id, user_id, user_personal_id) => {
  try {
    const kycInfoByPersonal = await getKycInfoByPersonal(user_id)
    const personal_info = kycInfoByPersonal.personal_info?.find(((personal) => personal.personal_id === user_personal_id)) || []
    const kyc_info = personal_info.kyc_info?.find(((kyc) => kyc.kyc_id === kyc_id)) || []

    const _response = {
      ...kycInfoByPersonal,
      personal_info: {
        ...personal_info,
        kyc_info,
      },
    }
    return _response
  } catch (error) {
    console.log(error)
    throw new Error(message.server_error)
  }
}

module.exports = {
  getKycSummaryModeAdmin,
  getKycSummaryModeBroker,
  toggleSummaryKey,
  createActivationKey,
  verifySummaryKey,
  sessionOut,
}
