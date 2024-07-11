/* CONSTANT */
const { settingPermissionClass, flag } = require('constant')

/* DB */
const db = require('db').helper

const getAll = async () =>{
  return await db('setting_permission')
    .innerJoin('m_site_menu', 'setting_permission.site_menu_id', 'm_site_menu.id')
    .select(
      'setting_permission.id as id',
      'setting_permission.site_menu_id',
      'setting_permission.authorization_id',
      'setting_permission.setting_class',
      'setting_permission.delete_flag',
      'm_site_menu.menu_key',
    )
    .where('setting_permission.delete_flag', flag.FALSE)
    .where('m_site_menu.delete_flag', flag.FALSE)
}

const updateSettingClass = async (payload) =>{
  return await db.transaction( async (trx) =>{
    const noneSettingIds = payload.filter((el) => Number(el.setting_class) === settingPermissionClass.NONE).map((el) => el.id)
    const optionalSettingIds = payload.filter((el) => Number(el.setting_class) === settingPermissionClass.OPTIONAL).map((el) => el.id)
    const readWriteSettingIds = payload.filter((el) => Number(el.setting_class) === settingPermissionClass.READ_WRITE).map((el) => el.id)


    if (noneSettingIds.length > 0) {
      await trx('setting_permission').update('setting_class', settingPermissionClass.NONE).whereIn('id', noneSettingIds)
    }

    if (optionalSettingIds.length > 0) {
      await trx('setting_permission').update('setting_class', settingPermissionClass.OPTIONAL).whereIn('id', optionalSettingIds)
    }

    if (readWriteSettingIds.length > 0) {
      await trx('setting_permission').update('setting_class', settingPermissionClass.READ_WRITE).whereIn('id', readWriteSettingIds)
    }

    return true
  })
}

module.exports = {
  getAll,
  updateSettingClass,
}
