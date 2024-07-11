
const db = require('db').helper
const utility = require('utility')
const {
  flag, dateFormat, userMatchingStatus, paymentTransactionStatus, postRequest, bankApi,
  supportStatus, localBankTimeType, depositAmountType, typeWallet, decisionMethod,
  paymentCompanyAccountFXON, typeTransactionProcess,
  baseCurrency, actionGroupTransactionProcess, commonSiteId, countryId,
} = require('constant')

/* library */
const moment = require('moment')
const _ = require('lodash')

const getPaymentNotificationById = async (id) => {
  const result = await db('deposit_local_bank_api')
    .select(
      'id',
      'transaction_id',
      'amount',
      'matching_process_status',
      'support_status',
      'ts_regist',
      'payment_company_id',
    )
    .where('id', id)
    .where('post_request', postRequest.PAYMENT_NOTIFICATION)
    .where('delete_flag', flag.FALSE)
    .first()
  return result
}

const updateById = async (id, payload) => {
  return await db('deposit_local_bank_api')
    .update(payload)
    .where('id', id)
    .where('delete_flag', flag.FALSE)
}

const getFirstRequestByUserId = async (userId, paymentCompanyId) => {
  const result = await db('deposit_local_bank_api as dl')
    .select(
      'dl.id',
      'dl.wallet_id',
      'dl.merchant_id',
    )
    .where('dl.user_basic_data_id', userId)
    .where('dl.post_request', postRequest.BANK_REQUEST)
    .where('dl.payment_company_id', paymentCompanyId)
    .where('dl.delete_flag', flag.FALSE)
    .orderBy([
      { column: 'dl.ts_regist', order: 'ASC' },
    ])
    .first()
  return result
}

const updateStatusToSuccess = async (id, userInfo, staffId, firstRequest, objPayment) => {
  const result = await db.transaction(async (trx) => {
    const updateStatusRes = await trx('deposit_local_bank_api')
      .update({
        user_basic_data_id: userInfo.id,
        member_id: userInfo.member_id,
        wallet_id: firstRequest.wallet_id || null,
        merchant_id: firstRequest.merchant_id || null,
        matching_process_status: userMatchingStatus.SUCCESS,
        processing_date: moment().utc().format(dateFormat.DATE_TIME),
        reason_id: null,
        reason_other: null,
        support_status: supportStatus.COMPLETION,
        staff_id: staffId,
        matching_method: decisionMethod.MANUAL,
      })
      .where('id', id)
      .where('delete_flag', flag.FALSE)

    if (!updateStatusRes) {
      return false
    }

    // create payment transaction
    await trx('payment_transaction')
      .insert(objPayment)

    // increase total assets of wallet if payment transaction approve
    if (objPayment.payment_status === paymentTransactionStatus.APPROVED) {
      const incrementWallet = await trx('wallets')
        .where({
          user_basic_data_id: objPayment.user_basic_data_id,
          type_wallet: typeWallet.JPY_WALLET,
          delete_flag: flag.FALSE,
        })
        .increment('total_assets', objPayment.amount)
      if (!incrementWallet) {
        return false
      }
    }

    return true
  })
  return result
}

const getLocalBankApi = async (obj) => {
  const res = await db('deposit_local_bank_api')
    .select(
      'user_basic_data_id as user_id',
      'member_id',
      'post_request',
      'amount',
      'product_name',
      'u_id',
      'email',
      'phone_number',
      'merchant_id',
    )
    .where(obj)
    .where('delete_flag', flag.FALSE)
    .where('post_request', postRequest.BANK_REQUEST)
    .orderBy([
      { column: 'ts_regist', order: 'ASC' },
    ])
    .first()

  return res
}

const createLocalBankApi = async (obj) => {
  try {
    const result = await db.transaction(async (trx) => {
      const isCreate = await trx('deposit_local_bank_api').insert(obj)
      if (!isCreate.length) {
        return false
      }
      return isCreate[0]
    })
    return result || false
  } catch (error) {
    console.log(error)
    return false
  }
}

