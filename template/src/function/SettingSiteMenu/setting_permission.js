/* library */
const utility = require('utility')

/* constant */
const { siteMenu, authorizationName, settingPermissionClass, errorMessageCodeConstant } = require('constant')

/* DB */
const { siteMenuRepository, settingPermissionRepository, authorizationRepository, errorLogRepository } = require('repository')

const { createMenuTree } = require('./setting_layout')

const getSettingPermission = async (event) =>{
  try {
    const [allSiteMenu, settingPermission, authorizations] = await Promise.all([
      siteMenuRepository.getAll(),
      settingPermissionRepository.getAll(),
      authorizationRepository.getAuthorizations(),
    ])

    // GROUP ROLE BY MENU ITEM
    const menuItemsPermission = allSiteMenu.map((el) =>{
      return {
        ...el,
        setting_permission: settingPermission
          .filter((st) => st.site_menu_id === el.id)
          .map((st) => {
            return {
              setting_permission_id: st.id,
              authorization_id: st.authorization_id,
              setting_class: st.setting_class,
            }
          }),
      }
    })

    // RETURN MENU TREE AND AUTHORIZATIONS
    return utility.createResponse(true, {
      menu_tree: createMenuTree(menuItemsPermission),
      authorizations: authorizations,
    })
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const updateSettingPermission = async (event) =>{
  try {
    const { data } = JSON.parse(event.body)

    // GET ALL DATA SETTING PERMISSION
    const settingPermission = await settingPermissionRepository.getAll()
    if (!settingPermission.length) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
    }

    const settingPermissionIds = settingPermission.map((el) => el.id)

    // LIST PERMISSION SETTING THAT UNABLE TO UPDATE
    const unableUpdateSettings = settingPermission.filter(
      (el) =>
        (el.menu_key === siteMenu.SITE_LINK_MASTER || el.menu_key === siteMenu.PERMISSION_SETTINGS) &&
        el.authorization_id === authorizationName.SYSTEM_ADMINISTRATOR,
    )
      .map((el) => el.id)


    // LIST PERMISSION SETTING THAT UNABLE TO UPDATE TO NONE
    const unableUpdateNoneSettings = settingPermission.filter(
      (el) =>
        (el.site_menu_id === siteMenu.CONFIGURATIONS || el.site_menu_id === siteMenu.SETTINGS) &&
        el.authorization_id === authorizationName.SYSTEM_ADMINISTRATOR,
    )
      .map((el) => el.id)

    const payloadUpdate = []

    for (const settingPermission of data) {
      const { setting_permission_id, setting_class } = settingPermission
      // VALIDATE FIELD
      if (
        unableUpdateSettings.includes(setting_permission_id) ||
        (unableUpdateNoneSettings.includes(setting_permission_id) && setting_class === settingPermissionClass.NONE) ||
        !settingPermissionIds.includes(setting_permission_id) ||
        !Object.values(settingPermissionClass).includes(setting_class)
      ) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
      }

      payloadUpdate.push({
        id: setting_permission_id,
        setting_class: setting_class,
      })
    }

    if (!payloadUpdate.length ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    await settingPermissionRepository.updateSettingClass(payloadUpdate)

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  getSettingPermission,
  updateSettingPermission,
}
