const db = require('db').helper
const { flag, commonSiteId } = require('constant')

const createHistory = async (payload) => {
  return await db('range_use_setting_history').insert(payload)
}

const getRangeUseSettingHistory = async (id) => {
  return await db('range_use_setting_history as rh')
    .join('range_use_setting as rus', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('rh.range_use_setting_id', 'rus.id')
    })
    .leftJoin('users_basic_data as admin', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('rh.staff_id', 'admin.id')
        .on('admin.delete_flag', flag.FALSE)
        .on('admin.site_id', '=', commonSiteId.P2TECH)
    })
    .select(
      'rh.id',
      'rh.content',
      'rh.before_update',
      'rh.after_update',
      db.raw('CONCAT(LEFT(admin.last_name_romaji,1),".",admin.first_name_romaji) as staff_name'),
      'rh.ts_regist',
      'rus.rule_name',
    )
    .where('rh.range_use_setting_id', id)
}

module.exports = {
  createHistory,
  getRangeUseSettingHistory,
}
