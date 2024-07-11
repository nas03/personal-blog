const db = require('db').helper
const { flag, dateFormat, commonSiteId, displayDateTime } = require('constant')
const moment = require('moment')
const _ = require('lodash')
/* func */
const utility = require('utility')

const { getlistSymbolByRebate } = require('./m_symbol_repository')

const getListRebatesMaster = async (condition, pagination) => {
  const orderArr = [...pagination.sort, { column: 'r.id', order: 'DESC' }]
  let query = db('m_rebates AS r')
    .leftJoin('m_broker as b', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('r.broker_id', 'b.id')
    })
    .leftJoin('m_account_type AS a', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('r.account_type_id', 'a.id')
    })
    .leftJoin('users_basic_data as admin', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('r.staff_id', 'admin.id')
        .on('admin.delete_flag', flag.FALSE)
        .on('admin.site_id', '=', commonSiteId.P2TECH)
    })
    .leftJoin('m_ib_rank AS i', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('r.ib_rank_id', 'i.id')
    })
    .leftJoin('m_product_type AS p', function() {
      /* eslint-disable no-invalid-this */
      this
        .on(db.raw('SUBSTRING_INDEX(r.product_type_id, \',\', 1)'), 'p.id')
    })
    .leftJoin('m_rebate_details AS d', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('d.rebate_id', 'r.id')
        .on('d.delete_flag', flag.FALSE)
        .on('d.enable_flag', flag.TRUE)
    })
    .select(
      'r.id AS rebate_id',
      'r.enable_flag',
      'b.broker_name',
      'a.account_type_name',
      'i.id AS ib_rank_id',
      'i.ib_rank',
      'i.ib_rank_name',
      'i.enable_flag as enable_flag_ib_rank',
      'i.broker_id',
      db.raw('1 AS total_ib_rank'),
      'r.platform',
      'p.ja_product_type',
      'p.en_product_type',
      'p.cn_product_type',
      'p.kr_product_type',
      'r.description',
      'r.master_name',
      'r.ts_start',
      'r.ts_end',
      'r.ts_regist',
      db.raw('CONCAT(LEFT(admin.last_name_romaji,1),".",admin.first_name_romaji) as staff_name'),
    )
    .count('d.rebate_id AS total_records')
    .where('r.delete_flag', flag.FALSE)

  let { brokerId, platform, accountTypeId, productTypeId, ibRankId, startTime, endTime, tsFrom, tsTo, isValidOnly, textSearch } = condition

  if (brokerId) {
    query.whereIn('r.broker_id', condition.brokerId)
  }
  if (platform) {
    query.whereIn('r.platform', condition.platform)
  }
  if (accountTypeId) {
    query.whereIn('r.account_type_id', condition.accountTypeId)
  }
  if (productTypeId) {
    query.whereIn('p.en_product_type', condition.productTypeId)
  }
  if (ibRankId) {
    query.whereIn('r.ib_rank_id', condition.ibRankId)
  }

  if (startTime || endTime) {
    const utc = (condition.utc || '0').replace(/[()UTC]/g, '')
    const timeFrom = moment(tsFrom, dateFormat.DATE_1).startOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE)
    const timeTo = moment(tsTo, dateFormat.DATE_1).endOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE)

    query.whereBetween(startTime ? 'r.ts_start' : 'r.ts_end', [timeFrom, timeTo])
  }

  query.groupBy('r.id')

  const ibRank = await db('m_ib_rank AS r')
    .select('broker_id')
    .count('broker_id AS total_ib_rank')
    .where('enable_flag', flag.TRUE)
    .groupBy('broker_id')

  if (isValidOnly === '1') {
    query.where('r.enable_flag', flag.TRUE)
  }

  if (textSearch) {
    query = db(db.raw(`(${query}) AS rebate`))

    // handle display datetime
    let formatDisplay
    switch (condition.display_date_time) {
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

    // handle timezone
    const utcHour = (condition.utc || '').replace(/[()UTC]/g, '') || '+00:00'

    query.andWhere((builder) => {
      textSearch = utility.escapeSql(textSearch)
      builder.whereILike('broker_name', `%${textSearch}%`)
        .orWhereILike('account_type_name', `%${textSearch}%`)
        .orWhereILike('ib_rank_name', `%${textSearch}%`)
        .orWhereILike('platform', `%${textSearch}%`)
        .orWhereILike('ja_product_type', `%${textSearch}%`)
        .orWhereILike('en_product_type', `%${textSearch}%`)
        .orWhereILike('cn_product_type', `%${textSearch}%`)
        .orWhereILike('kr_product_type', `%${textSearch}%`)
        .orWhereILike('master_name', `%${textSearch}%`)
        .orWhereILike('staff_name', `%${textSearch}%`)
        .orWhereILike('total_records', `%${textSearch}%`)
        .orWhereILike(db.raw(`DATE_FORMAT(DATE_ADD(ts_start, INTERVAL '${utcHour}' HOUR_MINUTE),"${formatDisplay} %H:%i")`), `%${textSearch}%`)
        .orWhereILike(db.raw(`DATE_FORMAT(DATE_ADD(ts_end, INTERVAL '${utcHour}' HOUR_MINUTE),"${formatDisplay} %H:%i")`), `%${textSearch}%`)
        .orWhereILike(db.raw(`DATE_FORMAT(DATE_ADD(ts_regist, INTERVAL '${utcHour}' HOUR_MINUTE),"${formatDisplay} %H:%i")`), `%${textSearch}%`)
    })

    if (orderArr[0].column === 'r.ts_regist') {
      orderArr[0].column = 'ts_regist'
    }
    orderArr[1].column = 'rebate_id'
  }

  const data = await query.orderBy(orderArr).paginate(pagination)

  return {
    data,
    ibRank,
  }
}

