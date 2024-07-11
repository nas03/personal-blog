const { dateFormat, queryTime, flag, inducedTradersDateType, displayDateTime } = require('constant')
const { helper: db, dbReader } = require('db')
const utility = require('utility')
const moment = require('moment')

const getListInducedTraders = async (queryString, pagination, isExportCSV) => {
  const query = dbReader('induced_traders as it')
    .select(
      'it.id as trader_id',
      'it.crawl_trader_id',
      'it.ts_regist',
      'it.site_id',
      'ms.site_name',
      'ms.symbol_logo_path',
      'ms.symbol_logo_name',
      'ms.side_logo_path',
      'ms.side_logo_name',
      'it.it_status_code',
      'mst.status_name',
      'mst.frame_color',
      'mst.paint_color',
      'mst.text_color',
      'mst.en_name as status_name_en',
      'mst.ja_name as status_name_ja',
      'mst.cn_name as status_name_cn',
      'mst.kr_name as status_name_kr',
      'it.it_status_label_number as status_label_number',
      'mst1.en_name as status_label_name_en',
      'mst1.ja_name as status_label_name_ja',
      'mst1.cn_name as status_label_name_cn',
      'mst1.kr_name as status_label_name_kr',
      'mst1.en_status_label_detail as status_label_detail_en',
      'mst1.ja_status_label_detail as status_label_detail_ja',
      'mst1.cn_status_label_detail as status_label_detail_cn',
      'mst1.kr_status_label_detail as status_label_detail_kr',
      'it.signup_date_broker',
      'it.signup_date_gmt',
      'it.account_closed_date_broker',
      'it.account_closed_date_gmt',
      'it.broker_id',
      'mb.broker_name',
      'it.new_client_flag',
      'it.ac_currency',
      'it.platform',
      'it.ac_type as account_type_name',
      'it.country_id',
      'it.area',
      'mc.file_name as country_file_name',
      'it.mt_account_name',
      'it.registration_site',
      'it.mt_account_no',
      'fxad.user_basic_data_id as user_id',
      'it.client_id',
      'it.decision_date',
      'it.ac_status',
      'it.action_method',
      dbReader.raw(
        `CASE 
             WHEN it.action_method = 3 THEN CONCAT(LEFT(admin.last_name_romaji,1),".",admin.first_name_romaji)
             ELSE NULL
         END as staff_name`,
      ),
    )
    .leftJoin('m_site as ms', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('it.site_id', 'ms.id')
    })
    .leftJoin('m_broker as mb', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('it.broker_id', 'mb.id')
        .on('mb.delete_flag', flag.FALSE)
    })
    .leftJoin('m_countries as mc', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('it.country_id', 'mc.id')
        .on('mc.delete_flag', flag.FALSE)
    })
    .leftJoin('m_status as mst', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('it.it_status_code', 'mst.status_code')
        .on('mst.status_label_number', 0)
        .on('mst.delete_flag', flag.FALSE)
        .on('mst.enable_flag', flag.TRUE)
    })
    .leftJoin('m_status as mst1', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('it.it_status_code', 'mst1.status_code')
        .on('mst1.status_label_number', '<>', 0)
        .on('it.it_status_label_number', 'mst1.status_label_number')
        .on('mst1.delete_flag', flag.FALSE)
        .on('mst1.enable_flag', flag.TRUE)
    })
    .leftJoin('users_basic_data as admin', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('it.updated_by_user_id', 'admin.id')
        .on('admin.delete_flag', flag.FALSE)
    })
    .leftJoin('fxs_xem_add_data as fxad', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('it.mt_account_no', 'fxad.mt_account_no')
        .on('fxad.delete_flag', flag.FALSE)
    })

  if (queryString.site_ids) {
    query.whereIn('it.site_id', queryString.site_ids)
  }

  if (queryString.broker_ids) {
    query.whereIn('it.broker_id', queryString.broker_ids.split(',').filter(Number))
  }

  if (queryString.it_status_code) {
    query.whereIn('it.it_status_code', queryString.it_status_code.split(',').filter(Number))
  }

  if (queryString.ac_currency) {
    query.whereIn('it.ac_currency', queryString.ac_currency.split(','))
  }

  if (queryString.new_client_flag) {
    query.whereIn('it.new_client_flag', queryString.new_client_flag.split(',').filter((el)=> el === '0' || Number(el)))
  }

  if (queryString.platform) {
    query.whereIn('it.platform', queryString.platform.split(','))
  }

  if (queryString.account_type_id) {
    query.whereIn('it.account_type_id', queryString.account_type_id.split(',').filter(Number))
  }

  if (queryString.mt_account_no) {
    queryString.mt_account_no = utility.escapeSql(queryString.mt_account_no)
    query.whereILike('it.mt_account_no', `%${queryString.mt_account_no}%`)
  }

  if (queryString.mt_account_name) {
    queryString.mt_account_name = utility.escapeSql(queryString.mt_account_name)
    query.whereILike('it.mt_account_name', `%${queryString.mt_account_name}%`)
  }

  if (queryString.trader_id) {
    query.where('it.id', queryString.trader_id)
  }

  const utc = (queryString.utc || '').replace(/[()UTC]/g, '') || '+00:00'

  if (queryString.ts_from && queryString.ts_to) {
    const ts_from = moment(queryString.ts_from).startOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME)
    const ts_to = moment(queryString.ts_to).endOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME)

    if (queryString.date_type === inducedTradersDateType.IMPORTED_DATE) {
      query.whereBetween('it.ts_regist', [ts_from, ts_to])
    } else if (queryString.date_type === inducedTradersDateType.OPENING_DATE && queryString.display_setting === queryTime.USER_TIME) {
      query.whereBetween('it.signup_date_gmt', [ts_from, ts_to])
    } else if (queryString.date_type === inducedTradersDateType.OPENING_DATE && queryString.display_setting === queryTime.BROKER_TIME) {
      const ts_from_broker = moment(queryString.ts_from).startOf('day').format(dateFormat.DATE_TIME)
      const ts_to_broker = moment(queryString.ts_to).endOf('day').format(dateFormat.DATE_TIME)
      query.whereBetween('it.signup_date_broker', [ts_from_broker, ts_to_broker])
    } else if (queryString.date_type === inducedTradersDateType.DECISION_DATE) {
      query.whereBetween('it.decision_date', [ts_from, ts_to])
    }
  }

  if (queryString.search_key) {
    const search_key = utility.escapeSql(queryString.search_key)

    // handle display datetime
    let formatDisplay
    switch (queryString.display_date_time) {
      case displayDateTime.MM_DD_YYYY:
        formatDisplay = '%m.%d.%Y'
        break
      case displayDateTime.DD_MM_YYYY:
        formatDisplay = '%d.%m.%Y'
        break
      default:
        formatDisplay = '%Y.%m.%d'
        break
    }

    query.where(function() {
      /* eslint-disable no-invalid-this */
      this.whereILike('ms.site_name', `%${search_key}%`)
        .orWhereILike(dbReader.raw(`DATE_FORMAT(CONVERT_TZ(it.ts_regist, "+00:00","${utc}"),"${formatDisplay} %H:%i:%S")`), `%${search_key}%`)
        .orWhereILike('it.id', `%${search_key}%`)
        .orWhereILike('mst.status_name', `%${search_key}%`)
        .orWhereILike('mst.en_name', `%${search_key}%`)
        .orWhereILike('mst.ja_name', `%${search_key}%`)
        .orWhereILike('mst.cn_name', `%${search_key}%`)
        .orWhereILike('mst.kr_name', `%${search_key}%`)
        .orWhereILike('mst1.en_name', `%${search_key}%`)
        .orWhereILike('mst1.ja_name', `%${search_key}%`)
        .orWhereILike('mst1.cn_name', `%${search_key}%`)
        .orWhereILike('mst1.kr_name', `%${search_key}%`)
        .orWhereILike('mst1.en_status_label_detail', `%${search_key}%`)
        .orWhereILike('mst1.ja_status_label_detail', `%${search_key}%`)
        .orWhereILike('mst1.cn_status_label_detail', `%${search_key}%`)
        .orWhereILike('mst1.kr_status_label_detail', `%${search_key}%`)
        .orWhereILike('mb.broker_name', `%${search_key}%`)
        .orWhereILike(dbReader.raw(
          `CASE WHEN it.new_client_flag = 0 THEN 'Add'
            WHEN it.new_client_flag = 1 THEN 'NEW'
            ELSE "" END`,
        ), `%${search_key}%`)
        .orWhereILike('it.ac_currency', `%${search_key}%`)
        .orWhereILike('it.platform', `%${search_key}%`)
        .orWhereILike('it.ac_type', `%${search_key}%`)
        .orWhereILike('it.area', `%${search_key}%`)
        .orWhereILike('it.mt_account_name', `%${search_key}%`)
        .orWhereILike('it.mt_account_no', `%${search_key}%`)
        .orWhereILike('it.client_id', `%${search_key}%`)
        .orWhereILike(dbReader.raw(
          `CASE WHEN it.action_method = 1 THEN 'User action'
                WHEN it.action_method = 2 THEN 'System action'
                WHEN it.action_method = 3 THEN CONCAT(LEFT(admin.last_name_romaji,1),".",admin.first_name_romaji)
            ELSE "" END`,
        ), `%${search_key}%`)
        .orWhereILike(dbReader.raw(
          `CASE WHEN it.ac_status = 0 THEN '認証未完了'
                WHEN it.ac_status = 1 THEN '認証完了'
            ELSE "" END`,
        ), `%${search_key}%`)
        .orWhereILike(dbReader.raw(`DATE_FORMAT(CONVERT_TZ(it.decision_date, "+00:00","${utc}"),"${formatDisplay} %H:%i:%S")`), `%${search_key}%`)

      if (queryString.display_setting === queryTime.BROKER_TIME) {
        this.orWhereILike(dbReader.raw(`DATE_FORMAT(it.signup_date_broker, "${formatDisplay} %H:%i:%S")`), `%${search_key}%`)
        this.orWhereILike(dbReader.raw(`DATE_FORMAT(it.account_closed_date_broker, "${formatDisplay} %H:%i:%S")`), `%${search_key}%`)
      }

      if (queryString.display_setting === queryTime.USER_TIME) {
        this.orWhereILike(dbReader.raw(`DATE_FORMAT(DATE_ADD(it.signup_date_gmt, INTERVAL '${utc}' HOUR_MINUTE),"${formatDisplay} %H:%i:%S")`),
          `%${search_key}%`)
        this.orWhereILike(
          dbReader.raw(`DATE_FORMAT(DATE_ADD(it.account_closed_date_gmt, INTERVAL '${utc}' HOUR_MINUTE),"${formatDisplay} %H:%i:%S")`),
          `%${search_key}%`,
        )
      }
    })
  }

  let totalRecord
  if (!isExportCSV) {
    const queryCount = query.clone().count('it.id as total').first()

    totalRecord = await queryCount
  }

  const arrSort = pagination.sort
  if (queryString.sort) {
    if (arrSort.length && arrSort[0].column === 'platform') {
      arrSort.push({ column: 'ac_type', order: arrSort[0].order })
    }
    arrSort.push({ column: 'id', order: 'DESC' })
  }
  arrSort.map((sort)=> {
    sort.column = `it.${sort.column}`
    return sort
  })

  query.limit(pagination.perPage)
    .offset((pagination.currentPage - 1) * pagination.perPage)
    .orderBy(arrSort)

  if (isExportCSV) {
    return await query
  }

  const listInducedTraders = await query

  return {
    data: listInducedTraders,
    pagination: {
      total: totalRecord.total,
      lastPage: Math.ceil(totalRecord.total / Number(pagination.perPage)),
      prevPage: Number(pagination.currentPage) - 1 || null,
      nextPage: Number(pagination.currentPage) === Math.ceil(totalRecord.total / Number(pagination.perPage)) ? null :
        Number(pagination.currentPage) + 1,
      perPage: Number(pagination.perPage),
      currentPage: Number(pagination.currentPage),
      from: (Number(pagination.currentPage) - 1) * Number(pagination.perPage),
      // eslint-disable-next-line max-len
      to: Number(pagination.currentPage) * Number(pagination.perPage) > totalRecord.total ? totalRecord.total : Number(pagination.currentPage) * Number(pagination.perPage),
    },
  }
}

