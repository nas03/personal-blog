'use strict'

/* constant */
const { bankApi, conditionValue, postRequest, userMatchingStatus, dateFormat, matchingMethod,
  paymentCategoryFXON, paymentDetailFXON, paymentCompanyAccountFXON, decisionMethod,
  paymentTransactionStatus, transactionType, transactionObjectType, baseCurrency, typeWallet, transactionStatus,
  commonSiteId, amountDeposit, resCheck, typeTransactionProcess, sourceTransactionProcess,
  actionGroupTransactionProcess, paymentType, paymentMethodFXON, paymentServiceAccountFXON, emailDetailContentId,
  errorMessageCodeConstant,
} = require('constant')
const default_UserId = -99
const defaultLang = 'ja'

/* DB */
const { depositLocalBankApiRepository, userMatchingRuleRepository,
  autoStatusChangeRuleRepository, walletsRepository,
  transactionRepository, paymentTransactionRepository, transactionProcessRepository,
  paymentDetailRepository, paymentCompanyAccRepository, usersBasicDataRepository, usersPersonalRepository,
  usersCorporateRepository, emailDetailContentRepository, emailHistoryRepository, errorLogRepository } = require('repository')

/* func */
const utility = require('utility')

/* helper */
const { mailer } = require('helper')

/* library */
const moment = require('moment')
const _ = require('lodash')
const querystring = require('querystring')

