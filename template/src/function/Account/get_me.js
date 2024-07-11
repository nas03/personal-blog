/* eslint-disable linebreak-style */
'use strict'

// func && const
const { createResponse, getUserIdByToken } = require('utility')
const { statusCode, flag, errorMessageCodeConstant } = require('constant')
const { siteRepository, usersBasicDataRepository, errorLogRepository, siteMenuRepository } = require('repository')

const { createMenuTree } = require('../SettingSiteMenu/setting_layout')
// API GET ME
const getUserByIdToken = async (event) => {
  try {
    const user_id = getUserIdByToken(event)

    // GET STAFF INFO
    const userData = await usersBasicDataRepository.getUserData(user_id)

    // EMAIL NOT EXIST
    if (!userData) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
    }

    // EMAIL NOT ACTIVATED
    if (userData.account_status_code === statusCode.REGISTERED) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.GET_USER_BY_ID_TOKEN.ACCOUNT_IS_NOT_ACTIVE])
    }

    // MAP ADMIN DATA WITH ADMIN SITES
    const listSites = await siteRepository.getAllSites()
    const adminSites = listSites.filter((el) => userData.siteIds.split(',').includes(el.id.toString()))
    const adminSiteNames = adminSites.map((el) => el.site_name).join(',')

    // GET MENU KEYS OWENED ADMIN
    const adminSiteIds = adminSites.filter((el) => el.enable_flag === flag.TRUE).map((el) => el.code)
    const adminSiteMenu = await siteMenuRepository.getAdminSiteMenu(adminSiteIds, userData.authorization_id)

    const data = {
      id: userData.id,
      userName: userData.full_name,
      firstName: userData.first_name_romaji,
      lastName: userData.last_name_romaji,
      email: userData.email,
      avatar: userData.profile_picture_url,
      avatarColor: userData.profile_picture_color,
      isActive: userData.account_status_code === statusCode.APPROVED ? 1 : 0,
      isGoogleSSO: userData.google_sso_flag,
      lastLoginDate: userData.last_login_date,
      isAccepted: userData.account_status_code !== statusCode.REGISTERED ? 1 : 0,
      createdDate: userData.ts_regist,
      authorizationId: userData.authorization_id,
      authorizationName: userData.authorization_name,
      siteIds: userData.siteIds,
      siteName: adminSiteNames,
      display_date_time: userData.display_date_time,
      display_time_zone: userData.display_time_zone,
      language_portal: userData.language_portal,
      language_email: userData.language_email,
      timezone: userData.timezone,
      admin_site_menu: createMenuTree(adminSiteMenu),
    }

    return createResponse(true, data)
  } catch (err) {
    console.log(err)
    return await errorLogRepository.createResponseAndLog(event, err, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  getUserByIdToken,
}
