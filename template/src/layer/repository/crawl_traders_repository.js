const db = require('db').helper
const { flag } = require('constant')

async function getCrawlTraderForImport(crawlTraderIds) {
  const query = db('crawl_traders')
    .select(
      'id',
      'broker_id',
      'site_id',
      'client_id',
      'mt_account_no',
      'account_name',
      'area',
      'signup_date_broker',
      'signup_date_gmt',
      'account_closed_date_broker',
      'account_closed_date_gmt',
      'account_closed_flag',
      'ac_status',
      'new_client_flag',
      'registration_site',
      'ac_type',
      'platform',
      'ac_currency',
      'import_status',
    )
    .orderBy('id')

  if (crawlTraderIds) {
    query.whereIn('id', crawlTraderIds)
  } else {
    query.where('import_status', flag.FALSE).limit(10000)
  }

  return await query
}

module.exports = {
  getCrawlTraderForImport,
}
