// utility
const utility = require('utility')

// constant
const { paymentCategoryFXON,
  transactionType, paymentMethodFXON, paymentType, paymentMethodICPAY, paymentMethodMYFOREX,
  commonSiteId, dateFormat, paymentCategoryICPAY, paymentCategoryMYFOREX,
  bankType, baseCurrency, flag, paymentTransactionStatus, errorMessageCodeConstant,
  decisionMethod, symbolCurrency, supportStatus, toggleStatus, uncheckALL } = require('constant')

// repository
const { paymentTransactionRepository, errorLogRepository, accountLocalBankRepository,
  accountOverseaBankRepository, usersBasicDataRepository,
} = require('repository')

// func
const { json2csvAsync } = require('json-2-csv')
const { uploadCSV } = require('helper').upload
const { _roundingByCurrency } = require('./get_all_credit_card_api')

/* library */
const moment = require('moment')

const getListPaymentTransaction = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}
    const {
      transaction_id,
      payment_date,
      decision_date,
      site_id,
      payment_status,
      payment_type,
      excluding_funds_transfer,
      payment_method,
      payment_category,
      payment_detail,
      full_name,
      company_acc,
      service_acc,
      email,
      user_id,
      name_type,
      lang,
      export_csv,
    } = queryString
    event.user_id = user_id || null
    const start_time = decision_date ? decision_date.split(',')[0] : payment_date ? payment_date.split(',')[0] : null
    const end_time = decision_date ? decision_date.split(',')[1] : payment_date ? payment_date.split(',')[1] : null

    // validate
    if ((start_time && !end_time) || (!start_time && end_time)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    if (start_time && !moment(start_time, dateFormat.DATE, true).isValid()) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    if (end_time && !moment(end_time, dateFormat.DATE, true).isValid()) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // Get staff display date time
    const staffId = utility.getUserIdByToken(event)
    const staffInfo = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': staffId })

    const filter = {
      transaction_id: transaction_id ? transaction_id : null,
      payment_date: payment_date ? payment_date : null,
      decision_date: decision_date ? decision_date : null,
      // GET VALID SITES USING QUERY
      site_id: utility.getValidSiteByAdmin(staffInfo.admin_with_site_id, site_id),
      payment_status: payment_status ? payment_status.split(',').filter(Number) : null,
      payment_type: payment_type ? Number(payment_type) : null,
      excluding_funds_transfer: excluding_funds_transfer ? Number(excluding_funds_transfer) : null,
      payment_method: payment_method ? payment_method.split(',') : null,
      payment_category: payment_category ? payment_category.split(',') : null,
      payment_detail: payment_detail ? payment_detail.split(',') : null,
      full_name: full_name ? full_name : null,
      company_acc: company_acc ? company_acc : null,
      service_acc: service_acc ? service_acc : null,
      email: email ? email : null,
      user_id: user_id ? user_id : null,
      name_type: name_type ? name_type : null,
      lang: lang ? lang : null,
      export_csv,
      utc: staffInfo.timezone || null,
    }

    // CHECK CASE SELECT BOX UNCHECK ALL
    const isUnCheckALL =
      [Number(site_id),
        Number(payment_status),
        Number(payment_method),
        Number(payment_category),
        Number(payment_detail)].includes(uncheckALL) ? true : false

    // paging, sort
    const pagination = utility.getPagination(queryString)

    const listPaymenTrans = !isUnCheckALL ? await paymentTransactionRepository.getLisPaymentTransaction(filter, pagination) : []

    // export CSV
    if (Number(export_csv) === flag.TRUE) {
      const lang = await utility.getMultilingualism(process.env.LOCALES_SOURCE, filter.lang)
      const psLang = lang.csv_pdf.payment_transaction
      const data = listPaymenTrans.map((el) => {
        const res = {}
        res.payment_date = utility.getDateTimeFormatted(el.payment_date, staffInfo.display_date_time, filter.utc, 'HH:mm')
        res.transaction_id = el.transaction_id
        res.site = el.site_name
        res.payment_status = _renderPaymentStatus(el.payment_status, psLang)
        res.payment_type = _renderPaymentType(el.payment_type, psLang)
        res.payment_method = el[`${filter.lang.toLowerCase()}_method_name`] || '-'
        res.payment_category = el[`${filter.lang.toLowerCase()}_category_name`] || '-'
        res.payment_detail = el[`${filter.lang.toLowerCase()}_detail_name`] || '-'
        res.company_acc = el[`${filter.lang.toLowerCase()}_company_name`] || '-'
        res.service_acc = el[`${filter.lang.toLowerCase()}_service_name`] || '-'
        res.amount = `${_renderSymbol(el.amount_currency)} ${formatCurrency(el.amount_currency, el.transaction_amount)}`
        res.fee = el.transaction_fee ? `${_renderSymbol(el.amount_currency)} ${formatCurrency(el.amount_currency, el.transaction_fee)}` : '-'
        res.rate = _renderRate(el.exchange_rate, el.exchange_symbol)
        res.name = el.full_name
        res.email = el.email
        res.w_balance_1 = el.first_w_balance !== null ?
          `${_renderSymbol(el.first_currency_transaction_object)} ${formatCurrency(el.first_currency_transaction_object, el.first_w_balance)}` : '-'
        res.w_balance_2 = el.second_w_balance !== null ?
          `${_renderSymbol(el.second_currency_transaction_object)} ${formatCurrency(el.second_currency_transaction_object, el.second_w_balance)}` :
          '-'
        res.wallet_acc_id_1 = el.first_transaction_object_id ? el.first_transaction_object_id.toUpperCase() : '-'
        res.wallet_acc_id_2 = el.second_transaction_object_id ? el.second_transaction_object_id.toUpperCase() : '-'
        res.decision_date = utility.getDateTimeFormatted(el.decision_date, staffInfo.display_date_time, filter.utc, 'HH:mm') || '-'
        res.support_status = el.decision_method === decisionMethod.MANUAL ? _renderSupportStatus(el.payment_status, psLang) : '-'
        res.manual_auto = el.decision_method === decisionMethod.AUTOMATIC ? psLang.auto : el.staff_name ? el.staff_name.toUpperCase() : '-'
        return res
      })

      const headers = [
        { title: psLang.title.payment_date, field: 'payment_date' },
        { title: psLang.title.transaction_id, field: 'transaction_id' },
        { title: psLang.title.site, field: 'site' },
        { title: psLang.title.status, field: 'payment_status' },
        { title: psLang.title.type, field: 'payment_type' },

        { title: psLang.title.method, field: 'payment_method' },
        { title: psLang.title.category, field: 'payment_category' },
        { title: psLang.title.detail, field: 'payment_detail' },
        { title: psLang.title.company_acc, field: 'company_acc' },
        { title: psLang.title.service_acc, field: 'service_acc' },
        { title: psLang.title.amount, field: 'amount' },

        { title: psLang.title.fee, field: 'fee' },
        { title: psLang.title.rate, field: 'rate' },
        { title: psLang.title.name, field: 'name' },
        { title: psLang.title.email, field: 'email' },
        { title: psLang.title.w_balance_1, field: 'w_balance_1' },
        { title: psLang.title.wallet_acc_id_1, field: 'wallet_acc_id_1' },
        { title: psLang.title.w_balance_2, field: 'w_balance_2' },
        { title: psLang.title.wallet_acc_id_2, field: 'wallet_acc_id_2' },

        { title: psLang.title.decision_date, field: 'decision_date' },
        { title: psLang.title.support_status, field: 'support_status' },
        { title: psLang.title.manual_auto, field: 'manual_auto' },
      ]

      const csvData = await json2csvAsync(data, { keys: headers, emptyFieldValue: '', excelBOM: true, expandArrayObjects: true })
      const result = await uploadCSV(csvData, 'Payment_transaction_')

      return utility.createResponse(true, { url_download: result.Location })
    } else {
      if (isUnCheckALL) {
        const res = utility.paginatedItems([], pagination.currentPage, pagination.perPage)
        return utility.createResponse(true, res)
      }

      // view payment transaction
      const handleData = listPaymenTrans.data.map((el) =>{
        const list_wallet = []

        if (el.first_transaction_object_id) {
          list_wallet.push(
            {
              balance: el.first_w_balance,
              currency: el.first_currency_transaction_object,
              transaction_object_id: el.first_transaction_object_id,
            },
          )
        }

        if (el.second_transaction_object_id) {
          list_wallet.push(
            {
              balance: el.second_w_balance,
              currency: el.second_currency_transaction_object,
              transaction_object_id: el.second_transaction_object_id,
            },
          )
        }
        return {
          ...el,
          list_wallet: list_wallet,
        }
      })

      listPaymenTrans.data = handleData
      return utility.createResponse(true, listPaymenTrans)
    }
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}


