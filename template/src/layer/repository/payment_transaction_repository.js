
const { flag, paymentTransactionStatus,
  rateType, baseCurrency, dateFormat, paymentMethodFXON,
  paymentMethodICPAY, paymentMethodMYFOREX,
  paymentType, supportStatus, decisionMethod,
  paymentCategoryFXON, paymentCategoryICPAY, transactionType, commonSiteId,
} = require('constant')

const { getListLatestRate } = require('./m_rate_repository')
const db = require('db').helper
const utility = require('utility')

/* library */
const moment = require('moment')

async function createPaymentTransaction(payload) {
  try {
    const result = await db('payment_transaction').insert(payload)
    return result.length ? true : false
  } catch (error) {
    console.log(error)
    return false
  }
}

async function getPaymentTransactionOfDay(user_id, obj, time, type_search = null) {
  try {
    const query = db('payment_transaction')
      .where(obj)
      .where('user_basic_data_id', user_id)
      .where('delete_flag', flag.FALSE)
      .whereIn('payment_status', [paymentTransactionStatus.ACTION_REQUIRED, paymentTransactionStatus.PENDING, paymentTransactionStatus.APPROVED])
      .whereBetween('ts_regist', [time.accessTimeFrom, time.accessTimeTo])
    let result
    if (type_search === 'sum_amount') {
      const listRate = await db('m_rate')
        .select(
          'id',
          'base',
          'symbol',
          'rate',
          'type',
        )
        .where('type', rateType.LATEST)
      // query.sum('amount')
      const res = await query.clone()
      result = res.reduce((sum, el) => {
        const currency = el.exchange_symbol.split('/')[1]
        let rate
        if (currency !== baseCurrency.JPY) {
          rate = listRate.find((item)=> item.base === currency && item.symbol === baseCurrency.JPY).rate
        } else {
          rate = 1
        }
        return sum + el.amount * rate
      }, 0)
    } else {
      result = await query.clone()
    }
    return result ? result : false
  } catch (error) {
    console.log(error)
    return false
  }
}

async function createPaymentAutoMatching(idMatching, objPayment, objLocalBankApi, walletInfo, amountPayment) {
  try {
    const result = await db.transaction(async (trx) => {
      if (idMatching) {
      // update local bank api success
        const isUpdate = await trx('deposit_local_bank_api')
          .where('id', idMatching)
          .update(objLocalBankApi)
        if (!isUpdate) {
          return false
        }
      }

      // create payment transaction
      const isCreate = await trx('payment_transaction').insert(objPayment)
      if (!isCreate.length) {
        return false
      }

      // increase total assets of wallet if payment transaction approve
      if (objPayment.payment_status === paymentTransactionStatus.APPROVED) {
        const incrementWallet = await trx('wallets')
          .where( 'id', walletInfo.id )
          .increment('total_assets', amountPayment)
        if (!incrementWallet) {
          return false
        }
      }
      return true
    })
    return result ? true : false
  } catch (error) {
    console.log(error)
    return false
  }
}

const updatePaymentStatus = async (payloadUpdateWallet, payloadTransProcess, payloadPaymentTrans, payloadTransHistory) => {
  const result = await db.transaction(async (trx) => {
    // insert transaction process
    await trx('transaction_process').insert(payloadTransProcess)

    // update payment transaction
    await trx('payment_transaction').update({
      decision_date: moment().utc().format(dateFormat.DATE_TIME),
      support_status: [paymentTransactionStatus.APPROVED, paymentTransactionStatus.CLOSE, paymentTransactionStatus.REJECT]
        .includes(payloadPaymentTrans.newStatus) ? supportStatus.COMPLETION : undefined,
      staff_id: payloadPaymentTrans.staff_id,
      reason_id: payloadPaymentTrans.reason_id || null,
      reason_other: payloadPaymentTrans.otherReason || null,
      payment_status: payloadPaymentTrans.newStatus,
      decision_method: decisionMethod.MANUAL,
    }).where('transaction_id', payloadPaymentTrans.transactionId)

    // deposit with fee create 2 fee records, deposit
    // deposit no fee  or withdraw after update transaction_history
    if (payloadTransHistory.length > 0) {
      await trx('transaction_history').where('transaction_id', payloadPaymentTrans.transactionId).del()
      await trx('transaction_history').insert(payloadTransHistory)
    } else {
      await trx('transaction_history').update({
        transaction_status: payloadPaymentTrans.newStatus,
      }).where('transaction_id', payloadPaymentTrans.transactionId)
    }

    // refund if withdraw
    // /add money to your wallet if you make a deposit
    if (payloadUpdateWallet.length) {
      await Promise.all(
        payloadUpdateWallet.map(async (wallet) =>{
          await trx('wallets')
            .where('id', wallet.wallet_id)
            .increment('total_assets', wallet.totalAmount)
          return true
        }),
      )
    }

    return true
  })

  return result
}

