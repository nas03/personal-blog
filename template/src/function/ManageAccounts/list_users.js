/* func */
const { createResponse, getPagination, getUserIdByToken, createAuthorizationKey, paginatedItems } = require('utility')
const { sendInviteUserMail } = require('./invite_user')

/* db */
const { errorLogRepository, usersBasicDataRepository, tokenAuthorityRepository, authorizationRepository, siteRepository } = require('repository')

/* constant */
const { commonSiteId, tokenAuthorityClass, uncheckALL, errorMessageCodeConstant } = require('constant')

const getListStaff = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}
    const pagination = getPagination(queryString)

    // Check case uncheck all
    const isUncheckALL = [Number(queryString.users_role), Number(queryString.site_ids)].includes(uncheckALL) ? true : false
    if (isUncheckALL) return createResponse(true, paginatedItems([], pagination.currentPage, pagination.perPage))


    // Get staff display date time and timezone
    const staffId = await getUserIdByToken(event)
    const staffInfo = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': staffId })
    queryString.utc = staffInfo.timezone || null
    queryString.display_date_time = staffInfo.display_date_time || null

    // GET LIST STAFF FROM users_basic_data
    const listStaffs = await usersBasicDataRepository.getListStaffs(queryString, pagination)

    // GET LIST SITE FROM m_site
    const listSites = await siteRepository.getAllSites()

    // MAP STAFF AND SITE
    listStaffs.data = listStaffs.data.map((staff) => (
      {
        ...staff,
        sites: listSites.filter((el) =>staff.admin_with_site_id.split(',').includes(el.code.toString())),
      }
    ))

    return createResponse(true, listStaffs)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const resendInviteUserMail = async (event) => {
  try {
    const id = event.pathParameters.staff_id
    const current_staff_id = getUserIdByToken(event)

    // GET STAFF INFO
    const staffInfo = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': id })

    if (!staffInfo || !staffInfo.resend_flag) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
    }

    // UPDATE KEY AND EXPIRE TIME
    const { key, expiresIn } = createAuthorizationKey(48, 'hours')
    await tokenAuthorityRepository.createTokenAuthority({
      target_id: staffInfo.id,
      site_id: commonSiteId.P2TECH,
      action_class: tokenAuthorityClass.CREATE_ACCOUNT,
      activation_key: key,
      activation_key_expire_datetime: expiresIn,
    })

    // SEND MAIL
    const responseMail = await sendInviteUserMail(current_staff_id, staffInfo.email, key)
    if (responseMail.isError) {
      return await errorLogRepository.createResponseAndLog(
        event,
        responseMail,
        null,
        [errorMessageCodeConstant.RESEND_INVITE_USER_MAIL.SEND_MAIL_ERROR],
      )
    }

    return createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getDropDownManageAccount = async (event) =>{
  try {
    const [listSite, listAuthorization] = await Promise.all([
      siteRepository.getAllSites(),
      authorizationRepository.getAuthorizations(),
    ])
    return createResponse(true, {
      sites: listSite,
      authorizations: listAuthorization,
    })
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  getListStaff,
  resendInviteUserMail,
  getDropDownManageAccount,
}
