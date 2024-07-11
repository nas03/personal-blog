/* eslint-disable require-jsdoc */
const db = require('db').helper
const {
  processingCashback, processingStatusCrawl, configBroker, mgrapiUpdateStatus,
  jobStatus, mgrUpdateStatus,
} = require('constant')

const getUnprocessedRecord = async (limit) => {
  const result = await db('crawl_transaction')
    .select(
      'id',
      'broker_id',
      'account as account_no',
      'order_id as order_no',
      'deal_id as deal_no',
      'ticket',
      'type as order_type',
      'platform',
      'account_type',
      'account_currency',
      'reward_per_trade',
      'reward_currency',
      'symbol',
      'open_time',
      'close_time',
      'profit',
      'volume',
      'mq_index',
      'mq_account',
      'method',
      'processing_cashback',
      'ts_regist',
    )
    .where('processing_cashback', processingCashback.UNPROCESSED)
    .orderBy([{ column: 'id', order: 'desc' }])
    .limit(limit)

  return result
}

const updateById = async (id, payload) => {
  return await db('crawl_transaction')
    .update(payload)
    .where('id', id)
}

const getScrapingExecutedRecord = async (limit) => {
  // XM trading, Exness, Titan, BigBoss, Miltion, XM Global
  const result = await db('crawl_transaction as ct')
    .select(
      'ct.id',
      'ct.broker_id',
      'ct.site_id',
      'ct.account as account_no',
      'ct.account_name',
      'ct.order_id',
      'ct.deal_id',
      'ct.ticket',
      'ct.platform',
      'ct.account_type_id',
      'ct.account_type',
      'ct.account_currency',
      'ct.reward_per_trade',
      'ct.reward_currency',
      'ct.symbol',
      'ct.open_time',
      'ct.close_time',
      'ct.open_time_broker',
      'ct.close_time_broker',
      'ct.profit',
      'ct.volume',
      'ct.ib_rank_id',
      'ct.mq_index',
      'ct.mq_account',
      'ct.processing_cashback',
      'ct.job_status',
      'ct.ts_regist',
    )
    .where((builder1) => {
      builder1.orWhere((builder2) => {
        builder2.whereIn('ct.broker_id',
          [configBroker.EXNESS.ID, configBroker.MILTON_MARKETS.ID, configBroker.XM_TRADING.ID, configBroker.XM_GLOBAL.ID],
        )
          .where('ct.job_status', processingStatusCrawl.SCRAPING_INTERNALLY_PROCESSED)
          .where('ct.mgrapi_update_status', mgrapiUpdateStatus.NOT_APPLICABLE)
      })
        .orWhere((builder2) => {
          builder2.whereIn('ct.broker_id', [configBroker.TITAN_FX.ID, configBroker.BIG_BOSS.ID])
            .where('ct.job_status', processingStatusCrawl.SCRAPING_INTERNALLY_PROCESSED)
            .where('ct.mgrapi_update_status', mgrapiUpdateStatus.IMPORTED)
        })
    })
    .limit(limit)

  return result
}

const getTransactionWithoutTfxBig = async (brokerId, limit)=>{
  try {
    return await db('crawl_transaction')
      .select('id',
        'broker_id',
        'account_type',
        'account_type_id',
        'mq_account',
        'close_time',
        'site_name',
        'reward_currency',
        'deal_id',
        'ticket',
        'account',
        'broker_account',
        'platform',
      )
      .where('job_status', jobStatus.VALUE_1)
      .where('broker_id', brokerId )
      .limit(limit)
  } catch (error) {
    console.error(error)
    return false
  }
}

const getTransactionTfxBig = async (brokerId, limit)=>{
  try {
    return await db('crawl_transaction')
      .select('id',
        'broker_id',
        'account_type',
        'account_type_id',
        'mq_account',
        'close_time',
        'site_name',
        'reward_currency',
        'deal_id',
        'ticket',
        'mq_index',
        'mq_server',
        'platform',
      )
      .where({ 'job_status': jobStatus.VALUE_1, 'mgrapi_update_status': mgrUpdateStatus.VALUE_1 })
      .where('broker_id', brokerId )
      .limit(limit)
  } catch (error) {
    console.error(error)
    return false
  }
}

const updateBatchTransaction = async (listQuery) => {
  const trx = await db.transaction()
  try {
    await Promise.all(listQuery.map(async (query) => await trx.raw(query)))

    await trx.commit()
    return true
  } catch (error) {
    await trx.rollback()
    console.error(error)
    return false
  }
}

const getDataDealIdExisted = async (listDealId, brokerId)=>{
  try {
    return await db('crawl_transaction')
      .select('deal_id', 'ticket', 'mq_server', 'mq_index', 'mq_server', 'platform', 'broker_id', 'broker_account', 'account')
      .where('broker_id', brokerId)
      .whereIn('deal_id', listDealId)
      .whereIn('job_status', [jobStatus.VALUE_2, jobStatus.VALUE_3])
  } catch (error) {
    console.error(error)
    return false
  }
}

const getDataTicketExisted = async (listTicket, brokerId)=>{
  try {
    return await db('crawl_transaction')
      .select('deal_id', 'ticket', 'mq_server', 'mq_index', 'mq_server', 'platform', 'broker_id', 'broker_account', 'account')
      .where('broker_id', brokerId)
      .whereIn('ticket', listTicket)
      .whereIn('job_status', [jobStatus.VALUE_2, jobStatus.VALUE_3])
  } catch (error) {
    console.error(error)
    return false
  }
}

const updateJobStatusByIdIn = async (jobStatus, ids) => {
  try {
    await db('crawl_transaction')
      .whereIn('id', ids)
      .update({ 'job_status': jobStatus })
  } catch (error) {
    console.error(error)
    return false
  }
  return true
}

module.exports = {
  getUnprocessedRecord,
  updateById,
  getScrapingExecutedRecord,
  getTransactionWithoutTfxBig,
  getTransactionTfxBig,
  updateBatchTransaction,
  updateJobStatusByIdIn,
  getDataDealIdExisted,
  getDataTicketExisted,
}
