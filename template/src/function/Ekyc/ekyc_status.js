/* FUNCTION */
const utility = require('utility')
const { createOperationHistory } = require('../History/operation_history.js')

/* DATABASE */
const {
  ekycRepository,
  errorLogRepository,
  usersBasicDataRepository,
  emailDetailContentRepository,
  emailHistoryRepository,
  usersPersonalRepository,
  usersCorporateRepository,
  statusMasterRepository,
} = require('repository')

/* CONSTANT */
const { commonSiteId, ekycDocumentType, ekycAuthenticationType,
  category, contentUpdate, flag, statusCode, emailDetailContentId, ekycFlow, kycProcessStep, errorMessageCodeConstant, message } = require('constant')

const { fxonPersonal, icpayPersonalMNC, icpayPersonalPoA, myForexPersonal, fxsignupPersonal } = require('./ekyc_level')

// HELPER
const { mailer } = require('helper')
const { verifiedAllBlock } = require('./kyc_process.js')
const { checkDuplicateError } = require('./ekyc_transaction')

const changeEkycStatus = async (event) =>{
  try {
    const staff_id = utility.getUserIdByToken(event)
    const { kyc_ids, status_code, status_label_number, status_label_message, is_send_mail } = JSON.parse(event.body)
    const [kyc_id, kyc_face_id] = kyc_ids

    // FIELDS CANNOT BLANK
    if (!kyc_ids.length || !status_code || (!status_label_number && status_label_number !== 0)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    const isDuplicateError = await checkDuplicateError(staff_id, kyc_ids)

    // CHECK KYC IS NOT EXISTED
    const kycTransaction = await ekycRepository.getKycTransaction({
      'kyc_transaction.id': kyc_id,
      'kyc_transaction.completed_flag': flag.TRUE,
      'kyc_transaction.delete_flag': flag.FALSE,
      'fl.delete_flag': flag.FALSE,
      'mkd.delete_flag': flag.FALSE,
    })

    event.user_id = kycTransaction?.user_basic_data_id || null


    if (!isDuplicateError) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.CHANGE_EKYC_STATUS.DUPLICATE_ERROR])
    }
    if (!kycTransaction) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.CHANGE_EKYC_STATUS.EKYC_EXPIRY])
    }

    // VALIDATE DUPLICATE ERROR
    const currentStatusCode = kycTransaction.status_code
    const isValidStatusField = await validateStatusField(currentStatusCode, status_code, kyc_id)
    // FIELDS INVALID
    if (
      !isValidStatusField ||
      (!is_send_mail && status_label_message) ||
      (status_code === statusCode.REJECTED && !status_label_number)
    ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    const user = await usersBasicDataRepository.getBaseUserInfo(kycTransaction.user_basic_data_id)

    // CHANGE KYC STATUS
    let percent = 0
    if (status_code === statusCode.APPROVED) {
      percent = await calculateEkycLevel(kycTransaction)
    }
    const updateStatus = await ekycRepository.updateEkycStatus(
      {
        kyc_id: kyc_id,
        kyc_face_id: kyc_face_id,
        user_basic_data_id: kycTransaction.user_basic_data_id,
        user_personal_id: kycTransaction.user_personal_id,
        site_id: user.site_id,
      },
      {
        staff_id: staff_id,
        status_code: status_code,
        percent: percent,
        status_label_message: status_label_message,
        status_label_number: status_label_number,
      },
    )

    if (updateStatus.status === false && updateStatus.message === message.kyc_process_duplicate_error) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.CHANGE_EKYC_STATUS.DUPLICATE_ERROR_WHEN_UPDATE])
    }

    // CREATE OPERATION HISTORY
    const ipAddress = event.requestContext.identity.sourceIp
    const deviceBrowser = event.headers['User-Agent']

    await createOperationHistory(
      user.id,
      user.site_id,
      category.IDENTITY_VERIFICATION,
      contentUpdate.CHANGE_DOCUMENT_STATUS,
      utility.renderStatusHistory(kycTransaction.status_code),
      utility.renderStatusHistory(status_code),
      ipAddress,
      deviceBrowser,
      staff_id,
      renderHistoryTarget(kycTransaction.authentication_type),
    )

    // SEND MAIL CHANGE KYC STATUS TO REJECT
    if (status_code === statusCode.REJECTED && is_send_mail === flag.TRUE) {
      const getReason = await statusMasterRepository.getStatusMaster({
        status_code: statusCode.REJECTED,
        status_label_number: status_label_number,
      })
      const customReasonObject = {
        ja_short_reason: getReason[0].ja_name,
        en_short_reason: getReason[0].en_name,
        cn_short_reason: getReason[0].cn_name,
        kr_short_reason: getReason[0].kr_name,
        ja_reason: getReason[0].ja_status_label_detail,
        en_reason: getReason[0].en_status_label_detail,
        cn_reason: getReason[0].cn_status_label_detail,
        kr_reason: getReason[0].kr_status_label_detail,
      }

      const kycDocumentMaster = {
        ja_document_name: kycTransaction.ja_document_name,
        en_document_name: kycTransaction.en_document_name,
        cn_document_name: kycTransaction.cn_document_name,
        kr_document_name: kycTransaction.kr_document_name,
        photo_type: kycTransaction.photo_type,
      }

      await sendMailChangeDocStt(
        user,
        kycDocumentMaster,
        customReasonObject,
        status_label_message,
        staff_id,
      )
    }

    return utility.createResponse(true)
  } catch (error) {
    console.error(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const calculateEkycLevel = async (kycTransaction) => {
  const { user_basic_data_id, authentication_type, document_type, flow } = kycTransaction
  const user = await usersBasicDataRepository.getUserInfo(user_basic_data_id)
  const personals = await usersPersonalRepository.getPersonals({ user_basic_data_id: user_basic_data_id })
  const corporates = await usersCorporateRepository.getCorporates({ user_basic_data_id: user_basic_data_id })

  let find
  if (user.site_id === commonSiteId.FXT) {
    find = fxonPersonal.find(
      (el) =>
        el.reg_category === user.reg_category &&
          el.numbers_of_personal === personals.length &&
          el.numbers_of_company === corporates.length &&
          el.authentication_type.includes(authentication_type),
    )
  } else if (user.site_id === commonSiteId.ICPAY) {
    if (flow === ekycFlow.FLOW_C) {
      find = icpayPersonalMNC.find((el) =>
        el.reg_category === user.reg_category &&
          el.is_iden_c === (document_type === ekycDocumentType.Identification_C) &&
          el.numbers_of_personal === personals.length &&
          el.numbers_of_company === corporates.length &&
          el.authentication_type.includes(authentication_type),
      )
    } else {
      find = icpayPersonalPoA.find((el) =>
        el.reg_category === user.reg_category &&
          el.numbers_of_personal === personals.length &&
          el.numbers_of_company === corporates.length &&
          el.authentication_type.includes(authentication_type),
      )
    }
  } else if (user.site_id === commonSiteId.MY_FOREX && authentication_type === ekycAuthenticationType.Identification_Auth) {
    find = myForexPersonal
  } else if (user.site_id === commonSiteId.FXS_XEM) {
    find = fxsignupPersonal.find((el) =>
      el.reg_category === user.reg_category &&
      el.numbers_of_personal === personals.length &&
      el.numbers_of_company === corporates.length &&
      el.authentication_type.includes(authentication_type),
    )
  }
  return find ? find.percent : 0
}

const sendMailChangeDocStt = async (userData, kycDocumentMaster, reasonData, adminUpdateReason, staff_id) =>{
  try {
    const { email, site_id, first_name_romaji, last_name_romaji, language_email, language_portal, reg_category } = userData

    const mailLang = language_email ? language_email : 'en'
    const portalLang = language_portal ? language_portal : 'en'
    const short_reason = reasonData[`${mailLang}_short_reason`]
    const regCategory = reg_category === flag.TRUE ? 'company' : 'personal'

    const long_reason = adminUpdateReason !== null ? adminUpdateReason :
      reasonData[`${mailLang}_reason`]
        .replace(/{{document_name}}/g, kycDocumentMaster[`${mailLang}_document_name`])
        .replace(/{{photo_type}}/g, kycDocumentMaster['photo_type'])

    switch (site_id) {
      case commonSiteId.MY_FOREX:
      {
        const userName = `${first_name_romaji} ${last_name_romaji}`
        // get template email
        const emailTemplateUrl = await emailDetailContentRepository.getTemplateSendEmailById(emailDetailContentId.EMAIL_DOCUMENT_DEFICIENCY_MF)
        // email body
        emailTemplateUrl.subject = `${emailTemplateUrl[`${mailLang}_subject`]}`
          .replace(/{{document_name}}/g, kycDocumentMaster[`${mailLang}_document_name`])
        const emailParameters = {
          user_name: userName.toUpperCase(),
          url_ekyc: `${process.env.URL_FE_MYFOREX}/setting/kyc/?lang=${portalLang}`,
          url_login: `${process.env.WF_DOMAIN_MYFOREX}/access.php?id=login`,
          short_reason: short_reason,
          long_reason: long_reason.replace(/ /g, '&nbsp;'),
        }
        const html = utility.renderEmail(emailParameters, emailTemplateUrl, mailLang)
        const responseSendMail = await mailer.sendMailMyForex(email, emailTemplateUrl.subject, '', html, emailTemplateUrl)
        if (responseSendMail) {
          await emailHistoryRepository.createEmailHistory({
            ...responseSendMail,
            email_detail_content_id: emailTemplateUrl.id,
            user_basic_data_id: userData.id,
          })
        }
        break
      }
      case commonSiteId.ICPAY:
      {
        const userName = `${first_name_romaji} ${last_name_romaji}`
        // get template email
        const emailTemplateUrl = await emailDetailContentRepository.getTemplateSendEmailById(emailDetailContentId.EMAIL_DOCUMENT_DEFICIENCY_ICPAY)
        // email body
        emailTemplateUrl.subject = `${emailTemplateUrl[`${mailLang}_subject`]}`
          .replace(/{{document_name}}/g, kycDocumentMaster[`${mailLang}_document_name`])
        const emailParameters = {
          user_name: userName.toUpperCase(),
          url_ekyc: `${process.env.URL_FE_ICPAY}/kyc/${regCategory}/?lang=${portalLang}`,
          url_login: `${process.env.URL_FE_ICPAY}/login/?lang=${portalLang}`,
          short_reason: short_reason,
          long_reason: long_reason.replace(/ /g, '&nbsp;'),
        }
        const html = utility.renderEmail(emailParameters, emailTemplateUrl, mailLang)
        const responseSendMail = await mailer.sendMailICPAY(email, emailTemplateUrl.subject, '', html, emailTemplateUrl)
        if (responseSendMail) {
          await emailHistoryRepository.createEmailHistory({
            ...responseSendMail,
            email_detail_content_id: emailTemplateUrl.id,
            user_basic_data_id: userData.id,
          })
        }
        break
      }
      case commonSiteId.FXT:
      {
        const userName = `${first_name_romaji} ${last_name_romaji}`
        // get template email
        const emailTemplateUrl = await emailDetailContentRepository.getTemplateSendEmailById(emailDetailContentId.EMAIL_DOCUMENT_DEFICIENCY)
        // email body
        emailTemplateUrl.subject = `${emailTemplateUrl[`${mailLang}_subject`]}`
          .replace(/{{document_name}}/g, kycDocumentMaster[`${mailLang}_document_name`])
        const emailParameters = {
          user_name: userName.toUpperCase(),
          link_path: `${process.env.URL_FE_FXT}/kyc/${regCategory}/?lang=${portalLang}`,
          url_login: `${process.env.URL_FE_FXT}/login/?lang=${portalLang}`,
          short_reason: short_reason,
          long_reason: long_reason.replace(/ /g, '&nbsp;'),
        }
        const html = utility.renderEmail(emailParameters, emailTemplateUrl, mailLang)
        const responseSendMail = await mailer.sendMailFXT(email, emailTemplateUrl.subject, '', html, emailTemplateUrl)
        if (responseSendMail) {
          await emailHistoryRepository.createEmailHistory({
            ...responseSendMail,
            email_detail_content_id: emailTemplateUrl.id,
            user_basic_data_id: userData.id,
            send_by_admin_id: staff_id,
          })
        }
        break
      }
      default:
        break
    }
  } catch (error) {
    console.log(error)
  }
}

const renderHistoryTarget = (authenticationType) => {
  switch (authenticationType) {
    case ekycAuthenticationType.Identification_Auth:
      return 'trans.identification_auth'
    case ekycAuthenticationType.MNC_Auth:
      return 'trans.mnc_auth'
    case ekycAuthenticationType.PoA_Auth:
      return 'trans.poa_auth'
    default:
      return ''
  }
}

const validateStatusField = async (currentStatus, newStatus, kycId) =>{
  currentStatus = parseInt(currentStatus)
  newStatus = parseInt(newStatus)
  switch (currentStatus) {
    case statusCode.REQUIRED:
      return newStatus === statusCode.PROCESSING
    case statusCode.PROCESSING:
      const kycEvaluation = await ekycRepository.getKycProcess({ id: kycId })

      const unableChangeToApprove = newStatus === statusCode.APPROVED &&
        (!verifiedAllBlock(kycEvaluation) || kycEvaluation.step_check !== kycProcessStep.STEP_TRIMMING)

      const unableChangeRejectClosed = [statusCode.CLOSED, statusCode.REJECTED].includes(newStatus) &&
        (verifiedAllBlock(kycEvaluation) || kycEvaluation.step_check !== kycProcessStep.STEP_TRIMMING)

      if (unableChangeToApprove || unableChangeRejectClosed) return false

      return [statusCode.APPROVED, statusCode.CLOSED, statusCode.REJECTED].includes(newStatus)
    case statusCode.APPROVED:
      return [statusCode.CLOSED, statusCode.REJECTED].includes(newStatus)
    case statusCode.REJECTED:
      return false
    case statusCode.CLOSED:
      return false
    case statusCode.EXPIRED:
      return false
    case statusCode.UNSUBMITTED:
      return false
    default:
      return false
  }
}

module.exports = {
  changeEkycStatus,
}