const matchingDepositLocalBank = async (event) => {
  const userErrorLog = {
    site_id: commonSiteId.FXT,
    user_id: null,
  }
  try {
    console.log('====== START API: ', moment().utc().format(dateFormat.DATE_TIME))
    console.log('====== Request data: ', event)
    const {
      pid: payment_id, pmt: amount, pnm: product_name, ema: email, pnb: phone_number, uid: u_id, rnm: remitter_name,
    } = querystring.parse(event.body)
    if (!payment_id || !amount || !product_name || !email || !phone_number || !u_id || !remitter_name) {
      throw new Error('field can not blank')
    }

    // check payment existed
    const paymentExisted = await depositLocalBankApiRepository.checkPaymentIdExisted(payment_id)
    if (paymentExisted) {
      throw new Error('payment existed')
    }

    const member_id = u_id.replace(process.env.USER_ID_MAXCONNECT_PREFIX, '')

    const transaction_id = utility.renderTransactionId()

    // create local bank api action require
    const responseDate = moment().utc().format(dateFormat.DATE_TIME)
    const objMatching = {
      member_id,
      post_request: postRequest.PAYMENT_NOTIFICATION,
      payment_company_id: paymentCompanyAccountFXON.DEPOSIT.BANK_TRANSFER.MAX_CONNECT,
      amount,
      product_name,
      u_id,
      email,
      phone_number,
      remitter_name,
      payment_id,
      transaction_id,
      processing_date: responseDate,
      matching_method: matchingMethod.AUTOMATIC,
      matching_process_status: userMatchingStatus.ACTION_REQUIRED,
      ts_regist: responseDate,
    }
    const idNewMatching = await depositLocalBankApiRepository.createLocalBankApi(objMatching)
    const [paymentDetailInfo, paymentCompanyInfo] = await Promise.all([
      paymentDetailRepository.getPaymentDetailById(paymentDetailFXON.BANK_TRANSFER_LOCAL_BANK),
      paymentCompanyAccRepository.getCompanyAccById(paymentCompanyAccountFXON.DEPOSIT.BANK_TRANSFER.MAX_CONNECT, commonSiteId.FXT),
    ])
    // create transaction process posting
    const objProcessPosting = {
      user_basic_data_id: default_UserId,
      transaction_id,
      type: typeTransactionProcess.POSTING,
      source: `${paymentDetailInfo.category_enName}, ${paymentDetailInfo.detail_enName}`,
      option: `${paymentCompanyInfo[0].en_company_name}, ${paymentCompanyInfo[0].en_service_name}`,
      amount,
      currency: baseCurrency.JPY,
      action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
      ts_regist: moment().utc().format(dateFormat.DATE_TIME),
    }
    const idNewTransactionProcess = await transactionProcessRepository.createTransactionProcess(objProcessPosting)

    const userInfo = await usersBasicDataRepository.getUserInfoByMemberId(member_id)
    if (!userInfo) {
      throw new Error('user not found')
    }

    const user_id = userInfo.id
    userErrorLog.user_id = user_id || null

    // update user_id transaction posting
    await transactionProcessRepository.updateById(idNewTransactionProcess, { user_basic_data_id: user_id })

    // check amount > 1000 jpy
    const objTransactionProcess = []
    if (amount > amountDeposit.LOCAL_BANK.FEE) {
      const [bankRequest, userMatchingRule] = await Promise.all([
        depositLocalBankApiRepository.getLocalBankApi({
          user_basic_data_id: user_id,
          payment_company_id: paymentCompanyAccountFXON.DEPOSIT.BANK_TRANSFER.MAX_CONNECT }),
        userMatchingRuleRepository.getUserMatchingRule(bankApi.FXT_MAXCONNECT),
      ])

      // check matching response maxconnect
      if (userMatchingRule?.match_api_response) {
        objTransactionProcess.push({
          user_basic_data_id: user_id,
          transaction_id,
          type: typeTransactionProcess.MATCHING_STATUS,
          source: sourceTransactionProcess.SYSTEM_MATCHING,
          amount,
          currency: baseCurrency.JPY,
          action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
          ts_regist: moment().utc().format(dateFormat.DATE_TIME),
        })

        // check operator conditions
        const matchingConditions = JSON.parse(userMatchingRule.matching_conditions)
        const matchingInfo = { u_id, email, phone_number, amount }
        const operatorMatching = matchingConditions.reduce(
          (result, el) => result + checkSettingRule(el, matchingInfo, bankRequest)
          , '')
        const result = eval(operatorMatching)
        let checkName = true

        // check name
        if (result && userMatchingRule.transfer_name_check) {
          const user_name = remitter_name.slice(6).trim()
          checkName = await checkNameTransfer(userInfo, user_name, userMatchingRule)
        }

        // auto create payment and history transaction
        if (result && checkName) {
          const walletInfo = await walletsRepository.getWalletByUserId(user_id, typeWallet.JPY_WALLET)
          if (!walletInfo) {
            throw new Error('The wallet not found')
          }

          objTransactionProcess.push({
            user_basic_data_id: user_id,
            transaction_id,
            type: typeTransactionProcess.MATCHING_STATUS,
            source: sourceTransactionProcess.MATCHING_APPROVED,
            option: member_id,
            amount,
            currency: baseCurrency.JPY,
            action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
            ts_regist: moment().utc().format(dateFormat.DATE_TIME),
          }, {
            user_basic_data_id: user_id,
            transaction_id,
            type: typeTransactionProcess.PAYMENT_STATUS,
            source: sourceTransactionProcess.SYSTEM_PAYMENT,
            amount: amount,
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
            paymentCompanyAccount: paymentCompanyAccountFXON.DEPOSIT.BANK_TRANSFER.MAX_CONNECT,
            paymentServiceAccount: paymentServiceAccountFXON.DEPOSIT.BANK_TRANSFER.LOCAL_BANK_TRANSFER_MAX_CONNECT,
          }
          // eslint-disable-next-line max-len
          const { objPayment, objTransaction, amountPayment } = await autoChangeStatusPayment(userInfo, transaction_id, amount, walletInfo, responseDate, false, {
            ...paymentInfo,
            paymentCurrency: baseCurrency.JPY,
          }, objTransactionProcess)
          const objLocalBankApi = {
            merchant_id: bankRequest.merchant_id,
            user_basic_data_id: bankRequest.user_id,
            matching_process_status: userMatchingStatus.SUCCESS,
          }

          // create payment
          await handleCreatePayment(idNewMatching, objPayment, objLocalBankApi, objTransaction, walletInfo, userInfo, amountPayment)
        } else {
          objTransactionProcess.push({
            user_basic_data_id: user_id,
            transaction_id,
            type: typeTransactionProcess.MATCHING_STATUS,
            source: sourceTransactionProcess.MATCHING_FAILURE,
            amount,
            currency: baseCurrency.JPY,
            action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
            ts_regist: moment().utc().format(dateFormat.DATE_TIME),
          }, {
            user_basic_data_id: user_id,
            transaction_id,
            type: typeTransactionProcess.MATCHING_STATUS,
            source: sourceTransactionProcess.ACTION_REQUIRED,
            amount,
            currency: baseCurrency.JPY,
            action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
            ts_regist: moment().utc().format(dateFormat.DATE_TIME),
          })
        }
      } else {
        objTransactionProcess.push({
          user_basic_data_id: user_id,
          transaction_id,
          type: typeTransactionProcess.MATCHING_STATUS,
          source: sourceTransactionProcess.ACTION_REQUIRED,
          amount,
          currency: baseCurrency.JPY,
          action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
          ts_regist: moment().utc().format(dateFormat.DATE_TIME),
        })
      }
    } else {
      objTransactionProcess.push({
        user_basic_data_id: user_id,
        transaction_id,
        type: typeTransactionProcess.MATCHING_STATUS,
        source: sourceTransactionProcess.ACTION_REQUIRED,
        amount,
        currency: baseCurrency.JPY,
        action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
        ts_regist: moment().utc().format(dateFormat.DATE_TIME),
      })
    }

    // create transaction process
    await transactionProcessRepository.createTransactionProcess(objTransactionProcess)
    return utility.createResponse(resCheck.OK)
  } catch (err) {
    console.log(err)
    await errorLogRepository.createResponseAndLog(event, err, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
    return utility.createResponse(resCheck.OK)
  }
}

// eslint-disable-next-line max-len
const autoChangeStatusPayment = async (userInfo, transaction_id, amount, walletInfo, responseDate, isActionRequired = false, paymentInfo, objTransactionProcess = false, listRate = false) => {
  let amountPayment
  let feePayment
  let ratePayment
  let symbolPayment
  let objectType
  let bankApiPayment

  switch (paymentInfo.paymentCategory) {
    case paymentCategoryFXON.LOCAL_BANK:
      amountPayment = Number(amount) < amountDeposit.LOCAL_BANK.MINIMUM ? Number(amount) - amountDeposit.LOCAL_BANK.FEE : Number(amount)
      feePayment = Number(amount) < amountDeposit.LOCAL_BANK.MINIMUM ? amountDeposit.LOCAL_BANK.FEE : null
      ratePayment = null
      symbolPayment = `${baseCurrency.JPY}/${baseCurrency.JPY}`
      objectType = _renderObjectType(baseCurrency.JPY)
      bankApiPayment = paymentInfo.paymentCompanyAccount === paymentCompanyAccountFXON.DEPOSIT.BANK_TRANSFER.MAX_CONNECT ? bankApi.FXT_MAXCONNECT :
        paymentInfo.paymentCompanyAccount === paymentCompanyAccountFXON.DEPOSIT.BANK_TRANSFER.INFINITAS ? bankApi.FXT_INFINITAS : ''
      break

    case paymentCategoryFXON.CREDIT_CARD:
      ratePayment = null
      amountPayment = amount
      feePayment = null
      symbolPayment = `${paymentInfo.paymentCurrency}/${walletInfo.currency}`
      objectType = _renderObjectType(walletInfo.currency)
      bankApiPayment = bankApi.FXT_CREDIT_CARD
      break

    default:
      break
  }

  const objPayment = {
    transaction_id,
    user_basic_data_id: userInfo.id,
    payment_type: paymentInfo.paymentType,
    payment_method_id: paymentInfo.paymentMethod,
    payment_category_id: paymentInfo.paymentCategory,
    payment_detail_id: paymentInfo.paymentDetail,
    payment_company_account_id: paymentInfo.paymentCompanyAccount,
    payment_service_account_id: paymentInfo.paymentServiceAccount,
    amount: amountPayment,
    amount_currency: paymentInfo.paymentCurrency,
    fee: feePayment,
    exchange_rate: ratePayment,
    exchange_symbol: symbolPayment,
    transaction_object_id: walletInfo.id,
    decision_date: moment().utc().format(dateFormat.DATE_TIME),
    payment_date: responseDate,
    decision_method: decisionMethod.AUTOMATIC,
  }

  let objTransaction = {
    user_basic_data_id: userInfo.id,
    transaction_id,
    transaction_type: transactionType.DEPOSIT,
    payment_category_id: paymentInfo.paymentCategory,
    payment_detail_id: paymentInfo.paymentDetail,
    transaction_object_type: objectType,
    transaction_object_id: walletInfo.id,
    ...await renderTitleTransaction(transactionType.DEPOSIT, objectType),
    amount: amount,
    exchange_rate: ratePayment,
    exchange_symbol: symbolPayment,
    wallet_balance_after_payment: walletInfo.total_assets,
  }

  if (_.isEmpty(walletInfo) || isActionRequired) {
    objPayment.payment_status = paymentTransactionStatus.ACTION_REQUIRED
    objTransaction.transaction_status = transactionStatus.ACCEPTED

    objTransactionProcess.push({
      user_basic_data_id: userInfo.id,
      transaction_id,
      amount: amount,
      currency: paymentInfo.paymentCurrency,
      type: typeTransactionProcess.PAYMENT_STATUS,
      source: sourceTransactionProcess.ACTION_REQUIRED,
      action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
      ts_regist: moment().utc().format(dateFormat.DATE_TIME),
    })
  } else {
    // eslint-disable-next-line max-len
    const autoChange = await autoStatusChangeRuleRepository.getAutoStatusChangeRuleByBankApiId(bankApiPayment)
    // case status of records that match the matching rule => Pending
    if (autoChange.pending_matching_rule) {
      // status change exception disable
      let checkStatus
      if (autoChange.p_status_change_exception) {
        // status change exception enable
        const check = {}

        // check deposite amount
        if (autoChange.p_enable_compare_deposit_amount) {
          let amountCheck
          if (paymentInfo.paymentCurrency !== baseCurrency.JPY) {
            const rate = listRate.find((el) => el.base === paymentInfo.paymentCurrency && el.symbol === baseCurrency.JPY)
            amountCheck = amount * rate.rate
          } else {
            amountCheck = amount
          }
          if (amountCheck <= autoChange.p_compare_deposit_amount) {
            check.checkAmout = true
          } else {
            check.checkAmout = false
          }
        }

        // check specific user
        if (autoChange.p_enable_compare_specific_user) {
          if (autoChange.p_compare_specific_user.split(',').includes(userInfo.member_id)) {
            check.checkCompareUser = true
          } else {
            check.checkCompareUser = false
          }
        }

        // check user status
        if (autoChange.p_enable_compare_user_status) {
          if (autoChange.p_compare_user_status === userInfo.account_status_code) {
            check.checkUserStatus = true
          } else {
            check.checkUserStatus = false
          }
        }

        // check operator
        if (eval(Object.values(check).join('||'))) {
          checkStatus = true
        }
      }

      //  check operator matching
      if (!checkStatus) {
        objPayment.payment_status = paymentTransactionStatus.ACTION_REQUIRED
        objTransaction.transaction_status = transactionStatus.ACCEPTED
        objTransactionProcess.push({
          user_basic_data_id: userInfo.id,
          transaction_id,
          amount: amount,
          currency: paymentInfo.paymentCurrency,
          type: typeTransactionProcess.PAYMENT_STATUS,
          source: sourceTransactionProcess.ACTION_REQUIRED,
          action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
          ts_regist: moment().utc().format(dateFormat.DATE_TIME),
        })
      } else {
        objPayment.payment_status = paymentTransactionStatus.APPROVED
        objTransaction.transaction_status = transactionStatus.SUCCESSFULLY
        objTransaction.amount = amountPayment
        objTransaction.wallet_balance_after_payment = walletInfo.total_assets + Number(amount),
        objTransactionProcess.push({
          user_basic_data_id: userInfo.id,
          transaction_id,
          amount: amount,
          currency: paymentInfo.paymentCurrency,
          type: typeTransactionProcess.PAYMENT_STATUS,
          source: sourceTransactionProcess.APPROVED,
          action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
          ts_regist: moment().utc().format(dateFormat.DATE_TIME),
        })
      }
    } else {
      // case status of records that match the matching rule => Approved
      let checkStatus
      if (autoChange.a_status_change_exception) {
        // status change exception enable
        const check = {}

        // check deposit amount
        if (autoChange.a_enable_compare_deposit_amount) {
          let amountCheck
          if (paymentInfo.paymentCurrency !== baseCurrency.JPY) {
            const rate = listRate.find((el) => el.base === paymentInfo.paymentCurrency && el.symbol === baseCurrency.JPY)
            amountCheck = amount * rate.rate
          } else {
            amountCheck = amount
          }
          if (amountCheck > autoChange.a_compare_deposit_amount) {
            check.checkDepositAmount = true
          } else {
            check.checkDepositAmount = false
          }
        }

        // check same transaction num
        if (autoChange.a_enable_compare_same_transaction_num) {
          const timeCheck = {
            accessTimeFrom: moment().utc().startOf('days').format(dateFormat.DATE_TIME),
            accessTimeTo: moment().utc().endOf('days').format(dateFormat.DATE_TIME),
          }
          const objCheck = {
            payment_type: paymentInfo.paymentType,
            payment_method_id: paymentInfo.paymentMethod,
            payment_category_id: paymentInfo.paymentCategory,
            payment_detail_id: paymentInfo.paymentDetail,
            payment_company_account_id: paymentInfo.paymentCompanyAccount,
            payment_service_account_id: paymentInfo.paymentServiceAccount,
          }
          const lastPayment = await paymentTransactionRepository.getPaymentTransactionOfDay(userInfo.id, objCheck, timeCheck)
          if (lastPayment.length >= autoChange.a_compare_same_transaction_num) {
            check.checkSameTransactionNum = true
          } else {
            check.checkSameTransactionNum = false
          }
        }

        // check day num
        if (autoChange.a_enable_compare_day_num) {
          const objCheck = {
            payment_type: paymentInfo.paymentType,
            payment_method_id: paymentInfo.paymentMethod,
            payment_category_id: paymentInfo.paymentCategory,
            payment_detail_id: paymentInfo.paymentDetail,
            payment_company_account_id: paymentInfo.paymentCompanyAccount,
            payment_service_account_id: paymentInfo.paymentServiceAccount,
          }
          const timeCheck = {
            accessTimeFrom: moment().utc().add(-(autoChange.a_compare_day_num), 'days').format(dateFormat.DATE_TIME),
            accessTimeTo: moment().utc().format(dateFormat.DATE_TIME),
          }
          const paymentCheck = await paymentTransactionRepository.getPaymentTransactionOfDay(userInfo.id, objCheck, timeCheck, 'sum_amount')
          if (paymentCheck >= autoChange.a_compare_total_deposit_amount) {
            check.checkTotalDepositAmount = true
          } else {
            check.checkTotalDepositAmount = false
          }
        }

        // check specific user
        if (autoChange.a_enable_compare_specific_user) {
          if (autoChange.a_compare_specific_user.split(',').includes(userInfo.member_id)) {
            check.checkSpecificUser = true
          } else {
            check.checkSpecificUser = false
          }
        }

        // check attention flag
        if (autoChange.a_enable_compare_user_attention) {
          if (userInfo.attention_flag) {
            check.userAttention = true
          } else {
            check.userAttention = false
          }
        }

        //  check operator matching
        if (eval(Object.values(check).join('||'))) {
          checkStatus = true
        }
      }

      //  check result operator matching
      if (!checkStatus) {
        objPayment.payment_status = paymentTransactionStatus.APPROVED
        objTransaction.transaction_status = transactionStatus.SUCCESSFULLY
        objTransaction.amount = amountPayment
        objTransaction.wallet_balance_after_payment = walletInfo.total_assets + Number(amount),
        objTransactionProcess.push({
          user_basic_data_id: userInfo.id,
          transaction_id,
          amount: amount,
          currency: paymentInfo.paymentCurrency,
          type: typeTransactionProcess.PAYMENT_STATUS,
          source: sourceTransactionProcess.APPROVED,
          action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
          ts_regist: moment().utc().format(dateFormat.DATE_TIME),
        })
      } else {
        objPayment.payment_status = paymentTransactionStatus.ACTION_REQUIRED
        objTransaction.transaction_status = transactionStatus.ACCEPTED
        objTransactionProcess.push({
          user_basic_data_id: userInfo.id,
          transaction_id,
          amount: amount,
          currency: paymentInfo.paymentCurrency,
          type: typeTransactionProcess.PAYMENT_STATUS,
          source: sourceTransactionProcess.ACTION_REQUIRED,
          action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
          ts_regist: moment().utc().format(dateFormat.DATE_TIME),
        })
      }
    }
    if (objPayment.payment_status === paymentTransactionStatus.APPROVED) {
      if (ratePayment !== null) {
        objTransactionProcess.push({
          user_basic_data_id: userInfo.id,
          transaction_id: objPayment.transaction_id,
          type: typeTransactionProcess.EXCHANGE,
          source: `${sourceTransactionProcess.CURRENCY_EXCHANGE}, ${walletInfo.currency} ${ratePayment}`,
          amount: amountPayment,
          currency: walletInfo.currency,
          action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
          ts_regist: moment().utc().format(dateFormat.DATE_TIME),
        })
      }
      if (objPayment.fee) {
        objTransaction = [
          {
            user_basic_data_id: userInfo.id,
            transaction_id: objPayment.transaction_id,
            transaction_type: transactionType.DEPOSIT_FEE,
            payment_category_id: paymentCategoryFXON.LOCAL_BANK,
            payment_detail_id: paymentDetailFXON.BANK_TRANSFER_LOCAL_BANK,
            transaction_object_type: transactionObjectType.JPY_WALLET,
            transaction_object_id: walletInfo.id,
            ...await renderTitleTransaction(transactionType.DEPOSIT_FEE, transactionObjectType.JPY_WALLET),
            transaction_status: transactionStatus.SUCCESSFULLY,
            amount: -amountDeposit.LOCAL_BANK.FEE,
            exchange_rate: ratePayment,
            exchange_symbol: symbolPayment,
            wallet_balance_after_payment: walletInfo.total_assets + amountPayment,
          },
          objTransaction,
        ]
        objTransactionProcess.push({
          user_basic_data_id: userInfo.id,
          transaction_id: objPayment.transaction_id,
          type: typeTransactionProcess.CHARGE,
          source: sourceTransactionProcess.DEPOSIT_FEE,
          amount: -feePayment,
          currency: walletInfo.currency,
          action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
          ts_regist: moment().utc().format(dateFormat.DATE_TIME),
        })
      }
      objTransactionProcess.push({
        user_basic_data_id: userInfo.id,
        transaction_id: objPayment.transaction_id,
        type: typeTransactionProcess.PAY_IN,
        source: walletInfo.id,
        amount: amountPayment,
        currency: walletInfo.currency,
        action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
        ts_regist: moment().utc().format(dateFormat.DATE_TIME),
      })
    }
  }

  return { objPayment, objTransaction, amountPayment }
}

const checkSettingRule = (value, matchingInfo, bankRequest) => {
  switch (value.key) {
    case 'user_id':
      // eslint-disable-next-line max-len
      return `${bankRequest.u_id === matchingInfo.u_id}${value.condition === conditionValue.OR ? ' || ' :
        value.condition === conditionValue.AND ? ' && ' : ''}`
    case 'email':
      return `${bankRequest.email === matchingInfo.email}${value.condition === conditionValue.OR ? ' || ' :
        value.condition === conditionValue.AND ? ' && ' : ''}`
    case 'phone':
      return `${bankRequest.phone_number === matchingInfo.phone_number}${value.condition === conditionValue.OR ? ' || ' :
        value.condition === conditionValue.AND ? ' && ' : ''}`
    case 'amount':
      return `${bankRequest.amount === Number(matchingInfo.amount)}${value.condition === conditionValue.OR ? ' || ' :
        value.condition === conditionValue.AND ? ' && ' : ''}`
    default:
      return ''
  }
}

const checkNameTransfer = async (userInfo, remitter_name, userMatchingRule) => {
  let checkName
  if (userInfo.reg_category === 0) {
    const personalInfo = await usersPersonalRepository.getNamePersonalByUserId(userInfo.id)
    const fullName = `${personalInfo.first_name_katakana} ${personalInfo.last_name_katakana}`
    const fullNameReverse = `${personalInfo.last_name_katakana} ${personalInfo.first_name_katakana}`
    const userNameConvert = remitter_name
    if (utility.convertToHalfWidthKatakana(fullName) === utility.convertToHalfWidthKatakana(userNameConvert) ||
      utility.convertToHalfWidthKatakana(fullNameReverse) === utility.convertToHalfWidthKatakana(userNameConvert)) {
      checkName = true
    } else {
      checkName = false
    }
  } else {
    // check company
    const corporateInfo = await usersCorporateRepository.getCorporateStep1ByUserId(userInfo.id)
    const check = {}

    // check corporate name registered
    if (userMatchingRule.check_corporate_name_registered) {
      if (remitter_name === corporateInfo.corporate_name_registered) {
        check.checkCorporateNameRegistered = true
      } else {
        check.checkCorporateNameRegistered = false
      }
    }

    // check corporate nam english
    if (userMatchingRule.check_corporate_name_english) {
      if (remitter_name === corporateInfo.corporate_name_english) {
        check.checkCorporateNameEnglish = true
      } else {
        check.checkCorporateNameEnglish = false
      }
    }

    // check corporate name katakana
    if (userMatchingRule.check_corporate_name_katakana) {
      if (remitter_name === corporateInfo.corporate_name_katakana) {
        check.checkCorporateNameKatakana = true
      } else {
        check.checkCorporateNameKatakana = false
      }
    }

    // check operator
    if (!eval(Object.values(check).join(' || '))) {
      checkName = false
    } else {
      checkName = true
    }
  }
  return checkName
}

const handleCreatePayment = async (idNewMatching, objPayment, objLocalBankApi, objTransaction, walletInfo, userInfo, amountPayment) => {
  // create payment
  // eslint-disable-next-line max-len
  const isCreatePayment = await paymentTransactionRepository.createPaymentAutoMatching(idNewMatching, objPayment, objLocalBankApi, walletInfo, amountPayment)
  if (!isCreatePayment) {
    throw new Error('create deposit local bank api fail')
  }

  // create history
  const isCreateTransaction = await transactionRepository.createTransactionHistory(objTransaction)
  if (!isCreateTransaction) {
    throw new Error('create transaction history fail')
  }

  if (objPayment.payment_status === paymentTransactionStatus.APPROVED) {
    // send mail payment complete
    await sendMailCompetePayment(userInfo, objPayment, walletInfo, amountPayment)
  }
}

const sendMailCompetePayment = async (userInfo, objPayment, walletInfo, amountPayment) => {
  // get info mail
  const typeLang = userInfo.language_email ? userInfo.language_email : defaultLang
  const portalLang = userInfo.language_portal ? userInfo.language_portal : defaultLang
  const lang = await utility.getMultilingualism(process.env.LOCALES_SOURCE, typeLang)
  const cpLang = lang.email.complete_payment
  const to = `${userInfo.email}`
  const userName = `${userInfo.first_name_romaji} ${userInfo.last_name_romaji}`

  // get payment method title
  let paymentMethodTitle
  switch (objPayment.payment_category_id) {
    case paymentCategoryFXON.LOCAL_BANK:
      paymentMethodTitle = cpLang.cp_payment_title.local_bank
      break
    case paymentCategoryFXON.CREDIT_CARD:
      switch (objPayment.payment_detail_id) {
        case paymentDetailFXON.VISA_CREDIT_CARD:
          paymentMethodTitle = cpLang.cp_payment_title.credit_card.visa
          break
        case paymentDetailFXON.JCB_CREDIT_CARD:
          paymentMethodTitle = cpLang.cp_payment_title.credit_card.jcb
          break
        case paymentDetailFXON.AMEX_CREDIT_CARD:
          paymentMethodTitle = cpLang.cp_payment_title.credit_card.amex
          break
        case paymentDetailFXON.MASTER_CREDIT_CARD:
          paymentMethodTitle = cpLang.cp_payment_title.credit_card.master
          break
        case paymentDetailFXON.DINERS_CREDIT_CARD:
          paymentMethodTitle = cpLang.cp_payment_title.credit_card.diners
          break
        default:
          break
      }
      break
    default:
      break
  }

  // get endpoint wallet and currency wallet
  let title_wallets
  let currency_wallet
  switch (walletInfo.currency) {
    case baseCurrency.JPY:
      title_wallets = cpLang.wallets.jpy.title
      currency_wallet = cpLang.wallets.jpy.currency
      break
    case baseCurrency.USD:
      title_wallets = cpLang.wallets.usd.title
      currency_wallet = cpLang.wallets.usd.currency
      break
    case baseCurrency.EUR:
      title_wallets = cpLang.wallets.eur.title
      currency_wallet = cpLang.wallets.eur.currency
      break
    default:
      break
  }
  // get template email
  const emailTemplateUrl = await emailDetailContentRepository.getTemplateSendEmailById(emailDetailContentId.EMAIL_DEPOSIT_COMPLETED)
  // email body
  emailTemplateUrl.subject = `${emailTemplateUrl[`${typeLang}_subject`]}`
  const emailParameters = {
    user_name: userName.toUpperCase(),
    payment_method: paymentMethodTitle,
    deposit_wallet: title_wallets,
    base_currency: currency_wallet,
    deposite_amount: objPayment.amount,
    deposite_commission: objPayment.fee ? objPayment.fee : '0',
    total_deposite_amount: amountPayment,
    url_login: `${process.env.URL_FE_FXT}/login/?lang=${portalLang}`,
  }
  const html = utility.renderEmail(emailParameters, emailTemplateUrl, typeLang)
  const responseSendMail = await mailer.sendMailFXT(to, emailTemplateUrl.subject, '', html, emailTemplateUrl)
  if (responseSendMail) {
    await emailHistoryRepository.createEmailHistory({
      ...responseSendMail,
      email_detail_content_id: emailTemplateUrl.id,
      user_basic_data_id: userInfo.id,
    })
  }
}

async function renderTextLocales(type, typelang, objectType, tradingAcc = {}) {
  const lang = await utility.getMultilingualism(process.env.LOCALES_SOURCE, typelang)
  const title = lang.email.complete_payment.title_th
  const textObjtype = renderTransactionObjectType(objectType, title, tradingAcc)
  let textTransactionType = ''
  const check = objectType === transactionObjectType.TRADING_ACCOUNT

  switch (type) {
    case transactionType.WITHDRAW:
      textTransactionType = title.withdraw
      if (typelang === 'en') {
        return `${textTransactionType}${textObjtype}`
      } else if (typelang === 'cn') {
        if (objectType === transactionObjectType.PARTNER_WALLET) {
          return title.from + textObjtype + textTransactionType
        }
        return title.from + `${check ? title.your : title.your_ratio}` + textObjtype + textTransactionType
      }
      return `${textObjtype}${textTransactionType}`

    case transactionType.REDEEM:
      if (typelang === 'en') {
        return title.redeem + textObjtype
      }

      if (typelang === 'cn') {
        return title.from + textObjtype + title.redeem
      }
      return textObjtype + title.redeem

    case transactionType.DEPOSIT:
      textTransactionType = title.deposit

      if (typelang === 'en') {
        return `${check ? title.deposit_into : textTransactionType}` + textObjtype
      } else if (typelang === 'cn') {
        return textTransactionType + title.your + textObjtype
      }
      return textObjtype + textTransactionType

    case transactionType.REFUND:
      if (!textTransactionType) {
        textTransactionType = title.refund
      }

      if (typelang === 'en' || typelang === 'cn') {
        return textTransactionType + textObjtype
      }

      return textObjtype + textTransactionType
    case transactionType.DEPOSIT_FEE:

      return title.deposit_fee
    case transactionType.WITHDRAW_FEE:

      return title.withdraw_fee
    default:
      return ''
  }
}

function renderTransactionObjectType(objectType, title, tradingAcc) {
  switch (objectType) {
    case transactionObjectType.USD_WALLET:
      return title.usd_wallet

    case transactionObjectType.JPY_WALLET:
      return title.jpy_wallet

    case transactionObjectType.EUR_WALLET:
      return title.eur_wallet

    case transactionObjectType.PARTNER_WALLET:
      return title.partner_wallet

    case transactionObjectType.BTC_WALLET:
      return title.btc_wallet

    case transactionObjectType.POINT_WALLET:
      return title.point_wallet

    case transactionObjectType.TRADING_ACCOUNT:
      return `${tradingAcc.platform.toUpperCase()} ${tradingAcc.currency.toUpperCase()} ${title.account} (${tradingAcc.mt_account_no})`
  }
}

async function renderTitleTransaction(transactionType, objectType, tradingAcc) {
  return {
    ja_title: await renderTextLocales(transactionType, 'ja', objectType, tradingAcc),
    en_title: await renderTextLocales(transactionType, 'en', objectType, tradingAcc),
    cn_title: await renderTextLocales(transactionType, 'cn', objectType, tradingAcc),
    kr_title: await renderTextLocales(transactionType, 'kr', objectType, tradingAcc),
  }
}

function _renderObjectType(currency) {
  switch (currency) {
    case baseCurrency.JPY:
      return transactionObjectType.JPY_WALLET
    case baseCurrency.EUR:
      return transactionObjectType.EUR_WALLET
    case baseCurrency.USD:
      return transactionObjectType.USD_WALLET
    default:
      return ''
  }
}

module.exports = {
  matchingDepositLocalBank,
  autoChangeStatusPayment,
  checkNameTransfer,
  handleCreatePayment,
  sendMailCompetePayment,
  renderTitleTransaction,
}
