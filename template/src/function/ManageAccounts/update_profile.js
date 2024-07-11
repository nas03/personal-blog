/* func */
const utility = require('utility')
const { checkPasswordStrength } = require('../Users/security_user_setting')
const passwordHash = require('password-hash')
const _ = require('lodash')

/* db */
const { errorLogRepository, usersBasicDataRepository, usersPortalDataRepository,
  timezonesRepository, siteRepository, authorizationRepository,
  generalAccessListRepository } = require('repository')

/* constant */
const { passwordStrength, flag, language, displayDateTime, statusClassConstant, actionMethod,
  twoFactorAuthentication, userBasicClass, statusCode, authorizationName, errorMessageCodeConstant,
  accessTypeGeneralAccessList, classiFication,
  listTypeGeneralAccessList,
  commonSiteId } = require('constant')

/* helper */
const { regex } = require('helper')

const updateProfile = async (event) => {
  try {
    const userBasicId = utility.getUserIdByToken(event)
    const { field_update, field_data } = JSON.parse(event.body)
    let payloadUpdate = {}
    let isUpdateUserBasicData = flag.FALSE
    let checkValid = true

    // VALIDATE REQUIRED
    const requiredFields = {
      change_name: ['first_name_romaji', 'last_name_romaji'],
      change_phone_number: ['phone_number', 'phone_number_country_id'],
      change_password: ['current_password', 'new_password'],
      change_2fa: ['twofa_flag', 'twofa_method_class'],
      change_google_soo: ['google_sso_flag', 'login_notify_flag'],
      change_display_setting_language: ['language_email', 'language_portal'],
      change_display_setting_time: ['display_time_zone', 'display_date_time'],
    }

    if (
      !field_update ||
      !Object.keys(field_data).length ||
      !requiredFields[field_update] ||
      requiredFields[field_update].some((field) =>
        field_data[field] === null || field_data[field] === undefined || field_data[field] === '')
    ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    const staffData = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': userBasicId })
    if (!staffData) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UPDATE_PROFILE.NOT_FOUND])
    }

    switch (field_update) {
      case 'change_name':
        const { first_name_romaji, last_name_romaji } = field_data
        const lengthValid = 64
        if (first_name_romaji.length > lengthValid || last_name_romaji.length > lengthValid ) {
          checkValid = false
          break
        }
        payloadUpdate = field_data
        isUpdateUserBasicData = flag.TRUE
        break

      case 'change_phone_number':
        const { phone_number, phone_number_country_id } = field_data
        if (!(typeof phone_number_country_id === 'number') || !(typeof phone_number === 'string')) {
          checkValid = false
          break
        }
        payloadUpdate = field_data
        isUpdateUserBasicData = flag.TRUE
        break

      case 'change_password':
        const { current_password, new_password } = field_data
        // VALIDATE CUR PASSWORD
        const verifyCurrentPassword = passwordHash.verify(current_password, staffData.hash_password)
        if (!verifyCurrentPassword) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UPDATE_PROFILE.INCORRECT_PASSWORD])
        }
        // VALIDATE NEW PASSWORD
        if (new_password.length < 12 || new_password.length > 255 || checkPasswordStrength(new_password) === passwordStrength.LOW) {
          checkValid = false
          break
        }
        const hash_password = passwordHash.generate(new_password, { algorithm: 'sha256' })
        payloadUpdate = { hash_password }
        isUpdateUserBasicData = flag.TRUE
        break

      case 'change_2fa':
        const { twofa_flag, twofa_method_class } = field_data
        if (
          (staffData.twofa_required_flag === flag.TRUE && twofa_flag === flag.FALSE) ||
          (staffData.twofa_required_flag === flag.FALSE && !Object.values(flag).includes(twofa_flag)) ||
          ![twoFactorAuthentication.EMAIL, twoFactorAuthentication.SMS, twoFactorAuthentication.PASSWORD].includes(twofa_method_class)) {
          checkValid = false
          break
        }
        payloadUpdate = field_data
        break

      case 'change_google_soo':
        const { google_sso_flag, login_notify_flag } = field_data
        // validate field invalid
        if (
          (staffData.google_sso_required_flag === flag.TRUE && google_sso_flag !== flag.TRUE) ||
          (staffData.google_sso_required_flag === flag.FALSE && !Object.values(flag).includes(google_sso_flag)) ||
          !Object.values(flag).includes(login_notify_flag)) {
          checkValid = false
          break
        }
        payloadUpdate = field_data
        break

      case 'change_display_setting_language':
        const { language_email, language_portal } = field_data
        if (!Object.values(language).includes(language_email) ||
          !Object.values(language).includes(language_portal)) {
          checkValid = false
          break
        }
        payloadUpdate = field_data
        break

      case 'change_display_setting_time':
        const { display_time_zone, display_date_time } = field_data
        const isExisted = await timezonesRepository.checkExistTimeZone({ id: display_time_zone })
        if (!Object.values(displayDateTime).includes(display_date_time) || !isExisted) {
          checkValid = false
          break
        }
        payloadUpdate = {
          display_time_zone_id: display_time_zone,
          display_date_time: display_date_time,
        }
        break

      default:
        checkValid = false
    }

    if (!checkValid) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    let updated
    if (isUpdateUserBasicData) {
      // UPDATE USERS_BASIC_DATA
      updated = await usersBasicDataRepository.updateUserBasicData(userBasicId, payloadUpdate)
      if (!updated) {
        return await errorLogRepository.createResponseAndLog(
          event,
          null,
          null,
          [errorMessageCodeConstant.UPDATE_PROFILE.UPDATE_FAIL.USER_BASIC_DB_FAIL],
        )
      }
    } else {
      // UPDATE USERS_PORTAL_DATA
      updated = await usersPortalDataRepository.updateUserPortalData(userBasicId, payloadUpdate)
      if (!updated) {
        return await errorLogRepository.createResponseAndLog(
          event,
          null,
          null,
          [errorMessageCodeConstant.UPDATE_PROFILE.UPDATE_FAIL.USER_PORTAL_DB_FAIL],
        )
      }
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const updateProfileByStaffId = async (event) => {
  try {
    const userBasicId = event.pathParameters.staff_id
    const adminBasicId = utility.getUserIdByToken(event)
    const { field_update, field_data } = JSON.parse(event.body)
    let payloadUpdate = {}
    let payloadPortal = {}
    let payloadHistory
    const payloadAccessControl = []
    let checkValid = true

    // VALIDATE REQUIRED
    const requiredFields = {
      change_enabled_flag: ['enabled_flag'],
      change_email: ['email'],
      change_name: ['first_name_romaji', 'last_name_romaji'],
      change_user_authority: ['authorization_id', 'site_ids'],
      change_security_settings: ['google_sso_required_flag', 'twofa_required_flag'],
      change_access_control: ['allow_list', 'deny_list'],
    }

    if (field_update !== 'delete_user' &&
      (!field_update || !field_data ||
      !Object.keys(field_data).length ||
      !requiredFields[field_update] ||
      requiredFields[field_update].some((field) =>
        field_data[field] === null || field_data[field] === undefined || (field_update !== 'change_access_control' && field_data[field] === '')))
    ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    const staffData = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': userBasicId })
    if (!staffData) {
      return await errorLogRepository.createResponseAndLog(event,
        null,
        null,
        [errorMessageCodeConstant.UPDATE_PROFILE_BY_STAFF_ID.NOT_FOUND],
      )
    }
    const adminData = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': adminBasicId })

    switch (field_update) {
      case 'change_enabled_flag':
        const { enabled_flag } = field_data
        if (![0, 1].includes(enabled_flag)) {
          checkValid = false
          break
        }

        if (
          (staffData.account_status_code === statusCode.APPROVED || staffData.account_status_code === statusCode.PENDING) &&
           staffData.admin_flag !== userBasicClass.MASTER_ADMIN
        ) {
          payloadHistory = {
            target_id: staffData.id,
            status_code: enabled_flag ? statusCode.APPROVED : statusCode.PENDING,
            status_class_id: statusClassConstant.ACCOUNT_STATUS,
            action_method: actionMethod.OPERATOR_ACTION,
            updated_by_user_id: userBasicId,
          }
        }
        break

      case 'change_email':
        const { email } = field_data
        if (email.length > 255 || !regex.emailValidator(email)) {
          checkValid = false
          break
        }

        // CHECK EXIST MAIL IN SYSTEM
        const isExits = await usersBasicDataRepository.checkMailExitsInSystem(email)
        if (isExits) {
          return await errorLogRepository.createResponseAndLog(event,
            null,
            null,
            [errorMessageCodeConstant.UPDATE_PROFILE_BY_STAFF_ID.EMAIL_EXIST_IN_SYSTEM])
        }

        payloadUpdate = { email }
        break

      case 'change_name':
        const { first_name_romaji, last_name_romaji } = field_data
        const lengthValid = 64
        if (first_name_romaji.length > lengthValid || last_name_romaji.length > lengthValid ) {
          checkValid = false
          break
        }
        payloadUpdate = field_data
        break

      case 'change_user_authority':
        const { authorization_id, site_ids } = field_data

        // CHECK EXISTS M_AUTHORIZATION ID
        const isExistedAuth = await authorizationRepository.checkIdExist(authorization_id)

        // CHECK CHECKED ALL M_SITE ID
        const listSite = await siteRepository.getAllSites()
        let siteMapIds = []
        let isNotExistedSites = false
        if (authorization_id === authorizationName.SYSTEM_ADMINISTRATOR) {
          siteMapIds = listSite.map((item) => item.code)
          isNotExistedSites = !_.isEqual(siteMapIds.sort(), site_ids.sort())
        } else {
          siteMapIds = listSite.filter( (item) => item.enable_flag !== flag.FALSE )
          siteMapIds = _.keyBy(siteMapIds, 'code')
          isNotExistedSites = _.some(site_ids, (id) => !siteMapIds[id])
        }

        if (isNaN(authorization_id) || !isExistedAuth.length || _.some(site_ids, isNaN) || isNotExistedSites) {
          checkValid = false
          break
        }
        payloadUpdate = { authorization_id, admin_with_site_id: _.sortBy(site_ids).join(',') }
        break

      case 'change_security_settings':
        const { google_sso_required_flag, twofa_required_flag } = field_data
        if (![0, 1].includes(google_sso_required_flag) || ![0, 1].includes(twofa_required_flag)) {
          checkValid = false
          break
        }
        payloadUpdate = { google_sso_required_flag, twofa_required_flag }

        payloadPortal = {
          twofa_flag: twofa_required_flag,
          google_sso_flag: google_sso_required_flag,
          twofa_method_class: twofa_required_flag ? twoFactorAuthentication.SMS : twoFactorAuthentication.PASSWORD,
        }
        break

      case 'delete_user':
        payloadHistory = {
          target_id: staffData.id,
          status_code: statusCode.CLOSED,
          status_class_id: statusClassConstant.ACCOUNT_STATUS,
          action_method: actionMethod.OPERATOR_ACTION,
          updated_by_user_id: userBasicId,
        }
        payloadUpdate = { delete_flag: flag.TRUE }
        break

      case 'change_access_control':
        const { allow_list, deny_list } = field_data
        if (!utility.checkValidIP(allow_list, deny_list)) {
          checkValid = false
          break
        }
        // VERIFY USER PERMISSION
        if (adminData.authorization_id !== authorizationName.SYSTEM_ADMINISTRATOR) {
          return errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.CHECK_PERMISSION.NOT_ACCESS_PERMISSION])
        }

        if (Number(userBasicId) === adminBasicId) {
          return errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.UPDATE_PROFILE_BY_STAFF_ID.UPDATE_FAIL.UPDATE_DB])
        }
        // NEW DATA FOR UPDATE/INSERTION
        const denyListPayload = {
          user_basic_data_id: userBasicId,
          access_type: accessTypeGeneralAccessList.IP,
          list_type: listTypeGeneralAccessList.ALL_SCREEN,
          list_classification: classiFication.DENY_LIST,
          site_id: commonSiteId.P2TECH,
          target: deny_list,
          active_flag: deny_list ? flag.TRUE : flag.FALSE,
          delete_flag: deny_list ? flag.FALSE : flag.TRUE,
        }
        const allowListPayload = {
          user_basic_data_id: userBasicId,
          access_type: accessTypeGeneralAccessList.IP,
          list_type: listTypeGeneralAccessList.ALL_SCREEN,
          list_classification: classiFication.ALLOW_LIST,
          site_id: commonSiteId.P2TECH,
          target: allow_list,
          active_flag: allow_list ? flag.TRUE : flag.FALSE,
          delete_flag: allow_list ? flag.FALSE : flag.TRUE,
        }

        const records = await generalAccessListRepository.getUserAccessListRecord(userBasicId, {
          site_id: commonSiteId.P2TECH,
          access_type: accessTypeGeneralAccessList.IP,
        })

        let allowListRecord
        let denyListRecord
        if (records && records.length > 0) {
          records.forEach((record) => {
            if (record.list_classification === classiFication.ALLOW_LIST) {
              allowListPayload.id = record.id
              allowListRecord = true
            }
            if (record.list_classification === classiFication.DENY_LIST) {
              denyListPayload.id = record.id
              denyListRecord = true
            }
          })
        }

        if (allowListRecord || allow_list) {
          payloadAccessControl.push(allowListPayload)
        }
        if (denyListRecord || deny_list) {
          payloadAccessControl.push(denyListPayload)
        }

        break
      default:
        checkValid = false
    }

    if (!checkValid) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // UPDATE USERS_BASIC_DATA
    const updated = await usersBasicDataRepository.updateAdminProfileData(
      userBasicId, payloadUpdate, payloadPortal,
      payloadHistory, payloadAccessControl)
    if (!updated) {
      return await errorLogRepository.createResponseAndLog(
        event,
        null,
        null,
        [errorMessageCodeConstant.UPDATE_PROFILE_BY_STAFF_ID.UPDATE_FAIL.UPDATE_DB],
      )
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const deleteAvatarByStaffId = async (event) => {
  try {
    const userBasicId = event.pathParameters.staff_id
    // DELETE AVATAR
    const updated = await usersPortalDataRepository.updateUserPortalData(userBasicId, { profile_picture_url: null })
    if (!updated) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.DELETE_AVATAR_BY_STAFF_ID.UPDATE_FAIL])
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  updateProfile,
  updateProfileByStaffId,
  deleteAvatarByStaffId,
}
