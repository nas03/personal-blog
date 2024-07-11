/* library */
const utility = require('utility')
const _ = require('lodash')
const { json2csvAsync } = require('json-2-csv')

/* DB */
const {
  symbolRepository,
  errorLogRepository,
  brokerRepository,
  productTypeRepository,
  accountTypeRepository,
  rebateDetailsMasterRepository,
} = require('repository')

/* constant */
const { resCheck, modeAPI, csvFileName, flag, uncheckALL, errorMessageCodeConstant } = require('constant')

/* helper */
const { uploadCSV } = require('helper').upload
const { isHalfWidthAlphabetNumberSymbol } = require('helper').regex

const getSymbolsMaster = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}

    // CHECK CASE SELECT BOX UNCHECK ALL
    const isUnCheckALL =
    [Number(queryString.broker_id),
      Number(queryString.product_type_id),
      Number(queryString.platform)]
      .includes(uncheckALL) ? true : false

    // common function handle check value is number in query
    const checkNumber = (str) => {
      return _.every(_.split(str, ','), (value) => value && !isNaN(value))
    }

    if (!_.isEmpty(queryString.broker) && !checkNumber(queryString.broker) ||
      !_.isEmpty(queryString.product_type) && !checkNumber(queryString.product_type)
    ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // pagination
    const pagination = utility.getPagination(queryString)

    if (queryString.mode === modeAPI.CSV_EXPORT) {
      // get list symbol in db
      let listSymbol = !isUnCheckALL ? await symbolRepository.getListSymbolsMaster(queryString, pagination, true) : []
      listSymbol = listSymbol.map((obj) => {
        return { ...obj, platform: obj?.platform.toUpperCase() }
      })

      // Handling csv parsing and uploading to S3
      const headers = [
        { field: 'formal_symbol', title: 'Formal symbol' },
        { field: 'broker_id', title: 'Brokers' },
        { field: 'product_type_id', title: 'Products type' },
        { field: 'account_type_id', title: 'Account type' },
        { field: 'platform', title: 'Platform' },
        { field: 'symbol_name', title: 'Symbol name' },
        { field: 'contract_size', title: 'Contract size' },
        { field: 'digit_size_csv', title: 'Digits' },
        { field: 'margin_currency', title: 'Margin currency' },
        { field: 'profit_currency', title: 'Profit currency' },
      ]

      const options = { keys: headers, emptyFieldValue: '', excelBOM: true, expandArrayObjects: true }
      // using lib to convert data to csv
      const csvData = await json2csvAsync(listSymbol, options)

      // upload to S3
      const result = await uploadCSV(csvData, csvFileName.SYMBOLS_MASTER)

      return utility.createResponse(true, { url_download: result.Location })
    }

    if (isUnCheckALL) {
      const res = utility.paginatedItems([], pagination.currentPage, pagination.perPage)
      return utility.createResponse(true, res)
    }

    // get list symbol in db
    const listSymbol = await symbolRepository.getListSymbolsMaster(queryString, pagination)
    listSymbol.data = listSymbol.data.map((obj) => {
      return {
        ...obj,
        platform: obj?.platform.toUpperCase(),
      }
    })

    return utility.createResponse(true, listSymbol)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const changeEnableFlag = async (event) => {
  try {
    const id = event.pathParameters.id
    const eventBody = JSON.parse(event.body) || {}
    const updateData = {}

    // if key for check symbol exist in m_rebate_details
    if (eventBody.is_check_rebate) {
      const listRebateDetail = await rebateDetailsMasterRepository.getRebateDetailBySymbolId(id)
      return utility.createResponse(true, { rebate_exist: listRebateDetail.length ? true : false })
    }

    // validate param
    if (_.isNil(eventBody.enable_flag)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    if (![0, 1].includes(eventBody.enable_flag)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // handle update only enable flag
    updateData.enable_flag = eventBody.enable_flag

    // check exist record
    const symbolMaster = await symbolRepository.getSymbolMaster(id)
    if (_.isEmpty(symbolMaster)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // update and check result
    const updated = await symbolRepository.updateSymbolsMaster(updateData, id)
    if (!updated) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.CHANGE_ENABLE_FLAG.UPDATE_FAIL_DB])
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const importSymbolsMaster = async (event) => {
  try {
    const { data } = JSON.parse(event.body)

    if (_.isArray(data) && !data.length) {
      return await errorLogRepository.createResponseAndLog(event, null, {
        error_line: 2,
        error_field: 'formal_symbol',
      }, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // Validate and format data form body
    const result = await _validateImportData(data)
    if (result.status === resCheck.ERROR) {
      const fieldMappings = {
        formal_symbol: 'Formal symbol',
        broker_id: 'Brokers',
        product_type_id: 'Products type',
        account_type_id: 'Account type',
        platform: 'Platform',
        symbol_name: 'Symbol name',
        contract_size: 'Contract size',
        digit_size: 'Formal Digits',
        margin_currency: 'Margin currency',
        profit_currency: 'Profit currency',
      }
      const errorData = result.data
      return await errorLogRepository.createResponseAndLog(event, null, {
        error_line: errorData.line,
        error_field: errorData.field,
      },
      [errorData.errorCode], { field: fieldMappings[errorData.field], line_number: errorData.line })
    }

    const dataFormDB = await symbolRepository.getListForCheckImport()

    // Handle fill data to object
    const hashMap = {}
    for (const data of dataFormDB) {
      const key = `${data.broker_id}-${data.account_type_id}-${data.platform}-${data.symbol_name}`
      hashMap[key] = data
    }

    const payload = { changed: [], new: [] }

    // Handle filter data filled for changed data
    data.forEach((item) => {
      const key = `${item.broker_id}-${item.account_type_id}-${item.platform}-${item.symbol_name}`
      const hashMapItem = hashMap[key]

      if (hashMapItem) {
        item.id = hashMapItem.id

        if (
          item.formal_symbol !== hashMapItem.formal_symbol ||
          item.product_type_id !== hashMapItem.product_type_id ||
          item.contract_size !== hashMapItem.contract_size ||
          item.digit_size !== hashMapItem.digit_size ||
          item.margin_currency !== hashMapItem.margin_currency ||
          item.profit_currency !== hashMapItem.profit_currency
        ) {
          payload.changed.push({
            id: item.id,
            formal_symbol: item.formal_symbol,
            product_type_id: item.product_type_id,
            contract_size: item.contract_size,
            digit_size: item.digit_size,
            margin_currency: item.margin_currency,
            profit_currency: item.profit_currency,
          })
        }
      } else {
        payload.new.push({
          formal_symbol: item.formal_symbol,
          broker_id: item.broker_id,
          product_type_id: item.product_type_id,
          account_type_id: item.account_type_id,
          platform: item.platform,
          symbol_name: item.symbol_name,
          contract_size: item.contract_size,
          digit_size: item.digit_size,
          margin_currency: item.margin_currency,
          profit_currency: item.profit_currency,
          enable_flag: flag.TRUE,
        })
      }
    })

    // Handle update to db with data changed
    if (payload && payload.changed.length) {
      const updated = await symbolRepository.updateSymbolsMaster(payload.changed)
      if (!updated) {
        return await errorLogRepository.createResponseAndLog(event, null, null,
          [errorMessageCodeConstant.IMPORT_SYMBOLS_MASTER.UPDATE_SYMBOLS_MASTER])
      }
    }

    // Handle update to db with ins new
    if (payload && payload.new.length) {
      await symbolRepository.createSymbolMaster(payload.new)
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const _validateImportData = async (data) => {
  // Get data for check logic file
  const [listBroker, listProductType, listAccountType] = await Promise.all([
    brokerRepository.getAll(),
    productTypeRepository.getAll(),
    accountTypeRepository.getAll(),
  ])

  // Function logic
  function getObjInvalid(obj) {
    const requiredKeys = [
      'formal_symbol',
      'broker_id',
      'account_type_id',
      'product_type_id',
      'platform',
      'symbol_name',
      'contract_size',
      'digit_size',
      'margin_currency',
      'profit_currency',
    ]

    const isNotNumberInt = (num) => {
      return !(/^\d+$/.test(num))
    }

    const isNotNumber = (num) => {
      return !(/^(1|(0\.0{0,14}1))$/.test(num))
    }

    // check format fields
    const fieldChecks = {
      formal_symbol: (val) => (!_.isString(val) || !isHalfWidthAlphabetNumberSymbol(val)),
      broker_id: (val) => isNotNumberInt(val),
      account_type_id: (val) => isNotNumberInt(val),
      product_type_id: (val) => isNotNumberInt(val),
      platform: (val) => !_.isString(val),
      symbol_name: (val) => (!_.isString(val) || !isHalfWidthAlphabetNumberSymbol(val)),
      contract_size: (val) => isNotNumberInt(val),
      digit_size: (val) => isNotNumber(val),
      margin_currency: (val) => !(/^[a-zA-Z0-9]*$/.test(val)),
      profit_currency: (val) => !(/^[a-zA-Z0-9]*$/.test(val)),
    }

    const objInvalid = {}
    for (const key of requiredKeys) {
      if (obj[key]) {
        obj[key] = obj[key].replace(/ /g, '')
      }

      if (obj[key] === '' || obj[key] === null || obj[key] === undefined) {
        objInvalid.missingKey = key
      }

      if (!objInvalid.missingKey && fieldChecks.hasOwnProperty(key) && fieldChecks[key](obj[key])) {
        objInvalid.invalidKey = key
      }

      if (!_.isEmpty(objInvalid)) {
        break
      }
    }

    return objInvalid
  }

  function getDataInListById(dataList, idToCheck) {
    return dataList.find((item) => item.id === idToCheck)
  }

  function generateKeyToCheckDuplicate(obj) {
    return ['broker_id', 'account_type_id', 'platform', 'symbol_name'].map((field) => obj[field]).join('|')
  }

  // Check for duplicates using a hash table
  const uniqueObjects = {}
  let objError
  for (const [index, obj] of data.entries()) {
    // check required all field
    const objInvalid = getObjInvalid(obj)
    if (objInvalid.missingKey) {
      objError = { line: index + 2, field: objInvalid.missingKey, errorCode: errorMessageCodeConstant.IMPORT_SYMBOLS_MASTER.MISSING_KEY }
      break
    }
    // check length data
    if (obj.platform.length > 3) {
      objError = { line: index + 2, field: 'platform', errorCode: errorMessageCodeConstant.IMPORT_SYMBOLS_MASTER.CHARS_EXCEED.PLATFORM }
      break
    }

    if (obj.formal_symbol.length > 30) {
      objError = { line: index + 2, field: 'formal_symbol', errorCode: errorMessageCodeConstant.IMPORT_SYMBOLS_MASTER.CHARS_EXCEED.FORMAL_SYMBOL }
      break
    }

    if (obj.symbol_name.length > 45) {
      objError = { line: index + 2, field: 'symbol_name', errorCode: errorMessageCodeConstant.IMPORT_SYMBOLS_MASTER.CHARS_EXCEED.SYMBOL_NAME }
      break
    }

    if (obj.margin_currency.length > 10) {
      objError = { line: index + 2, field: 'margin_currency', errorCode: errorMessageCodeConstant.IMPORT_SYMBOLS_MASTER.CHARS_EXCEED.MARGIN_CURRENCY }
      break
    }

    if (obj.profit_currency.length > 10) {
      objError = { line: index + 2, field: 'profit_currency', errorCode: errorMessageCodeConstant.IMPORT_SYMBOLS_MASTER.CHARS_EXCEED.PROFIT_CURRENCY }
      break
    }
    // check format
    if (objInvalid.invalidKey) {
      switch (objInvalid.invalidKey) {
        case 'formal_symbol': {
          objError = { line: index + 2, field: objInvalid.invalidKey,
            errorCode: errorMessageCodeConstant.IMPORT_SYMBOLS_MASTER.FIELD_INVALID.FORMAL_SYMBOL }
          break
        }
        case 'broker_id': {
          objError = { line: index + 2, field: objInvalid.invalidKey,
            errorCode: errorMessageCodeConstant.IMPORT_SYMBOLS_MASTER.FIELD_INVALID.BROKER }
          break
        }
        case 'account_type_id': {
          objError = { line: index + 2, field: objInvalid.invalidKey,
            errorCode: errorMessageCodeConstant.IMPORT_SYMBOLS_MASTER.FIELD_INVALID.PRODUCTS_TYPE }
          break
        }
        case 'product_type_id': {
          objError = { line: index + 2, field: objInvalid.invalidKey,
            errorCode: errorMessageCodeConstant.IMPORT_SYMBOLS_MASTER.FIELD_INVALID.ACCOUNT_TYPE }
          break
        }
        case 'platform': {
          objError = { line: index + 2, field: objInvalid.invalidKey,
            errorCode: errorMessageCodeConstant.IMPORT_SYMBOLS_MASTER.FIELD_INVALID.PLATFORM }
          break
        }
        case 'symbol_name': {
          objError = { line: index + 2, field: objInvalid.invalidKey,
            errorCode: errorMessageCodeConstant.IMPORT_SYMBOLS_MASTER.FIELD_INVALID.SYMBOL_NAME }
          break
        }
        case 'contract_size': {
          objError = { line: index + 2, field: objInvalid.invalidKey,
            errorCode: errorMessageCodeConstant.IMPORT_SYMBOLS_MASTER.FIELD_INVALID.CONTRACT_SIZE }
          break
        }
        case 'digit_size': {
          objError = { line: index + 2, field: objInvalid.invalidKey,
            errorCode: errorMessageCodeConstant.IMPORT_SYMBOLS_MASTER.FIELD_INVALID.DIGITS }
          break
        }
        case 'margin_currency': {
          objError = { line: index + 2, field: objInvalid.invalidKey,
            errorCode: errorMessageCodeConstant.IMPORT_SYMBOLS_MASTER.FIELD_INVALID.MARGIN_CURRENCY }
          break
        }
        default: {
          objError = { line: index + 2, field: objInvalid.invalidKey,
            errorCode: errorMessageCodeConstant.IMPORT_SYMBOLS_MASTER.FIELD_INVALID.PROFIT_CURRENCY }
        }
      }
      break
    }
    // format to data necessary for import and check exists
    obj.broker_id = parseInt(obj.broker_id)
    obj.product_type_id = parseInt(obj.product_type_id)
    obj.account_type_id = parseInt(obj.account_type_id)
    obj.contract_size = parseInt(obj.contract_size.replace(/,/g, ''))
    obj.digit_size = parseFloat(obj.digit_size)
    obj.platform = obj.platform.toLowerCase()

    // check broker in database
    const broker = getDataInListById(listBroker, obj.broker_id)
    if (!broker) {
      objError = { line: index + 2, field: 'broker', errorCode: errorMessageCodeConstant.IMPORT_SYMBOLS_MASTER.NOT_FOUND.BROKER }
      break
    }
    if (broker.enable_flag === flag.FALSE) {
      objError = { line: index + 2, field: 'broker', errorCode: errorMessageCodeConstant.IMPORT_SYMBOLS_MASTER.DISABLED.BROKER }
      break
    }

    // check product type in database
    const productType = getDataInListById(listProductType, obj.product_type_id)
    if (!productType) {
      objError = { line: index + 2, field: 'product_type_id', errorCode: errorMessageCodeConstant.IMPORT_SYMBOLS_MASTER.NOT_FOUND.PRODUCT_TYPE }
      break
    }
    if (productType.enable_flag === flag.FALSE) {
      objError = { line: index + 2, field: 'product_type_id', errorCode: errorMessageCodeConstant.IMPORT_SYMBOLS_MASTER.DISABLED.PRODUCT_TYPE }
      break
    }

    // check account type in database
    const accountType = getDataInListById(listAccountType, obj.account_type_id)
    if (!accountType) {
      objError = { line: index + 2, field: 'account_type_id', errorCode: errorMessageCodeConstant.IMPORT_SYMBOLS_MASTER.NOT_FOUND.ACCOUNT_TYPE }
      break
    }

    if (accountType.enable_flag === flag.FALSE) {
      objError = { line: index + 2, field: 'account_type_id', errorCode: errorMessageCodeConstant.IMPORT_SYMBOLS_MASTER.DISABLED.ACCOUNT_TYPE }
      break
    }

    // check platform
    if (!['mt4', 'mt5'].includes(obj.platform)) {
      objError = { line: index + 2, field: 'platform', errorCode: errorMessageCodeConstant.IMPORT_SYMBOLS_MASTER.NOT_FOUND.PLATFORM }
      break
    }

    // handle duplicate record using hash table
    const key = generateKeyToCheckDuplicate(obj)
    if (uniqueObjects[key]) {
      objError = { line: index + 2, errorCode: errorMessageCodeConstant.IMPORT_SYMBOLS_MASTER.DUPLICATE_RECORD }
      break
    } else {
      uniqueObjects[key] = true
    }
  }

  if (objError) {
    return { status: resCheck.ERROR, data: objError }
  }

  return { status: resCheck.OK }
}

module.exports = {
  getSymbolsMaster,
  changeEnableFlag,
  importSymbolsMaster,
}