async function saveInducedTraders(crawlTraderIds, dataInsert, dataUpdate) {
  await db.transaction(async (trx) => {
    if (dataInsert && dataInsert.length) {
      console.log('====== Data insert induced_traders: ', dataInsert.length)
      console.log('====== START insert induced_traders: ', moment.utc().format(dateFormat.DATE_TIME_ZONE_1))
      await trx('induced_traders').insert(dataInsert)
      console.log('====== END insert induced_traders: ', moment.utc().format(dateFormat.DATE_TIME_ZONE_1))
    }

    if (dataUpdate && dataUpdate.length) {
      console.log('====== Data update induced_traders: ', dataUpdate.length)
      console.log('====== START update induced_traders: ', moment.utc().format(dateFormat.DATE_TIME_ZONE_1))
      await Promise.all(dataUpdate.map((obj) => {
        return trx('induced_traders').where('crawl_trader_id', obj.crawl_trader_id).update(obj)
      }))
      console.log('====== END update induced_traders: ', moment.utc().format(dateFormat.DATE_TIME_ZONE_1))
    }

    console.log('====== START update import status crawl_traders: ', moment.utc().format(dateFormat.DATE_TIME_ZONE_1))
    // Update status to imported
    await trx('crawl_traders')
      .update({
        import_status: flag.TRUE,
      })
      .whereIn('id', crawlTraderIds)
    console.log('====== END update import status crawl_traders: ', moment.utc().format(dateFormat.DATE_TIME_ZONE_1))
  })
}