const createRebateMaster = async (parentRule, childRules) => {
  return await db.transaction(async (trx) => {
    // insert parent rule into table m_rebates
    const parentRuleInserted = await trx('m_rebates').insert(parentRule)
    if (!parentRuleInserted.length) return false

    childRules = childRules.map((item) => {
      return {
        formal_symbol: item.formal_symbol,
        symbol_name: item.symbol_name,
        contract_size: item.contract_size,
        digit_size: item.digit_size,
        margin_currency: item.margin_currency,
        profit_currency: item.profit_currency,
        rebate_id: parentRuleInserted[0],
        enable_flag: item.enable_flag,
        lot_rebate: item.lot_rebate,
        lot_rebate_currency: item.lot_rebate_currency,
        cb_rebate: item.cb_rebate,
        cb_rebate_currency: item.cb_rebate_currency,
        symbol_id: item.symbol_id,
      }
    })

    // insert list child rule into table m_rebate_details
    const isInsertchildRulesRule = await trx('m_rebate_details').insert(childRules)
    if (!isInsertchildRulesRule.length) return false

    return true
  })
}

const updateRebateMaster = async (rebate_id, payloadRebate, listRebateDetail, is_show_popup) => {
  const trx = await db.transaction()
  try {
    // update parent rebate master
    if (!_.isEmpty(payloadRebate) && !is_show_popup) {
      const isUpdateRebate = await trx('m_rebates')
        .update(payloadRebate)
        .where({
          id: rebate_id,
          delete_flag: flag.FALSE,
        })

      if (!isUpdateRebate) {
        throw Object.assign(new Error('Update Rebate fail'), { isCustomError: true })
      }

      if (payloadRebate.enable_flag === flag.FALSE) {
        const updateRebateDetail = await trx('m_rebate_details')
          .update({ enable_flag: flag.FALSE })
          .where({
            delete_flag: flag.FALSE,
            rebate_id,
          })

        if (!updateRebateDetail) {
          throw Object.assign(new Error('Update Rebate Detail fail'), { isCustomError: true })
        }
      }
    }

    // update list child rebate master detail
    if (_.isArray(listRebateDetail) && !is_show_popup) {
      const listDataUpdate = listRebateDetail.map(async (obj) => {
        const objUpdate = obj.enable_flag === flag.FALSE ?
          _.omit(obj, ['id', 'lot_rebate', 'cb_rebate', 'lot_rebate_currency', 'cb_rebate_currency']) :
          _.omit(obj, ['id'])

        const isUpdate = await trx('m_rebate_details')
          .update(objUpdate)
          .where({
            delete_flag: flag.FALSE,
            id: obj.id,
            rebate_id,
          })

        if (!isUpdate) {
          throw Object.assign(new Error('Update list child rebate master detail fail'), { isCustomError: true })
        }

        // If rebate detail is ON, the m_rebates to ON
        if (objUpdate.enable_flag === flag.TRUE) {
          const isUpdate = await trx('m_rebates')
            .update({
              enable_flag: flag.TRUE,
            })
            .where({
              id: rebate_id,
              delete_flag: flag.FALSE,
            })

          if (!isUpdate) {
            throw Object.assign(new Error('Update m_rebates to ON fail'), { isCustomError: true })
          }
        }
      })

      if (listDataUpdate.length > 0) {
        await Promise.all(listDataUpdate)
      }
    }

    if (is_show_popup) {
      const rebateDetail = await trx('m_rebates as r')
        .select(
          'r.id',
          'r.account_type_id',
          'r.platform',
          'r.enable_flag',
          'r.broker_id',
          'r.product_type_id',
          'p.en_product_type',
        )
        .leftJoin('m_product_type AS p', function() {
          /* eslint-disable no-invalid-this */
          this
            .on(db.raw('SUBSTRING_INDEX(r.product_type_id, \',\', 1)'), 'p.id')
        })
        .where('r.id', rebate_id)
        .where('r.delete_flag', flag.FALSE)
        .first()

      if (!rebateDetail) {
        throw Object.assign(new Error('Get rebateDetail fail'), { isCustomError: true })
      }

      const listSymbolCreate = await getlistSymbolByRebate(rebateDetail)

      // insert list symbol into table m_rebate_details
      if (listSymbolCreate.length > 0) {
        const newListSymbol = listSymbolCreate.map((obj) => _.omit(obj, ['product_type_id']))

        const isInsert = await trx('m_rebate_details').insert(newListSymbol)

        if (!isInsert) {
          throw Object.assign(new Error('Insert m_rebate_details fail'), { isCustomError: true })
        }

        // update product_type_id in table m_rebates again
        const oldListProductype = rebateDetail.product_type_id.split(',').map((item) => Number(item))

        const listProductTypeBySymbol = listSymbolCreate.map((item) => item.product_type_id)

        const newListProductype = _.sortBy(
          [...new Set([...oldListProductype, ...listProductTypeBySymbol])],
        )

        if (oldListProductype.length !== newListProductype.length) {
          const isUpdateRebate = await trx('m_rebates')
            .update({ product_type_id: newListProductype.join(',') })
            .where({
              id: rebate_id,
              delete_flag: flag.FALSE,
            })

          if (!isUpdateRebate) {
            throw Object.assign(new Error('Update Rebate fail'), { isCustomError: true })
          }
        }
      }
    }

    await trx.commit()
    return { isError: false }
  } catch (error) {
    console.log(error)
    await trx.rollback()
    if (error.isCustomError) {
      return { isError: true, error }
    }
    throw error
  }
}