const getPaymentTransByUser = async (user_id, payload) =>{
  try {
    return await db('payment_transaction as ps')
      .where('ps.user_basic_data_id', user_id)
      .where('ps.cashback_flag', '<>', flag.TRUE)
      .where(payload)
  } catch (error) {
    console.log(error)
    return false
  }
}

const updateSupportStatus = async (payloadUpdate) =>{
  const result = await db('payment_transaction').update({
    staff_id: payloadUpdate.staff_id,
    decision_method: payloadUpdate.decision_method,
    support_status: payloadUpdate.support_status,
  }).where('id', payloadUpdate.id)

  return result ? true : false
}

function getRateByBaseAndSymbol(listRates, base) {
  return listRates.find((item)=>item.base === base && item.symbol === baseCurrency.JPY).rate
}

const getLisPaymentTransaction = async (filter, pagination) =>{
  const query = db('payment_transaction as p')
    .select(
      'p.id',
      'p.ts_regist',
      'm_site.id as site_id',
      'm_site.site_name',
      'm_site.symbol_logo_path',
      'm_site.symbol_logo_name',
      'm_site.side_logo_path',
      'm_site.side_logo_name',
      'm_site.media_name',
      'p.payment_status',
      'p.payment_type',
      'p.payment_date',
      'p.transaction_id',
      'p.decision_method',
      'p.exchange_symbol',
      'p.amount as transaction_amount',
      'p.amount_currency',
      'p.fee as transaction_fee',
      'p.exchange_rate',
      'p.decision_date',
      'p.support_status',
      'p.reason_id',
      'p.reason_other',
      'p.payment_method_id',
      'p.payment_category_id',
      'p.payment_detail_id',
      'p.payment_company_account_id',
      'p.payment_service_account_id',
      'p.user_basic_data_id as user_id',
      'p.transaction_object_id',
      db.raw('CONCAT(LEFT(admin.last_name_romaji,1),".",admin.first_name_romaji) as staff_name'),

      'm.ja_name as ja_method_name',
      'm.en_name as en_method_name',
      'm.cn_name as cn_method_name',
      'm.kr_name as kr_method_name',
      'm.id as method_id',

      'c.ja_name as ja_category_name',
      'c.en_name as en_category_name',
      'c.cn_name as cn_category_name',
      'c.kr_name as kr_category_name',

      'd.ja_name as ja_detail_name',
      'd.en_name as en_detail_name',
      'd.cn_name as cn_detail_name',
      'd.kr_name as kr_detail_name',

      db.raw(`CASE WHEN ca.ja_company_name IS NULL or ca.ja_company_name = ''
      THEN ca.ja_account_name
      ELSE ca.ja_company_name
      END as ja_company_name`),

      db.raw(`CASE WHEN ca.en_company_name IS NULL  or ca.en_company_name = ''
      THEN ca.en_account_name
      ELSE ca.en_company_name
      END as en_company_name`),

      db.raw(`CASE WHEN ca.cn_company_name IS NULL  or ca.cn_company_name = ''
      THEN ca.cn_account_name
      ELSE ca.cn_company_name
      END as cn_company_name`),

      db.raw(`CASE WHEN ca.kr_company_name IS NULL or ca.kr_company_name = ''
      THEN ca.kr_account_name
      ELSE ca.kr_company_name
      END as kr_account_name`),

      db.raw(`CASE WHEN s.ja_service_name IS NULL or s.ja_service_name = ''
      THEN ta.mt_account_no
      ELSE s.ja_service_name
      END as ja_service_name`),

      db.raw(`CASE WHEN s.en_service_name IS NULL  or s.en_service_name = ''
      THEN ta.mt_account_no
      ELSE s.en_service_name
      END as en_service_name`),

      db.raw(`CASE WHEN s.cn_service_name IS NULL or s.cn_service_name = ''
       THEN ta.mt_account_no
      ELSE s.cn_service_name
      END as cn_service_name`),

      db.raw(`CASE WHEN s.kr_service_name IS NULL or s.kr_service_name = ''
      THEN ta.mt_account_no
      ELSE s.kr_service_name
      END as kr_service_name`),

      'm_reasons.ja_short_reason',
      'm_reasons.en_short_reason',
      'm_reasons.cn_short_reason',
      'm_reasons.kr_short_reason',
      'm_reasons.ja_reason',
      'm_reasons.en_reason',
      'm_reasons.cn_reason',
      'm_reasons.kr_reason',

      'u.email',
      'ta.mt_account_no',
      'i.corporate_name_english',

      db.raw(`CASE WHEN (${filter.name_type ? `"${filter.name_type}"` : null} = "corporate" and u.corporate_flag = 1) then i.corporate_name_english
      ELSE CONCAT(u.first_name_romaji," ",u.last_name_romaji) 
      END AS full_name`,
      ),

      db.raw(`CASE WHEN (p.payment_method_id = ${paymentMethodFXON.BANK} or p.payment_method_id = ${paymentMethodICPAY.BANK}
         or p.payment_method_id = ${paymentMethodMYFOREX.BANK}) and p.payment_type = ${paymentType.PAY_OUT} 
          THEN true ELSE false END  AS is_show_detail`,
      ),

      db.raw(`CASE WHEN fee.transaction_object_id = first_transaction_object.transaction_object_id THEN fee.wallet_balance_after_payment
      ELSE first_transaction_object.wallet_balance_after_payment
      END as first_w_balance`),

      db.raw(`CASE WHEN fee.transaction_object_id = second_transaction_object.transaction_object_id THEN fee.wallet_balance_after_payment
      ELSE second_transaction_object.wallet_balance_after_payment
      END as second_w_balance`),

      db.raw(`CASE WHEN ta.mt_account_no IS NULL THEN first_transaction_object.transaction_object_id
      ELSE CONCAT(u.member_id,"-",ta.platform,"-",ta.currency,"-",ta.mt_account_no)
      END as first_transaction_object_id`),

      'second_transaction_object.transaction_object_id as second_transaction_object_id',

      db.raw(`CASE
        WHEN ta.mt_account_no IS NULL THEN first_wallet.currency
        ELSE ta.currency
        END as first_currency_transaction_object`),

      'second_wallet.currency as second_currency_transaction_object',
    )
    .leftJoin('m_payment_method as m', 'p.payment_method_id', 'm.id')
    .leftJoin('m_payment_category as c', 'p.payment_category_id', 'c.id')
    .leftJoin('m_payment_detail as d', 'p.payment_detail_id', 'd.id')
    .leftJoin('users_corporate as i', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('p.user_basic_data_id', 'i.user_basic_data_id')
        .on('i.beneficial_owner', flag.FALSE)
        .on('i.delete_flag', flag.FALSE)
    })
    .leftJoin('m_payment_service_account_no as s', 'p.payment_service_account_id', 's.id')
    .leftJoin('m_payment_company_account as ca', 'p.payment_company_account_id', 'ca.id')
    .leftJoin('users_basic_data as u', 'p.user_basic_data_id', 'u.id')
    .leftJoin('m_site', 'u.site_id', 'm_site.id')
    .leftJoin('users_basic_data as admin', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('p.staff_id', 'admin.id')
        .on('admin.delete_flag', flag.FALSE)
        .on('admin.site_id', '=', commonSiteId.P2TECH)
    })
    .leftJoin('m_reasons', 'm_reasons.id', 'p.reason_id')
    .leftJoin('trading_accounts as ta', db.raw('CONVERT(ta.id, CHAR)'), 'p.transaction_object_id')

    .leftJoin('transaction_history as first_transaction_object', function() {
      this.on('first_transaction_object.transaction_id', '=', 'p.transaction_id')
        .andOn('first_transaction_object.transaction_object_id', '=', 'p.transaction_object_id')
        .andOn(function() {
          this.on('first_transaction_object.transaction_type', '=', transactionType.DEPOSIT)
            .orOn('first_transaction_object.transaction_type', '=', transactionType.WITHDRAW)
            .orOn('first_transaction_object.transaction_type', '=', transactionType.REDEEM)
        })
    })
    .leftJoin('wallets as first_wallet', 'first_wallet.id', 'first_transaction_object.transaction_object_id')

    .leftJoin('transaction_history as second_transaction_object', function() {
      this.on('second_transaction_object.transaction_id', '=', 'first_transaction_object.transaction_id')
        .andOn('second_transaction_object.transaction_object_id', '<>', 'first_transaction_object.transaction_object_id')
        .andOn(function() {
          this.on('second_transaction_object.transaction_type', '=', transactionType.DEPOSIT)
            .orOn('second_transaction_object.transaction_type', '=', transactionType.WITHDRAW)
        })
        .andOn('second_transaction_object.payment_category_id', '<>', paymentCategoryICPAY.ACCOUNT_TRANSFER)
        .andOn('second_transaction_object.payment_category_id', '<>', paymentCategoryFXON.ACCOUNT_TRANSFER)
    })
    .leftJoin('wallets as second_wallet', 'second_wallet.id', 'second_transaction_object.transaction_object_id')

    .leftJoin('transaction_history as fee', function() {
      this.on('fee.transaction_id', '=', 'p.transaction_id')
        .andOn(function() {
          this.on('fee.transaction_type', '=', transactionType.DEPOSIT_FEE)
            .orOn('fee.transaction_type', '=', transactionType.WITHDRAW_FEE)
        })
    })

    .where('p.delete_flag', flag.FALSE)
    .where('p.cashback_flag', '<>', flag.TRUE)
    .where('m_site.enable_flag', flag.TRUE)

  // search payment transaction
  if (filter['site_id']) {
    query.whereIn('m_site.id', filter['site_id'])
  }

  if (filter['payment_status']) {
    query.whereIn('p.payment_status', filter['payment_status'])
  }

  if (filter['excluding_funds_transfer'] === flag.TRUE) {
    query.whereNotIn('p.payment_category_id', [
      paymentCategoryFXON.ACCOUNT_TRANSFER,
      paymentCategoryICPAY.ACCOUNT_TRANSFER,
    ])
  }

  if (filter['payment_date'] || filter['decision_date'] ) {
    const field = filter['payment_date'] ? 'payment_date' : 'decision_date'
    const start_time = filter['decision_date'] ? filter['decision_date'].split(',')[0] : filter['payment_date'].split(',')[0]
    const end_time = filter['decision_date'] ? filter['decision_date'].split(',')[1] : filter['payment_date'].split(',')[1]
    const utc = (filter.utc || '0').replace('(', '').replace('UTC', '').replace(')', '')

    query.whereBetween(field,
      [moment(start_time)
        .startOf('day')
        .subtract(utc, 'hours')
        .format(dateFormat.DATE_TIME_ZONE)
        .toString(),
      moment(end_time).endOf('day')
        .subtract(utc, 'hours')
        .format(dateFormat.DATE_TIME_ZONE)
        .toString()])
  }

  if ( filter['full_name']) {
    filter['full_name'] = utility.escapeSql(filter['full_name'])
    query.where(
      db.raw(`CASE 
          WHEN (${filter.name_type ? `"${filter.name_type}"` : null} = "corporate" and u.corporate_flag = 1) then i.corporate_name_english
          ELSE CONCAT(u.first_name_romaji," ",u.last_name_romaji) 
          END
          like "%${filter['full_name'].toUpperCase()}%"`),
    )
  }

  if (filter['transaction_id']) {
    filter['transaction_id'] = utility.escapeSql(filter['transaction_id'])
    query.whereILike('p.transaction_id', `%${filter['transaction_id']}%`)
  }

  if (filter['user_id']) {
    query.where('p.user_basic_data_id', filter['user_id'])
  }

  if (filter['email']) {
    filter['email'] = utility.escapeSql(filter['email'])
    query.whereILike('u.email', `%${filter['email']}%`)
  }

  if (filter['payment_method']) {
    query.whereIn('m.en_name', filter['payment_method'])
  }

  if (filter['payment_category']) {
    query.whereIn('c.en_name', filter['payment_category'])
  }

  if (filter['payment_detail']) {
    query.whereIn('d.en_name', filter['payment_detail'])
  }

  if ( filter['company_acc']) {
    filter['company_acc'] = utility.escapeSql(filter['company_acc'])
    query.where(function() {
      if (filter.lang === 'en') {
        this.orWhereILike('ca.en_company_name', `%${filter['company_acc']}%`)
        this.orWhereILike('ca.en_account_name', `%${filter['company_acc']}%`)
      } else if (filter.lang === 'ja') {
        this.orWhereILike('ca.ja_company_name', `%${filter['company_acc']}%`)
        this.orWhereILike('ca.ja_account_name', `%${filter['company_acc']}%`)
      } else if (filter.lang === 'cn') {
        this.orWhereILike('ca.cn_company_name', `%${filter['company_acc']}%`)
        this.orWhereILike('ca.cn_account_name', `%${filter['company_acc']}%`)
      } else if (filter.lang === 'kr') {
        this.orWhereILike('ca.kr_company_name', `%${filter['company_acc']}%`)
        this.orWhereILike('ca.kr_account_name', `%${filter['company_acc']}%`)
      }
    })
  }

  if (filter['service_acc']) {
    filter['service_acc'] = utility.escapeSql(filter['service_acc'])
    query.where(function() {
      if (filter.lang === 'en') {
        this.orWhereILike('s.en_service_name', `%${filter['service_acc']}%`)
        this.orWhereILike('ta.mt_account_no', `%${filter['service_acc']}%`)
      } else if (filter.lang === 'ja') {
        this.orWhereILike('s.ja_service_name', `%${filter['service_acc']}%`)
        this.orWhereILike('ta.mt_account_no', `%${filter['service_acc']}%`)
      } else if (filter.lang === 'cn') {
        this.orWhereILike('s.cn_service_name', `%${filter['service_acc']}%`)
        this.orWhereILike('ta.mt_account_no', `%${filter['service_acc']}%`)
      } else if (filter.lang === 'kr') {
        this.orWhereILike('s.kr_service_name', `%${filter['service_acc']}%`)
        this.orWhereILike('ta.mt_account_no', `%${filter['service_acc']}%`)
      }
    })
  }

  if (filter['payment_type']) {
    query.where('p.payment_type', filter['payment_type'])
  }

  const column = pagination.sort[0].column
  const order = pagination.sort[0].order

  if (['transaction_amount', 'transaction_fee', 'first_w_balance'].includes(column)) {
    const listRates = await getListLatestRate()
    const orderArr = db.raw(`(
      CASE
        WHEN  ${column === 'first_w_balance' ? 'first_currency_transaction_object' : 'p.amount_currency'} = 'USD' 
              THEN ${column} * ${getRateByBaseAndSymbol(listRates, baseCurrency.USD)} 
        WHEN  ${column === 'first_w_balance' ? 'first_currency_transaction_object' : 'p.amount_currency'}  = 'JPY'
              THEN ${column}
        WHEN  ${column === 'first_w_balance' ? 'first_currency_transaction_object' : 'p.amount_currency'} = 'EUR'
              THEN ${column} * ${getRateByBaseAndSymbol(listRates, baseCurrency.EUR)}
        WHEN  ${column === 'first_w_balance' ? 'first_currency_transaction_object' : 'p.amount_currency'}  = 'BTC' 
              THEN ${column} 
        WHEN  ${column === 'first_w_balance' ? 'first_currency_transaction_object' : 'p.amount_currency'}  = 'PT' 
              THEN ${column} * 100
        ELSE ${column}
      END
  ) ${order} , p.payment_date DESC, p.id`)
    return Number(filter.export_csv) === 1 ? await query.orderBy(orderArr, 'DESC') : await query.orderBy(orderArr, 'DESC').paginate(pagination)
  } else {
    return Number(filter.export_csv) === 1 ?
      await query.orderBy([{ column: column, order: order }, { column: 'payment_date', order: 'DESC' }, { column: 'p.id', order: 'DESC' }]) :
      await query.orderBy([{ column: column, order: order }, { column: 'payment_date', order: 'DESC' }, { column: 'p.id', order: 'DESC' }])
        .paginate(pagination)
  }
}

