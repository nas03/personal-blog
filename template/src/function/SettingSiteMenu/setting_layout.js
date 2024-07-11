/* library */
const utility = require('utility')

/* constant */
const { flag, errorMessageCodeConstant } = require('constant')

/* DB */
const { siteMenuRepository, settingMenuLayoutRepository, errorLogRepository } = require('repository')

const getSiteMenuLayout = async (event) =>{
  try {
    const { site_id, show_enable_service, is_show_all } = event.queryStringParameters || {}

    const condition = { 'setting_menu_layout.site_id': site_id }

    if (show_enable_service) {
      condition['setting_menu_layout.display_flag'] = show_enable_service
    }

    const siteMenuLayout = await siteMenuRepository.getSiteMenuLayout(condition, is_show_all)

    // RETURN MENU TREE
    return utility.createResponse(true, createMenuTree(siteMenuLayout))
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const updateSiteMenuLayout = async (event) =>{
  try {
    const { site_id } = event.queryStringParameters || {}
    const { fieldUpdate, fieldData } = JSON.parse(event.body)

    if (!site_id || !fieldData || !fieldUpdate) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    switch (fieldUpdate) {
      case 'display_flag':
        const payloadUpdate = []
        // GET SETTING MENU LAYOUT BY SITE ID
        const siteMenuLayout = await siteMenuRepository.getSiteMenuLayout({ 'setting_menu_layout.site_id': site_id })
        const settingMenuLayoutIds = siteMenuLayout.map((el) => el.setting_menu_layout_id)

        // VALIDATE FIELD
        for (const el of fieldData) {
          if (!settingMenuLayoutIds.includes(el.setting_menu_layout_id) || ![flag.TRUE, flag.FALSE].includes(el.display_flag)) {
            return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
          }

          payloadUpdate.push({
            id: el.setting_menu_layout_id,
            display_flag: el.display_flag,
          })
        }

        if (!payloadUpdate.length ) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }


        await settingMenuLayoutRepository.updateDisplaySettingMenu(payloadUpdate)

        break

      case 'display_order':
        // GET SETTING MAIN MENU LAYOUT BY SITE ID
        const mainMenuLayout = await siteMenuRepository.getAll()

        const mainMenuLayoutIds = mainMenuLayout.map((el) => el.id)

        // VALIDATE FIELD
        for (const el of fieldData) {
          if (!mainMenuLayoutIds.includes(el.id) || el.display_order < 1 || el.display_order > mainMenuLayout.length) {
            return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
          }
        }

        await siteMenuRepository.updateSiteMenu(fieldData)
        break

      default:
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

// RECURSIVE FUNCTION
const createMenuTree = (allSiteMenus, parentMenuId = null) =>{
  // GET CHILDREN OF MENU PARENT ID
  const children = allSiteMenus.filter((el) => el.parent_menu_id === parentMenuId)

  if (children.length === 0) {
    return null
  }

  // FOR EACH CHILDREN, WE LOOKING FOR CHILDREN OF CHILDREN
  return children.map((siteMenu) =>{
    const subCategories = createMenuTree(allSiteMenus, siteMenu.id)
    if (subCategories) {
      siteMenu.sub_categories = subCategories
    }

    return siteMenu
  })
}

module.exports = {
  getSiteMenuLayout,
  updateSiteMenuLayout,
  createMenuTree,
}
