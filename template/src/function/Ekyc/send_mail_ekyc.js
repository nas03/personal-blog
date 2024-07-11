// UTILITY
const { createResponse, verifyToken } = require('utility')

// CONSTANT
const {
  message,
  commonSiteId,
  statusCode,
  category,
  contentUpdate,
  flag,
  splitContentUpdate,
  typeData,
  statusClassConstant,
  actionMethod,
  messageId,
  emailDetailContentId, errorMessageCodeConstant,
  code,
} = require('constant')

/* FUNCTION */
const utility = require('utility')
const moment = require('moment')

// HELPER
const { mailer } = require('helper')

// LODASH
const _ = require('lodash')

// REPOSITORY
const {
  usersBasicDataRepository,
  errorLogRepository,
  ekycRepository,
  operationHistoryRepository,
  statusHistoryRepository,
  userMessageRepository,
  usersPersonalRepository,
  emailHistoryRepository,
  emailDetailContentRepository,
} = require('repository')


const sendMailAcceptEkyc = async (event) => {
  try {
    const { accessToken } = JSON.parse(event.body)
    const verify = verifyToken(accessToken)

    // VERIFY TOKEN
    if (!verify.status) {
      console.log(message.access_token_invalid)
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.SEND_MAIL_EKYC.ACCESS_TOKEN_INVALID], null, code.AUTHORIZATION)
    }

    const { user_id, personal_id } = verify.data
    event.user_id = user_id
    const userInfo = await usersBasicDataRepository.getUserInfoSendMail(user_id)

    // Insert Message For Related Personal
    const insertPersonalMessage = await createKycCheckingMessageForPersonal(user_id, personal_id, userInfo.site_id)
    if (insertPersonalMessage) console.log('Inserted related personal message')

    const isCompleteEkyc = await ekycRepository.checkCompleteKycByStatus(
      user_id,
      null,
      [statusCode.REQUIRED, statusCode.PROCESSING, statusCode.APPROVED],
    )

    if (isCompleteEkyc) {
    // Insert Message For User
      const insertUserMessage = await createKycCheckingMessageForUser(user_id, userInfo.site_id)
      if (insertUserMessage) console.log('Inserted user message')

      if (!['stg', 'prod'].includes(process.env.NODE_ENV?.toLowerCase())) {
        if (userInfo.site_id === commonSiteId.MY_FOREX && userInfo.account_status_code === statusCode.ACTIVATED ) {
          const operationHistory = {
            id: utility.renderRandomId(),
            user_basic_data_id: user_id,
            site_id: commonSiteId.MY_FOREX,
            category_id: category.IDENTITY_VERIFICATION,
            content: contentUpdate.CHANGE_ACCOUNT_STATUS,
            before_update: `${statusCode.ACTIVATED}${splitContentUpdate}${typeData.STATUS}`,
            after_update: `${statusCode.REQUIRED}${splitContentUpdate}${typeData.STATUS}`,
            ip_address: '-',
            access_country: '-',
            device_browser: '-',
            admin_flag: flag.TRUE,
          }

          const payloadStatusHistory = {
            target_id: user_id,
            status_code: statusCode.REQUIRED,
            status_class_id: statusClassConstant.ACCOUNT_STATUS,
            action_method: actionMethod.USER_ACTION,
            updated_by_user_id: user_id,
          }

          await Promise.all([
            operationHistoryRepository.createOperationHistory(operationHistory),
            statusHistoryRepository.insertStatusHistory(payloadStatusHistory),
          ])
        }
      }
    }

    // SEND MAIL ACCEPT KYC DOCUMENT
    const siteId = userInfo.site_id
    const mailLang = userInfo.language_email ? userInfo.language_email : 'en'
    const to = userInfo.email
    const userName = `${userInfo.first_name_romaji} ${userInfo.last_name_romaji}`
    switch (siteId) {
      case commonSiteId.MY_FOREX:
      {
        // get template email
        const emailTemplateUrl = await emailDetailContentRepository.getTemplateSendEmailById(emailDetailContentId.EMAIL_ACCEPT_EKYC_MF)

        // email body
        emailTemplateUrl.subject = emailTemplateUrl[`${mailLang}_subject`]

        const emailParameters = {
          user_name: userName.toUpperCase(),
        }

        const html = utility.renderEmail(emailParameters, emailTemplateUrl, mailLang)

        const responseSendMail = await mailer.sendMailMyForex(to, emailTemplateUrl.subject, '', html, emailTemplateUrl)
        if (!responseSendMail.isError) {
          await emailHistoryRepository.createEmailHistory({
            ...responseSendMail,
            email_detail_content_id: emailTemplateUrl.id,
            user_basic_data_id: user_id,
          })
        }
        break
      }
      case commonSiteId.ICPAY:
      {
        // get template email
        const emailTemplateUrl = await emailDetailContentRepository.getTemplateSendEmailById(emailDetailContentId.EMAIL_ACCEPT_EKYC_ICPAY)

        // email body
        emailTemplateUrl.subject = emailTemplateUrl[`${mailLang}_subject`]

        const emailParameters = {
          user_name: userName.toUpperCase(),
        }

        const html = utility.renderEmail(emailParameters, emailTemplateUrl, mailLang)
        const responseSendMail = await mailer.sendMailICPAY(to, emailTemplateUrl.subject, '', html, emailTemplateUrl)
        if (!responseSendMail.isError) {
          await emailHistoryRepository.createEmailHistory({
            ...responseSendMail,
            email_detail_content_id: emailTemplateUrl.id,
            user_basic_data_id: user_id,
          })
        }
        break
      }
      case commonSiteId.FXT:
      {
        // get template email
        const emailTemplateUrl = await emailDetailContentRepository.getTemplateSendEmailById(emailDetailContentId.EMAIL_ACCEPT_EKYC)
        // email body
        emailTemplateUrl.subject = emailTemplateUrl[`${mailLang}_subject`]
        const emailParameters = {
          user_name: userName.toUpperCase(),
        }
        const html = utility.renderEmail(emailParameters, emailTemplateUrl, mailLang)
        const responseSendMail = await mailer.sendMailFXT(to, emailTemplateUrl.subject, '', html, emailTemplateUrl)
        if (!responseSendMail.isError) {
          await emailHistoryRepository.createEmailHistory({
            ...responseSendMail,
            email_detail_content_id: emailTemplateUrl.id,
            user_basic_data_id: user_id,
          })
        }
        break
      }
      case commonSiteId.FXS_XEM:
      {
        // get template email
        const emailTemplateUrl = await emailDetailContentRepository.getTemplateSendEmailById(emailDetailContentId.EMAIL_ACCEPT_EKYC_XEM)
        // GET HEADER, FOOTER, CONTENT
        const subject = emailTemplateUrl[`${mailLang}_subject`]

        const footerParameters = {
          current_year: moment.utc().format('YYYY'),
        }

        const containerParameters = {
          header: emailTemplateUrl[`${mailLang}_header`],
          footer: emailTemplateUrl[`${mailLang}_footer`]?.replace(/{{(.*?)}}/g, (match, key) => footerParameters[key] || match),
          content: emailTemplateUrl[`${mailLang}_content`],
        }

        // RENDER TEMPLATE
        const html = emailTemplateUrl[`${mailLang}_container`]?.replace(/{{(.*?)}}/g,
          (match, key) => _.isNil(containerParameters[key]) ? match : containerParameters[key])

        // SEND MAIL
        const responseSendMail = await mailer.sendMailFXSignupXEM(to, subject, '', html, emailTemplateUrl)
        if (!responseSendMail.isError) {
          await emailHistoryRepository.createEmailHistory({
            ...responseSendMail,
            email_detail_content_id: emailTemplateUrl.id,
            user_basic_data_id: user_id,
          })
        }
        break
      }
      default:
        break
    }

    return createResponse(true)
  } catch (error) {
    console.log(error.message)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const createKycCheckingMessageForUser = async (userId, siteId) => {
  try {
    const messageId = _renderKycMessageId(siteId)
    const payloadInsertUserMessage = {
      user_basic_data_id: userId,
      user_personal_id: null,
      message_id: messageId,
    }

    await userMessageRepository.createUserBasicDataMessage(payloadInsertUserMessage)
    return true
  } catch (error) {
    console.log(error)
    return false
  }
}

const createKycCheckingMessageForPersonal = async (userId, personalId, siteId) =>{
  try {
    const relatedPerson = await usersPersonalRepository.getRelatePerson(userId)
    // CHECK RELATED PERSONAL
    const relatedPersonIds = relatedPerson.map((el) => el.id)
    if (!relatedPersonIds.includes(Number(personalId))) return false

    const isCompleted = await ekycRepository.checkCompleteKycByStatus(
      userId,
      personalId,
      [statusCode.REQUIRED, statusCode.PROCESSING, statusCode.APPROVED],
    )
    if (!isCompleted) return false

    const messageId = _renderKycMessageId(siteId)
    const payloadInsertUserMessage = {
      user_basic_data_id: userId,
      user_personal_id: personalId,
      message_id: messageId,
    }

    await userMessageRepository.createUserBasicDataMessage(payloadInsertUserMessage)
    return true
  } catch (error) {
    console.log(error)
    return false
  }
}

const _renderKycMessageId = (site_id) =>{
  switch (site_id) {
    case commonSiteId.FXT:
      return messageId.FXT.EKYC_CHECKING
    case commonSiteId.MY_FOREX:
      return messageId.MY_FOREX.EKYC_CHECKING
    case commonSiteId.ICPAY:
      return messageId.ICPAY.EKYC_CHECKING
    default:
      return null
  }
}

module.exports = {
  sendMailAcceptEkyc,
}
