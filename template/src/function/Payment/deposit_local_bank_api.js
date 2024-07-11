/* DB */
const {
  depositLocalBankApiRepository, reasonsRepository, walletsRepository,
  transactionRepository, transactionProcessRepository, errorLogRepository, usersBasicDataRepository,
} = require('repository')

/* func */
const utility = require('utility')
const { autoChangeStatusPayment, sendMailCompetePayment } = require('../ApiAdvancedSetting/matching_deposit_localbank.js')

/* constant */
const { userMatchingStatus, reasonType, dateFormat, supportStatus, paymentTransactionStatus,
  typeWallet, amountDeposit, decisionMethod, paymentType, paymentMethodFXON, paymentCategoryFXON, paymentDetailFXON,
  paymentServiceAccountFXON, sourceTransactionProcess, typeTransactionProcess, baseCurrency, actionGroupTransactionProcess, paymentCompanyAccountFXON,
  errorMessageCodeConstant,
} = require('constant')

/* library */
const moment = require('moment')
const _ = require('lodash')

const updateUserMatchingStatus = async (event) => {
  try {
    const eventBody = JSON.parse(event.body)
    let { id, status, reasonId, reasonOther, userId } = eventBody
    const staffId = utility.getUserIdByToken(event)
    event.user_id = userId || null
    // Validate
    if (!id || !status) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    if (!Object.values(userMatchingStatus).includes(status) || status === userMatchingStatus.ACTION_REQUIRED) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    const paymentNotification = await depositLocalBankApiRepository.getPaymentNotificationById(id)
    if (!paymentNotification) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    if (
      (paymentNotification.matching_process_status === userMatchingStatus.PROCESSING &&
      ![userMatchingStatus.PENDING, userMatchingStatus.SUCCESS,
        userMatchingStatus.REJECT, userMatchingStatus.CLOSE].includes(status)) ||
      (paymentNotification.matching_process_status === userMatchingStatus.PENDING &&
      ![userMatchingStatus.SUCCESS,
        userMatchingStatus.REJECT, userMatchingStatus.CLOSE].includes(status)) ||
      [userMatchingStatus.SUCCESS, userMatchingStatus.REJECT,
        userMatchingStatus.CLOSE].includes(paymentNotification.matching_process_status) ||
      paymentNotification.matching_process_status === status
    ) {
      return await errorLogRepository.createResponseAndLog(
        event,
        null,
        null,
        [errorMessageCodeConstant.UPDATE_USER_MATCHING_STATUS.UPDATE_FAIL.MATCHING_STATUS_INCORRECT])
    }

    // Status is: Reject, Pending, Close, Processing
    if ([userMatchingStatus.REJECT, userMatchingStatus.PENDING,
      userMatchingStatus.CLOSE, userMatchingStatus.PROCESSING].includes(status)) {
      if (status === userMatchingStatus.PROCESSING) {
        reasonId = null,
        reasonOther = null
      } else {
        if (!reasonId && !reasonOther) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
        }

        // Validate reason ID
        if (reasonId) {
          let reasonTypeId
          switch (status) {
            case userMatchingStatus.REJECT:
              reasonTypeId = reasonType.REJECT_MATCHING
              break
            case userMatchingStatus.PENDING:
              reasonTypeId = reasonType.PENDING_MATCHING
              break
            default:
              reasonTypeId = reasonType.CLOSE_MATCHING
              break
          }

          const reason = await reasonsRepository.checkReasonExist(reasonId, reasonTypeId)
          if (!reason) {
            return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
          }

          reasonOther = null
        } else {
          reasonId = null
        }
      }

      let source
      if (status === userMatchingStatus.PROCESSING) {
        source = sourceTransactionProcess.PROCESSING
      } else if (status === userMatchingStatus.PENDING) {
        source = sourceTransactionProcess.PENDING
      } else {
        source = sourceTransactionProcess.IMPOSSIBLE
      }

      // Update content
      const payload = {
        matching_process_status: status,
        reason_id: reasonId,
        reason_other: reasonOther,
        processing_date: moment().utc().format(dateFormat.DATE_TIME),
        staff_id: staffId,
        matching_method: decisionMethod.MANUAL,
      }
      // Update support_status to Completion
      if (status !== userMatchingStatus.PENDING && status !== userMatchingStatus.PROCESSING) {
        payload.support_status = supportStatus.COMPLETION
      }

      const result = await depositLocalBankApiRepository.updateUserMatchingStatus(
        id, payload, source, paymentNotification.transaction_id, paymentNotification.amount, staffId)
      if (!result) {
        return await errorLogRepository.createResponseAndLog(
          event,
          null,
          null,
          [errorMessageCodeConstant.UPDATE_USER_MATCHING_STATUS.UPDATE_FAIL.USER_MATCHING_STATUS_DB_FAIL],
        )
      }
    // Status is: Success
    } else {
      if (!userId) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
      }

      const userInfo = await usersBasicDataRepository.getUserInfo(userId)
      if (!userInfo) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
      }

      // check amount > 1000 jpy
      if (paymentNotification.amount <= amountDeposit.LOCAL_BANK.FEE) {
        return await errorLogRepository.createResponseAndLog(
          event,
          null,
          null,
          [errorMessageCodeConstant.UPDATE_USER_MATCHING_STATUS.UPDATE_FAIL.SMALL_AMOUNT],
        )
      }

      // Get wallet info and first transaction request
      const firstRequest = await depositLocalBankApiRepository.getFirstRequestByUserId(userId, paymentNotification.payment_company_id) || {}
      const walletInfo = await walletsRepository.getWalletByUserId(userId, typeWallet.JPY_WALLET) || {}

      // Check status
      const paymentInfo = {
        paymentType: paymentType.PAY_IN,
        paymentMethod: paymentMethodFXON.BANK,
        paymentCategory: paymentCategoryFXON.LOCAL_BANK,
        paymentDetail: paymentDetailFXON.BANK_TRANSFER_LOCAL_BANK,
        paymentCompanyAccount: paymentNotification.payment_company_id,
        paymentServiceAccount: paymentNotification.payment_company_id === paymentCompanyAccountFXON.DEPOSIT.BANK_TRANSFER.MAX_CONNECT ?
          paymentServiceAccountFXON.DEPOSIT.BANK_TRANSFER.LOCAL_BANK_TRANSFER_MAX_CONNECT :
          paymentServiceAccountFXON.DEPOSIT.BANK_TRANSFER.LOCAL_BANK_INFINITAS,
        paymentCurrency: baseCurrency.JPY,
      }
      // Save transaction process
      const objTransactionProcess = []
      // Add Matching approved and System payment
      objTransactionProcess.push({
        user_basic_data_id: staffId,
        transaction_id: paymentNotification.transaction_id,
        type: typeTransactionProcess.MATCHING_STATUS,
        source: sourceTransactionProcess.MATCHING_APPROVED,
        option: userInfo.member_id,
        amount: paymentNotification.amount,
        currency: baseCurrency.JPY,
        action_group: actionGroupTransactionProcess.OPERATOR_ACTION,
        ts_regist: moment().utc().format(dateFormat.DATE_TIME),
      }, {
        user_basic_data_id: userId,
        transaction_id: paymentNotification.transaction_id,
        type: typeTransactionProcess.PAYMENT_STATUS,
        source: sourceTransactionProcess.SYSTEM_PAYMENT,
        amount: paymentNotification.amount,
        currency: baseCurrency.JPY,
        action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
        ts_regist: moment().utc().format(dateFormat.DATE_TIME),
      })

      const { objPayment, objTransaction } = await autoChangeStatusPayment(
        userInfo,
        paymentNotification.transaction_id,
        paymentNotification.amount,
        walletInfo,
        paymentNotification.ts_regist,
        _.isEmpty(firstRequest),
        paymentInfo,
        objTransactionProcess,
      )

      const result = await depositLocalBankApiRepository.updateStatusToSuccess(id, userInfo, staffId, firstRequest, objPayment)
      if (!result) {
        return await errorLogRepository.createResponseAndLog(
          event,
          null,
          null,
          [errorMessageCodeConstant.UPDATE_USER_MATCHING_STATUS.UPDATE_FAIL.STATUS_TO_SUCCESS_DB_FAIL],
        )
      }

      // create history
      await transactionRepository.createTransactionHistory(objTransaction)

      // create transaction process
      await transactionProcessRepository.createTransactionProcess(objTransactionProcess)

      if (objPayment.payment_status === paymentTransactionStatus.APPROVED) {
        // send mail payment complete
        await sendMailCompetePayment(userInfo, objPayment, walletInfo, objPayment.amount)
      }
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getListReasonForUserMatching = async (event) => {
  try {
    const listReason = await reasonsRepository.getListReasonByReasonType([
      reasonType.REJECT_MATCHING,
      reasonType.PENDING_MATCHING,
      reasonType.CLOSE_MATCHING,
    ])

    return utility.createResponse(true, listReason)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const updateUserMatchingWorking = async (event) => {
  try {
    const eventBody = JSON.parse(event.body)
    const { id, status } = eventBody
    const staffId = utility.getUserIdByToken(event)

    // Validate
    if (!id) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    if (!Object.values(supportStatus).includes(status) || status === supportStatus.COMPLETION) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    const paymentNotification = await depositLocalBankApiRepository.getPaymentNotificationById(id)
    if (!paymentNotification || paymentNotification.support_status === supportStatus.COMPLETION) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    const result = await depositLocalBankApiRepository.updateById(id, {
      support_status: status,
      staff_id: status === supportStatus.NO_WORKING &&
      paymentNotification.matching_process_status === userMatchingStatus.ACTION_REQUIRED ? null : staffId,
      matching_method: status === supportStatus.NO_WORKING &&
      paymentNotification.matching_process_status === userMatchingStatus.ACTION_REQUIRED ? decisionMethod.AUTOMATIC : decisionMethod.MANUAL,
    })

    if (!result) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_USER_MATCHING_WORKING.UPDATE_DEPOSIT_LOCAL_BANK_API_FAIL])
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getAllUserPayment = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}

    if (queryString.site_id) {
      queryString.site_id = queryString.site_id.split(',').filter(Number)
    }

    // Get staff display date time
    const staffId = utility.getUserIdByToken(event)
    const staffInfo = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': staffId })
    queryString.utc = staffInfo.timezone || null

    // paging, sort
    const pagination = utility.getPagination(queryString)
    const result = await usersBasicDataRepository.getListUserPayment(queryString, pagination)

    return utility.createResponse(true, result)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getDepositLocalBankApiById = async (event) => {
  try {
    if (!event.queryStringParameters || !event.queryStringParameters.id) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }
    const id = Number(event.queryStringParameters.id)
    const response = await depositLocalBankApiRepository.getDepositLocalBankApiById(id)
    if (!response) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }
    return utility.createResponse(true, response)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  updateUserMatchingStatus,
  getListReasonForUserMatching,
  updateUserMatchingWorking,
  getAllUserPayment,
  getDepositLocalBankApiById,
}
