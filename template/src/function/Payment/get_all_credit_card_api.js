/* DB */
const { depositCreditCardApiRepository, errorLogRepository, usersBasicDataRepository } = require('repository')

/* constant */
const { errorMessageCodeConstant, modeAPI, csvFileName, creditCardStatus, baseCurrency, uncheckALL } = require('constant')

/* func */
const utility = require('utility')

/* library */
const { json2csvAsync } = require('json-2-csv')
const { uploadCSV } = require('helper').upload

const getAllCreditCard = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}

    // paging, sort
    const pagination = utility.getPagination(queryString)

    // convert sort param from request_amount to request_amount_sort
    if (pagination.sort && pagination.sort[0].column === 'request_amount') {
      pagination.sort[0].column = 'request_amount_sort'
    }

    // convert sort param from deposit_amount to deposit_amount_sort
    if (pagination.sort && pagination.sort[0].column === 'deposit_amount') {
      pagination.sort[0].column = 'deposit_amount_sort'
    }

    // Get staff display date time
    const staffId = utility.getUserIdByToken(event)
    const staffInfo = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': staffId })

    let isUnCheckALL = false

    // input of select box
    const arrInput = ['siteId', 'cardBrand', 'status']
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
    queryString.utc = staffInfo.timezone || null

    // check if the CSV export mode
    if (queryString.mode === modeAPI.CSV_EXPORT) {
      // Get data CreditCardApi
      const creditCardData = !isUnCheckALL ? await depositCreditCardApiRepository.getAllCreditCardApi(pagination, queryString, true) : []
      let formatCreditCardData
      if (!creditCardData.length) {
        formatCreditCardData = [{}]
      } else {
        formatCreditCardData = creditCardData.map((item) => {
          return {
            ...item,
            response_date: utility.getDateTimeFormatted(item.response_date, staffInfo.display_date_time, queryString.utc),
            request_amount: item.request_amount && _convertAmountToString(item.request_amount, item.currency),
            deposit_amount: item.deposit_amount && _convertAmountToString(item.deposit_amount, item.currency),
            status: item.status === creditCardStatus.SUCCESS ? 'Success' : 'Failed',
            transaction_id: item.transaction_id || '-',
            error_code: item.error_code || '-',
            error_reason: item.en_short_message || '-',
          }
        })
      }


      // Handling csv parsing and uploading to S3
      const headers = [
        { field: 'response_date', title: 'Response Date' },
        { field: 'invoice_no', title: 'Invoice ID' },
        { field: 'site_name', title: 'Site' },
        { field: 'post_request', title: 'Post request' },
        { field: 'name', title: 'Name' },
        { field: 'card_brand', title: 'Card brand' },
        { field: 'request_amount', title: 'Request amount' },
        { field: 'deposit_amount', title: 'Deposit amount' },
        { field: 'status', title: 'Result' },
        { field: 'transaction_id', title: 'Transaction ID' },
        { field: 'error_code', title: 'Error code' },
        { field: 'error_reason', title: 'Error message' },
      ]

      const csvData = await json2csvAsync(formatCreditCardData, { keys: headers, emptyFieldValue: '', excelBOM: true, expandArrayObjects: true })
      const result = await uploadCSV(csvData, csvFileName.CREDIT_CARD)

      return utility.createResponse(true, { url_download: result.Location })
    }

    if (isUnCheckALL) {
      const res = utility.paginatedItems([], pagination.currentPage, pagination.perPage)
      return utility.createResponse(true, res)
    }

    const creditCardData = await depositCreditCardApiRepository.getAllCreditCardApi(pagination, queryString, false)
    const standardData = creditCardData.data.map((item) => {
      return {
        id: item.id,
        response_date: item.response_date,
        invoice_no: item.invoice_no,
        site_id: item.site_id,
        site_name: item.site_name,
        symbol_logo_path: item.symbol_logo_path,
        symbol_logo_name: item.symbol_logo_name,
        side_logo_path: item.side_logo_path,
        side_logo_name: item.side_logo_name,

        post_request: item.post_request,
        name: item.name,
        card_brand: item.card_brand,
        request_amount: item.request_amount,
        deposit_amount: item.deposit_amount,
        status: item.status,
        transaction_id: item.transaction_id,
        error_code: item.error_code,
        currency: item.currency,
        error_reason: {
          ja_short_message: item.ja_short_message,
          en_short_message: item.en_short_message,
          cn_short_message: item.cn_short_message,
          kr_short_message: item.kr_short_message,
        },
      }
    })
    creditCardData.data = standardData
    return utility.createResponse(true, creditCardData)
  } catch (err) {
    console.log(err)
    return await errorLogRepository.createResponseAndLog(event, err, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const _convertAmountToString = (amount, currency) => {
  switch (currency) {
    case baseCurrency.JPY:
      return _roundingByCurrency(amount, baseCurrency.JPY).toLocaleString('ja-JP', { style: 'currency', currency: currency })
    case baseCurrency.USD:
      return _roundingByCurrency(amount, baseCurrency.USD).toLocaleString('en-US', { style: 'currency', currency: currency })
    case baseCurrency.EUR:
      return _roundingByCurrency(amount, baseCurrency.EUR).toLocaleString('en-US', { style: 'currency', currency: currency })
    case baseCurrency.BTC:
      return _roundingByCurrency(amount, baseCurrency.BTC).toLocaleString('en-US', { style: 'currency', currency: currency })
  }
}

const _roundingByCurrency = (amount, currency) => {
  switch (currency) {
    case baseCurrency.USD:
      return utility.roundNumber(amount, 2)
    case baseCurrency.EUR:
      return utility.roundNumber(amount, 2)
    case baseCurrency.JPY:
      return utility.roundNumber(amount, 0)
    case baseCurrency.BTC:
      return utility.roundNumber(amount, 4)
    default:
      return amount
  }
}

module.exports = {
  getAllCreditCard,
  _roundingByCurrency,
}
