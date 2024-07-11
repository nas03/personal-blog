const db = require('db').helper
const utility = require('utility')
const { paymentCompanyAccountFXON, flag, dateFormat, withdrawalAmountType,
  countryId, transactionStatus } = require('constant')

/* library */
const moment = require('moment')
// const _ = require('lodash')

const createPaypayApiNotification = async (
  dataPayPay,
  dataTransactionProcess,
  transactionId,
  message_code,
  api_common_message_code,
  user_id,
  dataBackMonney,
) => {
  try {
    const result = await db.transaction(async (trx) => {
      // create paypay api fail
      const isCreate = await trx('withdrawal_local_bank_paypay_api').insert(dataPayPay)

      // create transaction process
      await trx('transaction_process').insert(dataTransactionProcess)

      // update transaction status
      const isUpdate = await trx('transaction_history').update({
        transaction_status: transactionStatus.REJECTED,
        api_common_message_code,
        api_error_code: message_code,
      })
        .where('transaction_id', transactionId)
      if (!isUpdate) {
        throw new Error('update fail')
      }

      // back monney
      for (const item of dataBackMonney) {
        const backMonney = await trx('wallets')
          .where({
            id: item.wallet_id,
            user_basic_data_id: user_id,
            delete_flag: 0,
          })
          .increment('total_assets', item.amout_back)
        if (!backMonney) {
          throw new Error('update fail')
        }
      }
      return isCreate[0]
    })
    return result || false
  } catch (error) {
    console.log(error)
    return false
  }
}

const getDetailPaymentPaypayApi = async (trans_id) => {
  try {
    const result = await db('withdrawal_local_bank_paypay_api')
      .select(
        'trans_id',
        'user_basic_data_id as user_id',
        'payment_company_id',
        'post_request',
        'account_local_bank_id',
        'amount',
        'status',
        'transaction_id',
      )
      .where({
        trans_id,
        delete_flag: flag.FALSE,
      })
    return result
  } catch (error) {
    console.log(error)
    return false
  }
}

