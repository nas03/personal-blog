'use strict'

/* constant */
const { postRequest, dateFormat, paymentType, paymentMethodFXON, paymentCategoryFXON, paymentDetailFXON, paymentCompanyAccountFXON,
  paymentServiceAccountFXON, decisionMethod, paymentTransactionStatus, commonSiteId, code, resCheck, creditCardResult,
  creditCardBrandMapping, creditCardStatus, typeTransactionProcess, actionGroupTransactionProcess, sourceTransactionProcess,
  creditCardBrand, errorMessageCodeConstant,
} = require('constant')
const default_UserId = -99
/* DB */
const { depositCreditCardApiRepository, walletsRepository, paymentTransactionRepository, paymentDetailRepository,
  paymentCompanyAccRepository, transactionProcessRepository, rateRepository, serviceProviderApiMessageRepository, usersBasicDataRepository,
  errorLogRepository,
} = require('repository')

/* func */
const utility = require('utility')
const { autoChangeStatusPayment, handleCreatePayment } = require('./matching_deposit_localbank.js')

/* library */
const moment = require('moment')

const autoPaymentGoLiveWeb = async (event) => {
  const userErrorLog = {
    site_id: commonSiteId.FXT,
    user_id: null,
  }
  try {
    console.log('====== START API: ', moment().utc().format(dateFormat.DATE_TIME))
    console.log('====== Request data: ', event)
    const { Result: result, PaymentResult: paymentResult, InvoiceNo: invoiceNo, cardBrand, amountOfMoney: amount, currency } = JSON.parse(event.body)
    const transaction_id = utility.renderTransactionId()
    const responseDate = moment().utc().format(dateFormat.DATE_TIME)

    const checkDepositCreditCard = await depositCreditCardApiRepository.getDepositCreditCardApi({
      invoice_no: invoiceNo,
      post_request: postRequest.PAYMENT_NOTIFICATION,
    })
    if (checkDepositCreditCard) {
      throw new Error(`InvoiceNo ${invoiceNo} existed`)
    }

    let paymentInfo = {}
    switch (cardBrand) {
      case creditCardBrandMapping.VISA:
        paymentInfo = {
          paymentType: paymentType.PAY_IN,
          paymentMethod: paymentMethodFXON.CARD,
          paymentCategory: paymentCategoryFXON.CREDIT_CARD,
          paymentDetail: paymentDetailFXON.VISA_CREDIT_CARD,
          paymentCompanyAccount: paymentCompanyAccountFXON.DEPOSIT.CREDIT_CARD.GO_LIVE_WEB_VISA,
          paymentServiceAccount: paymentServiceAccountFXON.DEPOSIT.CREDIT_CARD.CREDIT_CARD_PAYMENT_VISA,
        }
        break
      case creditCardBrandMapping.JCB:
        paymentInfo = {
          paymentType: paymentType.PAY_IN,
          paymentMethod: paymentMethodFXON.CARD,
          paymentCategory: paymentCategoryFXON.CREDIT_CARD,
          paymentDetail: paymentDetailFXON.JCB_CREDIT_CARD,
          paymentCompanyAccount: paymentCompanyAccountFXON.DEPOSIT.CREDIT_CARD.GO_LIVE_WEB_JCB,
          paymentServiceAccount: paymentServiceAccountFXON.DEPOSIT.CREDIT_CARD.CREDIT_CARD_PAYMENT_JCB,
        }
        break
      case creditCardBrandMapping.MASTER:
        paymentInfo = {
          paymentType: paymentType.PAY_IN,
          paymentMethod: paymentMethodFXON.CARD,
          paymentCategory: paymentCategoryFXON.CREDIT_CARD,
          paymentDetail: paymentDetailFXON.MASTER_CREDIT_CARD,
          paymentCompanyAccount: paymentCompanyAccountFXON.DEPOSIT.CREDIT_CARD.GO_LIVE_WEB_MASTER,
          paymentServiceAccount: paymentServiceAccountFXON.DEPOSIT.CREDIT_CARD.CREDIT_CARD_PAYMENT_MASTER,
        }
        break
      case creditCardBrandMapping.AMEX:
        paymentInfo = {
          paymentType: paymentType.PAY_IN,
          paymentMethod: paymentMethodFXON.CARD,
          paymentCategory: paymentCategoryFXON.CREDIT_CARD,
          paymentDetail: paymentDetailFXON.AMEX_CREDIT_CARD,
          paymentCompanyAccount: paymentCompanyAccountFXON.DEPOSIT.CREDIT_CARD.GO_LIVE_WEB_AMEX,
          paymentServiceAccount: paymentServiceAccountFXON.DEPOSIT.CREDIT_CARD.CREDIT_CARD_PAYMENT_AMEX,
        }
        break
      case creditCardBrandMapping.DINERS:
        paymentInfo = {
          paymentType: paymentType.PAY_IN,
          paymentMethod: paymentMethodFXON.CARD,
          paymentCategory: paymentCategoryFXON.CREDIT_CARD,
          paymentCompanyAccount: paymentCompanyAccountFXON.DEPOSIT.CREDIT_CARD.GO_LIVE_WEB_DINERS,
          paymentDetail: paymentDetailFXON.DINERS_CREDIT_CARD,
          paymentServiceAccount: paymentServiceAccountFXON.DEPOSIT.CREDIT_CARD.CREDIT_CARD_PAYMENT_DINERS,
        }
        break

      default:
        break
    }

    const objCreditCardApi = {
      invoice_no: invoiceNo,
      post_request: postRequest.PAYMENT_NOTIFICATION,
      payment_company_id: paymentInfo.paymentCompanyAccount,
      deposit_amount: amount,
      currency,
      status: result === creditCardResult.SUCCESS ? creditCardStatus.SUCCESS : creditCardStatus.FAIL,
      transaction_id: result === creditCardResult.SUCCESS ? transaction_id : null,
      card_brand: cardBrand === creditCardBrandMapping.MASTER ? creditCardBrand.MASTER :
        cardBrand === creditCardBrandMapping.DINERS ? creditCardBrand.DINERS : cardBrand,
      error_reason: result === creditCardResult.FAIL ? paymentResult : null,
    }
    // create deposit credit card
    const newIdCreditCard = await depositCreditCardApiRepository.createDepositCreditCardApi(objCreditCardApi)
    if (!newIdCreditCard) {
      throw new Error('create deposit credit card api fail')
    }

    let idNewTransactionProcess
    let objTransactionProcess = []

    if (result === creditCardResult.SUCCESS) {
      const [paymentDetailInfo, paymentCompanyInfo] = await Promise.all([
        paymentDetailRepository.getPaymentDetailById(paymentInfo.paymentDetail),
        paymentCompanyAccRepository.getCompanyAccById(paymentInfo.paymentServiceAccount, commonSiteId.FXT),
      ])
      // create transaction process posting
      const objProcessPosting = {
        user_basic_data_id: default_UserId,
        transaction_id,
        type: typeTransactionProcess.POSTING,
        source: `${paymentDetailInfo.category_enName}, ${paymentDetailInfo.detail_enName}`,
        option: `${paymentCompanyInfo[0].en_company_name}, ${paymentCompanyInfo[0].en_service_name}`,
        amount,
        currency,
        action_group: actionGroupTransactionProcess.USER_ACTION,
        ts_regist: moment().utc().format(dateFormat.DATE_TIME),
      }
      idNewTransactionProcess = await transactionProcessRepository.createTransactionProcess(objProcessPosting)
      objTransactionProcess.push({
        user_basic_data_id: default_UserId,
        transaction_id,
        type: typeTransactionProcess.MATCHING_STATUS,
        source: sourceTransactionProcess.SYSTEM_MATCHING,
        amount,
        currency,
        action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
        ts_regist: moment().utc().format(dateFormat.DATE_TIME),
      }, {
        user_basic_data_id: default_UserId,
        transaction_id,
        type: typeTransactionProcess.MATCHING_STATUS,
        source: sourceTransactionProcess.MATCHING_APPROVED,
        amount,
        currency,
        action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
        ts_regist: moment().utc().format(dateFormat.DATE_TIME),
      }, {
        user_basic_data_id: default_UserId,
        transaction_id,
        type: typeTransactionProcess.PAYMENT_STATUS,
        source: sourceTransactionProcess.SYSTEM_PAYMENT,
        amount,
        currency,
        action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
        ts_regist: moment().utc().format(dateFormat.DATE_TIME),
      })
    } else {
      // log record error table
      const error = {
        checkError: true,
        response: {
          data: {
            Result: result,
            PaymentResult: paymentResult,
            InvoiceNo: invoiceNo,
            cardBrand,
            amountOfMoney: amount,
            currency,
          },
          status: code.ERROR,
        },
      }
      const errorInsertRes = await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
      const errorDetails = JSON.parse(errorInsertRes)
      const objUpdate = {
        error_code: errorDetails?.body?.messages?.[0]?.error_log_id,
      }

      // get common message id
      const messageInfo = await serviceProviderApiMessageRepository.getCommonMessageCode(paymentResult)
      if (messageInfo) {
        objUpdate.error_reason = messageInfo.common_message_code
      }

      // update deposit card
      await depositCreditCardApiRepository.updateDepositCreditCardApi(newIdCreditCard, objUpdate)
    }

    const depositCreditCard = await depositCreditCardApiRepository.getDepositCreditCardApi({
      invoice_no: invoiceNo,
      post_request: postRequest.BANK_REQUEST,
    })
    if (depositCreditCard) {
      // update deposit credit card
      const objUpdateCreditCardApi = {
        user_basic_data_id: depositCreditCard.user_id,
        wallet_id: depositCreditCard.wallet_id,
        request_amount: depositCreditCard.request_amount,
        fullname: depositCreditCard.fullname,
      }

      await depositCreditCardApiRepository.updateDepositCreditCardApi(newIdCreditCard, objUpdateCreditCardApi)

      //  success
      if (result === creditCardResult.SUCCESS) {
        const userInfo = await usersBasicDataRepository.getUserInfoSendMail(depositCreditCard.user_id)
        // update transaction process posting
        await transactionProcessRepository.updateById(idNewTransactionProcess, { user_basic_data_id: userInfo.id })
        userErrorLog.user_id = userInfo.id
        // update option process matching approved
        objTransactionProcess[1].option = userInfo.member_id

        // update user_id transaction process
        objTransactionProcess = objTransactionProcess.map((el) => ({ ...el, user_basic_data_id: userInfo.id }))

        const walletInfo = await walletsRepository.getWalletByWalletId(depositCreditCard.wallet_id)
        const listRate = await rateRepository.getListLatestRate()

        // Check status
        // eslint-disable-next-line max-len
        const { objPayment, objTransaction, amountPayment } = await autoChangeStatusPayment(userInfo, transaction_id, amount, walletInfo, responseDate, false, {
          ...paymentInfo,
          paymentCurrency: currency,
        }, objTransactionProcess, listRate)
        await handleCreatePayment(null, objPayment, null, objTransaction, walletInfo, userInfo, amountPayment)
      }
    } else {
      if (result === creditCardResult.SUCCESS) {
        const objPayment = {
          transaction_id,
          payment_status: paymentTransactionStatus.ACTION_REQUIRED,
          payment_type: paymentType.PAY_IN,
          payment_method_id: paymentMethodFXON.CARD,
          payment_category_id: paymentCategoryFXON.CREDIT_CARD,
          payment_detail_id: paymentInfo.paymentDetail,
          payment_company_account_id: paymentInfo.paymentCompanyAccount,
          payment_service_account_id: paymentInfo.paymentServiceAccount,
          amount,
          payment_date: responseDate,
          decision_date: responseDate,
          decision_method: decisionMethod.AUTOMATIC,
        }
        objTransactionProcess.push({
          user_basic_data_id: default_UserId,
          transaction_id,
          type: typeTransactionProcess.PAYMENT_STATUS,
          source: sourceTransactionProcess.ACTION_REQUIRED,
          amount,
          currency,
          action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
          ts_regist: moment().utc().format(dateFormat.DATE_TIME),
        })
        // deposit payment transaction require
        const isInsertPayment = await paymentTransactionRepository.createPaymentTransaction(objPayment)
        if (!isInsertPayment) {
          throw new Error('create payment transaction fail')
        }
      }
    }

    // create transaction process
    if (objTransactionProcess.length) {
      await transactionProcessRepository.createTransactionProcess(objTransactionProcess)
    }
    return utility.createResponse(resCheck.OK)
  } catch (err) {
    console.log(err)
    await errorLogRepository.createResponseAndLog(event, err, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
    return utility.createResponse(resCheck.OK)
  }
}

module.exports = {
  autoPaymentGoLiveWeb,
}
