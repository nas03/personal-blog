/* DB */
const db = require('db').helper
const { getListLatestRate } = require('./m_rate_repository')

/* constant */
const { flag, dateFormat, depositAmountType, creditCardPostRequest, baseCurrency } = require('constant')

/* func */
const utility = require('utility')

/* library */
const moment = require('moment')
const _ = require('lodash')

const getAllCreditCardApi = async (pagination, queryString, isCsvMode) => {
  const rateInfo = await getListLatestRate()
  const usdRate = _rateToJPY(rateInfo, baseCurrency.USD)
  const eurRate = _rateToJPY(rateInfo, baseCurrency.EUR)

  const query = db('deposit_credit_card_api as dcca')
    .leftJoin('users_basic_data as u', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('dcca.user_basic_data_id', 'u.id')
        .on('u.delete_flag', flag.FALSE)
    })
    .leftJoin('m_site as ms', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('u.site_id', 'ms.id')
        .on('ms.delete_flag', flag.FALSE)
    })
    .leftJoin('m_api_common_message as macm', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('dcca.error_reason', 'macm.common_message_code')
        .on('macm.delete_flag', flag.FALSE)
    })

  // check if the CSV export mode
  if (isCsvMode) {
    query.select(
      'dcca.id',
      'dcca.ts_regist as response_date',
      'dcca.invoice_no',
      'ms.site_name',
      db.raw('\'Payment Notification\' as post_request'),
      'dcca.fullname as name',
      'dcca.card_brand',
      'dcca.request_amount',
      'dcca.deposit_amount',
      'dcca.status',
      'dcca.transaction_id',
      'dcca.error_code',
      'dcca.error_reason',
      'dcca.currency',
      db.raw(`
        CASE 
          WHEN dcca.currency = '${baseCurrency.USD}' THEN dcca.request_amount * ${usdRate}
          WHEN dcca.currency = '${baseCurrency.EUR}' THEN dcca.request_amount * ${eurRate}
        ELSE dcca.request_amount END as request_amount_sort`,
      ),
      db.raw(`
        CASE 
          WHEN dcca.currency = '${baseCurrency.USD}' THEN dcca.deposit_amount * ${usdRate}
          WHEN dcca.currency = '${baseCurrency.EUR}' THEN dcca.deposit_amount * ${eurRate}
        ELSE dcca.deposit_amount END as deposit_amount_sort`,
      ),
      db.raw('CASE WHEN macm.ja_short_msg IS NULL THEN dcca.error_reason ELSE macm.ja_short_msg END as ja_short_message'),
      db.raw('CASE WHEN macm.en_short_msg IS NULL THEN dcca.error_reason ELSE macm.en_short_msg END as en_short_message'),
      db.raw('CASE WHEN macm.cn_short_msg IS NULL THEN dcca.error_reason ELSE macm.cn_short_msg END as cn_short_message'),
      db.raw('CASE WHEN macm.kr_short_msg IS NULL THEN dcca.error_reason ELSE macm.kr_short_msg END as kr_short_message'),
    )
  } else {
    query.select(
      'dcca.id',
      'dcca.ts_regist as response_date',
      'dcca.invoice_no',
      'u.site_id',

      'ms.media_name',
      'ms.site_name',
      'ms.symbol_logo_path',
      'ms.symbol_logo_name',
      'ms.side_logo_path',
      'ms.side_logo_name',

      'dcca.post_request',
      'dcca.fullname as name',
      'dcca.card_brand',
      'dcca.request_amount',
      'dcca.deposit_amount',
      'dcca.status',
      'dcca.transaction_id',
      'dcca.error_code',
      'dcca.error_reason',
      'dcca.currency',
      db.raw(`
        CASE 
          WHEN dcca.currency = '${baseCurrency.USD}' THEN dcca.request_amount * ${usdRate}
          WHEN dcca.currency = '${baseCurrency.EUR}' THEN dcca.request_amount * ${eurRate}
        ELSE dcca.request_amount END as request_amount_sort`,
      ),
      db.raw(`
        CASE 
          WHEN dcca.currency = '${baseCurrency.USD}' THEN dcca.deposit_amount * ${usdRate}
          WHEN dcca.currency = '${baseCurrency.EUR}' THEN dcca.deposit_amount * ${eurRate}
        ELSE dcca.deposit_amount END as deposit_amount_sort`,
      ),
      db.raw('CASE WHEN macm.ja_short_msg IS NULL THEN dcca.error_reason ELSE macm.ja_short_msg END as ja_short_message'),
      db.raw('CASE WHEN macm.en_short_msg IS NULL THEN dcca.error_reason ELSE macm.en_short_msg END as en_short_message'),
      db.raw('CASE WHEN macm.cn_short_msg IS NULL THEN dcca.error_reason ELSE macm.cn_short_msg END as cn_short_message'),
      db.raw('CASE WHEN macm.kr_short_msg IS NULL THEN dcca.error_reason ELSE macm.kr_short_msg END as kr_short_message'),
    )
  }

  query.where({
    'dcca.delete_flag': flag.FALSE,
    'dcca.post_request': creditCardPostRequest.PAYMENT_NOTIFICATION,
  })
    .where('ms.enable_flag', flag.TRUE)

  // search by invoiceNo
  if (queryString.invoiceNo) {
    queryString.invoiceNo = utility.escapeSql(queryString.invoiceNo)
    query.whereILike('dcca.invoice_no', `%${queryString.invoiceNo}%`)
  }

  // search by array siteId
  if (!_.isEmpty(queryString.siteId)) {
    query.whereIn('u.site_id', queryString.siteId)
  }

  // search by name
  if (queryString.name) {
    queryString.name = utility.escapeSql(queryString.name)
    query.where('dcca.fullname', 'LIKE', `%${queryString.name}%`)
  }

  // search by cardBrand
  if (!_.isEmpty(queryString.cardBrand)) {
    query.whereIn('dcca.card_brand', queryString.cardBrand)
  }

  // search by result
  if (!_.isEmpty(queryString.status)) {
    query.whereIn('dcca.status', queryString.status)
  }

  // search by errorCode
  if (queryString.errorCode) {
    queryString.errorCode = utility.escapeSql(queryString.errorCode)
    query.where('dcca.error_code', 'LIKE', `%${queryString.errorCode}%`)
  }

  // search by responseDate
  const utc = (queryString.utc || '0').replace('(', '').replace('UTC', '').replace(')', '')
  if (queryString.tsFrom && queryString.tsTo) {
    const tsFrom = moment(queryString.tsFrom).startOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
    const tsTo = moment(queryString.tsTo).endOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
    query.whereBetween('dcca.ts_regist', [tsFrom, tsTo])
  } else if (queryString.tsFrom) {
    const tsFrom = moment(queryString.tsFrom).startOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
    query.where('dcca.ts_regist', '>=', tsFrom)
  } else if (queryString.tsTo) {
    const tsTo = moment(queryString.tsTo).endOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
    query.where('dcca.ts_regist', '<=', tsTo)
  }

  // search by depositAmount
  if (queryString.depositAmount) {
    if (!isNaN(queryString.depositAmount) && !isNaN(parseFloat(queryString.depositAmount))) {
      const usdQueryAmount = _convertAmountQuery(rateInfo, baseCurrency.USD, queryString.depositAmount)
      const eurQueryAmount = _convertAmountQuery(rateInfo, baseCurrency.EUR, queryString.depositAmount)
      const jpyQueryAmount = _convertAmountQuery(rateInfo, baseCurrency.JPY, queryString.depositAmount)
      let filterOperator = '='
      if (queryString.depositAmountType === depositAmountType.OR_MORE) {
        filterOperator = '>='
      } else if (queryString.depositAmountType === depositAmountType.OR_LESS) {
        filterOperator = '<='
      }
      query.where(function() {
        this.where(function() {
          this.where('dcca.currency', baseCurrency.JPY)
            .andWhere('dcca.deposit_amount', filterOperator, jpyQueryAmount)
        })
          .orWhere(function() {
            this.where('dcca.currency', baseCurrency.USD)
              .andWhere('dcca.deposit_amount', filterOperator, usdQueryAmount)
          })
          .orWhere(function() {
            this.where('dcca.currency', baseCurrency.EUR)
              .andWhere('dcca.deposit_amount', filterOperator, eurQueryAmount)
          })
      })
    } else {
      query.where('dcca.deposit_amount', -1)
    }
  }

  const orderArr = [...pagination.sort, { column: 'id', order: 'DESC' }]

  if (isCsvMode) {
    return await query.orderBy(orderArr)
  }
  return await query.orderBy(orderArr).paginate(pagination)
}