const getAllPaypayApi = async (pagination, queryString, isCsvMode) => {
  const query = db('withdrawal_local_bank_paypay_api as wlbpa')
    .leftJoin('account_local_bank as alb', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('alb.id', 'wlbpa.account_local_bank_id')
    })
    .leftJoin('users_basic_data as u', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('wlbpa.user_basic_data_id', 'u.id')
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
        .on('wlbpa.api_common_message_code', 'macm.common_message_code')
        .on('macm.delete_flag', flag.FALSE)
    })
    .leftJoin('users_personal as up', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('u.id', 'up.user_basic_data_id')
        .on('up.user_corporate_id', flag.FALSE)
        .on('up.transaction_person', flag.FALSE)
        .on('up.representative_person', flag.FALSE)
        .on('up.beneficial_owner', flag.FALSE)
        .on('up.delete_flag', flag.FALSE)
    })

  if (isCsvMode) {
    query.select(
      db.raw('CASE WHEN wlbpa.ts_regist IS NOT NULL THEN DATE_FORMAT(wlbpa.ts_regist, \'%Y.%m.%d %T\') ELSE \'-\' END as response_date'),
      'wlbpa.trans_id',
      'wlbpa.transaction_id',
      'wlbpa.amount as withdrawal_amount',
      'wlbpa.api_response_code',
      'u.site_id',
      'ms.site_name',
      'alb.bank_code',
      'alb.bank_name',
      'alb.branch_code',
      'alb.branch_name',
      'alb.account_number',
      'wlbpa.post_request',
      db.raw(
        `CASE WHEN up.nationality_id = ${countryId.JAPAN} THEN  CONCAT(up.first_name_katakana,up.last_name_katakana)
         ELSE CONCAT(u.first_name_romaji," ",u.last_name_romaji)
         END AS name`,
      ),
      'alb.account_type',
      'wlbpa.status',
      'macm.en_short_msg',
    )
  } else {
    query.select(
      'wlbpa.trans_id',
      'wlbpa.ts_regist AS response_date',
      'wlbpa.post_request',
      'wlbpa.status as result',
      'wlbpa.api_common_message_code',
      'wlbpa.api_response_code',
      'alb.bank_name',
      'alb.bank_code',
      'alb.branch_name',
      'alb.branch_code',
      'alb.account_type',
      'alb.account_number',
      'u.site_id',
      'ms.site_name',
      'ms.media_name',
      'ms.symbol_logo_path',
      'ms.symbol_logo_name',
      'ms.side_logo_path',
      'ms.side_logo_name',

      'macm.ja_short_msg',
      'macm.ja_long_msg',
      'macm.en_short_msg',
      'macm.en_long_msg',
      'macm.cn_short_msg',
      'macm.cn_long_msg',
      'macm.kr_short_msg',
      'macm.kr_long_msg',
      'wlbpa.transaction_id',
      'wlbpa.amount as withdrawal_amount',
      db.raw(
        `CASE WHEN up.nationality_id = ${countryId.JAPAN} THEN  CONCAT(up.first_name_katakana,up.last_name_katakana)
         ELSE CONCAT(u.first_name_romaji," ",u.last_name_romaji)
         END AS name`,
      ),
    )
  }

  query.where({
    'wlbpa.delete_flag': flag.FALSE,
    'wlbpa.payment_company_id': paymentCompanyAccountFXON.WITHDRAW.LOCAL_BANK.PAYPAY,
  }).where('ms.enable_flag', flag.TRUE)

  if (queryString.transID) {
    queryString.transID = utility.escapeSql(queryString.transID)
    query.whereILike('wlbpa.trans_id', `%${queryString.transID}%`)
  }
  if (queryString.siteId) {
    query.whereIn('u.site_id', queryString.siteId)
  }
  if (queryString.postRequest) {
    query.whereIn('wlbpa.post_request', queryString.postRequest)
  }
  if (queryString.name) {
    queryString.name = utility.escapeSql(queryString.name)
    query.where(db.raw(
      `CASE WHEN up.nationality_id = ${countryId.JAPAN} THEN  CONCAT(up.first_name_katakana,up.last_name_katakana)
       ELSE CONCAT(u.first_name_romaji," ",u.last_name_romaji) END LIKE '%${queryString.name}%'`,
    ))
  }
  if (queryString.bank) {
    queryString.bank = utility.escapeSql(queryString.bank)
    query.where(function() {
      this.whereILike('alb.bank_name', `%${queryString.bank}%`)
        .orWhereILike('alb.bank_code', `%${queryString.bank}%`)
    } )
  }
  if (queryString.branch) {
    queryString.branch = utility.escapeSql(queryString.branch)
    query.where(function() {
      this.whereILike('alb.branch_name', `%${queryString.branch}%`)
        .orWhereILike('alb.branch_code', `%${queryString.branch}%`)
    } )
  }
  if (queryString.accountNumber) {
    queryString.accountNumber = utility.escapeSql(queryString.accountNumber)
    query.whereILike('alb.account_number', `%${queryString.accountNumber}%`)
  }
  if (queryString.accountType) {
    query.whereIn('alb.account_type', queryString.accountType)
  }
  if (queryString.result) {
    query.whereIn('wlbpa.status', queryString.result)
  }
  if (queryString.errorCode) {
    queryString.errorCode = utility.escapeSql(queryString.errorCode)
    query.whereILike('wlbpa.api_response_code', `%${queryString.errorCode}%`)
  }

  const utc = (queryString.utc || '0').replace('(', '').replace('UTC', '').replace(')', '')

  if (queryString.tsFrom && queryString.tsTo) {
    const tsFrom = moment(queryString.tsFrom, dateFormat.DATE).startOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
    const tsTo = moment(queryString.tsTo, dateFormat.DATE).endOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
    query.whereBetween('wlbpa.ts_regist', [tsFrom, tsTo])
  } else if (queryString.tsFrom) {
    const tsFrom = moment(queryString.tsFrom, dateFormat.DATE).startOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
    query.where('wlbpa.ts_regist', '>=', tsFrom)
  } else if (queryString.tsTo) {
    const tsTo = moment(queryString.tsTo, dateFormat.DATE).endOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
    query.where('wlbpa.ts_regist', '<=', tsTo)
  }

  if (queryString.withdrawalAmount) {
    if (!isNaN(queryString.withdrawalAmount) && !isNaN(parseFloat(queryString.withdrawalAmount))) {
      if (queryString.withdrawalAmountType === withdrawalAmountType.OR_MORE) {
        query.where('wlbpa.amount', '>=', queryString.withdrawalAmount)
      } else if (queryString.withdrawalAmountType === withdrawalAmountType.OR_LESS) {
        query.where('wlbpa.amount', '<=', queryString.withdrawalAmount)
      } else {
        query.where('wlbpa.amount', queryString.withdrawalAmount)
      }
    } else {
      query.where(false)
    }
  }

  let orderArr
  if (queryString.sort) {
    orderArr = [...pagination.sort, { column: 'wlbpa.trans_id', order: 'DESC' }, { column: 'wlbpa.ts_regist', order: 'DESC' }]
  } else {
    orderArr = [{ column: 'wlbpa.trans_id', order: 'DESC' }, { column: 'wlbpa.ts_regist', order: 'DESC' }]
  }
  if (isCsvMode) {
    return await query.orderBy(orderArr)
  }
  return await query.orderBy(orderArr).paginate(pagination)
}

module.exports = {
  getAllPaypayApi,
  createPaypayApiNotification,
  getDetailPaymentPaypayApi,
}
