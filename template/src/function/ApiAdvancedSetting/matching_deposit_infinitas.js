'use strict'

/* constant */
const { bankApi, postRequest, userMatchingStatus, dateFormat, matchingMethod, typeWallet, amountDeposit,
  paymentDetailFXON, paymentCompanyAccountFXON, typeTransactionProcess, baseCurrency, actionGroupTransactionProcess, commonSiteId,
  sourceTransactionProcess, paymentType, paymentMethodFXON, paymentCategoryFXON, paymentServiceAccountFXON, message,
  errorMessageCodeConstant } = require('constant')
const default_UserId = -99

/* DB */
const { depositLocalBankApiRepository, userMatchingRuleRepository, walletsRepository,
  paymentDetailRepository, paymentCompanyAccRepository, transactionProcessRepository,
  errorLogRepository, usersBasicDataRepository } = require('repository')

/* func */
const utility = require('utility')
const { autoChangeStatusPayment, checkNameTransfer, handleCreatePayment } = require('./matching_deposit_localbank.js')

/* library */
const moment = require('moment')

const matchingDepositInfinitas = async (event) => {
  try {
    console.log('====== START API: ', moment().utc().format(dateFormat.DATE_TIME))
    console.log('====== Request data: ', event)
    const { deposit, name, date } = JSON.parse(event.body)

    const objParams = deposit.map((el, index) => ({
      name: name[index],
      amount: el,
      date,
    }))

    const userMatchingRule = await userMatchingRuleRepository.getUserMatchingRule(bankApi.FXT_INFINITAS)
    const error_log = []
    const resultMatching = objParams.map(async (el) => {
      try {
        const responseDate = moment().utc().format(dateFormat.DATE_TIME)
        const transaction_id = utility.renderTransactionId()
        const member_id = el.name.slice(0, 6)?.toLowerCase().trim()
        // create local bank api action require
        const objMatching = {
          member_id: member_id,
          post_request: postRequest.PAYMENT_NOTIFICATION,
          payment_company_id: paymentCompanyAccountFXON.DEPOSIT.BANK_TRANSFER.INFINITAS,
          amount: el.amount,
          remitter_name: el.name,
          transaction_id,
          processing_date: responseDate,
          matching_method: matchingMethod.AUTOMATIC,
          matching_process_status: userMatchingStatus.ACTION_REQUIRED,
          ts_regist: responseDate,
        }
        const idNewMatching = await depositLocalBankApiRepository.createLocalBankApi(objMatching)

        const [paymentDetailInfo, paymentCompanyInfo] = await Promise.all([
          paymentDetailRepository.getPaymentDetailById(paymentDetailFXON.BANK_TRANSFER_LOCAL_BANK),
          paymentCompanyAccRepository.getCompanyAccById(paymentCompanyAccountFXON.DEPOSIT.BANK_TRANSFER.INFINITAS, commonSiteId.FXT),
        ])
        // create transaction process posting
        const objProcessPosting = {
          user_basic_data_id: default_UserId,
          transaction_id,
          type: typeTransactionProcess.POSTING,
          source: `${paymentDetailInfo.category_enName}, ${paymentDetailInfo.detail_enName}`,
          option: `${paymentCompanyInfo[0].en_company_name}, ${paymentCompanyInfo[0].en_service_name}`,
          amount: el.amount,
          currency: baseCurrency.JPY,
          action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
          ts_regist: moment().utc().format(dateFormat.DATE_TIME),
        }
        const idNewTransactionProcess = await transactionProcessRepository.createTransactionProcess(objProcessPosting)
        const objTransactionProcess = []

        if (el.amount > amountDeposit.LOCAL_BANK.FEE) {
          if (userMatchingRule?.match_api_response) {
            // matching member_id
            const userInfo = await usersBasicDataRepository.getUserInfoByMemberId(member_id)
            if (!userInfo) {
              objTransactionProcess.push({
                user_basic_data_id: default_UserId,
                transaction_id,
                type: typeTransactionProcess.MATCHING_STATUS,
                source: sourceTransactionProcess.MATCHING_FAILURE,
                amount: el.amount,
                currency: baseCurrency.JPY,
                action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
                ts_regist: moment().utc().format(dateFormat.DATE_TIME),
              }, {
                user_basic_data_id: default_UserId,
                transaction_id,
                type: typeTransactionProcess.MATCHING_STATUS,
                source: sourceTransactionProcess.ACTION_REQUIRED,
                amount: el.amount,
                currency: baseCurrency.JPY,
                action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
                ts_regist: moment().utc().format(dateFormat.DATE_TIME),
              })
              await transactionProcessRepository.createTransactionProcess(objTransactionProcess)
              error_log.push({
                message: message.user_not_found,
                data: el,
              })
              return false
            }
            await transactionProcessRepository.updateById(idNewTransactionProcess, { user_basic_data_id: userInfo.id })

            objTransactionProcess.push({
              user_basic_data_id: userInfo.id,
              transaction_id,
              type: typeTransactionProcess.MATCHING_STATUS,
              source: sourceTransactionProcess.SYSTEM_MATCHING,
              amount: el.amount,
              currency: baseCurrency.JPY,
              action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
              ts_regist: moment().utc().format(dateFormat.DATE_TIME),
            })

            // check jpy wallet
            const walletInfo = await walletsRepository.getWalletByUserId(userInfo.id, typeWallet.JPY_WALLET)
            if (!walletInfo) {
              objTransactionProcess.push({
                user_basic_data_id: userInfo.id,
                transaction_id,
                type: typeTransactionProcess.MATCHING_STATUS,
                source: sourceTransactionProcess.MATCHING_FAILURE,
                amount: el.amount,
                currency: baseCurrency.JPY,
                action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
                ts_regist: moment().utc().format(dateFormat.DATE_TIME),
              }, {
                user_basic_data_id: userInfo.id,
                transaction_id,
                type: typeTransactionProcess.MATCHING_STATUS,
                source: sourceTransactionProcess.ACTION_REQUIRED,
                amount: el.amount,
                currency: baseCurrency.JPY,
                action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
                ts_regist: moment().utc().format(dateFormat.DATE_TIME),
              })
              await transactionProcessRepository.createTransactionProcess(objTransactionProcess)
              error_log.push({
                message: message.wallet_not_found,
                data: el,
              })
              return false
            }

            // check matching transfer name check
            let checkName = true
            if (userMatchingRule.transfer_name_check) {
              // check personal
              const user_name = el.name.slice(6)?.trim()
              checkName = await checkNameTransfer(userInfo, user_name, userMatchingRule)
            }
            // auto create payment and history transaction
            if (checkName) {
              objTransactionProcess.push({
                user_basic_data_id: userInfo.id,
                transaction_id,
                type: typeTransactionProcess.MATCHING_STATUS,
                source: sourceTransactionProcess.MATCHING_APPROVED,
                option: member_id,
                amount: el.amount,
                currency: baseCurrency.JPY,
                action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
                ts_regist: moment().utc().format(dateFormat.DATE_TIME),
              }, {
                user_basic_data_id: userInfo.id,
                transaction_id,
                type: typeTransactionProcess.PAYMENT_STATUS,
                source: sourceTransactionProcess.SYSTEM_PAYMENT,
                amount: el.amount,
                currency: baseCurrency.JPY,
                action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
                ts_regist: moment().utc().format(dateFormat.DATE_TIME),
              })
              // Check status
              const paymentInfo = {
                paymentType: paymentType.PAY_IN,
                paymentMethod: paymentMethodFXON.BANK,
                paymentCategory: paymentCategoryFXON.LOCAL_BANK,
                paymentDetail: paymentDetailFXON.BANK_TRANSFER_LOCAL_BANK,
                paymentCompanyAccount: paymentCompanyAccountFXON.DEPOSIT.BANK_TRANSFER.INFINITAS,
                paymentServiceAccount: paymentServiceAccountFXON.DEPOSIT.BANK_TRANSFER.LOCAL_BANK_INFINITAS,
              }
              // eslint-disable-next-line max-len
              const { objPayment, objTransaction, amountPayment } = await autoChangeStatusPayment(userInfo, transaction_id, el.amount, walletInfo, responseDate, false, {
                ...paymentInfo,
                paymentCurrency: baseCurrency.JPY,
              }, objTransactionProcess)

              const objLocalBankApi = {
                matching_process_status: userMatchingStatus.SUCCESS,
                user_basic_data_id: userInfo.id,
              }

              await handleCreatePayment(idNewMatching, objPayment, objLocalBankApi, objTransaction, walletInfo, userInfo, amountPayment)
            } else {
              objTransactionProcess.push({
                user_basic_data_id: userInfo.id,
                transaction_id,
                type: typeTransactionProcess.MATCHING_STATUS,
                source: sourceTransactionProcess.MATCHING_FAILURE,
                amount: el.amount,
                currency: baseCurrency.JPY,
                action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
                ts_regist: moment().utc().format(dateFormat.DATE_TIME),
              }, {
                user_basic_data_id: userInfo.id,
                transaction_id,
                type: typeTransactionProcess.MATCHING_STATUS,
                source: sourceTransactionProcess.ACTION_REQUIRED,
                amount: el.amount,
                currency: baseCurrency.JPY,
                action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
                ts_regist: moment().utc().format(dateFormat.DATE_TIME),
              })
            }
          } else {
            objTransactionProcess.push({
              user_basic_data_id: default_UserId,
              transaction_id,
              type: typeTransactionProcess.MATCHING_STATUS,
              source: sourceTransactionProcess.ACTION_REQUIRED,
              amount: el.amount,
              currency: baseCurrency.JPY,
              action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
              ts_regist: moment().utc().format(dateFormat.DATE_TIME),
            })
          }
        } else {
          objTransactionProcess.push({
            user_basic_data_id: default_UserId,
            transaction_id,
            type: typeTransactionProcess.MATCHING_STATUS,
            source: sourceTransactionProcess.ACTION_REQUIRED,
            amount: el.amount,
            currency: baseCurrency.JPY,
            action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
            ts_regist: moment().utc().format(dateFormat.DATE_TIME),
          })
        }
        // create transaction process
        await transactionProcessRepository.createTransactionProcess(objTransactionProcess)
        return true
      } catch (error) {
        error_log.push({
          message: error.message,
          data: el,
        })
        console.log(error)
        return false
      }
    })

    await Promise.all(resultMatching)
    if (error_log.length) {
      await errorLogRepository.createResponseAndLog(event, { listDataError: error_log }, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
    }
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ result: 'OK' }),
    }
  } catch (err) {
    console.log(err)
    await errorLogRepository.createResponseAndLog(event, err, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ result: 'OK' }),
    }
  }
}


module.exports = {
  matchingDepositInfinitas,
}
