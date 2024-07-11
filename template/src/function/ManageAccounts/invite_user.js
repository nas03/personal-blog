'use strict'

/* library */
const _ = require('lodash')
const { createResponse, getUserIdByToken, generateMemberId, getMultilingualism, createAuthorizationKey, checkValidIP } = require('utility')

/* repository */
const { errorLogRepository, authorizationRepository, siteRepository, usersBasicDataRepository } = require('repository')

/* constant */
const { userBasicClass, statusCode, commonSiteId, tokenAuthorityClass, flag, authorizationName, classiFication,
  actionMethod, statusClassConstant, errorMessageCodeConstant, accessTypeGeneralAccessList, listTypeGeneralAccessList } = require('constant')

const defaultLang = 'ja'

/* helper */
const { regex, mailer, template } = require('helper')

const inviteUser = async (event) => {
  try {
    const user_id = getUserIdByToken(event)
    const { email, authorization_id, site_ids, twofa_required_flag,
      google_sso_required_flag, deny_list, allow_list } = JSON.parse(event.body)

    // VALIDATE REQUIRED
    if (!email || !authorization_id || !site_ids || _.isNil(twofa_required_flag) || _.isNil(!google_sso_required_flag)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // CHECK EXISTS M_AUTHORIZATION ID
    const isExistedAuth = await authorizationRepository.checkIdExist(authorization_id)

    // CHECK CHECKED ALL M_SITE ID
    const listSite = await siteRepository.getAllSites()
    let isNotExistedSites = false
    let siteMapIds = []
    if (authorization_id === authorizationName.SYSTEM_ADMINISTRATOR) {
      siteMapIds = listSite.map((item) => item.code)
      isNotExistedSites = !_.isEqual(siteMapIds.sort(), site_ids.sort())
    } else {
      siteMapIds = listSite.filter( (item) => item.enable_flag !== flag.FALSE )
      siteMapIds = _.keyBy(siteMapIds, 'code')
      isNotExistedSites = _.some(site_ids, (id) => !siteMapIds[id])
    }

    // VALIDATE_FORMAT
    if (!regex.emailValidator(email) ||
      isNaN(authorization_id) ||
      !isExistedAuth.length ||
      !_.isArray(site_ids) ||
      _.some(site_ids, isNaN) ||
      isNotExistedSites ||
      ![0, 1].includes(twofa_required_flag) ||
      ![0, 1].includes(google_sso_required_flag)
    ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // CHECK LIST IP
    const isCheckIP = checkValidIP(allow_list, deny_list)

    if (!isCheckIP) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // CHECK MAIL EXIST
    const isExist = await usersBasicDataRepository.checkMailExitsInSystem(email)
    if (isExist) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.INVITE_USER.EMAIL_EXIST_IN_SYSTEM])
    }

    const { key, expiresIn } = createAuthorizationKey(48, 'hours')

    // INIT USER_BASIC_DATA
    const payloadCreateAdmin = {
      email,
      authorization_id,
      admin_with_site_id: _.sortBy(site_ids).join(','),
      twofa_required_flag,
      google_sso_required_flag,
      admin_flag: userBasicClass.ADMIN,
      site_id: commonSiteId.P2TECH,
      member_id: generateMemberId(),
    }

    // INIT TOKEN AUTHORITY
    const payloadCreateAuth = {
      site_id: commonSiteId.P2TECH,
      action_class: tokenAuthorityClass.CREATE_ACCOUNT,
      activation_key: key,
      activation_key_expire_datetime: expiresIn,
    }

    // INIT TOKEN AUTHORITY
    const payloadHistory = {
      status_code: statusCode.REGISTERED,
      status_class_id: statusClassConstant.ACCOUNT_STATUS,
      action_method: actionMethod.OPERATOR_ACTION,
      updated_by_user_id: user_id,
    }

    // INIT PAYLOAD IP LIST
    const payloadIPList = []
    if (allow_list) {
      payloadIPList.push({
        list_classification: classiFication.ALLOW_LIST,
        active_flag: flag.TRUE,
        target: allow_list,
        site_id: commonSiteId.P2TECH,
        access_type: accessTypeGeneralAccessList.IP,
        list_type: listTypeGeneralAccessList.ALL_SCREEN,
      })
    }

    if (deny_list) {
      payloadIPList.push({
        list_classification: classiFication.DENY_LIST,
        active_flag: flag.TRUE,
        target: deny_list,
        site_id: commonSiteId.P2TECH,
        access_type: accessTypeGeneralAccessList.IP,
        list_type: listTypeGeneralAccessList.ALL_SCREEN,
      })
    }

    // INSERT DB
    await usersBasicDataRepository.createAdmin(payloadCreateAdmin, payloadCreateAuth, payloadHistory,
      payloadIPList)

    // SEND MAIL
    const responseMail = await sendInviteUserMail(user_id, email, key)
    if (responseMail.isError) {
      return await errorLogRepository.createResponseAndLog(event, responseMail, null, [errorMessageCodeConstant.INVITE_USER.SEND_MAIL_ERROR])
    }

    return createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const sendInviteUserMail = async (user_id, email, activation_key) => {
  const staffInfo = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': user_id })
  const typeLang = staffInfo.language_email || defaultLang
  // TEMPLATE MAIL
  const lang = await getMultilingualism(process.env.LOCALES_SOURCE, typeLang)
  const to = email
  const invitationLang = lang.email.invite_user
  const title = [invitationLang.title]
  const tableTitle = invitationLang.table_title
  const content = {
    type: 'link',
    data: `${process.env.URL_FE}/one-time-path/?invitationKey=${activation_key}&lang=${typeLang}`,
  }
  const footer = [
    invitationLang.footer,
  ]
  const html = template.templateP2T(lang.email.common, typeLang, email, title, tableTitle, content, footer, null)
  // SEND MAIL
  return await mailer.sendMail(to, invitationLang.subject, '', html)
}

const checkEmailExists = async (event) => {
  try {
    const { email } = JSON.parse(event.body)
    const isExits = await usersBasicDataRepository.checkMailExitsInSystem(email)
    if (isExits) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.CHECK_EMAIL_EXISTS.EMAIL_EXIST_IN_SYSTEM])
    }
    return createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  inviteUser,
  sendInviteUserMail,
  checkEmailExists,
}
