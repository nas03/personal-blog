/* func */
const utility = require('utility')

/* constant */
const { commonSiteId, language, envCommon, errorMessageCodeConstant, statusCode } = require('constant')

/* helper */
const { mailer } = require('helper')

/* db */
const {
  emailHistoryRepository,
  emailDetailContentRepository,
  errorLogRepository,
  usersBasicDataRepository,
} = require('repository')

module.exports.sendMail = async (event) => {
  try {
    const eventBody = JSON.parse(event.body)
    const { emailDetailContentId, emailTo, subject, content, userBasicDataId } = eventBody
    const sendByAdminId = utility.getUserIdByToken(event)

    const user = await usersBasicDataRepository.getUserInfoSendMail(userBasicDataId)
    if (!user || user.account_status_code === statusCode.CLOSED) {
      return await errorLogRepository.createResponseAndLog(
        event,
        null,
        null,
        [errorMessageCodeConstant.SEND_MAIL.ACCOUNT_CLOSED],
      )
    }
    // get site id
    const emailTemplate = await emailDetailContentRepository.getTemplateSendEmailById(emailDetailContentId)

    let responseSendMail = null

    // send mail
    switch (emailTemplate.site_id) {
      case commonSiteId.MY_FOREX:
        responseSendMail = await mailer.sendMailMyForex(emailTo, subject, '', content, emailTemplate)
        if (responseSendMail.isError) {
          return await errorLogRepository.createResponseAndLog(event, responseSendMail, null,
            [errorMessageCodeConstant.SEND_MAIL.SEND_MAIL_ERROR_MY_FOREX])
        }
        break
      case commonSiteId.ICPAY:
        responseSendMail = await mailer.sendMailICPAY(emailTo, subject, '', content, emailTemplate)
        if (responseSendMail.isError) {
          return await errorLogRepository.createResponseAndLog(event, responseSendMail, null,
            [errorMessageCodeConstant.SEND_MAIL.SEND_MAIL_ERROR_ICPAY])
        }
        break
      case commonSiteId.FXT:
        responseSendMail = await mailer.sendMailFXT(emailTo, subject, '', content, emailTemplate)
        if (responseSendMail.isError) {
          return await errorLogRepository.createResponseAndLog(event, responseSendMail, null,
            [errorMessageCodeConstant.SEND_MAIL.SEND_MAIL_ERROR_FXT])
        }
        break
      case commonSiteId.FXS_XEM:
        responseSendMail = await mailer.sendMailFXSignupXEM(emailTo, subject, '', content, emailTemplate)
        if (responseSendMail.isError) {
          return await errorLogRepository.createResponseAndLog(event, responseSendMail, null,
            [errorMessageCodeConstant.SEND_MAIL.SEND_MAIL_ERROR_FXS_XEM])
        }
        break
      default:
        return utility.createResponse(true)
    }
    const payload = {
      ...responseSendMail,
      email_detail_content_id: emailDetailContentId,
      user_basic_data_id: userBasicDataId,
      send_by_admin_id: sendByAdminId,
    }

    // insert email history
    await emailHistoryRepository.createEmailHistory(payload)

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports.getTemplateSendEmailById = async (event) => {
  try {
    const id = event.pathParameters.id

    // get template send email
    const templateSendEmail = await emailDetailContentRepository.getTemplateSendEmailById(id)

    Object.values(language).forEach((lang) => {
      templateSendEmail.subject = templateSendEmail[`${lang}_subject`]
      templateSendEmail[`${lang}_html_body`] = utility.renderEmail({}, templateSendEmail, lang)
    })

    // Get email config
    const configEmail = await mailer._getEnvConfig([
      envCommon.EMAIL,
      envCommon.EMAIL_BCC,
    ], templateSendEmail.site_id, templateSendEmail)

    templateSendEmail.env_email_from_setting = configEmail[envCommon.EMAIL] || null
    templateSendEmail.env_email_bcc_setting = configEmail[envCommon.EMAIL_BCC] || null

    return utility.createResponse(true, templateSendEmail)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}