const getDepositCreditCardApi = async (obj) => {
  const result = await db('deposit_credit_card_api')
    .select(
      'invoice_no',
      'wallet_id',
      'user_basic_data_id as user_id',
      'fullname',
      'request_amount',
      'currency',
      'transaction_id',
    )
    .where(obj)
    .where({
      delete_flag: flag.FALSE,
    })
    .first()

  return result ? result : null
}

const createDepositCreditCardApi = async (obj) => {
  try {
    const result = await db('deposit_credit_card_api').insert(obj)
    return result.length ? result[0] : null
  } catch (error) {
    console.log(error)
    return null
  }
}

const updateDepositCreditCardApi = async (id, obj) => {
  try {
    const result = await db('deposit_credit_card_api')
      .where('id', id)
      .update(obj)
    return result ? result : null
  } catch (error) {
    console.log(error)
    return null
  }
}

const _rateToJPY = (rates, currency) =>{
  if (!rates.length) return 1
  switch (currency) {
    case baseCurrency.USD:
      return rates.find((item) => item.base === baseCurrency.USD && item.symbol === baseCurrency.JPY).rate
    case baseCurrency.EUR:
      return rates.find((item) => item.base === baseCurrency.EUR && item.symbol === baseCurrency.JPY).rate
    default:
      return 1
  }
}

const _convertAmountQuery = (rates, currency, amount) =>{
  if (!rates.length) return 1
  let rate
  switch (currency) {
    case baseCurrency.USD:
      rate = rates.find((item) => item.base === baseCurrency.JPY && item.symbol === baseCurrency.USD).rate
      return utility.roundNumber(amount * rate, 2)
    case baseCurrency.EUR:
      rate = rates.find((item) => item.base === baseCurrency.JPY && item.symbol === baseCurrency.EUR).rate
      return utility.roundNumber(amount * rate, 2)
    case baseCurrency.JPY:
      return utility.roundNumber(amount, 0)
    default:
      return 1
  }
}

module.exports = {
  getAllCreditCardApi,
  getDepositCreditCardApi,
  createDepositCreditCardApi,
  updateDepositCreditCardApi,
}