const getPaymentTransDetail = async (payment_transaction_id) =>{
  const query = await db('payment_transaction as ps')
    .leftJoin('m_payment_method', 'ps.payment_method_id', 'm_payment_method.id')
    .leftJoin('m_payment_category', 'ps.payment_category_id', 'm_payment_category.id')
    .leftJoin('m_payment_detail', 'ps.payment_detail_id', 'm_payment_detail.id')
    .leftJoin('m_payment_service_account_no', 'ps.payment_service_account_id', 'm_payment_service_account_no.id')
    .leftJoin('m_payment_company_account', 'ps.payment_company_account_id', 'm_payment_company_account.id')
    .leftJoin('users_basic_data as users', 'ps.user_basic_data_id', 'users.id')
    .leftJoin('users_basic_data as admin', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('ps.staff_id', 'admin.id')
        .on('admin.delete_flag', flag.FALSE)
        .on('admin.site_id', '=', commonSiteId.P2TECH)
    })
    .leftJoin('transaction_history', 'transaction_history.transaction_id', 'ps.transaction_id')
    .leftJoin('wallets', 'wallets.id', 'transaction_history.transaction_object_id')
    .leftJoin('trading_accounts as ta', db.raw('CONVERT(ta.id, CHAR)'), 'ps.transaction_object_id')
    .where('ps.id', payment_transaction_id)
    .where('ps.cashback_flag', '<>', flag.TRUE)
    .where('ps.delete_flag', flag.FALSE)
    .select(
      'ps.payment_status',
      'ps.payment_type',
      'ps.payment_date',
      'ps.transaction_id',
      'ps.decision_date',
      'ps.support_status',
      'ps.exchange_symbol',
      'ps.fee as total_fee',
      'ps.amount as total_amount',
      'ps.exchange_rate',
      'ps.payment_method_id',
      'ps.payment_category_id',
      'ps.payment_detail_id',
      'ps.payment_company_account_id',
      'ps.payment_service_account_id',
      'ps.account_bank_receive_id',
      'ps.amount_currency',
      'ps.staff_id',
      'ps.user_basic_data_id as user_id',
      'ps.decision_method',

      db.raw('CONCAT(LEFT(admin.last_name_romaji,1),".",admin.first_name_romaji) as staff_name'),
      'users.site_id',

      'm_payment_method.ja_name as ja_method_name',
      'm_payment_method.en_name as en_method_name',
      'm_payment_method.cn_name as cn_method_name',
      'm_payment_method.kr_name as kr_method_name',

      'm_payment_category.ja_name as ja_category_name',
      'm_payment_category.en_name as en_category_name',
      'm_payment_category.cn_name as cn_category_name',
      'm_payment_category.kr_name as kr_category_name',

      'm_payment_detail.ja_name as ja_detail_name',
      'm_payment_detail.en_name as en_detail_name',
      'm_payment_detail.cn_name as cn_detail_name',
      'm_payment_detail.kr_name as kr_detail_name',

      'm_payment_company_account.ja_company_name',
      'm_payment_company_account.en_company_name',
      'm_payment_company_account.cn_company_name',
      'm_payment_company_account.kr_company_name',
      'm_payment_company_account.ja_account_name',
      'm_payment_company_account.en_account_name',
      'm_payment_company_account.cn_account_name',
      'm_payment_company_account.kr_account_name',

      'm_payment_service_account_no.ja_service_name',
      'm_payment_service_account_no.en_service_name',
      'm_payment_service_account_no.cn_service_name',
      'm_payment_service_account_no.kr_service_name',

      'transaction_history.transaction_object_id',
      'transaction_history.amount',
      'transaction_history.transaction_type',
      'transaction_history.transaction_object_type',
      'transaction_history.wallet_balance_after_payment',
      'transaction_history.id as transaction_history_id',
      'transaction_history.ja_title',
      'transaction_history.en_title',
      'transaction_history.cn_title',
      'transaction_history.kr_title',
      'transaction_history.exchange_rate as ts_exchange_rate',
      'transaction_history.exchange_symbol as ts_exchange_symbol',

      'wallets.type_wallet',
      'wallets.currency',
      'wallets.total_assets',
      'wallets.wallet_status',
    ).orderBy([{ column: 'transaction_history_id', order: 'ASC' }])
  return query.length ? query : null
}

module.exports = {
  createPaymentTransaction,
  getPaymentTransactionOfDay,
  createPaymentAutoMatching,
  getLisPaymentTransaction,
  getPaymentTransDetail,
  updatePaymentStatus,
  getPaymentTransByUser,
  updateSupportStatus,
}