const getAllLocalBankApi = async (pagination, queryString, isCsvMode) => {
  const query = db('deposit_local_bank_api as dlba')
    .leftJoin('account_local_bank as alb', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('alb.deposit_request_id', 'dlba.id')
        .on('alb.delete_flag', flag.FALSE)
    })
    .leftJoin('users_basic_data as u', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('dlba.member_id', 'u.member_id')
        .on('u.delete_flag', flag.FALSE)
    })
    .leftJoin('users_personal as up', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('u.id', 'up.user_basic_data_id')
        .on('up.user_corporate_id', flag.FALSE)
        .on('up.transaction_person', flag.FALSE)
        .on('up.representative_person', flag.FALSE)
        .on('up.beneficial_owner', flag.FALSE)
    })
    .leftJoin('users_corporate as uc', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('u.id', 'uc.user_basic_data_id')
        .on('uc.beneficial_owner', flag.FALSE)
    })
    .leftJoin('users_basic_data as admin', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('dlba.staff_id', 'admin.id')
        .on('admin.delete_flag', flag.FALSE)
        .on('admin.site_id', '=', commonSiteId.P2TECH)
    })
    .leftJoin('m_reasons as mr', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('dlba.reason_id', 'mr.id')
        .on('mr.delete_flag', flag.FALSE)
    })
    .leftJoin('m_site as ms', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('u.site_id', 'ms.id')
        .on('ms.delete_flag', flag.FALSE)
    })


  if (isCsvMode) {
    query.select(
      'dlba.id',
      'dlba.ts_regist as response_date',
      'alb.allotted_at as allotted_at',
      'dlba.payment_id',
      'ms.site_name as site',
      'dlba.merchant_id',
      db.raw(
        `CASE WHEN dlba.post_request = ${postRequest.BANK_REQUEST} THEN  \'Bank Request\'
         WHEN dlba.post_request = ${postRequest.PAYMENT_NOTIFICATION} THEN  \'Payment Notification\' END AS post_request`,
      ),
      db.raw(
        `CASE
          WHEN post_request = ${postRequest.BANK_REQUEST} AND u.corporate_flag = 0 THEN (
            CASE
             WHEN up.nationality_id = ${countryId.JAPAN} THEN CONCAT(up.last_name_katakana," ",up.first_name_katakana)
            ELSE CONCAT(u.first_name_romaji," ",u.last_name_romaji) END 
            )
          WHEN post_request = ${postRequest.BANK_REQUEST} AND u.corporate_flag = 1 THEN ( 
             CASE 
              WHEN uc.country_id = ${countryId.JAPAN} THEN uc.corporate_name_katakana
            ELSE uc.corporate_name_english END
            )
          ELSE TRIM(SUBSTRING(dlba.remitter_name, 7))
        END as name`,
      ),
      db.raw(`CASE WHEN post_request = ${postRequest.BANK_REQUEST} THEN u.email ELSE dlba.email END as email`),
      db.raw(`CASE WHEN post_request = ${postRequest.BANK_REQUEST} THEN u.member_id ELSE dlba.member_id END as member_id`),
      db.raw(`CASE WHEN post_request = ${postRequest.BANK_REQUEST} THEN u.phone_number ELSE dlba.phone_number END as phone_number`),
      db.raw('CONCAT(alb.bank_name," ",alb.branch_name, "(" , alb.branch_code, ")") AS bank_branch_code'),
      db.raw('CONCAT(alb.account_type," ",alb.account_number) AS type_number_account'),
      'alb.account_name',
      db.raw(
        `CASE WHEN dlba.post_request = ${postRequest.BANK_REQUEST} THEN dlba.amount ` +
        'ELSE NULL END AS request_amount ',
      ),
      db.raw(
        `CASE WHEN dlba.post_request = ${postRequest.BANK_REQUEST} THEN alb.deposit_count ` +
        'ELSE NULL END AS deposit_count ',
      ),
      db.raw(
        `CASE WHEN dlba.post_request = ${postRequest.BANK_REQUEST} THEN alb.last_deposit_at ELSE NULL END AS last_dept_date`,
      ),
      db.raw(
        `CASE WHEN dlba.post_request = ${postRequest.PAYMENT_NOTIFICATION} THEN dlba.amount ` +
        'ELSE NULL END AS deposit_amount ',
      ),
      db.raw(
        `CASE WHEN dlba.post_request = ${postRequest.PAYMENT_NOTIFICATION} THEN dlba.processing_date ELSE NULL END AS processing_date`,
      ),
      'dlba.matching_process_status AS matching_process',
      db.raw(
        `CASE WHEN dlba.post_request = ${postRequest.PAYMENT_NOTIFICATION} THEN
        CASE WHEN dlba.matching_process_status = ${userMatchingStatus.ACTION_REQUIRED} THEN \'Action Required\'
        WHEN dlba.matching_process_status = ${userMatchingStatus.PENDING} THEN \'Pending\'
        WHEN dlba.matching_process_status = ${userMatchingStatus.SUCCESS} THEN \'Success\'
        WHEN dlba.matching_process_status = ${userMatchingStatus.REJECT} THEN \'Reject\'
        WHEN dlba.matching_process_status = ${userMatchingStatus.CLOSE} THEN \'Close\' END
        ELSE NULL END AS matching_process_text`,
      ),
      db.raw(
        `CASE WHEN dlba.post_request = ${postRequest.PAYMENT_NOTIFICATION} THEN
        CASE
          WHEN dlba.matching_process_status = ${userMatchingStatus.PENDING}
            OR dlba.matching_process_status = ${userMatchingStatus.REJECT}
            OR dlba.matching_process_status = ${userMatchingStatus.CLOSE} THEN
            CASE
              WHEN dlba.reason_id IS NULL THEN dlba.reason_other ELSE mr.en_short_reason
            END
        END ELSE NULL END AS reason`,
      ),
      db.raw(`CASE WHEN dlba.post_request = ${postRequest.PAYMENT_NOTIFICATION} THEN dlba.transaction_id END as transaction_id`),
      db.raw(
        `CASE WHEN dlba.post_request = ${postRequest.PAYMENT_NOTIFICATION} THEN
          CASE WHEN admin.first_name_romaji IS NOT NULL THEN
            CASE WHEN dlba.support_status = ${supportStatus.WORKING} THEN \'Working\'
                 WHEN dlba.support_status = ${supportStatus.COMPLETION} THEN \'Comp\'
            END
          END END as support_status`,
      ),
      db.raw(
        `CASE WHEN dlba.post_request = ${postRequest.PAYMENT_NOTIFICATION} THEN
          CASE WHEN admin.first_name_romaji IS NULL THEN \'System\' ELSE 
          CONCAT(LEFT(admin.last_name_romaji,1),".",admin.first_name_romaji) END END as staff_name`,
      ),
    )
  } else {
    query.select(
      'dlba.id',
      'dlba.ts_regist AS response_date',
      'alb.allotted_at',
      'dlba.payment_id',
      'u.site_id',
      'ms.symbol_logo_path',
      'ms.symbol_logo_name',
      'ms.side_logo_path',
      'ms.side_logo_name',
      'ms.site_name',
      'dlba.merchant_id',
      'dlba.post_request',
      db.raw(
        `CASE
          WHEN post_request = ${postRequest.BANK_REQUEST} AND u.corporate_flag = 0 THEN (
            CASE
             WHEN up.nationality_id = ${countryId.JAPAN} THEN CONCAT(up.last_name_katakana," ",up.first_name_katakana)
            ELSE CONCAT(u.first_name_romaji," ",u.last_name_romaji) END 
            )
          WHEN post_request = ${postRequest.BANK_REQUEST} AND u.corporate_flag = 1 THEN ( 
             CASE 
              WHEN uc.country_id = ${countryId.JAPAN} THEN uc.corporate_name_katakana
            ELSE uc.corporate_name_english END
            )
          ELSE TRIM(SUBSTRING(dlba.remitter_name, 7))
        END as name`,
      ),
      db.raw(`CASE WHEN post_request = ${postRequest.BANK_REQUEST} THEN u.email ELSE dlba.email END as email`),
      db.raw(`CASE WHEN post_request = ${postRequest.BANK_REQUEST} THEN u.member_id ELSE dlba.member_id END as member_id`),
      db.raw(`CASE WHEN post_request = ${postRequest.BANK_REQUEST} THEN u.phone_number ELSE dlba.phone_number END as phone_number`),
      'alb.bank_name',
      'alb.branch_name',
      'alb.branch_code',
      db.raw('CONCAT(alb.bank_name," ",alb.branch_name, "(" , alb.branch_code, ")") AS bank_branch_code'),
      'alb.account_type',
      'alb.account_number',
      db.raw('CONCAT(alb.account_type," ",alb.account_number) AS type_number_account'),
      'alb.account_name',
      db.raw(
        `CASE WHEN dlba.post_request = ${postRequest.BANK_REQUEST} THEN dlba.amount ` +
        'ELSE NULL END AS request_amount ',
      ),
      db.raw(
        `CASE WHEN dlba.post_request = ${postRequest.BANK_REQUEST} THEN alb.deposit_count ` +
        'ELSE NULL END AS deposit_count ',
      ),
      db.raw(
        `CASE WHEN dlba.post_request = ${postRequest.BANK_REQUEST} THEN alb.last_deposit_at ` +
        'ELSE NULL END AS last_dept_date ',
      ),
      db.raw(
        `CASE WHEN dlba.post_request = ${postRequest.PAYMENT_NOTIFICATION} THEN dlba.amount ` +
        'ELSE NULL END AS deposit_amount ',
      ),
      'dlba.processing_date',
      'dlba.matching_process_status AS matching_process',
      'mr.ja_short_reason',
      'mr.en_short_reason',
      'mr.cn_short_reason',
      'mr.kr_short_reason',
      'dlba.reason_other',
      'dlba.transaction_id',
      'dlba.matching_method',
      'dlba.support_status',
      db.raw('CONCAT(LEFT(admin.last_name_romaji,1),".",admin.first_name_romaji) as staff_name'),
    )
  }

  query.where({
    'dlba.delete_flag': flag.FALSE,
    'dlba.payment_company_id': paymentCompanyAccountFXON.DEPOSIT.BANK_TRANSFER.MAX_CONNECT,
  })
    .where('ms.enable_flag', flag.TRUE)

  if (queryString.paymentId) {
    queryString.paymentId = utility.escapeSql(queryString.paymentId)
    query.whereILike('dlba.payment_id', `%${queryString.paymentId}%`)
  }
  // search by array merchantId, siteId, postRequest, matchingProcess
  if (!_.isEmpty(queryString.merchantId)) {
    let isBlank = false
    if (queryString.merchantId.includes('blank')) {
      isBlank = true
      queryString.merchantId = queryString.merchantId.filter((item) => item !== 'blank')
    }

    if (!isBlank) {
      query.whereIn('dlba.merchant_id', queryString.merchantId)
    } else {
      if (_.isEmpty(queryString.merchantId)) {
        query.whereNull('dlba.merchant_id')
      } else {
        query.where((builder) => {
          builder.whereNull('dlba.merchant_id')
            .orWhereIn('dlba.merchant_id', queryString.merchantId)
        })
      }
    }
  }

  if (!_.isEmpty(queryString.siteId)) {
    query.whereIn('u.site_id', queryString.siteId)
  }

  if (!_.isEmpty(queryString.postRequest)) {
    query.whereIn('dlba.post_request', queryString.postRequest)
  }

  if (!_.isEmpty(queryString.matchingProcess)) {
    query.whereIn('dlba.matching_process_status', queryString.matchingProcess)
  }
  // search by name, email, memberId
  if (queryString.name) {
    queryString.name = utility.escapeSql(queryString.name)
    query.where(db.raw(
      `CASE
        WHEN post_request = ${postRequest.BANK_REQUEST} THEN CONCAT(u.first_name_romaji," ",u.last_name_romaji)
        ELSE dlba.remitter_name
      END`,
    ), 'LIKE', `%${queryString.name}%`)
  }

  if (queryString.email) {
    queryString.email = utility.escapeSql(queryString.email)
    query.whereILike(db.raw(`CASE WHEN post_request = ${postRequest.BANK_REQUEST} THEN u.email ELSE dlba.email END`), `%${queryString.email}%`)
  }

  if (queryString.memberId) {
    queryString.memberId = utility.escapeSql(queryString.memberId)
    query.whereILike(
      db.raw(`CASE WHEN post_request = ${postRequest.BANK_REQUEST} THEN u.member_id ELSE dlba.member_id END`),
      `%${queryString.memberId}%`,
    )
  }

  const utc = (queryString.utc || '0').replace('(', '').replace('UTC', '').replace(')', '')
  // choose option typeTime
  if (queryString.timeType === localBankTimeType.RESPONSE) {
    if (queryString.tsFrom && queryString.tsTo) {
      const tsFrom = moment(queryString.tsFrom).startOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
      const tsTo = moment(queryString.tsTo).endOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
      query.whereBetween('dlba.ts_regist', [tsFrom, tsTo])
    } else if (queryString.tsFrom) {
      const tsFrom = moment(queryString.tsFrom).startOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
      query.where('dlba.ts_regist', '>=', tsFrom)
    } else if (queryString.tsTo) {
      const tsTo = moment(queryString.tsTo).endOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
      query.where('dlba.ts_regist', '<=', tsTo)
    }
  } else if (queryString.timeType === localBankTimeType.ALLOTTED) {
    if (queryString.tsFrom && queryString.tsTo) {
      const tsFrom = moment(queryString.tsFrom).startOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
      const tsTo = moment(queryString.tsTo).endOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
      query.whereBetween('alb.allotted_at', [tsFrom, tsTo])
    } else if (queryString.tsFrom) {
      const tsFrom = moment(queryString.tsFrom).startOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
      query.where('alb.allotted_at', '>=', tsFrom)
    } else if (queryString.tsTo) {
      const tsTo = moment(queryString.tsTo).endOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
      query.where('alb.allotted_at', '<=', tsTo)
    }
  } else if (queryString.timeType === localBankTimeType.PROCESSING) {
    if (queryString.tsFrom && queryString.tsTo) {
      const tsFrom = moment(queryString.tsFrom).startOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
      const tsTo = moment(queryString.tsTo).endOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
      query.whereBetween(
        db.raw(`CASE WHEN dlba.post_request = ${postRequest.PAYMENT_NOTIFICATION} THEN dlba.processing_date ELSE NULL END`),
        [tsFrom, tsTo],
      )
    } else if (queryString.tsFrom) {
      const tsFrom = moment(queryString.tsFrom).startOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
      query.where(
        db.raw(`CASE WHEN dlba.post_request = ${postRequest.PAYMENT_NOTIFICATION} THEN dlba.processing_date ELSE NULL END`),
        '>=',
        tsFrom,
      )
    } else if (queryString.tsTo) {
      const tsTo = moment(queryString.tsTo).endOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
      query.where(
        db.raw(`CASE WHEN dlba.post_request = ${postRequest.PAYMENT_NOTIFICATION} THEN dlba.processing_date ELSE NULL END`),
        '<=',
        tsTo,
      )
    }
  } else if (queryString.timeType === localBankTimeType.LAST_DEPT) {
    if (queryString.tsFrom && queryString.tsTo) {
      const tsFrom = moment(queryString.tsFrom).startOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
      const tsTo = moment(queryString.tsTo).endOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
      query.whereBetween(
        db.raw(`CASE WHEN dlba.post_request = ${postRequest.BANK_REQUEST} THEN alb.last_deposit_at ELSE NULL END`),
        [tsFrom, tsTo],
      )
    } else if (queryString.tsFrom) {
      const tsFrom = moment(queryString.tsFrom).startOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
      query.where(
        db.raw(`CASE WHEN dlba.post_request = ${postRequest.BANK_REQUEST} THEN alb.last_deposit_at ELSE NULL END`),
        '>=',
        tsFrom,
      )
    } else if (queryString.tsTo) {
      const tsTo = moment(queryString.tsTo).endOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
      query.where(
        db.raw(`CASE WHEN dlba.post_request = ${postRequest.BANK_REQUEST} THEN alb.last_deposit_at ELSE NULL END`),
        '<=',
        tsTo,
      )
    }
    query.where('dlba.post_request', '<>', postRequest.PAYMENT_NOTIFICATION)
  }
  // search by depositCount, depositAmount
  if (queryString.depositCount) {
    if (!isNaN(queryString.depositCount) && !isNaN(parseFloat(queryString.depositCount))) {
      query.where('alb.deposit_count', queryString.depositCount)
        .where('dlba.post_request', '<>', postRequest.PAYMENT_NOTIFICATION)
    } else {
      query.where('alb.deposit_count', -1)
    }
  }

  if (queryString.depositAmount) {
    if (!isNaN(queryString.depositAmount) && !isNaN(parseFloat(queryString.depositAmount))) {
      if (queryString.depositAmountType === depositAmountType.OR_MORE) {
        query.where('dlba.amount', '>=', queryString.depositAmount)
      } else if (queryString.depositAmountType === depositAmountType.OR_LESS) {
        query.where('dlba.amount', '<=', queryString.depositAmount)
      } else {
        query.where('dlba.amount', queryString.depositAmount)
      }
    } else {
      query.where('dlba.amount', -1)
    }
    query.where('dlba.post_request', postRequest.PAYMENT_NOTIFICATION)
  }
  const orderArr = [...pagination.sort, { column: 'id', order: 'DESC' }]
  if (isCsvMode) {
    return await query.orderBy(orderArr)
  }
  return await query.orderBy(orderArr).paginate(pagination)
}