const checkRebateExist = async (broker_id, ib_rank_id, account_type_id, en_product_type, ts_start, ts_end, platform) => {
  return await db('m_rebates as mr')
    .select(
      'mr.id',
    )
    .leftJoin('m_product_type AS p', function() {
      /* eslint-disable no-invalid-this */
      this
        .on(db.raw('SUBSTRING_INDEX(mr.product_type_id, \',\', 1)'), 'p.id')
    })
    .where('mr.broker_id', broker_id)
    .where('mr.ib_rank_id', ib_rank_id)
    .where('mr.account_type_id', account_type_id)
    .where('mr.platform', platform)
    .where('mr.delete_flag', flag.FALSE)
    .where('p.en_product_type', en_product_type)
    .where(function() {
      this.where(function() {
        this.where('mr.ts_start', '<', ts_start)
        this.where('mr.ts_end', '>', ts_start)
      })
      this.orWhere(function() {
        this.where('mr.ts_start', '<', ts_end)
        this.where('mr.ts_end', '>', ts_end)
      })
      this.orWhere(function() {
        this.where('mr.ts_start', '<=', ts_start)
        this.where('mr.ts_end', '>=', ts_end)
      })
      this.orWhere(function() {
        this.where('mr.ts_start', '>=', ts_start)
        this.where('mr.ts_end', '<=', ts_end)
      })
    })
}

