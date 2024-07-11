const { withdrawalLocalBankPaypayApiRepository, errorLogRepository, usersBasicDataRepository } = require('repository')
const utility = require('utility')
const { errorMessageCodeConstant, modeAPI, csvFileName, postRequestPaypay,
  paypayBankApiStatus, accountLocalBankType, typeAccountLocalBank, uncheckALL } = require('constant')
const { json2csvAsync } = require('json-2-csv')
const { uploadCSV } = require('helper').upload

const getAllWithdrawalPaypay = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}

    let isUnCheckALL = false

    const staffId = utility.getUserIdByToken(event)
    const staffInfo = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': staffId })

    // input of select box
    const arrInput = ['siteId', 'postRequest', 'result', 'accountType']
    arrInput.forEach((item) => {
      // CHECK CASE SELECT BOX UNCHECK ALL
      if (Number(queryString[item]) === uncheckALL) isUnCheckALL = true

      if (item === 'siteId') {
        // GET VALID SITES USING QUERY
        queryString[item] = utility.getValidSiteByAdmin(staffInfo.admin_with_site_id, queryString[item])
      } else if (queryString[item]) {
        queryString[item] = queryString[item].split(',')
      }
    })

    // paging, sort
    const pagination = utility.getPagination(queryString)

    if (queryString.mode === modeAPI.CSV_EXPORT) {
      const paypayApiData = !isUnCheckALL ? await withdrawalLocalBankPaypayApiRepository.getAllPaypayApi(pagination, queryString, true) : []

      // Handling csv parsing and uploading to S3
      const headers = [
        { field: 'response_date', title: 'Response Date' },
        { field: 'trans_id', title: 'Trans ID' },
        { field: 'site_name', title: 'Site' },
        { field: 'post_request', title: 'Post request' },
        { field: 'name', title: 'Name' },
        { field: 'bank_code', title: 'Bank ID' },
        { field: 'bank_name', title: 'Bank Name' },
        { field: 'branch_code', title: 'Branch ID' },
        { field: 'branch_name', title: 'Branch Name' },
        { field: 'account_type', title: 'Account Type' },
        { field: 'account_number', title: 'Account number' },
        { field: 'withdrawal_amount', title: 'Withdrawal amount' },
        { field: 'result', title: 'Result' },
        { field: 'transaction_id', title: 'Transaction ID' },
        { field: 'api_error_code', title: 'Error code' },
        { field: 'error_reason', title: 'Error reason' },
      ]

      let csvData
      // handle data csv 0 record
      if ( !paypayApiData.length ) {
        const listTitle = headers.map((i) => {
          return i.title
        })
        csvData = listTitle.join(',')
      } else {
        // handle data export csv
        const listDataCsv = paypayApiData.map((item) => {
          const newData = { ...item }
          newData.post_request = item.post_request === postRequestPaypay.PAYMENT_REQUEST ? 'Payment Request' : 'Non Payment request'
          newData.withdrawal_amount = `¥ ${Number(item.withdrawal_amount).toLocaleString('en-US')}`,
          newData.result = item.status === paypayBankApiStatus.SUCCESS ? 'Success' : 'Fail',
          newData.api_error_code = item.api_response_code ? item.api_response_code : '-'
          newData.error_reason = item.en_short_msg ? item.en_short_msg : '-'
          newData.account_type = item.account_type === accountLocalBankType.ORDINARY ? typeAccountLocalBank.ORDINARY : typeAccountLocalBank.CURRENT

          return newData
        })
        csvData = await json2csvAsync(listDataCsv, { keys: headers, emptyFieldValue: '', excelBOM: true, expandArrayObjects: true })
      }
      const result = await uploadCSV(csvData, csvFileName.PAYPAY_API)
      return utility.createResponse(true, { url_download: result.Location })
    }

    if (isUnCheckALL) {
      const res = utility.paginatedItems([], pagination.currentPage, pagination.perPage)
      return utility.createResponse(true, res)
    }

    const paypayApiData = await withdrawalLocalBankPaypayApiRepository.getAllPaypayApi(pagination, queryString, false)
    return utility.createResponse(true, paypayApiData)
  } catch (err) {
    console.log(err)
    return await errorLogRepository.createResponseAndLog(event, err, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  getAllWithdrawalPaypay,
}
