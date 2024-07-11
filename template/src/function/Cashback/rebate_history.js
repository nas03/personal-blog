const utility = require('utility')

// Constant
const {
  resCheck, code, message, platformCode, platform: platformKey,
  dateFormat, flag, csvFileName, actionMethod, lotRebateCurrency: lotRebateCurrencyConstant, uncheckALL,
  calculatedFlagConstant, batchTypes, resultTypes, brokerID, resultDetailIds, resultDetailMessages, statusCode,
  statusLableConstant, baseCurrency, statusClassConstant, errorMessageCodeConstant,
} = require('constant')

// Repository
const {
  errorLogRepository, rebateHistoryRepository, crawlTransactionRepository, brokerRepository, symbolRepository,
  ibRankRepository, accountTypeRepository, rebatesMasterRepository, siteRepository, sequenceRepository, batchLogRepository, usersBasicDataRepository,
  rateRepository,
} = require('repository')

// Library
const moment = require('moment')
const { json2csvAsync } = require('json-2-csv')
const uuid = require('uuid')
const _ = require('lodash')

// Helper
const { uploadCSVRebateHistory } = require('helper').upload
const { sendSqsMessageRebateStatistics } = require('helper').aws

const { axios } = require('helper')
const aws = require('helper').aws

// Default setting
// USD, JPY, EUR
const listBaseCurrency = [lotRebateCurrencyConstant.USD, lotRebateCurrencyConstant.JPY, lotRebateCurrencyConstant.EUR]

