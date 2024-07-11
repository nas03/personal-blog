/* func */
const utility = require('utility')

/* db */
const { usersBasicDataRepository, errorLogRepository, timezonesRepository, statusHistoryRepository,
  countryRepository, tokenAuthorityRepository, siteRepository, userAccessHistoryRepository,
  generalAccessListRepository,
} = require('repository')

/* constant */
const { statusCode, commonSiteId, tokenAuthorityClass, errorMessageCodeConstant,
  statusClassConstant, actionMethod, flag, classiFication,
} = require('constant')

const getProfile = async (event) => {
  try {
    const userBasicId = utility.getUserIdByToken(event)
    // GET STAFF INFO
    const staffData = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': userBasicId })
    // GET STAFF ACCESS CONTROL DATA
    let allow_list = null
    let deny_list = null

    const accessData = await generalAccessListRepository.getUserAccessListRecord(userBasicId, {
      active_flag: flag.TRUE,
    })

    if (accessData && accessData.length > 0) {
      accessData.forEach((record) => {
        if (record && record.list_classification === classiFication.ALLOW_LIST) allow_list = record.target
        if (record && record.list_classification === classiFication.DENY_LIST) deny_list = record.target
      })
    }

    staffData.allow_list = allow_list
    staffData.deny_list = deny_list
    // GENERATE PROFILE DATA
    const staffProfile = await modifyStaffData(staffData)

    return utility.createResponse(true, staffProfile)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getProfileByActivationKey = async (event) => {
  try {
    const ipAddress = event.requestContext.identity.sourceIp
    const { activation_key } = event.pathParameters || {}

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
        [errorMessageCodeConstant.GET_PROFILE_BY_ACTIVATION_KEY.EXPIRED_LINK_INVITE.VERIFY_FAIL],
      )
    }

    // GET STAFF INFO
    const staffData = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': verify.target_id })
    if (
      !staffData ||
      (staffData.account_status_code !== statusCode.REGISTERED && staffData.account_status_code !== statusCode.ACTIVATED)
    ) {
      return await errorLogRepository.createResponseAndLog(
        event,
        null,
        null,
        [errorMessageCodeConstant.GET_PROFILE_BY_ACTIVATION_KEY.EXPIRED_LINK_INVITE.ACCOUNT_STATUS],
      )
    }

    // UPDATE ACCOUNT STATUS
    if (staffData.account_status_code === statusCode.REGISTERED) {
      await statusHistoryRepository.insertStatusHistory({
        target_id: staffData.id,
        status_code: statusCode.ACTIVATED,
        status_class_id: statusClassConstant.ACCOUNT_STATUS,
        action_method: actionMethod.OPERATOR_ACTION,
        updated_by_user_id: staffData.id,
      })
    }

    const [admin_profile, countries, timezones, location] = await Promise.all([
      modifyStaffData(staffData),
      countryRepository.getAll(),
      timezonesRepository.getTimeZones(),
      utility.getLocationByIp(ipAddress),
    ])

    const response = {
      admin_profile: admin_profile,
      location: {
        current_country: location?.countryCode || null,
        timezone: location?.timezone || null,
      },
      countries: countries,
      timezones: timezones.data,
    }

    return utility.createResponse(true, response)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const modifyStaffData = async (staffData) =>{
  // MAP ADMIN DATA WITH ADMIN SITES
  const listSites = await siteRepository.getAllSites()
  const adminSites = listSites.filter((el) => staffData.admin_with_site_id.split(',').includes(el.id.toString()))

  const response = {
    profile_infor: {
      first_name_romaji: staffData.first_name_romaji,
      last_name_romaji: staffData.last_name_romaji,
      email: staffData.email,
      phone_number: staffData.phone_number,
      phone_number_country_id: staffData.phone_number_country_id,
      profile_picture_url: staffData.profile_picture_url,
      profile_picture_color: staffData.profile_picture_color,
      profile_picture_name: staffData.profile_picture_name,
      authorization_name: staffData.authorization_name,
      sites: adminSites,
    },
    security_settings: {
      twofa_flag: staffData.twofa_flag,
      twofa_method_class: staffData.twofa_method_class,
      google_sso_flag: staffData.google_sso_flag,
      login_notify_flag: staffData.login_notify_flag,
      twofa_required_flag: staffData.twofa_required_flag,
      google_sso_required_flag: staffData.google_sso_required_flag,
    },
    display_settings: {
      language_portal: staffData.language_portal,
      language_email: staffData.language_email,
      display_date_time: staffData.display_date_time,
      display_time_zone: staffData.display_time_zone,
    },
    access_control: {
      allow_list: staffData.allow_list,
      deny_list: staffData.deny_list,
    },
  }
  return response
}

const getStaffAccessHistories = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}
    queryString.staffId = event.pathParameters.staff_id || null

    // GET PAGINATION
    const pagination = utility.getPagination(queryString)

    // GET STAFF DISPLAY DATE TIME AND TIMEZONE
    const staffId = utility.getUserIdByToken(event)
    const staffInfo = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': staffId })
    queryString.utc = staffInfo.timezone || null
    queryString.display_date_time = staffInfo.display_date_time

    // GET LIST ACCESS HISTORY BY STAFF ID
    const listAccessHistory = await userAccessHistoryRepository.getStaffAccessHistories(queryString, pagination)

    return utility.createResponse(true, listAccessHistory)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getProfileByStaffId = async (event) => {
  try {
    const userBasicId = event.pathParameters.staff_id

    // GET STAFF INFO
    const staffData = await usersBasicDataRepository.getStaffById(userBasicId)

    return utility.createResponse(true, staffData)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  getProfile,
  getProfileByActivationKey,
  getStaffAccessHistories,
  getProfileByStaffId,
}