const getListMerchantId = async () => {
  const result =
    await db('merchant_setting as m')
      .join('api_advanced_setting as aas', function() {
        /* eslint-disable no-invalid-this */
        this
          .on('m.api_advanced_setting_id', 'aas.id')
          .on('aas.bank_api_id', bankApi.FXT_MAXCONNECT)
      })
      .distinct(
        'merchant_id',
      )
  return result
}

const getDepositLocalBankApiById = async (id) => {
  const result = await db('deposit_local_bank_api as d')
    .select(
      'd.id',
      'd.payment_id',
      'd.merchant_id',
      'd.post_request',
      'd.payment_company_id',
      'd.member_id',
      'd.remitter_name as user_name',
      'd.phone_number',
      'd.email',
      'd.amount',
      'd.matching_process_status',
      'd.support_status',
      'd.processing_date',
      'd.transaction_id',
      'd.matching_method',
      'd.ts_regist ',
      'u.site_id as response_site_id',
      db.raw('CONCAT(LEFT(admin.last_name_romaji,1),".",admin.first_name_romaji) as staff_name'),
      'm_site.site_name',
      'm_site.symbol_logo_path',
      'm_site.symbol_logo_name',
      'm_site.side_logo_path',
      'm_site.side_logo_name',
      'm_site.media_name',
    )
    .leftJoin('users_basic_data as u', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('d.member_id', 'u.member_id')
        .on('u.delete_flag', flag.FALSE)
    })
    .leftJoin('users_basic_data as admin', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('d.staff_id', 'admin.id')
        .on('admin.delete_flag', flag.FALSE)
        .on('admin.site_id', '=', commonSiteId.P2TECH)
    })
    .leftJoin('m_site', 'u.site_id', 'm_site.id')
    .where('d.id', id)
    .first()

  return result
}

