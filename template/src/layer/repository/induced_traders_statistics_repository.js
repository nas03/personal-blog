/* DB */
const { helper: db, dbReader } = require('db')
const { isEmpty } = require('lodash')
const { commonSiteId } = require('constant')

const searchUserAccounts = async (signup_date_from, signup_date_to, broker_ids) => {
  const site_ids = [
    commonSiteId.MY_FOREX,
    commonSiteId.FX_PLUS,
    commonSiteId.FXS_XEM,
    commonSiteId.FXS_TFX,
    commonSiteId.FXS_EXN,
  ]

  return dbReader('induced_traders_statistics as its')
    .whereBetween('its.signup_date_gmt', [signup_date_from, signup_date_to])
    .whereIn('its.site_id', site_ids)
    .where((builder) => {
      if (!isEmpty(broker_ids)) {
        builder.whereIn('its.broker_id', broker_ids)
      }
    })
    .select(
      'its.signup_date_gmt as signup_date',
      'its.site_id',
      'its.broker_id',
      'its.registration_site',
      'its.new_account_number',
      'its.active_account_number',
      'its.add_account_number',
    )
}

const getStartMonthHasData = async () => {
  return dbReader('induced_traders_statistics').min('signup_date_gmt as start_month_has_data').first()
}

async function deleteAndInsertInducedTradersStatistics(deleteConditions, insertData) {
  await db.transaction(async (trx) => {
    await trx('induced_traders_statistics')
      .whereIn(
        db.raw("CONCAT(signup_date_gmt,'-',broker_id,'-',site_id,'-',registration_site)"),
        deleteConditions,
      )
      .delete()

    await trx('induced_traders_statistics').insert(insertData)
  })
}

module.exports = {
  searchUserAccounts,
  getStartMonthHasData,
  deleteAndInsertInducedTradersStatistics,
}
