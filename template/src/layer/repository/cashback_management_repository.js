const { cashbackStatus, processingCashback, flag } = require('constant')

/* eslint-disable require-jsdoc */
const db = require('db').helper

const createCashback = async (
  payloadCashbackManagement,
  payloadPaymentTransaction,
  payloadCashbackHistory,
  payloadCashbackProcess,
  wallet,
  crawlTransactionId,
) => {
  return await db.transaction(async (trx) => {
    await trx('cashback_management').insert(payloadCashbackManagement)

    // Update status to imported
    await trx('crawl_transaction')
      .update({
        processing_cashback: processingCashback.IMPORTED,
      })
      .where('id', crawlTransactionId)

    if (payloadCashbackManagement.cashback_status === cashbackStatus.SUCCESS) {
      await trx('payment_transaction').insert(payloadPaymentTransaction)

      await trx('transaction_history').insert(payloadCashbackHistory)

      await trx('transaction_process').insert(payloadCashbackProcess)

      // Add cashback to wallet
      await trx('wallets')
        .increment('total_assets', payloadPaymentTransaction.amount)
        .where('id', wallet.id)
    }

    return true
  })
}

const getCashBackJob2 = async (limit) => {
  try {
    return await db('cashback_management')
      .select(
        'id',
        'broker_id',
        'mt_account_no',
        'portfolio_id',
        'order_no',
        'deal_no',
        'ticket',
        'order_type',
        'platform',
        'account_type_id',
        'account_currency',
        'symbol',
        'myforex_symbol_id',
        'lot_rebates',
        'lot_rebates_currency',
        'cb_rebates',
        'cb_rebates_currency',
        'add_cb_rebates',
        'add_cb_rebates_currency',
        'open_time',
        'close_time',
        'profit',
        'volume',
        'wallet_add_date',
        'cashback_status',
        'trade_detail_transfer_status',
      )
      .where('delete_flag', flag.FALSE)
      .where('trade_detail_transfer_status', flag.FALSE)
      .where('cashback_status ', cashbackStatus.SUCCESS)
      .limit(limit)
  } catch (error) {
    console.error(error)
    return false
  }
}

module.exports = {
  createCashback,
  getCashBackJob2,
}
