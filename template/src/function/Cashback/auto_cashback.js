'use strict'

// library
const utility = require('utility')
const {
  errorLogRepository, crawlTransactionRepository, portfoliosRepository, walletsRepository, accountTypeRepository,
  cashbackManagementRepository, brokerRepository, symbolRepository, ibRankRepository,
} = require('repository')
const {
  platformCode, platform: platformKey, processingCashback, baseCurrency, typeWallet, dateFormat,
  cashbackStatus, matchingMethod, transactionStatus, transactionType, paymentTransactionStatus, paymentType, decisionMethod,
  paymentMethodFXON, typeTransactionProcess, actionGroupTransactionProcess, sourceTransactionProcess, flag, errorMessageCodeConstant,
} = require('constant')

const moment = require('moment')
const _ = require('lodash')
const { _roundingByCurrency } = require('../Payment/get_all_credit_card_api')

const scheduleCashback = async (event) => {
  try {
    const timer = Date.now()
    console.log('====== Job cashback start ======')
    // Get all lang and set to object
    const languages = ['ja', 'en', 'cn', 'kr']
    const results = await Promise.all(languages.map((lang) => utility.getMultilingualism(process.env.LOCALES_SOURCE, lang)))
    const lang = _.zipObject(languages, results)

    // Get data crawl (limit 100 record)
    const listTransaction = await crawlTransactionRepository.getUnprocessedRecord(process.env.CASHBACK_UNPROCESSED_LIMIT)

    // Get enable broker
    const listBroker = await brokerRepository.getAll(true)

    // Get enable symbol
    const listSymbol = await symbolRepository.getAll(true)

    // Get ib_rank
    const listIbRank = await ibRankRepository.getAllForJobCashback(true)

    // Get enable account type
    const listAccountType = await accountTypeRepository.getAll(true)

    // Get a list of portfolios with cashback subscriptions
    for (const transaction of listTransaction) {
      await _autoCashback(transaction, listBroker, listSymbol, listAccountType, listIbRank, lang, event)
    }

    console.log(`Runtime ${Date.now() - timer}ms`)
    console.log('====== Job cashback done ======')
    return utility.createResponse(true)
  } catch (error) {
    console.error(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const _autoCashback = async (transaction, listBroker, listSymbol, listAccountType, listIbRank, lang, event) => {
  try {
    // Get info cashback
    if (transaction.reward_currency) {
      transaction.reward_currency = transaction.reward_currency.trim().slice(-3)

      if (![baseCurrency.JPY, baseCurrency.USD].includes(transaction.reward_currency)) {
        transaction.reward_currency = baseCurrency.USD
      }
    }
    transaction.cashback_amount = _roundingByCurrency(Number(transaction.reward_per_trade), transaction.reward_currency)
    transaction.cashback_account = transaction.account_no
    transaction.platformKey = _getPlatformKey(transaction.platform)

    // Get broker from master data
    transaction.brokerObject = listBroker.find((item) => item.id === transaction.broker_id)

    // Validate crawl transaction
    const isValid = _validateCrawlTransaction(transaction)
    if (!isValid) {
      console.error('Transaction: ', transaction)
      await crawlTransactionRepository.updateById(transaction.id, {
        processing_cashback: processingCashback.ERROR,
      })
      return
    }

    // Get portfolios with cashback subscriptions
    const portfolio = await portfoliosRepository.getPortfolioRegisteredCashback(
      transaction.cashback_account,
      transaction.brokerObject.broker_code,
      transaction.platformKey,
    )

    // Update status crawl transaction to NOT_APPLY
    if (!portfolio || transaction.brokerObject.premium_broker === flag.FALSE) {
      await crawlTransactionRepository.updateById(transaction.id, {
        processing_cashback: processingCashback.NOT_APPLY,
      })
      return
    }

    // Get ib rank
    transaction.ibRankObj = listIbRank.find((item) => item.broker_id === transaction.brokerObject.id)

    // Get account_type_id
    const findAccountType = listAccountType.find((item) => {
      return item.account_type_name.toLowerCase() === transaction.account_type?.toLowerCase() &&
        item.broker_id === transaction.brokerObject.id &&
        (transaction.platformKey === platformKey.MT4 && item.platform_mt4 || transaction.platformKey === platformKey.MT5 && item.platform_mt5)
    })
    transaction.account_type_id = findAccountType ? findAccountType.id : null

    // Get symbol from master data
    transaction.symbolObject = transaction.account_type_id ? listSymbol.find((item) => {
      return item.symbol_name === transaction.symbol &&
        item.broker_id === transaction.brokerObject.id &&
        item.platform === transaction.platformKey &&
        item.account_type_id === transaction.account_type_id
    }) : null

    // Get user wallet
    const wallet = await walletsRepository.getWalletByUserId(
      portfolio.user_id,
      transaction.reward_currency === baseCurrency.JPY ? typeWallet.JPY_WALLET : typeWallet.USD_WALLET,
    )

    // Get status cashback
    let statusCashback
    if (!transaction.symbolObject) {
      statusCashback = cashbackStatus.ACTION_REQUIRED
    } else {
      statusCashback = cashbackStatus.SUCCESS
    }

    // Generate cashback information and transaction history
    const transactionId = utility.renderTransactionId()
    const payloadCashbackManagement = _getPayloadCashbackManagement(transaction, portfolio, wallet, transactionId, statusCashback)
    let payloadPaymentTransaction
    let payloadCashbackHistory
    let payloadCashbackProcess
    if (cashbackStatus.SUCCESS) {
      payloadPaymentTransaction = _getPayloadPaymentTransaction(transaction, portfolio, wallet, transactionId, statusCashback)
      payloadCashbackHistory = _getPayloadCashbackHistory(transaction, portfolio, wallet, transactionId, statusCashback, lang)
      payloadCashbackProcess = _getPayloadCashbackProcess(transaction, portfolio, wallet, transactionId)
    }

    await cashbackManagementRepository.createCashback(
      payloadCashbackManagement,
      payloadPaymentTransaction,
      payloadCashbackHistory,
      payloadCashbackProcess,
      wallet,
      transaction.id,
    )
  } catch (error) {
    console.error(error)
    console.error('Transaction error: ', transaction)
    try {
      await crawlTransactionRepository.updateById(transaction.id, {
        processing_cashback: processingCashback.ERROR,
      })
    } catch (err) {
      console.error(err)
    }
    return
  }
}

const _validateCrawlTransaction = (transaction) => {
  const {
    reward_currency, cashback_amount, cashback_account, brokerObject, platform,
  } = transaction
  if (
    !reward_currency || !cashback_amount || !cashback_account || !brokerObject ||
    !Object.values(platformCode).includes(platform)
  ) {
    return false
  }

  return true
}

const _getPlatformKey = (platform) => {
  return platform === platformCode.MT4 ? platformKey.MT4 : platformKey.MT5
}

const _getPayloadCashbackManagement = (transaction, portfolio, wallet, transactionId, statusCashback) => {
  return {
    broker_id: transaction.brokerObject.id,
    mt_account_no: transaction.cashback_account,
    portfolio_id: portfolio.portfolio_id,
    method: transaction.method || 1,
    order_no: transaction.order_no,
    deal_no: transaction.deal_no,
    ticket: transaction.ticket,
    order_type: transaction.order_type,
    platform: portfolio.platform,
    account_type_id: transaction.account_type_id,
    account_currency: transaction.account_currency,
    reward_per_trade: transaction.cashback_amount,
    reward_currency: transaction.reward_currency,
    symbol: transaction.symbol,
    myforex_symbol_id: transaction.symbolObject?.id,
    lot_rebates: transaction.cashback_amount,
    lot_rebates_currency: transaction.reward_currency,
    cb_rebates: transaction.cashback_amount,
    cb_rebates_currency: transaction.reward_currency,
    add_cb_rebates: transaction.cashback_amount,
    add_cb_rebates_currency: transaction.reward_currency,
    ib_rank_id: transaction.ibRankObj ? transaction.ibRankObj.id : null,
    open_time: transaction.open_time,
    close_time: transaction.close_time,
    profit: transaction.profit,
    volume: transaction.volume,
    user_basic_data_id: portfolio.user_id,
    wallet_id: wallet.id,
    transaction_id: transactionId,
    wallet_add_date: statusCashback === cashbackStatus.SUCCESS ? moment().utc().format(dateFormat.DATE_TIME) : null,
    cashback_status: statusCashback,
    matching_method: matchingMethod.AUTOMATIC,
    matching_date: moment().utc().format(dateFormat.DATE_TIME),
  }
}

const _getPayloadPaymentTransaction = (transaction, portfolio, wallet, transactionId) => {
  const now = moment().utc().format(dateFormat.DATE_TIME)
  return {
    user_basic_data_id: portfolio.user_id,
    transaction_id: transactionId,
    payment_status: paymentTransactionStatus.APPROVED,
    payment_type: paymentType.PAY_IN,
    amount: transaction.cashback_amount,
    amount_currency: wallet.currency,
    fee: null,
    transaction_object_id: wallet.id,
    decision_date: now,
    payment_date: now,
    decision_method: decisionMethod.AUTO,
    payment_category_id: null,
    payment_detail_id: null,
    payment_method_id: paymentMethodFXON.BANK,
    payment_company_account_id: null,
    payment_service_account_id: null,
    cashback_flag: flag.TRUE,
  }
}

const _getPayloadCashbackHistory = (transaction, portfolio, wallet, transactionId, statusCashback, lang) => {
  let status
  switch (statusCashback) {
    case cashbackStatus.ACTION_REQUIRED:
      status = transactionStatus.ACCEPTED
      break
    case cashbackStatus.PENDING:
      status = transactionStatus.PENDING
      break
    // cashbackStatus.SUCCESS
    default:
      status = transactionStatus.SUCCESSFULLY
      break
  }

  return {
    user_basic_data_id: portfolio.user_id,
    transaction_id: transactionId,
    payment_category_id: null,
    payment_detail_id: null,
    transaction_type: transactionType.DEPOSIT,
    transaction_object_type: wallet.type_wallet,
    transaction_object_id: wallet.id,
    transaction_status: status,
    amount: transaction.cashback_amount,
    wallet_balance_after_payment: wallet.total_assets + Number(transaction.cashback_amount),
    broker_id: transaction.brokerObject.id,
    cashback_flag: flag.TRUE,
    ..._renderTitleTransaction(
      lang,
      transaction,
    ),
  }
}

const _getPayloadCashbackProcess = (transaction, portfolio, wallet, transactionId) => {
  const cashbackProcess = []

  // Posting
  cashbackProcess.push({
    user_basic_data_id: portfolio.user_id,
    transaction_id: transactionId,
    type: typeTransactionProcess.POSTING,
    source: `Cashback ${transaction.brokerObject?.broker_name}`,
    option: `ウォレット、${wallet.id}`,
    amount: transaction.cashback_amount,
    currency: wallet.currency,
    action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
  })

  // Cashback Status
  cashbackProcess.push({
    user_basic_data_id: portfolio.user_id,
    transaction_id: transactionId,
    type: typeTransactionProcess.CASHBACK_STATUS,
    source: sourceTransactionProcess.SYSTEM_PAYMENT,
    amount: transaction.cashback_amount,
    currency: wallet.currency,
    action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
  })

  // Cashback Status Approved
  cashbackProcess.push({
    user_basic_data_id: portfolio.user_id,
    transaction_id: transactionId,
    type: typeTransactionProcess.CASHBACK_STATUS,
    source: sourceTransactionProcess.APPROVED,
    amount: transaction.cashback_amount,
    currency: wallet.currency,
    action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
  })

  // Payin
  cashbackProcess.push({
    user_basic_data_id: portfolio.user_id,
    transaction_id: transactionId,
    type: typeTransactionProcess.PAY_IN,
    source: wallet.id,
    amount: transaction.cashback_amount,
    currency: wallet.currency,
    action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
  })

  return cashbackProcess
}

function _renderTitleTransaction(lang, transaction) {
  return {
    ja_title: _renderTextLocales(lang, 'ja', transaction),
    en_title: _renderTextLocales(lang, 'en', transaction),
    cn_title: _renderTextLocales(lang, 'cn', transaction),
    kr_title: _renderTextLocales(lang, 'kr', transaction),
  }
}

function _renderTextLocales(lang, typeLang, transaction) {
  return transaction.brokerObject?.broker_name + '：' + lang[typeLang].transaction_history.title_cashback
}

module.exports = {
  scheduleCashback,
}
