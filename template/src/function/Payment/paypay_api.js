const axios = require('axios')
const https = require('https')
const { code, resCheck, message, actionGroupTransactionProcess, postRequestPaypay, typeTransactionProcess,
  sourceTransactionProcess, paypayBankApiStatus, baseCurrency, errorLogType } = require('constant')
// const qs = require('qs')
const querystring = require('querystring')

// repository
const { errorLogRepository, withdrawalLocalBankPaypayApiRepository, transactionRepository, serviceProviderApiMessageRepository,
  walletsRepository } = require('repository')

// utility
const utility = require('utility')

const { getObjectPaypay, streamToString } = require('helper').aws

const callApiWithdrawlPaypay = async (event) => {
  try {
    const authorizationToken = event.headers.Authorization
    const mcToken = authorizationToken ? authorizationToken.split(' ')[1] : ''
    if (mcToken !== process.env.PAYPAY_P2TECH_API_KEY) {
      await errorLogRepository.createSystemLog(event, code.AUTHORIZATION, message.access_token_invalid)
      return utility.createResponse(resCheck.ERROR, null, code.AUTHORIZATION, message.access_token_invalid)
    }

    let bodyData = event.body
    // GET SSL
    const clientCrt = await getObjectPaypay('dev/clcerts.crt')
    const caCrt = await getObjectPaypay('dev/cacerts.crt')
    const clientKey = await getObjectPaypay('dev/nocerts.key')

    const clientCrtString = await streamToString(clientCrt.Body)
    const caCrtString = await streamToString(caCrt.Body)
    const clientKeyString = await streamToString(clientKey.Body)

    const httpsAgent = new https.Agent({
      cert: clientCrtString,
      ca: caCrtString,
      key: clientKeyString,
    })

    const config = {
      httpsAgent: httpsAgent,
    }

    const bodyObj = querystring.parse(bodyData)
    let headers = {}
    if (bodyObj['headers']) {
      headers = JSON.parse(bodyObj['headers'])
      delete bodyObj.headers
      bodyData = querystring.stringify(bodyObj)
    }

    const result = await axios({
      method: 'POST',
      url: process.env.PAYPAY_URL_API + '/NBPNK101/NBPNK101',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        ...headers,
      },
      data: bodyData,
      ...config,
    })

    return utility.createResponse(true, result)
  } catch (error) {
    console.log(error)
    return utility.createResponse(resCheck.ERROR, { message: error.message }, code.ERROR, message.server_error)
  }
}

