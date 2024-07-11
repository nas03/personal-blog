const db = require('db').helper
const { flag } = require('constant')

const getSettingClearErrorLog = async ()=>{
  // get condition from error_log_retention_settings to clear error_log
  return await db('error_log_retention_settings')
    .select(
      'log_level',
      'site_id',
      'retention_weeks',
    )
    .where('retention_weeks', '>', 0)
    .where('delete_flag', flag.FALSE)
}

module.exports = {
  getSettingClearErrorLog,
}