const checkRebateExistByRebateId = async (broker_id, ib_rank_id, account_type_id, en_product_type, ts_start, ts_end, rebate_id, platform) => {
  return await db('m_rebates as mr')
    .select(
      'mr.id',
    )
    .leftJoin('m_product_type AS p', function() {
      /* eslint-disable no-invalid-this */
      this
        .on(db.raw('SUBSTRING_INDEX(mr.product_type_id, \',\', 1)'), 'p.id')
    })
    .where('mr.broker_id', broker_id)
    .where('mr.ib_rank_id', ib_rank_id)
    .where('mr.account_type_id', account_type_id)
    .where('p.en_product_type', en_product_type)
    .where('mr.platform', platform)
    .where('mr.delete_flag', flag.FALSE)
    .whereNot('mr.id', rebate_id)
    .where(function() {
      this.where(function() {
        this.where('mr.ts_start', '<', ts_start)
        this.where('mr.ts_end', '>', ts_start)
      })
      this.orWhere(function() {
        this.where('mr.ts_start', '<', ts_end)
        this.where('mr.ts_end', '>', ts_end)
      })
      this.orWhere(function() {
        this.where('mr.ts_start', '<=', ts_start)
        this.where('mr.ts_end', '>=', ts_end)
      })
      this.orWhere(function() {
        this.where('mr.ts_start', '>=', ts_start)
        this.where('mr.ts_end', '<=', ts_end)
      })
    })
}

const getAllRebatesForCalculation = async () => {
  const rebateDetail = await db('m_rebates AS r')
    .join('m_rebate_details AS rd', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('rd.rebate_id', 'r.id')
        .on('rd.delete_flag', flag.FALSE)
    })
    .select(
      'r.id',
      'r.broker_id',
      'r.account_type_id',
      'r.enable_flag',
      'r.platform',
      'r.description',
      'r.master_name',
      'r.ts_start',
      'r.ts_end',
      'r.ts_regist',
      'rd.id as detail_id',
      'rd.formal_symbol',
      'rd.symbol_name',
      'rd.contract_size',
      'rd.digit_size',
      'rd.profit_currency',
      'rd.lot_rebate',
      'rd.lot_rebate_currency',
      'rd.cb_rebate',
      'rd.cb_rebate_currency',
      'rd.symbol_id',
    )
    .where('r.enable_flag', flag.TRUE)
    .where('r.delete_flag', flag.FALSE)
    .orderBy([{ column: 'r.ts_regist ', order: 'DESC' }])

  return rebateDetail
}

const getListRebatesByBrokersId = async (brokerIds)=>{
  try {
    return await db('m_rebates')
      .select('broker_id', 'account_type_id', 'ib_rank_id', 'platform', 'product_type_id', 'ts_start', 'ts_end', 'ts_regist')
      .where({
        'delete_flag': flag.FALSE,
        'enable_flag': flag.TRUE,
      })
      .whereIn('broker_id', brokerIds)
      .orderBy('broker_id', 'asc')
  } catch (error) {
    console.log(error)
    return false
  }
}

module.exports = {
  getListRebatesMaster,
  createRebateMaster,
  updateRebateMaster,
  checkRebateExist,
  checkRebateExistByRebateId,
  getAllRebatesForCalculation,
  getListRebatesByBrokersId,
}