const getListRebateHistory = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}
    const pagination = utility.getPagination(queryString)

    // Declare fields to check case uncheck all
    const { site_id, account_type_id, broker_id, ib_rank_id, platform } = queryString
    // Check case uncheck all
    const isUnCheckALL = [Number(site_id), Number(account_type_id), Number(broker_id), Number(ib_rank_id), Number(platform)].includes(uncheckALL) ?
      true : false

    const staffId = utility.getUserIdByToken(event)
    const staffInfo = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': staffId })

    // GET VALID SITES USING QUERY
    queryString.site_id = utility.getValidSiteByAdmin(staffInfo.admin_with_site_id, site_id)
    queryString.utc = staffInfo.timezone || null
    queryString.display_date_time = staffInfo.display_date_time

    if (queryString.isExportCSV === 'true') {
      const fileName = `files/csv/${uuid.v4()}/${csvFileName.REBATE_HISTORY}${moment().utc().format('YYYYMMDDHHmmss')}.csv`

      let csvData
      const timerQuery = Date.now()
      const listRebateHistoryCSV = !isUnCheckALL ? await rebateHistoryRepository.getListRebateHistory(queryString, pagination, true) : []
      console.log('time get DB:', (Date.now() - timerQuery) / 1000, 's')

      console.log('length array', listRebateHistoryCSV.length)
      if (!listRebateHistoryCSV.length) {
        // eslint-disable-next-line max-len
        csvData = 'Imported Date,Rebate ID,Site,IB Rebate status,Broker,IB Rank,Ticket No.,Close date (User time),Close date (Broker server time),Symbol,Platform,AC type,Lots,E-rebates,E-rebates currency,Lot rebates,Lot rebates currency,Account name,MT Account No.,Decision date,Manual or AUTO,Staff'

        const result = await uploadCSVRebateHistory(csvData, fileName)
        return utility.createResponse(true, result)
      }

      // GENERATE NEW DATETIME FORMAT FROM DISPLAY AND TIMEZONE
      const _renderDateTime = (data_time, hasConvertTz = true) => {
        return data_time ?
          utility.getDateTimeFormatted(data_time, staffInfo.display_date_time, hasConvertTz ? queryString.utc : null) :
          null
      }

      listRebateHistoryCSV.forEach((el) => {
        if (el.ib_rebates_status_code === statusCode.REQUIRED) {
          el.ib_rebates_status_code = 'Action required'
        } else if (el.ib_rebates_status_code === statusCode.APPROVED) {
          el.ib_rebates_status_code = 'Approved'
        }

        if (el.action_method === actionMethod.USER_ACTION) {
          el.action_method = 'User action'
        } else if (el.action_method === actionMethod.SYSTEM_ACTION) {
          el.action_method = 'System action'
        } else if (el.action_method === actionMethod.OPERATOR_ACTION) {
          el.action_method = el.staff_name
        }

        el.platform = el.platform.toUpperCase()
        el.volume = `${el.volume} Lot`

        el.ts_regist = _renderDateTime(el.ts_regist)
        el.close_time = _renderDateTime(el.close_time)
        el.close_time_broker = _renderDateTime(el.close_time_broker, false)
        el.decision_date = _renderDateTime(el.decision_date)
      })

      // Handling csv parsing and uploading to S3
      const headers = [
        { field: 'ts_regist', title: 'Imported Date' },
        { field: 'id', title: 'Rebate ID' },
        { field: 'site_name', title: 'Site' },
        { field: 'ib_rebates_status_code', title: 'IB Rebate status' },
        { field: 'broker_name', title: 'Broker' },
        { field: 'ib_rank_name', title: 'IB Rank' },
        { field: 'ticket', title: 'Ticket No.' },
        { field: 'close_time', title: 'Close date (User time)' },
        { field: 'close_time_broker', title: 'Close date (Broker server time)' },
        { field: 'symbol', title: 'Symbol' },
        { field: 'platform', title: 'Platform' },
        { field: 'account_type_name', title: 'AC type' },
        { field: 'volume', title: 'Lots' },
        { field: 'earned_rebates', title: 'E-rebates' },
        { field: 'earned_rebates_currency', title: 'E-rebates currency' },
        { field: 'lot_rebates', title: 'Lot rebates' },
        { field: 'lot_rebates_currency', title: 'Lot rebates currency' },
        { field: 'mt_account_no', title: 'MT Account No.' },
        { field: 'mt_account_name', title: 'Account name' },
        { field: 'decision_date', title: 'Decision date' },
        { field: 'action_method', title: 'Action method or Staff' },
      ]

      csvData = await json2csvAsync(listRebateHistoryCSV, { keys: headers, emptyFieldValue: '-', excelBOM: true })

      console.log('byte :', (Buffer.from(csvData, 'utf-8')).length)
      const y = Date.now()
      const result = await uploadCSVRebateHistory(csvData, fileName)
      console.log('upload S3 :', (Date.now() - y) / 1000, 's')
      console.log(result)
      return utility.createResponse(true, result)
    }

    console.log('====== START Get data rebate history: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))

    // Check case uncheck all
    if (isUnCheckALL) {
      const res = utility.paginatedItems([], pagination.currentPage, pagination.perPage)
      console.log('====== END Get data rebate history: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
      return utility.createResponse(true, res)
    }

    const listRebateHistory = await rebateHistoryRepository.getListRebateHistory(queryString, pagination)
    console.log('====== END Get data rebate history: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))

    return utility.createResponse(true, listRebateHistory)
  } catch (err) {
    console.log(err)
    await errorLogRepository.createSystemLog(event, code.ERROR, message.server_error, err)
    return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
  }
}


const scheduleRebateHistory = async (event) => {
  let parentBatchLogId
  const processStartTime = moment.utc().format(dateFormat.DATE_TIME_ZONE)
  let totalCount = 0

  try {
    event.body = { ...event }
    event.path = '/schedule-rebate-history'

    parentBatchLogId = await sequenceRepository.updateAndGetBatchId()

    parentBatchLogId && await batchLogRepository.createNewBatchLogBegin(parentBatchLogId, batchTypes.RBT_HIST)

    const sqsMessage = utility.generateSqsMessage(parentBatchLogId, resultDetailIds.E_1009002)

    parentBatchLogId && await aws.sendSqsMessage(sqsMessage)

    const timer = Date.now()
    console.log('====== Job rebate history start ======', event)
    // Get data crawl (limit 500 record)
    console.log('====== START Get data crawl: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
    const listTransaction = await crawlTransactionRepository.getScrapingExecutedRecord(process.env.CASHBACK_UNPROCESSED_LIMIT)
    totalCount = listTransaction.length
    console.log('====== END Get data crawl: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
    console.log('====== Data crawl: ', listTransaction.length)

    // Get current ID
    const dateNow = moment().utc().format('YYMMDD')
    let currentId = await rebateHistoryRepository.getCurrentId(dateNow)

    // Get a list of rebate history
    let numRecord = 0
    const listPayloadRebateHistory = []
    const listPayloadRebateStatusHistory = []
    const listTransactionId = []
    for (const transaction of listTransaction) {
      numRecord++
      if (numRecord % 1000 === 0) {
        console.log('====== START Create rebate history: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
        console.log('====== Record: ', numRecord)
      }

      const payloadRebateHistory = _autoCreateRebateHistory(transaction)

      if (!payloadRebateHistory) {
        continue
      }
      currentId++
      payloadRebateHistory.id = dateNow + '-' + currentId.toString().padStart(10, '0')
      // render payload rebate_status_history
      const payloadRebateStatusHistory = _autoCreateRebateStatusHistory(payloadRebateHistory)
      listPayloadRebateStatusHistory.push(payloadRebateStatusHistory)
      listPayloadRebateHistory.push(payloadRebateHistory)
      listTransactionId.push(transaction.id)
      if (numRecord % 1000 === 0) {
        console.log('====== END Create rebate history: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
      }
    }

    if (listPayloadRebateHistory.length) {
      // Insert data
      await rebateHistoryRepository.createRebateHistory(listPayloadRebateHistory, listPayloadRebateStatusHistory, listTransactionId)
    }

    parentBatchLogId && await batchLogRepository.createNewBatchLogProcessResult(
      parentBatchLogId,
      batchTypes.RBT_HIST,
      resultTypes.SUCCESS,
      {
        total_count: totalCount,
        result_count: totalCount,
        process_start_time: processStartTime,
        process_end_time: moment.utc().format(dateFormat.DATE_TIME_ZONE),
        result_detail: {},
      },
    )

    console.log(`Runtime ${Date.now() - timer}ms`)
    console.log('====== Job rebate history done ======')
    return utility.createResponse(true)
  } catch (error) {
    console.error(error)

    parentBatchLogId && await batchLogRepository.createNewBatchLogProcessResult(
      parentBatchLogId,
      batchTypes.RBT_HIST,
      resultTypes.ERROR,
      {
        total_count: totalCount,
        result_count: 0,
        process_start_time: processStartTime,
        process_end_time: moment.utc().format(dateFormat.DATE_TIME_ZONE),
        result_detail: {
          // eslint-disable-next-line new-cap
          result_detail_message: resultDetailMessages.E_1009001(error.sqlMessage || error.message),
        },
      },
      resultDetailIds.E_1009001,
    )

    await errorLogRepository.createSystemLog(event, code.ERROR, message.server_error, error)
    return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
  } finally {
    parentBatchLogId && await batchLogRepository.createNewBatchLogEnd(parentBatchLogId, batchTypes.RBT_HIST)
  }
}

const _autoCreateRebateHistory = (transaction) => {
  const ibRebatesStatus = {
    code: statusCode.REQUIRED,
    lable: statusLableConstant.REQUIRED.NOT_CALCULATED,
  }
  // Get info cashback
  transaction.cashback_account = transaction.account_no
  transaction.platformKey = _getPlatformKey(transaction.platform)

  // Generate rebate history information
  const payloadRebateHistory = _getPayloadRebateHistory(transaction, ibRebatesStatus)

  return payloadRebateHistory
}

// render payload rebate_status_history depend on rebate_history
const _autoCreateRebateStatusHistory = (transaction) => {
  return {
    target_id: transaction.id,
    status_code: transaction.ib_rebates_status_code,
    status_label_number: transaction.ib_rebates_status_label_number,
    status_class_id: statusClassConstant.REBATE_HISTORY_STATUS,
    action_method: actionMethod.SYSTEM_ACTION,
    updated_by_user_id: null,
  }
}

const _getPlatformKey = (platform) => {
  return platform === platformCode.MT4 ? platformKey.MT4 : (platformCode.MT5 ? platformKey.MT5 : platform)
}

const _getPayloadRebateHistory = (transaction, ibRebatesStatus) => {
  return {
    crawl_transaction_id: transaction.id,
    site_id: transaction.site_id,
    broker_id: transaction.broker_id,
    ib_rank_id: transaction.ib_rank_id,
    order_id: transaction.order_id,
    deal_id: transaction.deal_id,
    ticket: transaction.ticket,
    open_time_broker: transaction.open_time_broker,
    open_time: transaction.open_time,
    close_time: transaction.close_time,
    close_time_broker: transaction.close_time_broker,
    symbol: transaction.symbol,
    symbol_id: null,
    platform: transaction.platformKey,
    account_type_id: transaction.account_type_id,
    volume: transaction.volume,
    reward_per_trade: transaction.reward_per_trade,
    reward_per_trade_usd: null,
    reward_currency: transaction.reward_currency,
    calculated_lot_rebates: null,
    calculated_lot_rebates_currency: null,
    mt_account_name: transaction.account_name,
    mt_account_no: transaction.cashback_account,
    account_currency: transaction.account_currency,
    profit: transaction.profit,
    rebate_detail_id: null,
    rebate_contract_size: null,
    rebate_digit_size: null,
    rebate_profit_currency: null,
    rebate_lot_rebate: null,
    rebate_lot_rebate_currency: null,
    rate_data: null,
    ib_rebates_status_code: ibRebatesStatus.code,
    ib_rebates_status_label_number: ibRebatesStatus.lable,
    action_method: actionMethod.SYSTEM_ACTION,
    decision_date: moment().utc().format(dateFormat.DATE_TIME),
    calculate_flag: flag.FALSE,
  }
}

const _getRewardRerTradeUsd = (transaction, rateByCloseTimes) => {
  if (transaction.reward_currency === baseCurrency.USD || transaction.reward_per_trade === 0 || transaction.reward_per_trade === null) {
    return transaction.reward_per_trade
  }

  if (transaction.close_time && transaction.reward_currency && transaction.reward_currency !== baseCurrency.USD) {
    const rateObject = rateByCloseTimes[0].find((item) => {
      return item.base === transaction.reward_currency &&
        item.symbol === baseCurrency.USD &&
        item.date_only === moment(transaction.close_time).format(dateFormat.DATE)
    })

    return rateObject?.rate ? transaction.reward_per_trade * rateObject.rate : null
  }

  return null
}

const getDropdownRebateHistory = async (event) => {
  try {
    const adminId = utility.getUserIdByToken(event)
    const queryString = event.queryStringParameters || {}
    const { broker_id, isShowOnlyEnable } = queryString

    const [sites, ibRanks, accountTypes, adminData] = await Promise.all([
      siteRepository.getAll(),
      ibRankRepository.getIbRankforDropdownRebateHistory(broker_id, isShowOnlyEnable),
      accountTypeRepository.getAccountTypeForDropdownRebateHistory(broker_id, isShowOnlyEnable),
      usersBasicDataRepository.getUserBasicData({ id: adminId }),
    ])

    const adminWithSiteIds = adminData.admin_with_site_id.split(',').map(Number)

    const response = {
      ib_ranks: ibRanks,
      account_types: accountTypes,
      platform: [platformKey.MT4, platformKey.MT5],
      sites: sites.filter((el) => adminWithSiteIds.includes(el.id)) || [],
    }

    return utility.createResponse(true, response)
  } catch (error) {
    console.log(error)
    await errorLogRepository.createSystemLog(event, code.ERROR, message.server_error, error)
    return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
  }
}

const scheduleCalculateRebateHistory = async (event, rebateHistoryRecalculates, isRecalculate) => {
  let parentBatchLogId
  let batchType
  const processStartTime = moment.utc().format(dateFormat.DATE_TIME_ZONE)
  let totalCount = 0
  let resultCount = 0

  try {
    event.body = { ...event }
    event.path = '/schedule-calculate-rebate-history'

    console.log('====== Job calculate rebate history start ======', event)
    const timer = Date.now()
    const { brokerId } = event || {}

    batchType = getBatchTypeByBrokerId(brokerId)
    parentBatchLogId = await sequenceRepository.updateAndGetBatchId()

    parentBatchLogId && await batchLogRepository.createNewBatchLogBegin(parentBatchLogId, batchType)

    const sqsMessage = utility.generateSqsMessage(parentBatchLogId, resultDetailIds[`E_10${batchType}005`])

    parentBatchLogId && await aws.sendSqsMessage(sqsMessage)

    // Get broker info
    const broker = await brokerRepository.getBrokerIncludeSoftDelete(brokerId)

    // Get data crawl (limit 500 record)
    console.log('====== START Get data rebate: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
    let listRebateHistory
    if (isRecalculate === true) {
      listRebateHistory = rebateHistoryRecalculates
    } else {
      listRebateHistory = await rebateHistoryRepository.getRebateHistoryForCalculate(process.env.CALCULATE_REBATE_HISTORY_LIMIT, brokerId)
    }
    totalCount = listRebateHistory.length
    console.log('====== END Get data rebate: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
    console.log('====== Data rebate: ', listRebateHistory.length)

    // GET m_rate with close_time, base, symbol
    let rateByCloseTimesData = []
    if (listRebateHistory.length) {
      const closeTimes = listRebateHistory
        .filter((transaction) =>
          transaction.close_time &&
              transaction.reward_per_trade &&
              transaction.reward_currency &&
               transaction.reward_currency !== baseCurrency.USD,
        )
        .map((transaction) => {
          return {
            close_time: transaction.close_time,
            base: transaction.reward_currency,
            symbol: baseCurrency.USD,
          }
        })

      // Get rate by close_time
      if (closeTimes.length) {
        rateByCloseTimesData = await rateRepository.getRateByRebateHistory(closeTimes)
      }
    }

    // Get enable site
    console.log('====== START Get enable site: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
    const listSite = await siteRepository.getAll(false, true)
    console.log('====== END Get enable site: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))

    // Get enable broker
    console.log('====== START Get enable broker: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
    const listBroker = await brokerRepository.getAll(false, true)
    console.log('====== END Get enable broker: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))

    // Get enable symbol
    console.log('====== START Get enable symbol: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
    const listSymbol = await symbolRepository.getAll(true)
    console.log('====== END Get enable symbol: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))

    // Get ib_rank
    console.log('====== START Get ib rank: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
    const listIbRank = await ibRankRepository.getAllForJobCashback(false, true)
    console.log('====== END Get ib rank: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))

    // Get enable account type
    console.log('====== START Get enable account type: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
    const listAccountType = await accountTypeRepository.getAll(false)
    console.log('====== END Get enable account type: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))

    // Get enable account type
    console.log('====== START Get master data rebate detail: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
    const listRebateDetail = await rebatesMasterRepository.getAllRebatesForCalculation()
    console.log('====== END Get master data rebate detail: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))

    // Create body data
    console.log('====== START Create body data: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
    const bodyData = []
    const closeDatesMap = new Map()

    listRebateHistory.forEach((transaction) => {
      // Get reward per trade USD
      transaction.reward_per_trade_usd = _getRewardRerTradeUsd(transaction, rateByCloseTimesData)

      // Get info cashback
      transaction.cashback_account = transaction.mt_account_no

      // Get site from master data
      transaction.siteObject = listSite.find((item) => item.id === transaction.site_id)

      // Get broker from master data
      transaction.brokerObject = listBroker.find((item) => item.id === transaction.broker_id)

      // Get ib rank
      transaction.ibRankObj = listIbRank.find((item) => item.id === transaction.ib_rank_id)

      // Get account type
      transaction.accountTypeObj = listAccountType.find((item) => item.id === transaction.account_type_id)

      // Get symbol from master data
      transaction.symbolObject = listSymbol.find((item) => {
        return item.symbol_name === transaction.symbol &&
          item.broker_id === transaction.broker_id &&
          item.platform === transaction.platform &&
          item.account_type_id === transaction.account_type_id
      })

      // Group close date (Format: closeTime-brokerId-siteId-productType)
      const closeTimeDateOnly = moment(transaction.close_time).format(dateFormat.DATE)
      const productTypeKey = transaction.symbolObject?.product_type_id === 1 ? 'FX' : 'CFD'
      closeDatesMap.set(`${closeTimeDateOnly}-${brokerId}-${transaction.site_id}-${productTypeKey}`, {
        close_date: closeTimeDateOnly,
        broker_id: brokerId,
        site_id: transaction.site_id,
        products_type_name: productTypeKey,
      })

      // Mapping setting rebate
      // Get rebates master
      const rebateDetail = listRebateDetail.find((item) => {
        return item.broker_id === transaction.broker_id &&
            item.account_type_id === transaction.account_type_id &&
            item.platform === transaction.platform &&
            item.symbol_name === transaction.symbol &&
            item.ts_start <= transaction.close_time &&
            item.ts_end >= transaction.close_time
      })

      transaction.rebate_detail_id = rebateDetail?.detail_id
      transaction.rebate_contract_size = rebateDetail?.contract_size
      transaction.rebate_digit_size = rebateDetail?.digit_size
      transaction.rebate_profit_currency = rebateDetail?.profit_currency
      transaction.rebate_lot_rebate = rebateDetail?.lot_rebate
      transaction.rebate_lot_rebate_currency = rebateDetail?.lot_rebate_currency

      const lotRebateCurrency = transaction.rebate_lot_rebate_currency
      const profitCurrency = transaction.rebate_profit_currency
      const rebateCurrency = transaction.reward_currency
      const closeTimeFormat = moment(transaction.close_time).format(dateFormat.DATE_TIME_GET_RATE)

      // Validate
      transaction.isCaculation = _validateRebateHistory(transaction)

      // Move to the next record when there is no rebate setting
      if (!transaction.isCaculation) {
        return
      }

      // For SP unit
      if (lotRebateCurrency === lotRebateCurrencyConstant.SPP) {
        bodyData.push({
          kind: transaction.accountTypeObj?.account_type_code,
          platform: transaction.platform.toUpperCase(),
          pair: transaction.symbolObject?.formal_symbol.replace('/', ''),
          ts: closeTimeFormat,
        })

        if (rebateCurrency !== profitCurrency) {
          bodyData.push(
            ..._getRateBody(profitCurrency, rebateCurrency, transaction.accountTypeObj?.account_type_code, transaction.platform, closeTimeFormat),
          )
        }
        // For 3 currencies USD, JPY, EUR
      } else if (listBaseCurrency.includes(lotRebateCurrency)) {
        if (rebateCurrency !== lotRebateCurrency) {
          // Convert from lotRebateCurrency to rebateCurrency
          bodyData.push(
            ..._getRateBody(lotRebateCurrency, rebateCurrency, transaction.accountTypeObj?.account_type_code, transaction.platform, closeTimeFormat),
          )
        }
        // For Pips unit or Points unit
      } else if (lotRebateCurrency === lotRebateCurrencyConstant.PIPS || lotRebateCurrency === lotRebateCurrencyConstant.POINTS) {
        if (rebateCurrency !== profitCurrency) {
          bodyData.push(
            ..._getRateBody(profitCurrency, rebateCurrency, transaction.accountTypeObj?.account_type_code, transaction.platform, closeTimeFormat),
          )
        }
      }
    })
    console.log('====== END Create body data: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))

    // Call api get rate
    const uniqueBodyData = _filterUniqueObjects(bodyData)
    console.log('Request body length: ', uniqueBodyData.length)
    console.log('Request body: ', JSON.stringify(uniqueBodyData))
    console.log('====== START Get rate: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
    const listRate = uniqueBodyData.length === 0 ? [] : await axios({
      method: 'POST',
      url: process.env.URL_API_SYNC_RATE_REBATE + `/rates/getMultipleBrokerRate?broker=${broker.broker_code}`,
      data: uniqueBodyData,
    })
    console.log('====== END Get rate: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
    console.log('Response body length: ', listRate.length)
    console.log('Response body: ', JSON.stringify(listRate))

    let numRecord = 0
    for (const transaction of listRebateHistory) {
      numRecord++
      if (numRecord % 200 === 0) {
        console.log('====== START Calculate and update rebate history: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
        console.log('====== Record: ', numRecord)
      }
      const isSuccess = await _calculateRebateHistory(transaction, listRate, event, isRecalculate)
      if (isSuccess) {
        resultCount++
      }

      if (numRecord % 200 === 0) {
        console.log('====== END Calculate and update rebate history: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
      }
    }

    // Puss message SQS
    console.log('Rebate history length: ', listRebateHistory.length)
    if (listRebateHistory.length) {
      console.log('Data send to SQS: ', JSON.stringify(Array.from(closeDatesMap.values())))
      await sendSqsMessageRebateStatistics(JSON.stringify(Array.from(closeDatesMap.values())), brokerId, `${brokerId}_${uuid.v4()}`, 0)
    }

    let resultDetailMessage = null
    let resultDetailId = null

    if (totalCount === 0) {
      resultDetailId = resultDetailIds[`E_10${batchType}004`]
      resultDetailMessage = resultDetailMessages[`E_10${batchType}004`]
    } else if (totalCount !== resultCount) {
      resultDetailId = resultDetailIds[`E_10${batchType}002`]
      resultDetailMessage = resultDetailMessages[`E_10${batchType}002`](totalCount - resultCount)
    }

    parentBatchLogId && await batchLogRepository.createNewBatchLogProcessResult(
      parentBatchLogId,
      batchType,
      resultTypes.SUCCESS,
      {
        total_count: totalCount,
        result_count: resultCount,
        process_start_time: processStartTime,
        process_end_time: moment.utc().format(dateFormat.DATE_TIME_ZONE),
        result_detail: {
          result_detail_message: resultDetailMessage,
        },
      },
      resultDetailId,
    )


    console.log(`Runtime ${Date.now() - timer}ms`)
    console.log('====== Job calculate rebate history done ======')
    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    const resultDetailId = error.isAxiosError ? resultDetailIds[`E_10${batchType}001`] : resultDetailIds[`E_10${batchType}003`]
    parentBatchLogId && await batchLogRepository.createNewBatchLogProcessResult(
      parentBatchLogId,
      batchType,
      resultTypes.ERROR,
      {
        total_count: totalCount,
        result_count: resultCount,
        process_start_time: processStartTime,
        process_end_time: moment.utc().format(dateFormat.DATE_TIME_ZONE),
        result_detail: {
          // eslint-disable-next-line new-cap
          result_detail_message: error.isAxiosError ?
            resultDetailMessages[`E_10${batchType}001`] :
            resultDetailMessages[`E_10${batchType}003`](error.sqlMessage || error.message),
        },
      },
      resultDetailId,
    )

    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  } finally {
    parentBatchLogId && await batchLogRepository.createNewBatchLogEnd(parentBatchLogId, batchType)
  }
}

const getBatchTypeByBrokerId = (_brokerId) => {
  switch (_brokerId) {
    case brokerID.XMG:
      return batchTypes.CALC_RBT_HIST_XMG
    case brokerID.XEM:
      return batchTypes.CALC_RBT_HIST_XEM
    case brokerID.TFX:
      return batchTypes.CALC_RBT_HIST_TFX
    case brokerID.MIL:
      return batchTypes.CALC_RBT_HIST_MIL
    case brokerID.EXN:
      return batchTypes.CALC_RBT_HIST_EXN
    case brokerID.BIG:
      return batchTypes.CALC_RBT_HIST_BIG
    default:
      return batchTypes.CALC_RBT_HIST_BIG
  }
}

const _calculateRebateHistory = async (transaction, listRate, event, isRecalculate) => {
  try {
    const lotRebate = transaction.rebate_lot_rebate
    const lotRebateCurrency = transaction.rebate_lot_rebate_currency
    const profitCurrency = transaction.rebate_profit_currency
    const contractSize = transaction.rebate_contract_size
    const digitSize = transaction.rebate_digit_size
    const rebateCurrency = transaction.reward_currency
    const volume = transaction.volume
    const closeTimeFormat = moment(transaction.close_time).format(dateFormat.DATE_TIME_GET_RATE)
    let calculatedLotRebates = null
    let calculatedLotRebatesCurrency = null

    const rebateSettingPayload = {
      rebate_detail_id: transaction.rebate_detail_id,
      rebate_contract_size: transaction.rebate_contract_size,
      rebate_digit_size: transaction.rebate_digit_size,
      rebate_profit_currency: transaction.rebate_profit_currency,
      rebate_lot_rebate: transaction.rebate_lot_rebate,
      rebate_lot_rebate_currency: transaction.rebate_lot_rebate_currency,
    }

    // Move to the next record when there is no rebate setting
    if (!transaction.isCaculation) {
      const payloadStatusHistory = {
        target_id: transaction.id,
        status_code: transaction.ibRebatesStatus.code,
        status_label_number: transaction.ibRebatesStatus.lable,
        status_class_id: statusClassConstant.REBATE_HISTORY_STATUS,
        ...(isRecalculate === true ? {
          action_method: actionMethod.OPERATOR_ACTION,
          updated_by_user_id: event?.staffId,
        } : {
          action_method: actionMethod.SYSTEM_ACTION,
          updated_by_user_id: null,
        }),
      }

      await rebateHistoryRepository.updateRebateHistoryForCalculation(transaction.id, {
        calculated_lot_rebates: calculatedLotRebates,
        calculated_lot_rebates_currency: calculatedLotRebatesCurrency,
        calculate_flag: calculatedFlagConstant.PROCESSED,
        ...(isRecalculate === true ? {} : {
          action_method: actionMethod.SYSTEM_ACTION,
          decision_date: moment().utc().format(dateFormat.DATE_TIME),
          updated_by_user_id: null,
        }),
        symbol_id: transaction.symbolObject?.id,
        formal_symbol: transaction.symbolObject?.formal_symbol,
        products_type_id: transaction.symbolObject?.product_type_id,
        ib_rebates_status_code: transaction.ibRebatesStatus.code,
        ib_rebates_status_label_number: transaction.ibRebatesStatus.lable,
        reward_per_trade_usd: transaction.reward_per_trade_usd,
        ...rebateSettingPayload,
      }, payloadStatusHistory)
      return true
    }

    const rateData = {
      convertSP: null,
      convertToUSD: {
        rateAsk: null,
        rateBid: null,
      },
      convertFromUSD: {
        rateAsk: null,
        rateBid: null,
      },
    }

    // For SP unit
    if (lotRebateCurrency === lotRebateCurrencyConstant.SPP) {
      _findFullRate(
        profitCurrency,
        rebateCurrency,
        transaction.accountTypeObj?.account_type_code,
        transaction.platform.toUpperCase(),
        closeTimeFormat,
        listRate,
        rateData,
        transaction.symbolObject?.formal_symbol.replace('/', ''),
      )

      // Check rate data
      if (!rateData.convertSP) {
        transaction.ibRebatesStatus = {
          code: statusCode.REQUIRED,
          lable: statusLableConstant.REQUIRED.NO_RATE,
        }
      }

      if (rebateCurrency !== profitCurrency) {
        // Contract size * Digits * 10 * SP (pips) * Volume * SP (%), then convert from profitCurrency to rebateCurrency
        calculatedLotRebates = rateData.convertSP ?
          (contractSize * digitSize * 10 * rateData.convertSP.spread) * volume * (lotRebate / 100) : null

        calculatedLotRebates = calculatedLotRebates !== null ?
          _convertAmount(calculatedLotRebates, profitCurrency, rebateCurrency, rateData, transaction) : null
      } else {
        // Contract size * Digits * 10 * SP (pips) * Volume * SP (%)
        calculatedLotRebates = rateData.convertSP ?
          (contractSize * digitSize * 10 * rateData.convertSP.spread) * volume * (lotRebate / 100) : null
      }
      // For 3 currencies USD, JPY, EUR
    } else if (listBaseCurrency.includes(lotRebateCurrency)) {
      if (rebateCurrency !== lotRebateCurrency) {
        _findFullRate(
          lotRebateCurrency,
          rebateCurrency,
          transaction.accountTypeObj?.account_type_code,
          transaction.platform.toUpperCase(),
          closeTimeFormat,
          listRate,
          rateData,
        )

        // Lot rebate * Volume, then convert from lotRebateCurrency to rebateCurrency
        calculatedLotRebates = _convertAmount(lotRebate * volume, lotRebateCurrency, rebateCurrency, rateData, transaction)
      } else {
        // Lot rebate * Volume
        calculatedLotRebates = lotRebate * volume
      }
      // For Pips unit
    } else if (lotRebateCurrency === lotRebateCurrencyConstant.PIPS) {
      if (rebateCurrency !== profitCurrency) {
        _findFullRate(
          profitCurrency,
          rebateCurrency,
          transaction.accountTypeObj?.account_type_code,
          transaction.platform.toUpperCase(),
          closeTimeFormat,
          listRate,
          rateData,
        )

        // (Contract size * Digits * 10 * Lot rebate) * Volume, then convert from profitCurrency to rebateCurrency
        calculatedLotRebates = _convertAmount(
          (contractSize * digitSize * 10 * lotRebate) * volume,
          profitCurrency,
          rebateCurrency,
          rateData,
          transaction,
        )
      } else {
        // (Contract size * Digits * 10 * Lot rebate) * Volume
        calculatedLotRebates = (contractSize * digitSize * 10 * lotRebate) * volume
      }
      // For Points unit
    } else if (lotRebateCurrency === lotRebateCurrencyConstant.POINTS) {
      if (rebateCurrency !== profitCurrency) {
        _findFullRate(
          profitCurrency,
          rebateCurrency,
          transaction.accountTypeObj?.account_type_code,
          transaction.platform.toUpperCase(),
          closeTimeFormat,
          listRate,
          rateData,
        )

        // (Contract size * Digits * Lot rebate) * Volume, then convert from profitCurrency to rebateCurrency
        calculatedLotRebates = _convertAmount((contractSize * digitSize * lotRebate) * volume, profitCurrency, rebateCurrency, rateData, transaction)
      } else {
        // (Contract size * Digits * Lot rebate) * Volume
        calculatedLotRebates = (contractSize * digitSize * lotRebate) * volume
      }
    }

    // Check lot rebates
    if (
      transaction.isCaculation &&
      transaction.ibRebatesStatus.lable !== statusLableConstant.REQUIRED.NO_RATE &&
      _roundingRebateAmount(Number(calculatedLotRebates), rebateCurrency) !== _roundingRebateAmount(transaction.reward_per_trade, rebateCurrency)
    ) {
      transaction.ibRebatesStatus = {
        code: statusCode.REQUIRED,
        lable: statusLableConstant.REQUIRED.REBATES_DIFFERENCE,
      }
    }

    if (calculatedLotRebates !== null) {
      calculatedLotRebatesCurrency = rebateCurrency
    }

    const payloadStatusHistory = {
      target_id: transaction.id,
      status_code: transaction.ibRebatesStatus.code,
      status_label_number: transaction.ibRebatesStatus.lable,
      status_class_id: statusClassConstant.REBATE_HISTORY_STATUS,
      ...(isRecalculate === true ? {
        action_method: actionMethod.OPERATOR_ACTION,
        updated_by_user_id: event?.staffId,
      } : {
        action_method: actionMethod.SYSTEM_ACTION,
        updated_by_user_id: null,
      }),
    }

    await rebateHistoryRepository.updateRebateHistoryForCalculation(transaction.id, {
      calculated_lot_rebates: calculatedLotRebates,
      calculated_lot_rebates_currency: calculatedLotRebatesCurrency,
      calculate_flag: calculatedFlagConstant.PROCESSED,
      rate_data: JSON.stringify(rateData),
      ...(isRecalculate === true ? {} : {
        action_method: actionMethod.SYSTEM_ACTION,
        decision_date: moment().utc().format(dateFormat.DATE_TIME),
        updated_by_user_id: null,
      }),
      symbol_id: transaction.symbolObject?.id,
      formal_symbol: transaction.symbolObject?.formal_symbol,
      products_type_id: transaction.symbolObject?.product_type_id,
      ib_rebates_status_code: transaction.ibRebatesStatus.code,
      ib_rebates_status_label_number: transaction.ibRebatesStatus.lable,
      reward_per_trade_usd: transaction.reward_per_trade_usd,
      ...rebateSettingPayload,
    }, payloadStatusHistory)

    return true
  } catch (error) {
    console.error('Rebate history error: ', transaction.id)
    console.error(error)
    await errorLogRepository.createSystemLog(event, code.ERROR, message.server_error, error)
    return
  }
}

const _validateRebateHistory = (transaction) => {
  const {
    reward_currency, cashback_account, brokerObject, platform, ibRankObj, symbolObject,
    close_time, close_time_broker, siteObject, accountTypeObj, volume, reward_per_trade, rebate_detail_id,
  } = transaction

  let ibRebatesStatus
  let isCaculation = true

  switch (true) {
    case !brokerObject || !platform:
      ibRebatesStatus = {
        code: statusCode.REQUIRED,
        lable: statusLableConstant.REQUIRED.MISSING_DATA,
      }
      isCaculation = false
      break
    case !accountTypeObj:
      ibRebatesStatus = {
        code: statusCode.REQUIRED,
        lable: statusLableConstant.REQUIRED.NO_AC_TYPE,
      }
      isCaculation = false
      break
    case !symbolObject:
      ibRebatesStatus = {
        code: statusCode.REQUIRED,
        lable: statusLableConstant.REQUIRED.NO_SYMBOL_MASTER,
      }
      isCaculation = false
      break
    case !rebate_detail_id:
      ibRebatesStatus = {
        code: statusCode.REQUIRED,
        lable: statusLableConstant.REQUIRED.NO_REBATE_MASTER,
      }
      isCaculation = false
      break
    case reward_currency === null || volume === null || close_time === null:
      ibRebatesStatus = {
        code: statusCode.REQUIRED,
        lable: statusLableConstant.REQUIRED.MISSING_DATA,
      }
      isCaculation = false
      break
    case reward_per_trade === null || !siteObject || !ibRankObj || close_time_broker === null || cashback_account === null:
      ibRebatesStatus = {
        code: statusCode.REQUIRED,
        lable: statusLableConstant.REQUIRED.MISSING_DATA,
      }
      break
    default:
      ibRebatesStatus = {
        code: statusCode.APPROVED,
        lable: statusLableConstant.LABLE_OF_STATUS_MASTER,
      }
      break
  }

  transaction.ibRebatesStatus = ibRebatesStatus
  return isCaculation
}

const _getRateBody = (baseCurrency, symbolCurrency, accountTypeCode, platformKey, closeTimeFormat) => {
  const listBodyRequest = []

  if (baseCurrency !== lotRebateCurrencyConstant.USD) {
    listBodyRequest.push({
      kind: accountTypeCode,
      platform: platformKey.toUpperCase(),
      pair: `USD${baseCurrency}`,
      ts: closeTimeFormat,
    }, {
      kind: accountTypeCode,
      platform: platformKey.toUpperCase(),
      pair: `${baseCurrency}USD`,
      ts: closeTimeFormat,
    })
  }

  if (symbolCurrency !== lotRebateCurrencyConstant.USD) {
    listBodyRequest.push({
      kind: accountTypeCode,
      platform: platformKey.toUpperCase(),
      pair: `USD${symbolCurrency}`,
      ts: closeTimeFormat,
    }, {
      kind: accountTypeCode,
      platform: platformKey.toUpperCase(),
      pair: `${symbolCurrency}USD`,
      ts: closeTimeFormat,
    })
  }

  return listBodyRequest
}

const _findFullRate = (baseCurrency, symbolCurrency, accountTypeCode, platform, tsClose, listRate, rateData, pair = null) => {
  listRate.forEach((item) => {
    if (item.kind === accountTypeCode && item.platform === platform && item.ts_original === tsClose) {
      // Get rate SP%
      if (pair && pair === item.pair) {
        rateData.convertSP = item
      }

      if (baseCurrency === symbolCurrency) {
        return
      }

      // convert baseCurrency to USD
      if (item.pair === `USD${baseCurrency}`) {
        rateData.convertToUSD.rateAsk = item
      } else if (item.pair === `${baseCurrency}USD`) {
        rateData.convertToUSD.rateBid = item
      }

      // convert USD to symbolCurrency
      if (item.pair === `USD${symbolCurrency}`) {
        rateData.convertFromUSD.rateAsk = item
      } else if (item.pair === `${symbolCurrency}USD`) {
        rateData.convertFromUSD.rateBid = item
      }
    }
  })
}

const _convertAmount = (amount, baseCurrency, symbolCurrency, rateData, transaction) => {
  let newAmount = null

  // convert baseCurrency to USD
  if (baseCurrency === lotRebateCurrencyConstant.USD) {
    newAmount = amount
  } else {
    if (!_.isEmpty(rateData.convertToUSD.rateAsk)) {
      newAmount = amount / rateData.convertToUSD.rateAsk.ask
    } else if (!_.isEmpty(rateData.convertToUSD.rateBid)) {
      newAmount = amount * rateData.convertToUSD.rateBid.last_price
    } else {
      // Update ib status
      transaction.ibRebatesStatus = {
        code: statusCode.REQUIRED,
        lable: statusLableConstant.REQUIRED.NO_RATE,
      }
      return null
    }
  }

  // convert USD to symbolCurrency
  if (symbolCurrency === lotRebateCurrencyConstant.USD) {
    newAmount = newAmount
  } else {
    if (!_.isEmpty(rateData.convertFromUSD.rateAsk)) {
      newAmount = newAmount * rateData.convertFromUSD.rateAsk.ask
    } else if (!_.isEmpty(rateData.convertFromUSD.rateBid)) {
      newAmount = newAmount / rateData.convertFromUSD.rateBid.last_price
    } else {
      // Update ib status
      transaction.ibRebatesStatus = {
        code: statusCode.REQUIRED,
        lable: statusLableConstant.REQUIRED.NO_RATE,
      }
      return null
    }
  }

  return newAmount
}

function _filterUniqueObjects(arr) {
  const uniqueObjectsSet = new Set(arr.map(JSON.stringify))

  const uniqueObjectsArray = Array.from(uniqueObjectsSet, JSON.parse)

  return uniqueObjectsArray
}

const recalculateRebateHistory = async (event) => {
  try {
    const { rebateHistoryIds } = JSON.parse(event.body) || {}
    const staffId = utility.getUserIdByToken(event)

    const listRebateHistory = await rebateHistoryRepository.getRebateHistoryForRecalculate(rebateHistoryIds)
    await rebateHistoryRepository.updateRecalculateRebate(rebateHistoryIds, staffId)

    const groupRebateByBroker = _.groupBy(listRebateHistory, 'broker_id')

    await Promise.all(Object.keys(groupRebateByBroker).map((brokerId) => {
      return scheduleCalculateRebateHistory({ brokerId: Number(brokerId), staffId }, groupRebateByBroker[brokerId], true)
    }))

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    await errorLogRepository.createSystemLog(event, code.ERROR, message.server_error, error)
    return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
  }
}

const _roundingRebateAmount = (amount, currency) => {
  switch (currency) {
    case baseCurrency.JPY:
      return utility.roundNumber(amount, 0)
    default:
      return utility.roundNumber(amount, 2)
  }
}

module.exports = {
  getListRebateHistory,
  scheduleRebateHistory,
  getDropdownRebateHistory,
  scheduleCalculateRebateHistory,
  recalculateRebateHistory,
}