const checkPaymentIdExisted = async (payment_id) => {
  const result = await db('deposit_local_bank_api')
    .where('payment_id', payment_id)
    .where('delete_flag', flag.FALSE)
    .first()

  return result ? true : false
}

const getAllLocalBankApi2 = async (pagination, queryString, isCsvMode) => {
  const query = db('deposit_local_bank_api as dlba')
    .leftJoin('users_basic_data as u', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('dlba.member_id', 'u.member_id')
        .on('u.delete_flag', flag.FALSE)
    })
    .leftJoin('users_basic_data as admin', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('dlba.staff_id', 'admin.id')
        .on('admin.delete_flag', flag.FALSE)
        .on('admin.site_id', '=', commonSiteId.P2TECH)
    })
    .leftJoin('m_reasons as mr', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('dlba.reason_id', 'mr.id')
        .on('mr.delete_flag', flag.FALSE)
    })
    .leftJoin('m_site as ms', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('u.site_id', 'ms.id')
        .on('ms.delete_flag', flag.FALSE)
    })

  if (isCsvMode) {
    query.select(
      'dlba.id',
      db.raw('DATE_FORMAT(dlba.ts_regist, \'%Y.%m.%d %T\') as response_date'),
      'ms.site_name as site',
      'dlba.post_request',
      'dlba.remitter_name as name',
      'dlba.amount as deposit_amount',
      'dlba.processing_date',
      'dlba.matching_process_status AS matching_process',
      db.raw(
        `CASE  WHEN dlba.matching_process_status IS NOT NULL THEN 
          CASE WHEN dlba.matching_process_status = ${userMatchingStatus.ACTION_REQUIRED} THEN \'Action Required\'
              WHEN dlba.matching_process_status = ${userMatchingStatus.PROCESSING} THEN \'Processing\'
              WHEN dlba.matching_process_status = ${userMatchingStatus.PENDING} THEN \'Pending\'
              WHEN dlba.matching_process_status = ${userMatchingStatus.SUCCESS} THEN \'Success\'
              WHEN dlba.matching_process_status = ${userMatchingStatus.REJECT} THEN \'Reject\'
              WHEN dlba.matching_process_status = ${userMatchingStatus.CLOSE} THEN \'Close\' 
        END ElSE NULL END
       AS matching_process_text`,
      ),
      db.raw(
        `CASE
          WHEN dlba.matching_process_status IS NOT NULL THEN 
          CASE WHEN dlba.matching_process_status = ${userMatchingStatus.PENDING}
            OR dlba.matching_process_status = ${userMatchingStatus.REJECT}
            OR dlba.matching_process_status = ${userMatchingStatus.CLOSE} THEN
            CASE
              WHEN dlba.reason_id IS NULL THEN dlba.reason_other ELSE mr.en_short_reason
            END
        END ELSE NULL END AS reason`,
      ),
      'dlba.transaction_id',
      'dlba.support_status',
      db.raw(`CASE WHEN admin.first_name_romaji IS NULL THEN \'System\'
       ELSE CONCAT(LEFT(admin.last_name_romaji,1),".",admin.first_name_romaji) END as staff_name`),
    )
  } else {
    query.select(
      'dlba.id',
      'dlba.ts_regist AS response_date',
      'u.site_id',
      'ms.symbol_logo_path',
      'ms.symbol_logo_name',
      'ms.side_logo_path',
      'ms.side_logo_name',
      'ms.media_name',
      'ms.site_name',
      'dlba.post_request',
      'dlba.remitter_name as name',
      'dlba.amount as deposit_amount',
      'dlba.processing_date',
      'dlba.matching_process_status AS matching_process',
      'mr.ja_short_reason',
      'mr.en_short_reason',
      'mr.cn_short_reason',
      'mr.kr_short_reason',
      'dlba.reason_other',
      'dlba.transaction_id',
      'dlba.matching_method',
      'dlba.support_status',
      db.raw('CONCAT(LEFT(admin.last_name_romaji,1),".",admin.first_name_romaji) as staff_name'),
    )
  }

  query.where({
    'dlba.delete_flag': flag.FALSE,
    'dlba.payment_company_id': paymentCompanyAccountFXON.DEPOSIT.BANK_TRANSFER.INFINITAS,
    'dlba.post_request': postRequest.PAYMENT_NOTIFICATION,
  })
    .where('ms.enable_flag', flag.TRUE)

  // search by array siteId, matchingProcess
  if (!_.isEmpty(queryString.siteId)) {
    query.whereIn('u.site_id', queryString.siteId)
  }

  if (!_.isEmpty(queryString.matchingProcess)) {
    query.whereIn('dlba.matching_process_status', queryString.matchingProcess)
  }

  // search by name
  if (queryString.name) {
    queryString.name = utility.escapeSql(queryString.name)
    query.whereILike('dlba.remitter_name', `%${queryString.name}%`)
  }

  const utc = (queryString.utc || '0').replace('(', '').replace('UTC', '').replace(')', '')
  // choose option typeTime
  if (queryString.timeType === localBankTimeType.RESPONSE) {
    if (queryString.tsFrom && queryString.tsTo) {
      const tsFrom = moment(queryString.tsFrom).startOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
      const tsTo = moment(queryString.tsTo).endOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
      query.whereBetween('dlba.ts_regist', [tsFrom, tsTo])
    } else if (queryString.tsFrom) {
      const tsFrom = moment(queryString.tsFrom).startOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
      query.where('dlba.ts_regist', '>=', tsFrom)
    } else if (queryString.tsTo) {
      const tsTo = moment(queryString.tsTo).endOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
      query.where('dlba.ts_regist', '<=', tsTo)
    }
  } else if (queryString.timeType === localBankTimeType.PROCESSING) {
    if (queryString.tsFrom && queryString.tsTo) {
      const tsFrom = moment(queryString.tsFrom).startOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
      const tsTo = moment(queryString.tsTo).endOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
      query.whereBetween('dlba.processing_date', [tsFrom, tsTo])
    } else if (queryString.tsFrom) {
      const tsFrom = moment(queryString.tsFrom).startOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
      query.where('dlba.processing_date', '>=', tsFrom)
    } else if (queryString.tsTo) {
      const tsTo = moment(queryString.tsTo).endOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
      query.where('dlba.processing_date', '<=', tsTo)
    }
  }

  // search by depositAmount
  if (queryString.depositAmount) {
    if (!isNaN(queryString.depositAmount) && !isNaN(parseFloat(queryString.depositAmount))) {
      if (queryString.depositAmountType === depositAmountType.OR_MORE) {
        query.where('dlba.amount', '>=', queryString.depositAmount)
      } else if (queryString.depositAmountType === depositAmountType.OR_LESS) {
        query.where('dlba.amount', '<=', queryString.depositAmount)
      } else {
        query.where('dlba.amount', queryString.depositAmount)
      }
    } else {
      query.where('dlba.amount', -1)
    }
  }

  const orderArr = [...pagination.sort, { column: 'id', order: 'DESC' }]

  if (isCsvMode) {
    return await query.orderBy(orderArr)
  }
  return await query.orderBy(orderArr).paginate(pagination)
}

const updateUserMatchingStatus = async (id, payload, source, transaction_id, amount, staff_id) => {
  const result = await db.transaction(async (trx) => {
    const updateStatusRes = await trx('deposit_local_bank_api')
      .update(payload)
      .where('id', id)
      .where('delete_flag', flag.FALSE)
    if (!updateStatusRes) {
      return false
    }
    const objTransaction = {
      user_basic_data_id: -99,
      transaction_id: transaction_id,
      type: typeTransactionProcess.MATCHING_STATUS,
      source: source,
      amount: amount,
      currency: baseCurrency.JPY,
      action_group: actionGroupTransactionProcess.OPERATOR_ACTION,
      staff_id: staff_id,
    }
    await trx('transaction_process').insert(objTransaction)
    return true
  })
  return result
}

module.exports = {
  getPaymentNotificationById,
  updateById,
  updateStatusToSuccess,
  getFirstRequestByUserId,
  getAllLocalBankApi,
  getListMerchantId,
  getLocalBankApi,
  createLocalBankApi,
  getDepositLocalBankApiById,
  checkPaymentIdExisted,
  getAllLocalBankApi2,
  updateUserMatchingStatus,
}