async function getSignUpDates() {
  return await dbReader('induced_traders')
    .select(
      dbReader.raw('DATE_FORMAT(signup_date_gmt, \'%Y-%m-%d\') as signup_date'),
      'broker_id',
      'site_id',
      'registration_site',
      dbReader.raw("DATE_FORMAT(MAX(ts_update), '%Y-%m-%d %H:%i:%s') as max_ts_update"),
    )
    .where('summary_flag', flag.FALSE)
    .where('delete_flag', flag.FALSE)
    .groupBy('signup_date', 'broker_id', 'site_id', 'registration_site')
}

async function getInducedTradersForStatistics(conditions) {
  const queries = conditions.map((condition) =>
    dbReader('induced_traders')
      .select(
        dbReader.raw('DATE_FORMAT(signup_date_gmt, \'%Y-%m-%d\') as signup_date'),
        'broker_id',
        'site_id',
        'registration_site',
        dbReader.raw('SUM(IF(new_client_flag = 1, 1, 0)) as new_account_number'),
        dbReader.raw('SUM(CASE WHEN new_client_flag = 1 AND ac_status = 1 THEN 1 ELSE 0 END) as active_account_number'),
        dbReader.raw('SUM(IF(new_client_flag = 0, 1, 0)) as add_account_number'),
      )
      .whereBetween('signup_date_gmt', [`${condition.signup_date} 00:00:00`, `${condition.signup_date} 23:59:59`])
      .where('broker_id', condition.broker_id)
      .where('site_id', condition.site_id)
      .where('registration_site', condition.registration_site)
      .where('delete_flag', flag.FALSE)
      .groupBy('signup_date', 'broker_id', 'site_id', 'registration_site'),
  )
  return dbReader.raw(`${queries.join(' UNION ALL ')}`)
}

const getCrawlTraderIds = async () => {
  return await dbReader('induced_traders').pluck('crawl_trader_id')
}

const updateSummaryFlag = async (conditions) => {
  await Promise.all(
    conditions.map((condition) =>
      db('induced_traders')
        .where('summary_flag', flag.FALSE)
        .whereBetween('signup_date_gmt', [`${condition.signup_date} 00:00:00`, `${condition.signup_date} 23:59:59`])
        .where('broker_id', condition.broker_id)
        .where('site_id', condition.site_id)
        .where('registration_site', condition.registration_site)
        .where('delete_flag', flag.FALSE)
        .where('ts_update', '<=', condition.max_ts_update)
        .update('summary_flag', flag.TRUE),
    ),
  )
}

module.exports = {
  getListInducedTraders,
  saveInducedTraders,
  getSignUpDates,
  getInducedTradersForStatistics,
  getCrawlTraderIds,
  updateSummaryFlag,
}
