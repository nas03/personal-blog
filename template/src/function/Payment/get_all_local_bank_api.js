const { depositLocalBankApiRepository, errorLogRepository, usersBasicDataRepository } = require('repository')
const utility = require('utility')
const { errorMessageCodeConstant, modeAPI, csvFileName, postRequest, supportStatus, uncheckALL } = require('constant')
const { json2csvAsync } = require('json-2-csv')
const { uploadCSV } = require('helper').upload

const getAllLocalBank = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}

    let isUnCheckALL = false

    // paging, sort
    const pagination = utility.getPagination(queryString)

    // Get staff info to valid siteIds
    const staffId = utility.getUserIdByToken(event)
    const staffInfo = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': staffId })
    // input of select box
    const arrInput = ['merchantId', 'siteId', 'postRequest', 'matchingProcess']

    arrInput.forEach((item) => {
      // CHECK CASE SELECT BOX UNCHECK ALL
      if (Number(queryString[item]) === uncheckALL) isUnCheckALL = true

      if (item === 'siteId') {
        // GET VALID SITES USING QUERY
        queryString[item] = utility.getValidSiteByAdmin(staffInfo.admin_with_site_id, queryString[item] )
      } else if (queryString[item]) {
        queryString[item] = queryString[item].split(',')
      }
    })
    queryString.utc = staffInfo.timezone || null

    if (queryString.mode === modeAPI.CSV_EXPORT) {
      const _renderDateTime = (data_time) => {
        return data_time ? utility.getDateTimeFormatted(data_time, staffInfo.display_date_time, queryString.utc) : '-'
      }

      // Get data form db
      const localBankData = !isUnCheckALL ? await depositLocalBankApiRepository.getAllLocalBankApi(pagination, queryString, true) : []

      // Format data
      const formatLocalBankData = localBankData.map((item) => {
        return {
          ...item,
          payment_id: item.payment_id || '-',
          request_amount: item.request_amount && item.request_amount.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' }),
          deposit_amount: item.deposit_amount && item.deposit_amount.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' }),
          response_date: _renderDateTime(item.response_date),
          allotted_at: _renderDateTime(item.allotted_at),
          last_dept_date: _renderDateTime(item.last_dept_date),
          processing_date: _renderDateTime(item.processing_date),
        }
      })

      // Handling csv parsing and uploading to S3
      const headers = [
        { field: 'response_date', title: 'Response Date' },
        { field: 'allotted_at', title: 'Allotted Date' },
        { field: 'payment_id', title: 'Payment ID' },
        { field: 'site', title: 'Site' },
        { field: 'merchant_id', title: 'Merchant-ID' },
        { field: 'post_request', title: 'Post request' },
        { field: 'name', title: 'Name' },
        { field: 'email', title: 'Email' },
        { field: 'member_id', title: 'M-ID' },
        { field: 'phone_number', title: 'Phone number' },
        { field: 'bank_branch_code', title: 'Bank & Branch (CODE)' },
        { field: 'type_number_account', title: 'Type & A-Number' },
        { field: 'account_name', title: 'Account name' },
        { field: 'request_amount', title: 'Request amount' },
        { field: 'deposit_count', title: 'Deposit count' },
        { field: 'last_dept_date', title: 'Last dept.Date' },
        { field: 'deposit_amount', title: 'Deposit amount' },
        { field: 'processing_date', title: 'Processing date' },
        { field: 'matching_process_text', title: 'Matching process' },
        { field: 'reason', title: 'Reason' },
        { field: 'transaction_id', title: 'Transaction ID' },
        { field: 'support_status', title: 'Support status' },
        { field: 'staff_name', title: 'Staff' },
      ]

      const csvData = await json2csvAsync(formatLocalBankData, { keys: headers, emptyFieldValue: '', excelBOM: true, expandArrayObjects: true })
      const result = await uploadCSV(csvData, csvFileName.LOCAL_BANK)

      return utility.createResponse(true, { url_download: result.Location })
    }

    if (isUnCheckALL) {
      const res = utility.paginatedItems([], pagination.currentPage, pagination.perPage)
      return utility.createResponse(true, res)
    }

    const localBankData = await depositLocalBankApiRepository.getAllLocalBankApi(pagination, queryString, false)
    return utility.createResponse(true, localBankData)
  } catch (err) {
    console.log(err)
    return await errorLogRepository.createResponseAndLog(event, err, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getAllLocalBankApiInfinitas = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}

    let isUnCheckALL = false

    // paging, sort
    const pagination = utility.getPagination(queryString)

    // Get staff display date time
    const staffId = await utility.getUserIdByToken(event)
    const staffInfo = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': staffId })

    // input of select box
    const arrInput = ['siteId', 'matchingProcess']
    arrInput.forEach((item) => {
      if (Number(queryString[item]) === uncheckALL) isUnCheckALL = true

      if ( item === 'siteId') {
        // GET VALID SITES USING QUERY
        queryString[item] = utility.getValidSiteByAdmin(staffInfo.admin_with_site_id, queryString[item])
      } else if (queryString[item]) {
        queryString[item] = queryString[item].split(',')
      }
    })

    queryString.utc = staffInfo.timezone || null

    if (queryString.mode === modeAPI.CSV_EXPORT) {
      const _renderDateTime = (data_time) => {
        return data_time ? utility.getDateTimeFormatted(data_time, staffInfo.display_date_time, queryString.utc) : '-'
      }

      // Get data form db
      const localBankData = !isUnCheckALL ? await depositLocalBankApiRepository.getAllLocalBankApi2(pagination, queryString, true) : []

      // convert data before create csv
      let formatLocalBankData
      if (!localBankData.length) {
        formatLocalBankData = [{}]
      } else {
        formatLocalBankData = localBankData.map((item) => {
          return {
            ...item,
            deposit_amount: item.deposit_amount && _renderItemCurrency(item.deposit_amount, 'ja-JP', 'currency', 'JPY'),
            post_request: item.post_request && _renderPostRequest(item.post_request),
            support_status: item.staff_name && _renderSupportStatus(item.support_status),
            response_date: _renderDateTime(item.response_date),
            processing_date: _renderDateTime(item.processing_date),
          }
        })
      }

      // Handling csv parsing and uploading to S3
      const headers = [
        { field: 'response_date', title: 'Response Date' },
        { field: 'site', title: 'Site' },
        { field: 'post_request', title: 'Post request' },
        { field: 'name', title: 'Name' },
        { field: 'deposit_amount', title: 'Deposit amount' },
        { field: 'processing_date', title: 'Processing date' },
        { field: 'matching_process_text', title: 'Matching process' },
        { field: 'reason', title: 'Reason' },
        { field: 'transaction_id', title: 'Transaction ID' },
        { field: 'support_status', title: 'Support status' },
        { field: 'staff_name', title: 'Staff' },
      ]

      const csvData = await json2csvAsync(formatLocalBankData, { keys: headers, emptyFieldValue: '', excelBOM: true, expandArrayObjects: true })
      const result = await uploadCSV(csvData, csvFileName.LOCAL_BANK_API_2)

      return utility.createResponse(true, { url_download: result.Location })
    }

    if (isUnCheckALL) {
      const res = utility.paginatedItems([], pagination.currentPage, pagination.perPage)
      return utility.createResponse(true, res)
    }

    const localBankData = await depositLocalBankApiRepository.getAllLocalBankApi2(pagination, queryString, false)
    return utility.createResponse(true, localBankData)
  } catch (err) {
    console.log(err)
    return await errorLogRepository.createResponseAndLog(event, err, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const _renderItemCurrency = (item, language, style, currency) => {
  return item.toLocaleString(language, { style: style, currency: currency })
}

const _renderPostRequest = (item) => {
  if (item === postRequest.PAYMENT_NOTIFICATION) {
    return 'Payment Notification'
  }
  return null
}

const _renderSupportStatus = (status) => {
  if (status === supportStatus.WORKING) {
    return 'Working'
  } else if (status === supportStatus.COMPLETION) {
    return 'Comp'
  } else {
    return ''
  }
}

module.exports = {
  getAllLocalBank,
  getAllLocalBankApiInfinitas,
}
