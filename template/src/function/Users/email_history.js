/* func */
const utility = require('utility')

/* constant */
const { envCommon, errorMessageCodeConstant } = require('constant')

/* helper */
const { mailer } = require('helper')

/* db */
const {
  emailHistoryRepository,
  emailDetailContentRepository,
  errorLogRepository,
} = require('repository')


module.exports.getEmailHistoryById = async (event) => {
  try {
    const id = event.pathParameters.id

    // Get Email History By Id
    const emailDetail = await emailHistoryRepository.getEmailHistoryById(id)

    // Get email config
    const configEmail = await mailer._getEnvConfig([
      envCommon.EMAIL,
      envCommon.EMAIL_BCC,
    ], emailDetail.site_id, emailDetail)

    delete emailDetail.site_id

    emailDetail.env_email_from_setting = configEmail[envCommon.EMAIL] || null
    emailDetail.env_email_bcc_setting = configEmail[envCommon.EMAIL_BCC] || null

    return utility.createResponse(true, emailDetail)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports.getTemplateNameEmailDropdown = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}
    const siteId = queryString.siteId
    // get list template dropdown
    const listEmailHistory = await emailDetailContentRepository.getTemplateNameEmailDropdown(siteId)

    return utility.createResponse(true, listEmailHistory)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}
