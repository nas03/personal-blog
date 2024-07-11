/* CONSTANT */
const { flag } = require('constant')
const { settingPermissionClass } = require('../constant/constant')

/* DB */
const db = require('db').helper

const getSiteMenuLayout = async (condition, is_show_all) =>{
  const query = db('m_site_menu')
    .leftJoin('setting_menu_layout', 'setting_menu_layout.site_menu_id', 'm_site_menu.id')
    .leftJoin('m_site', 'm_site.id', 'setting_menu_layout.site_id')
    .select(
      'm_site_menu.id as id',
      'm_site_menu.menu_key',
      'm_site_menu.display_icon',
      'm_site_menu.ja_display_name',
      'm_site_menu.en_display_name',
      'm_site_menu.cn_display_name',
      'm_site_menu.kr_display_name',
      'm_site_menu.parent_menu_id',
      'm_site_menu.display_order',
      'm_site_menu.display_level',
      'setting_menu_layout.id as setting_menu_layout_id',
      'setting_menu_layout.site_id',
      'setting_menu_layout.display_flag',
    )
  if (is_show_all) {
    query.where({
      'm_site_menu.delete_flag': flag.FALSE,
      'setting_menu_layout.delete_flag': flag.FALSE,
      'm_site.delete_flag': flag.FALSE,
    })
      .groupBy('m_site_menu.id')
  } else {
    query.where({
      ...condition,
      'm_site_menu.delete_flag': flag.FALSE,
      'setting_menu_layout.delete_flag': flag.FALSE,
      'm_site.enable_flag': flag.TRUE,
      'm_site.delete_flag': flag.FALSE,
    })
  }

  return await query.orderBy([
    { column: 'm_site_menu.display_level', order: 'asc' },
    { column: 'm_site_menu.display_order', order: 'asc' },
  ])
}

const updateSiteMenu = async (payload) =>{
  return await db.transaction(async (trx) =>{
    await Promise.all(
      payload.map((siteMenu) =>{
        return trx('m_site_menu')
          .update({
            'display_order': siteMenu.display_order,
          }).where('id', siteMenu.id)
      }),
    )
    return true
  })
}

const getAdminSiteMenu = async (siteIds, authorizationId) =>{
  return await db('m_site_menu')
    .innerJoin('setting_menu_layout', function() {
    /* eslint-disable no-invalid-this */
      this
        .on('m_site_menu.id', 'setting_menu_layout.site_menu_id')
        .andOnIn('setting_menu_layout.site_id', siteIds)
        .andOn('setting_menu_layout.display_flag', flag.TRUE)
    })
    .innerJoin('m_site', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('m_site.id', 'setting_menu_layout.site_id')
        .andOn('m_site.enable_flag', flag.TRUE)
    })
    .innerJoin('setting_permission', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('m_site_menu.id', 'setting_permission.site_menu_id')
        .andOn('setting_permission.authorization_id', authorizationId)
        .andOn('setting_permission.setting_class', '!=', settingPermissionClass.NONE)
    })
    .select(
      'm_site_menu.id',
      'm_site_menu.menu_key',
      'm_site_menu.ja_display_name',
      'm_site_menu.en_display_name',
      'm_site_menu.cn_display_name',
      'm_site_menu.kr_display_name',
      'm_site_menu.parent_menu_id',
      'm_site_menu.display_order',
    )
    .where('m_site_menu.delete_flag', flag.FALSE)
    .orderBy([
      { column: 'm_site_menu.display_level', order: 'asc' },
      { column: 'm_site_menu.display_order', order: 'asc' },
    ])
    .groupBy('m_site_menu.id')
}

const getAll = async () =>{
  return await db('m_site_menu')
    .where('delete_flag', flag.FALSE)
    .orderBy([
      { column: 'm_site_menu.display_level', order: 'asc' },
      { column: 'm_site_menu.default_display_order', order: 'asc' },
    ])
}

const checkResourceAccess = async (authorizationId, siteIds, menuKeys) =>{
  return await db('m_site_menu')
    .innerJoin('setting_permission', function() {
      /* eslint-disable no-invalid-this */
      this.on('m_site_menu.id', 'setting_permission.site_menu_id')
        .on('setting_permission.delete_flag', flag.FALSE)
        .on('setting_permission.authorization_id', authorizationId )
        .andOn('setting_permission.setting_class', '!=', settingPermissionClass.NONE)
    })
    .innerJoin('setting_menu_layout', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('setting_menu_layout.site_menu_id', 'm_site_menu.id')
        .andOnIn('setting_menu_layout.site_id', siteIds)
        .on('setting_menu_layout.display_flag', flag.TRUE)
        .on('setting_menu_layout.delete_flag', flag.FALSE)
    })
    .innerJoin('m_site', function() {
      this
        .on('m_site.id', 'setting_menu_layout.site_id')
        .on('m_site.enable_flag', flag.TRUE)
        .on('m_site.delete_flag', flag.FALSE)
    })
    .where('m_site_menu.delete_flag', flag.FALSE )
    .whereIn('m_site_menu.menu_key', menuKeys)
    .first()
}

module.exports = {
  getSiteMenuLayout,
  updateSiteMenu,
  getAdminSiteMenu,
  getAll,
  checkResourceAccess,
}