const notificationPaypayFail = async (event) => {
  try {
    // check IP Address call api
    const ipAddress = event.requestContext.identity.sourceIp
    if (!process.env.WHITE_LIST_IP_PAYPAY.includes(ipAddress)) {
      await errorLogRepository.createSystemLog(event, code.ERROR, 'Invalid IP address', null, errorLogType.MAIN_ERROR)
      return utility.createResponse(resCheck.ERROR, { message: 'Invalid IP address', ip: ipAddress }, code.ERROR, message.server_error)
    }

    const bodyData = querystring.parse(event.body)

    if ( !bodyData['ReTransfer:TrfInfo:TransID'] || !bodyData['ReTransfer:TrfInfo:ResultCode'] ) {
      await errorLogRepository.createSystemLog(event, code.ERROR, message.fields_cannot_blank, null, errorLogType.MAIN_ERROR)
      return utility.createResponse(true)
    }

    // get record paypay api
    const [paymentPaypayApi, common_messega_code] = await Promise.all([
      withdrawalLocalBankPaypayApiRepository.getDetailPaymentPaypayApi(bodyData['ReTransfer:TrfInfo:TransID']),
      serviceProviderApiMessageRepository.getCommonMessageCodeByMessageCode(bodyData['ReTransfer:TrfInfo:ResultCode']),
    ])

    // check exist post request payment notification
    const isCheckPaypay = paymentPaypayApi.find((i) => {
      return i.post_request === postRequestPaypay.NON_PAYMENT_REQUEST || i.status === paypayBankApiStatus.FAIL
    })

    if (!paymentPaypayApi.length || isCheckPaypay || paymentPaypayApi.length > 1) {
      await errorLogRepository.createSystemLog(event, code.ERROR, message.fields_invalid, null, errorLogType.MAIN_ERROR)
      return utility.createResponse(true)
    }

    // get transaction history
    const listTransactionHistory =
      await transactionRepository.getTransactionHistoryByTransactionId(paymentPaypayApi[0].transaction_id, paymentPaypayApi[0].user_id)

    if (!listTransactionHistory.length) {
      await errorLogRepository.createSystemLog(event, code.ERROR, message.fields_invalid, null, errorLogType.MAIN_ERROR)
      return utility.createResponse(true)
    }

    // get wallet
    const listWalletId = listTransactionHistory.map((i) => {
      return i.transaction_object_id
    })

    const listWallet = await walletsRepository.getWalletByListWalletId(listWalletId)

    if (!listWallet.length) {
      await errorLogRepository.createSystemLog(event, code.ERROR, message.fields_invalid, null, errorLogType.MAIN_ERROR)
      return utility.createResponse(true)
    }

    const dataBackMonney = []

    // create data transaction process & back monney
    const arrObjTransactionProcess = [
      {
        user_id: paymentPaypayApi[0].user_id,
        transaction_id: paymentPaypayApi[0].transaction_id,
        type: typeTransactionProcess.PO_STATUS,
        source: sourceTransactionProcess.REJECT,
        amount: -Number(paymentPaypayApi[0].amount),
        currency: baseCurrency.JPY,
        action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
      },
    ]
    listTransactionHistory.forEach( async (item) => {
      const wallet = listWallet.find((i) => {
        return i.id === item.transaction_object_id
      })
      arrObjTransactionProcess.push({
        user_id: paymentPaypayApi[0].user_id,
        transaction_id: paymentPaypayApi[0].transaction_id,
        type: typeTransactionProcess.PAYOUT_REVERSE,
        source: item.transaction_object_id,
        amount: Math.abs(item.amount),
        currency: wallet.currency,
        action_group: actionGroupTransactionProcess.SYSTEM_ACTION,
      })
      dataBackMonney.push({
        wallet_id: item.transaction_object_id,
        amout_back: Number(Math.abs(item.amount)),
      })
    })

    // insert data Non payment request paypay api
    const nonPaymentPaypayApi = {
      ...paymentPaypayApi[0],
      amount: -Number(paymentPaypayApi[0].amount),
      post_request: postRequestPaypay.NON_PAYMENT_REQUEST,
      status: paypayBankApiStatus.FAIL,
      transaction_id: paymentPaypayApi[0].transaction_id,
      api_common_message_code: common_messega_code ? common_messega_code.common_message_code : null,
      api_response_code: bodyData['ReTransfer:TrfInfo:ResultCode'],
      req_hd: event.headers,
      req_body: event.body,
      req_hd_vl: event.headers['HD_VL'],
      req_hd_msg_class: event.headers['HD_MsgClass'],
      req_hd_kind: event.headers['HD_Kind'],
      req_hd_comp_code: event.headers['HD_CompCode'],
      req_hd_detail_code: event.headers['HD_DetailCode'],
      req_hd_req_date_time: event.headers['HD_ReqDateTime'],
      req_hd_rsp_date_time: event.headers['HD_RspDateTime'],
      req_hd_tran_id: event.headers['HD_TranId'],
      req_user_id: bodyData['ReTransfer:UserID'],
      req_user_name: bodyData['ReTransfer:UserName'],
      req_dt_notice: bodyData['ReTransfer:DtNotice'],
      req_date: bodyData['ReTransfer:TrfInfo:Date'],
      req_order_code: bodyData['ReTransfer:TrfInfo:OrderCode'],
      req_rmt_bank_id: bodyData['ReTransfer:TrfInfo:RmtBankAcct:BankID'],
      req_rmt_bank_name: bodyData['ReTransfer:TrfInfo:RmtBankAcct:BankName'],
      req_rmt_branch_id: bodyData['ReTransfer:TrfInfo:RmtBankAcct:BrID'],
      req_rmt_branch_name: bodyData['ReTransfer:TrfInfo:RmtBankAcct:BrName'],
      req_rmt_account_type_code: bodyData['ReTransfer:TrfInfo:RmtBankAcct:AcctTypeCode'],
      req_rmt_bank_account_no: bodyData['ReTransfer:TrfInfo:RmtBankAcct:AcctNo'],
      req_rmt_bank_account_name: bodyData['ReTransfer:TrfInfo:RmtBankAcct:BankAcctName'],
      req_output_name: bodyData['ReTransfer:TrfInfo:OutputName'],
      req_rcpt_bank_id: bodyData['ReTransfer:TrfInfo:RcptBankAcct:BankID'],
      req_rcpt_bank_name: bodyData['ReTransfer:TrfInfo:RcptBankAcct:BankName'],
      req_rcpt_branch_id: bodyData['ReTransfer:TrfInfo:RcptBankAcct:BrID'],
      req_rcpt_branch_name: bodyData['ReTransfer:TrfInfo:RcptBankAcct:BrName'],
      req_rcpt_account_type_code: bodyData['ReTransfer:TrfInfo:RcptBankAcct:AcctTypeCode'],
      req_rcpt_bank_account_no: bodyData['ReTransfer:TrfInfo:RcptBankAcct:AcctNo'],
      req_rcpt_bank_account_name: bodyData['ReTransfer:TrfInfo:RcptBankAcct:BankAcctName'],
      req_amount: bodyData['ReTransfer:TrfInfo:Amount'],
    }

    // create data Paypay Api Notification and update transaction
    await withdrawalLocalBankPaypayApiRepository.createPaypayApiNotification(
      nonPaymentPaypayApi,
      arrObjTransactionProcess,
      paymentPaypayApi[0].transaction_id,
      bodyData['ReTransfer:TrfInfo:ResultCode'],
      common_messega_code ? common_messega_code.common_message_code : null,
      paymentPaypayApi[0].user_id,
      dataBackMonney,
    )

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    await errorLogRepository.createSystemLog(event, code.ERROR, message.server_error, error, errorLogType.MAIN_ERROR)
    return utility.createResponse(true)
  }
}

module.exports = {
  callApiWithdrawlPaypay,
  notificationPaypayFail,
}
