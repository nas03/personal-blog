const { flag } = require('constant')

/* DB */
const db = require('db').helper

const getSiteSetting = (condition, statusClassIds) =>{
  return db('m_site_setting')
    .where(condition)
    .whereIn('status_class_id', statusClassIds)
    .where('delete_flag', flag.FALSE)
}


module.exports = {
  getSiteSetting,
}
