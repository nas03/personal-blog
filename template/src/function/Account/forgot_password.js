// library
const passwordHash = require('password-hash')

// func && const
const { createResponse, createAuthorizationKey, getMultilingualism } = require('utility')
const { message, statusCode, commonSiteId, tokenAuthorityClass, errorMessageCodeConstant } = require('constant')
const { usersBasicDataRepository, errorLogRepository, tokenAuthorityRepository } = require('repository')
const { mailer, template } = require('helper')
const { createAccessToken } = require('./login')
const defaultLang = 'ja'

const redirectForgotPassword = async (event) => {
  try {
    const { email } = JSON.parse(event.body)
    // GET STAFF INFO
    const userBasicData = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.email': email })
    if (!userBasicData) {
      return createResponse(true)
    }

    // EMAIL NOT ACTIVATED
    if (userBasicData.account_status_code !== statusCode.APPROVED) {
      return createResponse(true)
    }

    const { key, expiresIn } = createAuthorizationKey(30, 'minute')

    // CREATE TOKEN AUTHORITY
    await tokenAuthorityRepository.createTokenAuthority({
      target_id: userBasicData.id,
      site_id: commonSiteId.P2TECH,
      action_class: tokenAuthorityClass.RESET_PASSWORD,
      activation_key: key,
      activation_key_expire_datetime: expiresIn,
    })

    // SEND MAIL
    const language_email = userBasicData.language_email || defaultLang
    const language_portal = userBasicData.language_portal || defaultLang
    const clientName = userBasicData.first_name_romaji + ' ' + userBasicData.last_name_romaji
    const to = email
    const lang = await getMultilingualism(process.env.LOCALES_SOURCE, language_email)
    const rsLang = lang.email.reset_password
    const title = [rsLang.title]
    const tableTitle = rsLang.table_title
    const content = {
      type: 'link',
      data: `${process.env.URL_FE}/one-time-path/?resetKey=${key}&lang=${language_portal}`,
    }
    const footer = [rsLang.footer]
    const html = template.templateP2T(lang.email.common, language_email, clientName, title, tableTitle, content, footer, null)
    const responseSendMail = await mailer.sendMail(to, rsLang.subject, '', html)
    if (responseSendMail.isError) {
      return await errorLogRepository.createResponseAndLog(event, responseSendMail, null, [errorMessageCodeConstant.FORGOT_PASSWORD.SEND_MAIL_ERROR])
    }
    return createResponse(true)
  } catch (err) {
    console.log(err)
    return await errorLogRepository.createResponseAndLog(event, err, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}
const changePasswordForgotType = async (event) => {
  try {
    const { newPassword, resetKey } = JSON.parse(event.body)

    // VERIFY ACTIVATION KEY
    const verify = await tokenAuthorityRepository.verifyTokenAuthority({
      site_id: commonSiteId.P2TECH,
      action_class: tokenAuthorityClass.RESET_PASSWORD,
      activation_key: resetKey,
    })
    if (!verify) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.RESET_PASSWORD.RESET_KEY_INVALID])
    }

    // GET STAFF INFO
    const userBasicData = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': verify.target_id })
    if (!userBasicData) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.RESET_PASSWORD.UPDATE_FAILED.USER_NOT_FOUND])
    }

    // UPDATE NEW PASSWORD
    const responseUpdated = await usersBasicDataRepository.updateUserBasicData(
      userBasicData.id,
      {
        hash_password: passwordHash.generate(newPassword, { algorithm: 'sha256' }),
      },
    )
    if (!responseUpdated) {
      return await errorLogRepository.createResponseAndLog(event, responseUpdated, null,
        [errorMessageCodeConstant.RESET_PASSWORD.UPDATE_FAILED.UPDATE_DB])
    }

    // CREATE ACCESS TOKEN
    const accessTokenResponse = await createAccessToken(event, userBasicData)
    if (!accessTokenResponse.status) {
      if (accessTokenResponse.data === message.account_is_not_active) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.RESET_PASSWORD.ACCOUNT_IS_NOT_ACTIVE])
      }

      return await errorLogRepository.createResponseAndLog(event, accessTokenResponse, null,
        [errorMessageCodeConstant.RESET_PASSWORD.UPDATE_FAILED.CREATE_TOKEN])
    }

    // DELETE TOKEN AUTHORITY
    await tokenAuthorityRepository.deleteTokenAuthority(verify.id)

    return createResponse(true, { accessToken: accessTokenResponse.data })
  } catch (err) {
    console.log(err)
    return await errorLogRepository.createResponseAndLog(event, err, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const checkURLResetPasswordValid = async (event) => {
  try {
    const eventBody = JSON.parse(event.body)
    const { resetKey } = eventBody

    // VERIFY ACTIVATION KEY
    const verify = await tokenAuthorityRepository.verifyTokenAuthority({
      site_id: commonSiteId.P2TECH,
      action_class: tokenAuthorityClass.RESET_PASSWORD,
      activation_key: resetKey,
    })
    if (!verify) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.VERIFY_URL_RESET_PASSWORD.INVALID_RESET_KEY])
    }

    // GET STAFF INFO
    const userBasicData = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': verify.target_id })
    if (!userBasicData) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.VERIFY_URL_RESET_PASSWORD.NOT_FOUND_USER_MATCH_KEY])
    }

    return createResponse(true)
  } catch (err) {
    console.log(err)
    return await errorLogRepository.createResponseAndLog(event, err, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  redirectForgotPassword,
  changePasswordForgotType,
  checkURLResetPasswordValid,
}

