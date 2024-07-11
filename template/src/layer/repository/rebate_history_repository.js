const {
  flag, dateFormat, queryTime, processingStatusCrawl, calculatedFlagConstant,
  actionMethod, statusCode, statusLableConstant,
} = require('constant')
const { helper: db, dbReader } = require('db')
const utility = require('utility')
const moment = require('moment')

const getListRebateHistory = async (queryString, pagination, isExportCSV) => {
  let useIndexString = ''
  if (queryString.id) {
    useIndexString = ''
  } else if (queryString.import_date === 'true') {
    useIndexString = 'USE INDEX (idx_ts_regist)'
  } else if (queryString.close_date === 'true' && queryString.query_time === queryTime.USER_TIME) {
    useIndexString = 'USE INDEX (idx_close_time)'
  } else if (queryString.close_date === 'true' && queryString.query_time === queryTime.BROKER_TIME) {
    useIndexString = 'USE INDEX (idx_close_time_broker)'
  }
  const query = dbReader.from(dbReader.raw(`rebate_history as rh ${useIndexString}`))

  if (queryString.ib_rebates_status_code) {
    query.whereIn('rh.ib_rebates_status_code', queryString.ib_rebates_status_code.split(',').filter(Number))
  }

  if (queryString.site_id) {
    query.whereIn('rh.site_id', queryString.site_id)
  }

  if (queryString.account_type_id) {
    query.whereIn('rh.account_type_id', queryString.account_type_id.split(',').filter(Number))
  }

  if (queryString.broker_id) {
    query.whereIn('rh.broker_id', queryString.broker_id.split(',').filter(Number))
  }

  if (queryString.ib_rank_id) {
    query.whereIn('rh.ib_rank_id', queryString.ib_rank_id.split(',').filter(Number))
  }

  if (queryString.platform) {
    query.whereIn('rh.platform', queryString.platform.split(','))
  }

  if (queryString.id) {
    queryString.id = utility.escapeSql(queryString.id)
    query.where('rh.id', queryString.id)
  }

  if (queryString.symbol) {
    queryString.symbol = utility.escapeSql(queryString.symbol)
    query.whereILike('rh.formal_symbol', `%${queryString.symbol}%`)
  }

  if (queryString.ticket) {
    queryString.ticket = utility.escapeSql(queryString.ticket)
    query.whereILike(dbReader.raw(`
    CASE 
      WHEN rh.ticket IS NOT NULL THEN rh.ticket
      WHEN rh.order_id IS NOT NULL THEN rh.order_id
    ELSE rh.deal_id END`,
    ), `%${queryString.ticket}%`)
  }

  if (queryString.mt_account_name) {
    queryString.mt_account_name = utility.escapeSql(queryString.mt_account_name)
    query.whereILike('rh.mt_account_name', `%${queryString.mt_account_name}%`)
  }

  if (queryString.mt_account_no) {
    queryString.mt_account_no = utility.escapeSql(queryString.mt_account_no)
    query.whereILike('rh.mt_account_no', `%${queryString.mt_account_no}%`)
  }

  const utc = (queryString.utc || '').replace(/[()UTC]/g, '') || '+00:00'

  if (queryString.ts_from && queryString.ts_to) {
    const ts_from = moment(queryString.ts_from).startOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME)
    const ts_to = moment(queryString.ts_to).endOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME)

    if (queryString.import_date === 'true') {
      query.whereBetween('rh.ts_regist', [ts_from, ts_to])
    } else if (queryString.close_date === 'true' && queryString.query_time === queryTime.USER_TIME) {
      query.whereBetween('rh.close_time', [ts_from, ts_to])
    } else if (queryString.close_date === 'true' && queryString.query_time === queryTime.BROKER_TIME) {
      const ts_from_broker = moment(queryString.ts_from).startOf('day').format(dateFormat.DATE_TIME)
      const ts_to_broker = moment(queryString.ts_to).endOf('day').format(dateFormat.DATE_TIME)
      query.whereBetween('rh.close_time_broker', [ts_from_broker, ts_to_broker])
    }
  }

  let totalRecord
  if (!isExportCSV) {
    const queryCount = query.clone().count('id as total').first()
    console.log(queryCount.toString())

    console.log('====== START Count rebate history: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
    totalRecord = await queryCount
    console.log('====== END Count rebate history: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
  }

  const arrSort = pagination.sort
  if (arrSort[0]?.column === 'platform') {
    arrSort.push({
      column: 'account_type_id',
      order: arrSort[0]?.order,
    })
  }

  query.select(
    'id',
    'ts_regist',
    'site_id',
    'ib_rebates_status_code',
    'ib_rebates_status_label_number',
    'close_time',
    'close_time_broker',
    'formal_symbol as symbol',
    'platform',
    'volume',
    'calculated_lot_rebates as lot_rebates',
    'calculated_lot_rebates_currency as lot_rebates_currency',
    'reward_per_trade as earned_rebates',
    'reward_currency as earned_rebates_currency',
    'mt_account_name',
    'mt_account_no',
    'action_method',
    'decision_date',
    dbReader.raw(`
      CASE 
        WHEN rh.ticket IS NOT NULL THEN rh.ticket
        WHEN rh.order_id IS NOT NULL THEN rh.order_id
      ELSE rh.deal_id END as ticket`,
    ),
    'account_type_id',
    'ib_rank_id',
    'broker_id',
    'updated_by_user_id',
  ).limit(pagination.perPage)
    .offset((pagination.currentPage - 1) * pagination.perPage)
    .orderBy(arrSort)

  const newQuery = dbReader.select(
    'rh.id',
    'rh.ts_regist',
    'rh.site_id',
    'rh.ib_rebates_status_code',
    'rh.ib_rebates_status_label_number',
    'mst1.status_name as ib_rebates_status_name',
    'mst1.en_name as en_rebates_status_name',
    'mst1.ja_name as ja_rebates_status_name',
    'mst1.cn_name as cn_rebates_status_name',
    'mst1.kr_name as kr_rebates_status_name',
    'mst.en_name as en_rebate_status_label',
    'mst.ja_name as ja_rebate_status_label',
    'mst.cn_name as cn_rebate_status_label',
    'mst.kr_name as kr_rebate_status_label',
    'mst.en_status_label_detail',
    'mst.ja_status_label_detail',
    'mst.cn_status_label_detail',
    'mst.kr_status_label_detail',
    'rh.close_time',
    'rh.close_time_broker',
    'rh.symbol',
    'rh.platform',
    'rh.volume',
    'rh.lot_rebates',
    'rh.lot_rebates_currency',
    'rh.earned_rebates',
    'rh.earned_rebates_currency',
    'rh.mt_account_name',
    'rh.mt_account_no',
    'rh.action_method',
    'rh.decision_date',
    'ms.site_name',
    'mb.broker_name',
    'mi.ib_rank_name',
    'ma.account_type_name',
    dbReader.raw('CONCAT(LEFT(admin.last_name_romaji,1),".",admin.first_name_romaji) as staff_name'),
    'rh.ticket',
  )
    .from(query.as('rh'))
    .leftJoin('m_site as ms', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('rh.site_id', 'ms.id')
        .on('ms.delete_flag', flag.FALSE)
    })
    .leftJoin('m_broker as mb', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('rh.broker_id', 'mb.id')
        .on('mb.delete_flag', flag.FALSE)
    })
    .leftJoin('m_ib_rank as mi', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('rh.ib_rank_id', 'mi.id')
        .on('mi.delete_flag', flag.FALSE)
    })
    .leftJoin('m_account_type as ma', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('rh.account_type_id', 'ma.id')
        .on('ma.delete_flag', flag.FALSE)
    })
    .leftJoin('m_status as mst', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('rh.ib_rebates_status_code', 'mst.status_code')
        .on('mst.status_label_number', '<>', 0)
        .on('rh.ib_rebates_status_label_number', 'mst.status_label_number')
        .on('mst.delete_flag', flag.FALSE)
    })
    .leftJoin('users_basic_data as admin', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('rh.updated_by_user_id', 'admin.id')
        .on('admin.delete_flag', flag.FALSE)
    })
    .leftJoin('m_status as mst1', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('rh.ib_rebates_status_code', 'mst1.status_code')
        .on('mst1.status_label_number', 0)
        .on('mst1.delete_flag', flag.FALSE)
    })

  console.log(newQuery.toString())

  if (isExportCSV) {
    return await newQuery
  }

  console.log('====== START Get list rebate history: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
  const listRebateHistory = await newQuery
  console.log('====== END Get list rebate history: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))

  return {
    data: listRebateHistory,
    pagination: {
      total: totalRecord.total,
      lastPage: Math.ceil(totalRecord.total / Number(pagination.perPage)),
      prevPage: Number(pagination.currentPage) - 1 || null,
      nextPage: Number(pagination.currentPage) === Math.ceil(totalRecord.total / Number(pagination.perPage)) ? null :
        Number(pagination.currentPage) + 1,
      perPage: Number(pagination.perPage),
      currentPage: Number(pagination.currentPage),
      from: (Number(pagination.currentPage) - 1) * Number(pagination.perPage),
      to: Number(pagination.currentPage) * Number(pagination.perPage) > totalRecord.total ?
        totalRecord.total : Number(pagination.currentPage) * Number(pagination.perPage),
    },
  }
}

const getCurrentId = async (dateNow) => {
  const currentId = await db('rebate_history')
    .select(
      'id',
    )
    .whereILike('id', `${dateNow}-%`)
    .orderBy([{ column: 'id', order: 'DESC' }])
    .first()

  if (currentId) {
    return Number(currentId.id.split('-').pop())
  }

  return 1
}

const createRebateHistory = async (payloadRebateHistory, payloadRebateStatusHistory, listTransactionId) => {
  return await db.transaction(async (trx) => {
    console.log('====== START insert rebate history: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
    await trx('rebate_history').insert(payloadRebateHistory)
    console.log('====== END insert rebate history: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
    console.log('====== START insert rebate status history: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
    await trx('rebate_status_history').insert(payloadRebateStatusHistory)
    console.log('====== END insert rebate status history: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
    console.log('====== START update status crawl transaction: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))

    // Update status to imported
    await trx('crawl_transaction')
      .update({
        job_status: processingStatusCrawl.REBATE_HISTORY_IMPORTED,
      })
      .whereIn('id', listTransactionId)

    console.log('====== END update status crawl transaction: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))

    return true
  })
}

const getRebateHistoryForCalculate = async (limit, brokerId) => {
  const result = await db(db.raw('rebate_history as rh use index(idx_broker_id_calculate_flag)'))
    .select(
      'rh.id',
      'rh.crawl_transaction_id',
      'rh.broker_id',
      'rh.site_id',
      'rh.ib_rank_id',
      'rh.close_time',
      'rh.close_time_broker',
      'rh.platform',
      'rh.account_type_id',
      'rh.reward_per_trade',
      'rh.reward_currency',
      'rh.mt_account_no',
      'rh.symbol',
      'rh.symbol_id',
      'rh.volume',
      'rh.calculate_flag',
    )
    .where('rh.calculate_flag', calculatedFlagConstant.UNPROCESSED)
    .where('rh.delete_flag', flag.FALSE)
    .where('rh.broker_id', brokerId)
    .limit(limit)

  return result
}

const getRebateHistoryForRecalculate = async (listRebateHistoryId) => {
  const result = await db('rebate_history')
    .select(
      'id',
      'crawl_transaction_id',
      'broker_id',
      'site_id',
      'ib_rank_id',
      'close_time',
      'close_time_broker',
      'platform',
      'account_type_id',
      'reward_per_trade',
      'reward_currency',
      'mt_account_no',
      'symbol',
      'symbol_id',
      'volume',
      'calculate_flag',
    )
    .whereIn('id', listRebateHistoryId)
    .where('delete_flag', flag.FALSE)

  return result
}

const updateRebateHistoryForCalculation = async (id, payloadRebate, payloadStatus) => {
  return await db.transaction(async (trx) => {
    await trx('rebate_history').update(payloadRebate)
      .where('id', id)

    await db('rebate_status_history').insert(payloadStatus)
  })
}

const updateRecalculateRebate = async (ids, updatedByUserId) => {
  return await db.transaction(async (trx) => {
    await trx('rebate_history').update({
      reward_per_trade_usd: null,
      symbol_id: null,
      formal_symbol: null,
      calculated_lot_rebates: null,
      calculated_lot_rebates_currency: null,
      rebate_detail_id: null,
      rebate_contract_size: null,
      rebate_digit_size: null,
      rebate_profit_currency: null,
      rebate_lot_rebate: null,
      rebate_lot_rebate_currency: null,
      rate_data: null,
      ib_rebates_status_code: statusCode.REQUIRED,
      ib_rebates_status_label_number: statusLableConstant.REQUIRED.NOT_CALCULATED,
      calculate_flag: calculatedFlagConstant.UNPROCESSED,
      summary_flag: flag.FALSE,
      action_method: actionMethod.OPERATOR_ACTION,
      decision_date: moment().utc().format(dateFormat.DATE_TIME),
      updated_by_user_id: updatedByUserId,
    })
      .whereIn('id', ids)
    return true
  })
}

const getCloseDates = async () => {
  return dbReader('rebate_history')
    .select(
      dbReader.raw("DATE_FORMAT(close_time, '%Y-%m-%d') as close_date"),
      'broker_id',
      'site_id',
      dbReader.raw("CASE WHEN products_type_id = 1 then 'FX' else 'CFD' END AS products_type_name"),
    )
    .where('delete_flag', flag.FALSE)
    .where('summary_flag', flag.FALSE)
    .whereNotNull('reward_per_trade_usd')
    .where('calculate_flag', flag.TRUE)
    .groupBy(
      'close_date',
      'broker_id',
      'site_id',
      'products_type_name')
}

const getRebateHistoryForStatistics = async (conditions) => {
  const queries = conditions.map((condition) =>
    dbReader(dbReader.raw('rebate_history use index(idx_close_time, idx_broker_id_close_time)'))
      .select(
        dbReader.raw("DATE_FORMAT(close_time, '%Y-%m-%d') as close_date"),
        'broker_id',
        'site_id',
        dbReader.raw("CASE WHEN products_type_id = 1 then 'FX' else 'CFD' END AS products_type_name"),
        dbReader.raw('SUM(volume) as trading_volume'),
        dbReader.raw('COUNT(id) as number_of_trade'),
        dbReader.raw('SUM(reward_per_trade_usd) as e_rebate_usd'),
        dbReader.raw("DATE_FORMAT(MAX(ts_update), '%Y-%m-%d %H:%i:%s') as max_ts_update"),
      )
      .where('delete_flag', flag.FALSE)
      .whereNotNull('reward_per_trade_usd')
      .where('calculate_flag', flag.TRUE)
      .whereBetween('close_time', [`${condition.close_date} 00:00:00`, `${condition.close_date} 23:59:59`])
      .where('broker_id', condition.broker_id)
      .where('site_id', condition.site_id)
      .where((builder) => {
        if (condition.products_type_name === 'FX') {
          builder.where('products_type_id', 1)
        } else {
          builder
            .whereNot('products_type_id', 1)
            .orWhereNull('products_type_id')
        }
      })
      .groupBy(
        'close_date',
        'broker_id',
        'site_id',
        'products_type_name'),
  )

  return dbReader.raw(`${queries.join(' UNION ALL ')}`)
}

const updateSummaryFlag = async (conditions) => {
  await Promise.all(
    conditions.map((condition) =>
      db(db.raw('rebate_history use index(idx_summary_flag, idx_close_time, idx_broker_id_close_time)'))
        .where('delete_flag', flag.FALSE)
        .where('summary_flag', flag.FALSE)
        .whereNotNull('reward_per_trade_usd')
        .where('calculate_flag', flag.TRUE)
        .whereBetween('close_time', [`${condition.close_date} 00:00:00`, `${condition.close_date} 23:59:59`])
        .where('broker_id', condition.broker_id)
        .where('site_id', condition.site_id)
        .where((builder) => {
          if (condition.products_type_name === 'FX') {
            builder.where('products_type_id', 1)
          } else {
            builder
              .whereNot('products_type_id', 1)
              .orWhereNull('products_type_id')
          }
        })
        .where('ts_update', '<=', condition.max_ts_update)
        .update('summary_flag', flag.TRUE),
    ),
  )
}

module.exports = {
  getListRebateHistory,
  createRebateHistory,
  getRebateHistoryForCalculate,
  updateRebateHistoryForCalculation,
  getCurrentId,
  updateRecalculateRebate,
  getCloseDates,
  getRebateHistoryForStatistics,
  updateSummaryFlag,
  getRebateHistoryForRecalculate,
}
