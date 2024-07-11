/* CONSTANT */
const { flag } = require('constant')

/* DB */
const db = require('db').helper

const updateDisplaySettingMenu = async (payload) =>{
  return await db.transaction( async (trx) =>{
    const displayMenuIds = payload.filter((el) => Number(el.display_flag) === flag.TRUE).map((el) => el.id)
    const hiddenMenuIds = payload.filter((el) => Number(el.display_flag) === flag.FALSE).map((el) => el.id)

    if (displayMenuIds.length > 0) {
      await trx('setting_menu_layout').update('display_flag', flag.TRUE).whereIn('id', displayMenuIds)
    }

    if (hiddenMenuIds.length > 0) {
      await trx('setting_menu_layout').update('display_flag', flag.FALSE).whereIn('id', hiddenMenuIds)
    }

    return true
  })
}

module.exports = {
  updateDisplaySettingMenu,
}
