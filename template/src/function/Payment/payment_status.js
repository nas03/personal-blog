// utility
const utility = require('utility')

// constant
const { reasonType, paymentTransactionStatus, paymentType, typeTransactionProcess, sourceTransactionProcess,
  actionGroupTransactionProcess, transactionType, toggleStatus, supportStatus, decisionMethod, commonSiteId,
  errorMessageCodeConstant } = require('constant')

// repository
const { errorLogRepository, reasonsRepository, paymentTransactionRepository } = require('repository')

// function
const { renderTitleTransaction } = require('../ApiAdvancedSetting/matching_deposit_localbank')
const { _roundingByCurrency } = require('./get_all_credit_card_api')

const getListReasonPayment = async (event) =>{
  try {
    const listReason = await reasonsRepository.getListReasonByReasonType([reasonType.PENDING_PAYMENT,
      reasonType.REJECT_PAYMENT, reasonType.CLOSE_PAYMENT])

    const response = {
      reason_pending: listReason.filter((reason) => reason.reason_type === reasonType.PENDING_PAYMENT) || null,
      reason_reject: listReason.filter((reason) => reason.reason_type === reasonType.REJECT_PAYMENT) || null,
      reason_close: listReason.filter((reason) => reason.reason_type === reasonType.CLOSE_PAYMENT) || null,
    }

    return utility.createResponse(true, response)
  } catch (error) {
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}


const changePaymentStatus = async (event) =>{
  try {
    const { id, newStatus, reason_id, otherReason } = JSON.parse(event.body)
    const staff_id = utility.getUserIdByToken(event)

    // validate input
    if (!id) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }
    const getPaymentTransInfor = await paymentTransactionRepository.getPaymentTransDetail(id)
    event.user_id = getPaymentTransInfor?.user_id

    if (!newStatus || ([paymentTransactionStatus.PENDING, paymentTransactionStatus.REJECT, paymentTransactionStatus.CLOSE]
      .includes(newStatus) && !(reason_id ? reason_id : otherReason))) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }
    if (!getPaymentTransInfor) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.PAYMENT_CHANGE_STATUS.PAYMENT_TRANS_NOT_EXIST])
    }

    const currentStatus = getPaymentTransInfor[0].payment_status
    const payment_type = getPaymentTransInfor[0].payment_type
    const transactionId = getPaymentTransInfor[0].transaction_id

    // validate input
    if (!validateStatusField(currentStatus, newStatus)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // create data update payment Transaction
    const payloadTransProcess = createTransactionProcess(newStatus, staff_id, getPaymentTransInfor)

    if (!payloadTransProcess.length) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // get data for,update wallet
    const payloadUpdateWallet = getMoneyTranferInfor(newStatus, getPaymentTransInfor)
    // get data for  update payment Transaction
    const payloadUpdatePaymentTrans = { transactionId, newStatus, staff_id, reason_id, otherReason, payment_type }
    // create data for transaction history
    const payloadTransHistory = await createTransactionHistory(newStatus, getPaymentTransInfor)

    // update payment status
    const updatePaymentStatus = await paymentTransactionRepository.updatePaymentStatus(payloadUpdateWallet, payloadTransProcess,
      payloadUpdatePaymentTrans, payloadTransHistory)

    if (!updatePaymentStatus) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.PAYMENT_CHANGE_STATUS.UPDATE_PAYMENT_STATUS])
    }

    return utility.createResponse(true)
  } catch (error) {
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getMoneyTranferInfor = (newStatus, paymentTransInfor) =>{
  try {
    const response = []
    const isDeposiToWallet = paymentTransInfor[0].payment_type === paymentType.PAY_IN && newStatus === paymentTransactionStatus.APPROVED
    const isRefundWithdraw = paymentTransInfor[0].payment_type === paymentType.PAY_OUT &&
    [paymentTransactionStatus.CLOSE, paymentTransactionStatus.REJECT].includes(newStatus)

    if (isDeposiToWallet) {
      response.push({
        totalAmount: paymentTransInfor[0].total_amount,
        wallet_id: paymentTransInfor[0].transaction_object_id,
      })
    } else if (isRefundWithdraw) {
    // get target wallet from transaction
      const lisTargetWallet = paymentTransInfor.filter((p) => p.transaction_type === transactionType.WITHDRAW)
      // get fee form payment transaction
      const feeFromTrans = paymentTransInfor.find((p) => p.transaction_type === transactionType.WITHDRAW_FEE)

      lisTargetWallet.forEach((targetWallet) => {
        response.push({
          // check if the fee currency and wallet currency are the same, if so add the fee amount
          totalAmount: -(targetWallet.amount + (feeFromTrans &&
            targetWallet.transaction_object_type === feeFromTrans.transaction_object_type ? feeFromTrans.amount : 0)),
          wallet_id: targetWallet.transaction_object_id,
        })
      })
    }

    return response
  } catch (error) {
    console.log(error)
    return []
  }
}


const createTransactionProcess = (newStatus, staff_id, paymentTransInfor, version) =>{
  let dataTransactionProcess = []

  const payment_type = paymentTransInfor[0]?.payment_type
  const currency = paymentTransInfor[0].amount_currency
  const exchange_rate = paymentTransInfor[0]?.exchange_rate
  const exchange_symbol = paymentTransInfor[0]?.exchange_symbol
  const transaction_id = paymentTransInfor[0]?.transaction_id
  const user_id = paymentTransInfor[0]?.user_id
  const fee = paymentTransInfor[0]?.total_fee || 0
  const amount = paymentTransInfor[0]?.total_amount || 0
  const amountWithFee = amount + (payment_type === paymentType.PAY_IN ? fee : -fee)
  const wallet_id = paymentTransInfor[0]?.transaction_object_id
  const lisTargetWallet = paymentTransInfor[0].site_id === commonSiteId.MY_FOREX ?
    paymentTransInfor.filter((payment) => payment.transaction_type === transactionType.WITHDRAW) : []


  switch (newStatus) {
    case paymentTransactionStatus.PROCESSING:
      dataTransactionProcess = [{
        user_basic_data_id: user_id,
        transaction_id: transaction_id,
        type: typeTransactionProcess.PAYMENT_STATUS,
        source: sourceTransactionProcess.PROCESSING,
        amount: amountWithFee,
        currency: currency,
        action_group: actionGroupTransactionProcess.OPERATOR_ACTION,
        staff_id: staff_id,
      }]
      break
    case paymentTransactionStatus.PENDING:
      dataTransactionProcess = [{
        user_basic_data_id: user_id,
        transaction_id: transaction_id,
        type: typeTransactionProcess.PAYMENT_STATUS,
        source: sourceTransactionProcess.PENDING,
        amount: amountWithFee,
        currency: currency,
        action_group: actionGroupTransactionProcess.OPERATOR_ACTION,
        staff_id: staff_id,
      }]
      break
    case paymentTransactionStatus.APPROVED:
      dataTransactionProcess = [
        {
          user_basic_data_id: user_id,
          transaction_id: transaction_id,
          type: typeTransactionProcess.PAYMENT_STATUS,
          source: sourceTransactionProcess.APPROVED,
          amount: amountWithFee,
          currency: currency,
          action_group: actionGroupTransactionProcess.OPERATOR_ACTION,
          staff_id: staff_id,
        },
        payment_type === paymentType.PAY_IN && exchange_rate ? {
          user_basic_data_id: user_id,
          transaction_id: transaction_id,
          type: typeTransactionProcess.EXCHANGE,
          source: `${sourceTransactionProcess.CURRENCY_EXCHANGE}, ${exchange_symbol.split('/')[1]} ${utility.roundNumber(exchange_rate, 6)}`,
          amount: _roundingByCurrency(amountWithFee * exchange_rate, currency),
          currency: currency,
          action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
        } : undefined,
        fee ? {
          user_basic_data_id: user_id,
          transaction_id: transaction_id,
          type: typeTransactionProcess.CHARGE,
          source: payment_type === paymentType.PAY_IN ? sourceTransactionProcess.DEPOSIT_FEE : sourceTransactionProcess.WITHDRAWAL_FEE,
          amount: -fee,
          currency: currency,
          action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
        } : undefined,
        {
          user_basic_data_id: user_id,
          transaction_id: transaction_id,
          type: payment_type === paymentType.PAY_IN ? typeTransactionProcess.PAY_IN : typeTransactionProcess.PAY_OUT,
          source: lisTargetWallet.length ? lisTargetWallet[0]?.transaction_object_id : wallet_id,
          amount: lisTargetWallet.length ? lisTargetWallet[0]?.amount : amount,
          currency: lisTargetWallet.length ? lisTargetWallet[0]?.currency : currency,
          action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
        },
        lisTargetWallet.length > 1 ? {
          user_basic_data_id: user_id,
          transaction_id: transaction_id,
          type: payment_type === paymentType.PAY_IN ? typeTransactionProcess.PAY_IN : typeTransactionProcess.PAY_OUT,
          source: lisTargetWallet[1]?.transaction_object_id,
          amount: lisTargetWallet[1]?.amount,
          currency: lisTargetWallet[1]?.currency,
          action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
        } : undefined,
      ]
      break
    case paymentTransactionStatus.REJECT:
      dataTransactionProcess = [
        {
          user_basic_data_id: user_id,
          transaction_id: transaction_id,
          type: typeTransactionProcess.PAYMENT_STATUS,
          source: sourceTransactionProcess.REJECT,
          amount: amountWithFee,
          currency: currency,
          action_group: actionGroupTransactionProcess.OPERATOR_ACTION,
          staff_id: staff_id,
        },
        {
          user_basic_data_id: user_id,
          transaction_id: transaction_id,
          type: payment_type === paymentType.PAY_IN ? typeTransactionProcess.PAY_IN : typeTransactionProcess.PAY_OUT,
          source: sourceTransactionProcess.REJECT_CLOSE,
          amount: amountWithFee,
          currency: currency,
          action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
        },
      ]
      break
    case paymentTransactionStatus.CLOSE:
      dataTransactionProcess = [
        {
          user_basic_data_id: user_id,
          transaction_id: transaction_id,
          type: typeTransactionProcess.PAYMENT_STATUS,
          source: sourceTransactionProcess.CLOSE,
          amount: amountWithFee,
          currency: currency,
          action_group: actionGroupTransactionProcess.OPERATOR_ACTION,
          staff_id: staff_id,
        },
        {
          user_basic_data_id: user_id,
          transaction_id: transaction_id,
          type: payment_type === paymentType.PAY_IN ? typeTransactionProcess.PAY_IN : typeTransactionProcess.PAY_OUT,
          source: sourceTransactionProcess.REJECT_CLOSE,
          amount: amountWithFee,
          currency: currency,
          action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
        },
      ]
      break
    default:
      break
  }

  const response = dataTransactionProcess.filter((el) => el !== undefined)
  return response
}

const createTransactionHistory = async (newStatus, paymentTransInfor) =>{
  try {
    let res = []
    // paymentTransInfor[0] = DeposiTargetWallet
    if (newStatus === paymentTransactionStatus.APPROVED &&
       paymentTransInfor[0].payment_type === paymentType.PAY_IN) {
      if (paymentTransInfor[0].total_fee) {
        res = [{
          user_basic_data_id: paymentTransInfor[0].user_id,
          transaction_id: paymentTransInfor[0].transaction_id,
          payment_category_id: paymentTransInfor[0].payment_category_id,
          payment_detail_id: paymentTransInfor[0].payment_detail_id,
          transaction_type: transactionType.DEPOSIT_FEE,
          transaction_object_type: paymentTransInfor[0].type_wallet,
          transaction_object_id: paymentTransInfor[0].transaction_object_id,
          ...await renderTitleTransaction(
            transactionType.DEPOSIT_FEE,
            paymentTransInfor[0].type_wallet,
          ),
          transaction_status: paymentTransactionStatus.APPROVED,
          amount: -paymentTransInfor[0].total_fee,
          exchange_rate: paymentTransInfor[0].ts_exchange_rate,
          exchange_symbol: paymentTransInfor[0].ts_exchange_symbol,
          wallet_balance_after_payment: Number(paymentTransInfor[0].total_assets) + Number(paymentTransInfor[0].total_amount),

        },
        {
          user_basic_data_id: paymentTransInfor[0].user_id,
          transaction_id: paymentTransInfor[0].transaction_id,
          transaction_type: paymentTransInfor[0].transaction_type,
          payment_category_id: paymentTransInfor[0].payment_category_id,
          payment_detail_id: paymentTransInfor[0].payment_detail_id,
          transaction_object_type: paymentTransInfor[0].transaction_object_type,
          transaction_object_id: paymentTransInfor[0].transaction_object_id,
          ja_title: paymentTransInfor[0].ja_title,
          en_title: paymentTransInfor[0].en_title,
          cn_title: paymentTransInfor[0].cn_title,
          kr_title: paymentTransInfor[0].kr_title,
          transaction_status: paymentTransactionStatus.APPROVED,
          amount: paymentTransInfor[0].amount - paymentTransInfor[0].total_fee,
          exchange_rate: paymentTransInfor[0].ts_exchange_rate,
          exchange_symbol: paymentTransInfor[0].ts_exchange_symbol,
          wallet_balance_after_payment: Number(paymentTransInfor[0].total_assets) +
             Number(paymentTransInfor[0].total_amount) + Number(paymentTransInfor[0].total_fee),
        },
        ]
      } else {
        res.push( {
          user_basic_data_id: paymentTransInfor[0].user_id,
          transaction_id: paymentTransInfor[0].transaction_id,
          transaction_type: paymentTransInfor[0].transaction_type,
          payment_category_id: paymentTransInfor[0].payment_category_id,
          payment_detail_id: paymentTransInfor[0].payment_detail_id,
          transaction_object_type: paymentTransInfor[0].transaction_object_type,
          transaction_object_id: paymentTransInfor[0].transaction_object_id,
          ja_title: paymentTransInfor[0].ja_title,
          en_title: paymentTransInfor[0].en_title,
          cn_title: paymentTransInfor[0].cn_title,
          kr_title: paymentTransInfor[0].kr_title,
          transaction_status: paymentTransactionStatus.APPROVED,
          amount: paymentTransInfor[0].amount,
          exchange_rate: paymentTransInfor[0].ts_exchange_rate,
          exchange_symbol: paymentTransInfor[0].ts_exchange_symbol,
          wallet_balance_after_payment: Number(paymentTransInfor[0].total_assets) + Number(paymentTransInfor[0].total_amount),
        })
      }
    } else if (paymentTransInfor[0].payment_type === paymentType.PAY_OUT &&
      [paymentTransactionStatus.REJECT, paymentTransactionStatus.CLOSE].includes(newStatus)
    ) {
      const isFee = paymentTransInfor.find((el) => el.transaction_type === transactionType.WITHDRAW_FEE)
      if (isFee) {
        const idWithdraw = paymentTransInfor.find((el) => el.transaction_object_id === isFee.transaction_object_id &&
          el.transaction_type === transactionType.WITHDRAW)
        res.push({
          user_basic_data_id: paymentTransInfor[0].user_id,
          transaction_id: isFee.transaction_id,
          payment_category_id: isFee.payment_category_id,
          payment_detail_id: isFee.payment_detail_id,
          transaction_type: isFee.transaction_type,
          transaction_object_type: isFee.transaction_object_type,
          transaction_object_id: isFee.transaction_object_id,
          ja_title: isFee.ja_title,
          en_title: isFee.en_title,
          cn_title: isFee.cn_title,
          kr_title: isFee.kr_title,
          transaction_status: newStatus,
          amount: isFee.amount,
          exchange_rate: isFee.ts_exchange_rate,
          exchange_symbol: isFee.ts_exchange_symbol,
          account_bank_receive_id: isFee.ts_account_bank_receive_id,
          wallet_balance_after_payment: Number(isFee.total_assets) +
          Math.abs(Number(idWithdraw.amount)) + Math.abs(Number(isFee.amount)),
        })
      }
      const paymentExcludeFee = paymentTransInfor.filter((el) => el.transaction_type !== transactionType.WITHDRAW_FEE)
      paymentExcludeFee.forEach((el) => {
        res.push({
          user_basic_data_id: paymentTransInfor[0].user_id,
          transaction_id: el.transaction_id,
          payment_category_id: el.payment_category_id,
          payment_detail_id: el.payment_detail_id,
          transaction_type: el.transaction_type,
          transaction_object_type: el.transaction_object_type,
          transaction_object_id: el.transaction_object_id,
          ja_title: el.ja_title,
          en_title: el.en_title,
          cn_title: el.cn_title,
          kr_title: el.kr_title,
          transaction_status: newStatus,
          amount: el.amount,
          exchange_rate: el.ts_exchange_rate,
          exchange_symbol: el.ts_exchange_symbol,
          account_bank_receive_id: el.ts_account_bank_receive_id,
          wallet_balance_after_payment: Number(el.total_assets) + Math.abs(Number(el.amount)),
        })
      })
    } else {
      const isFee = paymentTransInfor.find((el) => el.transaction_type === transactionType.WITHDRAW_FEE)

      paymentTransInfor.forEach((el) => {
        res.push({
          user_basic_data_id: paymentTransInfor[0].user_id,
          transaction_id: el.transaction_id,
          payment_category_id: el.payment_category_id,
          payment_detail_id: el.payment_detail_id,
          transaction_type: el.transaction_type,
          transaction_object_type: el.transaction_object_type,
          transaction_object_id: el.transaction_object_id,
          ja_title: el.ja_title,
          en_title: el.en_title,
          cn_title: el.cn_title,
          kr_title: el.kr_title,
          transaction_status: newStatus,
          amount: el.amount,
          exchange_rate: el.ts_exchange_rate,
          exchange_symbol: el.ts_exchange_symbol,
          account_bank_receive_id: el.ts_account_bank_receive_id,
          wallet_balance_after_payment: el.transaction_type === transactionType.WITHDRAW &&
          isFee ? Number(el.total_assets) + Number(Math.abs(isFee.amount)) :
            Number(el.total_assets),
        })
      })
    }
    return res
  } catch (error) {
    console.log(error)
    return []
  }
}


// validate field new status
const validateStatusField = (currentStatus, newStatus) =>{
  switch (currentStatus) {
    case paymentTransactionStatus.ACTION_REQUIRED:
      if ([paymentTransactionStatus.PENDING,
        paymentTransactionStatus.REJECT,
        paymentTransactionStatus.CLOSE,
        paymentTransactionStatus.PROCESSING,
        paymentTransactionStatus.APPROVED].includes(newStatus)) {
        return true
      }
      return false

    case paymentTransactionStatus.PROCESSING:
      if ([paymentTransactionStatus.APPROVED, paymentTransactionStatus.PENDING,
        paymentTransactionStatus.CLOSE, paymentTransactionStatus.REJECT].includes(newStatus)) {
        return true
      }
      return false
    case paymentTransactionStatus.PENDING:
      if ([paymentTransactionStatus.APPROVED, paymentTransactionStatus.CLOSE, paymentTransactionStatus.REJECT].includes(newStatus)) {
        return true
      }
      return false
    case paymentTransactionStatus.APPROVED:
      return false
    case paymentTransactionStatus.REJECT:
      return false
    case paymentTransactionStatus.CLOSE:
      return false
    default:
      return false
  }
}

const changeSupportStatus = async (event) =>{
  try {
    const { id, toggle_status } = JSON.parse(event.body)
    const staff_id = utility.getUserIdByToken(event)
    if (!id) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }
    const getPaymentTransDetail = await paymentTransactionRepository.getPaymentTransDetail(id)
    event.user_id = getPaymentTransDetail?.user_id

    if (!toggle_status) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }
    if (!getPaymentTransDetail) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    const current_status = getPaymentTransDetail[0].payment_status
    if ([
      paymentTransactionStatus.REJECT,
      paymentTransactionStatus.CLOSE,
      paymentTransactionStatus.APPROVED,
    ].includes(current_status)) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.CHANGE_SUPPORT_STATUS.UPDATE_FAIL.CURRENT_STATUS])
    }

    const payloadUpdate = { id }
    switch (current_status) {
      case paymentTransactionStatus.ACTION_REQUIRED:
        if (toggle_status === toggleStatus.ON) {
          payloadUpdate.support_status = supportStatus.WORKING
          payloadUpdate.staff_id = staff_id
          payloadUpdate.decision_method = decisionMethod.MANUAL
        } else {
          payloadUpdate.support_status = supportStatus.NO_WORKING
          payloadUpdate.staff_id = null
          payloadUpdate.decision_method = decisionMethod.AUTOMATIC
        }
        break
      case paymentTransactionStatus.PROCESSING:
      case paymentTransactionStatus.PENDING:
        if (toggle_status === toggleStatus.ON) {
          payloadUpdate.support_status = supportStatus.WORKING
          payloadUpdate.staff_id = staff_id
          payloadUpdate.decision_method = decisionMethod.MANUAL
        } else {
          payloadUpdate.support_status = supportStatus.NO_WORKING
          payloadUpdate.staff_id = staff_id
          payloadUpdate.decision_method = decisionMethod.MANUAL
        }
        break
      default:
        break
    }

    const updateSupportStt = await paymentTransactionRepository.updateSupportStatus(payloadUpdate)

    if (!updateSupportStt) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.CHANGE_SUPPORT_STATUS.UPDATE_FAIL.UPDATE_FAIL_DB])
    }

    return utility.createResponse(true)
  } catch (err) {
    console.log(err)
    return await errorLogRepository.createResponseAndLog(event, err, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}


module.exports = {
  getListReasonPayment,
  changePaymentStatus,
  changeSupportStatus,
}