const getPaymentTransactionDetail = async (event) => {
  try {
    const { id } = event.pathParameters || {}

    // get infor transaction in db
    const getPaymentTransDetail = await paymentTransactionRepository.getPaymentTransDetail(id)
    event.user_id = getPaymentTransDetail?.user_id
    if (!getPaymentTransDetail) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
    }

    // Check if it is withdraw money to the bank?
    if (![paymentMethodFXON.BANK, paymentMethodICPAY.BANK, paymentMethodMYFOREX.BANK].includes(getPaymentTransDetail[0].payment_method_id) ||
    !getPaymentTransDetail[0].payment_type === paymentType.PAY_OUT) {
      return utility.createResponse(true)
    }

    // get type bank
    const sourceBankType = getBankType(getPaymentTransDetail[0].payment_category_id)
    // get information about  number of wallet using and fee infor
    const target_wallet = []
    const targetWalletFromTrans = getPaymentTransDetail.filter((payment) => payment.transaction_type === transactionType.WITHDRAW)
    const feeFromTrans = getPaymentTransDetail.find((payment) => payment.transaction_type === transactionType.WITHDRAW_FEE)

    // hidden fee when site = myforex and currency fee = currency wallet and DoubleTransaction
    targetWalletFromTrans.forEach((transaction) => {
      const base = transaction.exchange_symbol ? transaction.exchange_symbol.split('/')[0] : null
      const symbol = transaction.exchange_symbol ? transaction.exchange_symbol.split('/')[1] : null
      const rate = transaction.exchange_symbol ? utility.roundNumber(transaction.exchange_rate, 6) : null
      const isSingleTransaction = targetWalletFromTrans.length === 1
      const isDoubleTransaction = targetWalletFromTrans.length === 2
      const isDifferentBaseCurrency = (transaction.currency === baseCurrency.JPY && sourceBankType === bankType.OVERSEA_BANK) ||
        (transaction.currency === baseCurrency.USD && sourceBankType === bankType.LOCAL_BANK)
      const hiddenFee =
         transaction.site_id === commonSiteId.MY_FOREX && isDoubleTransaction &&
          transaction.transaction_object_type !== feeFromTrans.transaction_object_type
      const isDisplayCurrencyConversion = transaction.site_id === commonSiteId.MY_FOREX &&
        (hiddenFee || (isSingleTransaction && isDifferentBaseCurrency))
      const amount = transaction.amount
      target_wallet.push(
        {
          wallet_id: transaction.transaction_object_id,
          wallet_currency: transaction.currency,
          amount: amount,
          rate: isDisplayCurrencyConversion ?
            `1${base} = ${rate}${symbol}` : undefined,
          exchange_symbol: isDisplayCurrencyConversion ? transaction.exchange_symbol : undefined,
          withdrawal_amount_after_exchange: isDisplayCurrencyConversion && transaction?.exchange_symbol ? isSingleTransaction ?
            getPaymentTransDetail[0].total_amount :
            _roundingByCurrency(amount * transaction.exchange_rate, transaction.exchange_symbol.split('/')[1]) : undefined,
          // get fee from payment transaction table
          fee: !hiddenFee ? getPaymentTransDetail[0].total_fee : undefined,
          wallet_balance_after_withdrawal: feeFromTrans && transaction.transaction_object_type === feeFromTrans.transaction_object_type ?
            feeFromTrans.wallet_balance_after_payment : transaction.wallet_balance_after_payment,
        },
      )
    })


    // get receiving bank information
    const bankInfor = await getBankInfor(sourceBankType, getPaymentTransDetail[0].account_bank_receive_id)

    const response = {
      payment_infor_basic: {
        payment_date: getPaymentTransDetail[0].payment_date,
        payment_type: getPaymentTransDetail[0].payment_type,
        transaction_id: getPaymentTransDetail[0].transaction_id,
        payment_status: getPaymentTransDetail[0].payment_status,
        support_status: getPaymentTransDetail[0].support_status,
        decision_date: getPaymentTransDetail[0].decision_date,
        totalFee: getPaymentTransDetail[0].total_fee,
        totalAmount: getPaymentTransDetail[0].total_amount,
        amount_currency: getPaymentTransDetail[0].amount_currency,
        staff_name: getPaymentTransDetail[0].staff_name,
        exchange_rate: getPaymentTransDetail[0].exchange_rate,
        exchange_symbol: getPaymentTransDetail[0].exchange_symbol,
        is_disable_toggle: [paymentTransactionStatus.REJECT, paymentTransactionStatus.CLOSE, paymentTransactionStatus.APPROVED]
          .includes(getPaymentTransDetail[0].payment_status) ? true : false,
        toggle_status: [paymentTransactionStatus.ACTION_REQUIRED, paymentTransactionStatus.PENDING, paymentTransactionStatus.PROCESSING]
          .includes(getPaymentTransDetail[0].payment_status) &&
          getPaymentTransDetail[0].support_status === supportStatus.WORKING ? toggleStatus.ON : toggleStatus.OFF,
      },
      payment_source: {
        ja_method_name: getPaymentTransDetail[0].ja_method_name,
        en_method_name: getPaymentTransDetail[0].en_method_name,
        cn_method_name: getPaymentTransDetail[0].cn_method_name,
        kr_method_name: getPaymentTransDetail[0].kr_method_name,

        ja_category_name: getPaymentTransDetail[0].ja_category_name,
        en_category_name: getPaymentTransDetail[0].en_category_name,
        cn_category_name: getPaymentTransDetail[0].cn_category_name,
        kr_category_name: getPaymentTransDetail[0].kr_category_name,

        ja_detail_name: getPaymentTransDetail[0].ja_detail_name,
        en_detail_name: getPaymentTransDetail[0].en_detail_name,
        cn_detail_name: getPaymentTransDetail[0].cn_detail_name,
        kr_detail_name: getPaymentTransDetail[0].kr_detail_name,

        ja_company_name: getPaymentTransDetail[0].ja_company_name,
        cn_company_name: getPaymentTransDetail[0].cn_company_name,
        kr_company_name: getPaymentTransDetail[0].kr_company_name,
        en_company_name: getPaymentTransDetail[0].en_company_name,

        ja_account_name: getPaymentTransDetail[0].ja_account_name,
        en_account_name: getPaymentTransDetail[0].en_account_name,
        cn_account_name: getPaymentTransDetail[0].cn_account_name,
        kr_account_name: getPaymentTransDetail[0].kr_account_name,

        ja_service_name: getPaymentTransDetail[0].ja_service_name,
        en_service_name: getPaymentTransDetail[0].en_service_name,
        cn_service_name: getPaymentTransDetail[0].cn_service_name,
        kr_service_name: getPaymentTransDetail[0].kr_service_name,
      },
      bank_information: bankInfor || {},
      target_wallet,
    }
    return utility.createResponse(true, response)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getBankType = (payment_category_id) => {
  if (paymentCategoryFXON.LOCAL_BANK === payment_category_id ||
    paymentCategoryICPAY.LOCAL_BANK === payment_category_id ||
    paymentCategoryMYFOREX.LOCAL_BANK === payment_category_id) {
    return bankType.LOCAL_BANK
  } else if (paymentCategoryFXON.OVERSEAS_BANK === payment_category_id ||
    paymentCategoryICPAY.OVERSEAS_BANK === payment_category_id ||
    paymentCategoryMYFOREX.OVERSEAS_BANK === payment_category_id) {
    return bankType.OVERSEA_BANK
  } else return null
}

const getBankInfor = async (type, account_bank_id) => {
  let result = {}

  // if account_bank_id is null return {}
  if (!account_bank_id) {
    return {}
  }

  switch (type) {
    case bankType.LOCAL_BANK:
      const getLocalBankInfor = await accountLocalBankRepository.getLocalBankDetail(account_bank_id)
      if (getLocalBankInfor) {
        result = {
          bank_branch_infor: `(${getLocalBankInfor.bank_code}) ${getLocalBankInfor.bank_name} (${getLocalBankInfor.
            branch_code}) ${getLocalBankInfor.branch_name}`,
          account_type: getLocalBankInfor.account_type,
          account_number: getLocalBankInfor.account_number,
          account_holder: getLocalBankInfor.account_name,
        }
      }
      return result
    case bankType.OVERSEA_BANK:
      const getOverseaBankInfor = await accountOverseaBankRepository.getDetailOverseaBank(account_bank_id)
      // if bank_address_line2 after ''
      const bank_address = getOverseaBankInfor.bank_address_line ? getOverseaBankInfor.bank_address_line2 ?
        `${getOverseaBankInfor.bank_address_line} ${getOverseaBankInfor.
          bank_address_line2} ${getOverseaBankInfor.bank_state} ${getOverseaBankInfor.bank_city} ${getOverseaBankInfor.bank_zip_postal_code}` :
        `${getOverseaBankInfor.bank_address_line} ${getOverseaBankInfor.bank_state} ${getOverseaBankInfor.
          bank_city} ${getOverseaBankInfor.bank_zip_postal_code}` : null

      if (getOverseaBankInfor) {
        result = {
          bank_country: getOverseaBankInfor.bank_country,
          account_currentcy: getOverseaBankInfor.currency,
          beneficiary_bank_name: getOverseaBankInfor.bank_name,
          swift_code: getOverseaBankInfor.swift_code,
          branch_name: getOverseaBankInfor.branch_name,
          bank_address: bank_address,
          account_number: getOverseaBankInfor.account_number,
          iban_number: getOverseaBankInfor.iban_number,
          beneficiary_name: getOverseaBankInfor.beneficiary_name,
          clearing_code: getOverseaBankInfor.clearing_code,
          intermediary_bank: getOverseaBankInfor.intermediary_bank,
          intermediary_swift_code: getOverseaBankInfor.intermediary_swift_code,
        }
      }
      return result
    default:
      return {}
  }
}

const _renderPaymentType = (type, lang) =>{
  switch (type) {
    case paymentType.PAY_IN:
      return lang.payment_type.pay_in
    case paymentType.PAY_OUT:
      return lang.payment_type.pay_out
    default:
      return '-'
  }
}

const _renderSupportStatus = (status, lang) =>{
  if ([paymentTransactionStatus.PENDING, paymentTransactionStatus.PROCESSING].includes(status)) {
    return lang.support_status.working
  }
  if ([paymentTransactionStatus.APPROVED,
    paymentTransactionStatus.CLOSE,
    paymentTransactionStatus.REJECT].includes(status)) {
    return lang.support_status.completion
  }
  return '-'
}

const _renderRate = (rate, exchange_symbol) =>{
  if (!rate || !exchange_symbol) {
    return '-'
  }

  const base = exchange_symbol.split('/')[0]
  const symbol = exchange_symbol.split('/')[1]

  return `${_renderSymbol(symbol)} ${formatCurrency('RATE', rate)}/${base}`
}

const _renderPaymentStatus = (payment_status, lang) =>{
  switch (payment_status) {
    case paymentTransactionStatus.ACTION_REQUIRED:
      return lang.status.action_required
    case paymentTransactionStatus.PROCESSING:
      return lang.status.processing
    case paymentTransactionStatus.PENDING:
      return lang.status.pending
    case paymentTransactionStatus.APPROVED:
      return lang.status.approved
    case paymentTransactionStatus.REJECT:
      return lang.status.reject
    case paymentTransactionStatus.CLOSE:
      return lang.status.close
    default:
      return '-'
  }
}

const _renderSymbol = (currency) =>{
  switch (currency) {
    case baseCurrency.USD:
      return symbolCurrency.USD
    case baseCurrency.JPY:
      return symbolCurrency.JPY
    case baseCurrency.EUR:
      return symbolCurrency.EUR
    case baseCurrency.BTC:
      return symbolCurrency.BTC
    case baseCurrency.PT:
      return symbolCurrency.PT
    default:
      return currency
  }
}

const formatCurrency = (currency, value) =>{
  if (!value) {
    return currency === 'JPY' ?
      '0' :
      currency === 'USD' ||
      currency === 'EUR' ||
      currency === 'PT' ?
        '0.00' :
        currency === 'BTC' ?
          '0.0000' :
          '0.000000'
  }

  function formatNumberToDecimal(value, decimal) {
    if (value) {
      if (decimal) {
        return Number(value)
          .toFixed(decimal)
          .toString()
          .replace(/\d(?=\d*\.\d)(?=(?:\d{3})+(?!\d))/g, '$&,')
      } else {
        return Number(value)
          .toFixed(decimal)
          .toString()
          .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
      }
    }
  }
  switch (currency) {
    case 'USD':
    case 'EUR':
    case 'PT':
      return formatNumberToDecimal(value, 2)
    case 'JPY':
      return formatNumberToDecimal(value, 0)
    case 'BTC':
      return formatNumberToDecimal(value, 4)
    case 'RATE':
      return formatNumberToDecimal(value, 6)
  }
}

module.exports = {
  getListPaymentTransaction,
  getPaymentTransactionDetail,
  formatCurrency,
}

