/* DB */
const db = require('db').helper
const { isEmpty } = require('lodash')
const { flag, commonSiteId } = require('constant')

const searchRebateStatistics = async (close_date_from, close_date_to, broker_ids, products_type_name) =>{
  const site_ids = [
    commonSiteId.MY_FOREX,
    commonSiteId.FX_PLUS,
    commonSiteId.FXS_XEM,
    commonSiteId.FXS_TFX,
    commonSiteId.FXS_EXN,
  ]

  return db('rebate_statistics as rs')
    .leftJoin('m_broker as b', 'b.id', 'rs.broker_id')
    .whereBetween('rs.close_date', [close_date_from, close_date_to])
    .where('b.enable_flag', flag.TRUE)
    .whereIn('rs.site_id', site_ids)
    .where((builder) => {
      if (!isEmpty(products_type_name)) {
        builder.where('rs.products_type_name', products_type_name)
      }
      if (!isEmpty(broker_ids)) {
        builder.whereIn('rs.broker_id', broker_ids)
      }
    })
    .select(
      'rs.site_id',
      'rs.broker_id',
      'b.broker_code',
      'b.broker_name',
      'b.ja_broker_name',
      'b.en_broker_name',
      'b.cn_broker_name',
      'b.kr_broker_name',
      'b.broker_sequence',
      'rs.close_date',
      'rs.trading_volume',
      'rs.number_of_trade',
      'rs.e_rebate_usd',
    )
    .orderBy('b.broker_sequence', 'asc')
}

const getStartMonthHasData = async () => {
  return db('rebate_statistics').min('close_date as start_month_has_data').first()
}

const deleteAndInsertRebateStatistics = async (deleteConditions, insertData) => {
  await db.transaction(async (trx) => {
    await trx('rebate_statistics')
      .whereIn(
        db.raw("CONCAT(close_date, '-', broker_id, '-', site_id, '-', products_type_name)"),
        deleteConditions,
      )
      .del()

    await trx('rebate_statistics').insert(insertData)
  })
}

module.exports = {
  searchRebateStatistics,
  getStartMonthHasData,
  deleteAndInsertRebateStatistics,
}
