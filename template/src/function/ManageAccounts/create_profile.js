/* func */
const utility = require('utility')
const passwordHash = require('password-hash')
const { checkPasswordStrength } = require('../Users/security_user_setting')
const { createAccessHistory } = require('../History/user_access_history')

/* db */
const { errorLogRepository, usersBasicDataRepository, usersPortalDataRepository, tokenAuthorityRepository } = require('repository')

/* constant */
const { language, flag, twoFactorAuthentication, statusClassConstant, actionMethod,
  displayDateTime, passwordStrength, statusCode, commonSiteId, tokenAuthorityClass, errorMessageCodeConstant } = require('constant')

const createProfileByActivationKey = async (event) => {
  try {
    const { activation_key } = event.pathParameters || {}
    const body = JSON.parse(event.body)

    if (!activation_key) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // VERIFY ACTIVATION KEY
    const verify = await tokenAuthorityRepository.verifyTokenAuthority({
      site_id: commonSiteId.P2TECH,
      action_class: tokenAuthorityClass.CREATE_ACCOUNT,
      activation_key: activation_key,
    })
    if (!verify) {
      return await errorLogRepository.createResponseAndLog(
        event,
        null,
        null,
        [errorMessageCodeConstant.CREATE_PROFILE_BY_ACTIVATION_KEY.EXPIRED_LINK_INVITE.VERIFY_FAIL],
      )
    }

    // GET STAFF INFO
    const staffData = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': verify.target_id })
    if (!staffData || staffData.account_status_code !== statusCode.ACTIVATED) {
      return await errorLogRepository.createResponseAndLog(
        event,
        null,
        null,
        [errorMessageCodeConstant.CREATE_PROFILE_BY_ACTIVATION_KEY.EXPIRED_LINK_INVITE.ACCOUNT_STATUS],
      )
    }

    // VALIDATE REQUIRED
    const fieldRequire = utility.checkFieldRequired(body, [
      'first_name_romaji',
      'last_name_romaji',
      'phone_number_country_id',
      'phone_number',
      'password',
      'twofa_flag',
      'twofa_method_class',
      'google_sso_flag',
      'login_notify_flag',
      'language_portal',
      'language_email',
      'display_time_zone',
      'display_date_time',
    ])
    if (!fieldRequire) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // VALIDATE FORMAT
    if (
      checkPasswordStrength(body.password) === passwordStrength.LOW ||
      body.password.length < 12 ||
      body.password.length > 255 ||
      !Object.values(language).includes(body.language_portal) ||
      !Object.values(language).includes(body.language_email) ||
      !Object.values(flag).includes(body.twofa_flag) ||
      ![twoFactorAuthentication.EMAIL, twoFactorAuthentication.SMS, twoFactorAuthentication.PASSWORD].includes(body.twofa_method_class) ||
      !Object.values(flag).includes(body.google_sso_flag) ||
      !Object.values(flag).includes(body.login_notify_flag) ||
      !Object.values(displayDateTime).includes(body.display_date_time) ||
      !(typeof body.display_time_zone === 'number')
    ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // INIT USER_BASIC_DATA
    const payloadUserBasicData = {
      hash_password: passwordHash.generate(body.password, { algorithm: 'sha256' }),
      first_name_romaji: body.first_name_romaji,
      last_name_romaji: body.last_name_romaji,
      phone_number_country_id: body.phone_number_country_id,
      phone_number: body.phone_number,
    }
    const payloadUserPortalData = {
      user_basic_data_id: staffData.id,
      profile_picture_url: body.profile_picture_url || null,
      profile_picture_color: utility.colorRandom(),
      twofa_flag: body.twofa_flag,
      twofa_method_class: body.twofa_method_class,
      google_sso_flag: body.google_sso_flag,
      login_notify_flag: body.login_notify_flag,
      language_portal: body.language_portal,
      language_email: body.language_email,
      display_date_time: body.display_date_time,
      display_time_zone_id: body.display_time_zone,
    }
    const payloadHistory = {
      target_id: staffData.id,
      status_code: statusCode.APPROVED,
      status_class_id: statusClassConstant.ACCOUNT_STATUS,
      action_method: actionMethod.OPERATOR_ACTION,
      updated_by_user_id: staffData.id,
    }

    await usersPortalDataRepository.updateStaffProfile(
      staffData.id,
      payloadUserBasicData,
      payloadUserPortalData,
      payloadHistory,
    )

    // DELETE TOKEN AUTHORITY
    await tokenAuthorityRepository.deleteTokenAuthority(verify.id)

    // CREATE ACCESS HISTORY
    const directIpAddress = event.requestContext.identity.sourceIp
    const directUserAgent = {
      userAgent: event.headers['User-Agent'],
      mobileDeviceType: event.headers.access_device_type,
      mobileDeviceName: event.headers.access_device_name,
    }
    await createAccessHistory(directIpAddress, directUserAgent, 1, null, staffData.id)

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  createProfileByActivationKey,
}
