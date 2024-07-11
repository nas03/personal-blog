const utility = require('utility')

// Constant
const {
  resCheck, code, message, uncheckALL, csvFileName, flag,
  actionMethod,
  statusCode,
  summaryFlag,
  dateFormat,
  batchTypes,
  resultTypes,
  resultDetailIds,
  resultDetailMessages,
} = require('constant')

// Repository
const {
  errorLogRepository, usersBasicDataRepository, inducedTradersRepository,
  crawlTradersRepository,
  sequenceRepository,
  accountTypeRepository,
  batchLogRepository, countryRepository,
} = require('repository')

// Library
const moment = require('moment')
const { json2csvAsync } = require('json-2-csv')
const uuid = require('uuid')
const { groupBy } = require('lodash')
const { aws } = require('helper')

// Helper
const { uploadCSVRebateHistory } = require('helper').upload

const getListInducedTraders = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}
    const pagination = utility.getPagination(queryString)

    // Declare fields to check case uncheck all
    const { site_ids, broker_ids, it_status_code, ac_currency, new_client_flag, platform, account_type_id } = queryString
    // Check case uncheck all
    const isUnCheckALL = [Number(site_ids), Number(broker_ids), Number(it_status_code),
      Number(ac_currency), Number(new_client_flag), Number(platform), Number(account_type_id)].includes(uncheckALL) ?
      true : false

    // Get staff display date time and timezone
    const staffId = await utility.getUserIdByToken(event)
    const staffInfo = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': staffId })
    queryString.utc = staffInfo.timezone || null
    queryString.display_date_time = staffInfo.display_date_time

    // Get valid site by admin_with_site_id
    queryString.site_ids = utility.getValidSiteByAdmin(staffInfo.admin_with_site_id, site_ids)

    if (queryString.is_export_csv === 'true') {
      const fileName = `files/csv/${uuid.v4()}/${csvFileName.INDUCED_TRADERS}${moment().utc().format('YYYYMMDDHHmmss')}.csv`

      let csvData
      const listInducedTradersCSV = !isUnCheckALL ? await inducedTradersRepository.getListInducedTraders(queryString, pagination, true) : []

      if (!listInducedTradersCSV.length) {
        // eslint-disable-next-line max-len
        csvData = 'Site,Imported Date,Traders ID,IT status,Label,AC.Opening Date(Broker server time),AC.Opening Date(User time),AC.Closing Date(Broker server time),AC.Closing Date(User time),Broker,AC.Opening Type,AC.Currency,Platform,AC type,Area,MT Account No.,Name,Client ID,CAC.Status,Decision date,Manual or AUTO,Staff'

        const result = await uploadCSVRebateHistory(csvData, fileName)
        return utility.createResponse(true, result)
      }

      // GENERATE NEW DATETIME FORMAT FROM DISPLAY AND TIMEZONE
      const _renderDateTime = (data_time, hasConvertTz = true) => {
        return data_time ?
          utility.getDateTimeFormatted(data_time, staffInfo.display_date_time, hasConvertTz ? queryString.utc : null) :
          null
      }

      listInducedTradersCSV.forEach((el) => {
        if (el.new_client_flag === flag.FALSE) {
          el.new_client_flag = 'Add'
        } else if (el.new_client_flag === flag.TRUE) {
          el.new_client_flag = 'NEW'
        }

        if (el.action_method === actionMethod.USER_ACTION) {
          el.action_method = 'User action'
        } else if (el.action_method === actionMethod.SYSTEM_ACTION) {
          el.action_method = 'System action'
        } else if (el.action_method === actionMethod.OPERATOR_ACTION) {
          el.action_method = el.staff_name
        }

        if (el.ac_status === flag.FALSE) {
          el.ac_status = '認証未完了'
        } else if (el.ac_status === flag.TRUE) {
          el.ac_status = '認証完了'
        }

        el.platform = el.platform?.toUpperCase()

        el.ts_regist = _renderDateTime(el.ts_regist)
        el.signup_date_gmt = _renderDateTime(el.signup_date_gmt)
        el.signup_date_broker = _renderDateTime(el.signup_date_broker, false)
        el.account_closed_date_gmt = _renderDateTime(el.account_closed_date_gmt)
        el.account_closed_date_broker = _renderDateTime(el.account_closed_date_broker, false)
        el.decision_date = _renderDateTime(el.decision_date)
      })

      // Handling csv parsing and uploading to S3
      const headers = [
        { field: 'site_name', title: 'Site' },
        { field: 'ts_regist', title: 'Imported Date' },
        { field: 'trader_id', title: 'Traders ID' },
        { field: `status_name_${staffInfo.language_portal || 'ja'}`, title: 'IT Status' },
        { field: `status_label_name_${staffInfo.language_portal || 'ja'}`, title: 'Label' },
        { field: 'signup_date_broker', title: 'AC.Opening Date (Broker server time)' },
        { field: 'signup_date_gmt', title: 'AC.Opening Date (User time)' },
        { field: 'account_closed_date_broker', title: 'AC.Close Date (Broker server time)' },
        { field: 'account_closed_date_gmt', title: 'AC.Close Date (User time)' },
        { field: 'broker_name', title: 'Broker' },
        { field: 'new_client_flag', title: 'AC.Opening Type' },
        { field: 'ac_currency', title: 'AC.Currency' },
        { field: 'platform', title: 'Platform' },
        { field: 'account_type_name', title: 'AC type' },
        { field: 'area', title: 'Area' },
        { field: 'mt_account_no', title: 'MT Account No.' },
        { field: 'mt_account_name', title: 'Name' },
        { field: 'client_id', title: 'Client ID' },
        { field: 'ac_status', title: 'CAC.Status' },
        { field: 'decision_date', title: 'Decision date' },
        { field: 'action_method', title: 'Action method or Staff' },
      ]

      csvData = await json2csvAsync(listInducedTradersCSV, { keys: headers, emptyFieldValue: '-', excelBOM: true })

      const result = await uploadCSVRebateHistory(csvData, fileName)
      return utility.createResponse(true, result)
    }

    // Check case uncheck all
    if (isUnCheckALL) {
      const res = utility.paginatedItems([], pagination.currentPage, pagination.perPage)
      return utility.createResponse(true, res)
    }

    const listInducedTraders = await inducedTradersRepository.getListInducedTraders(queryString, pagination)

    return utility.createResponse(true, listInducedTraders)
  } catch (err) {
    console.log(err)
    await errorLogRepository.createSystemLog(event, code.ERROR, message.server_error, err)
    return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
  }
}

const scheduleInducedTraders = async (event, reImportIds, isReImport, staffId) => {
  let parentBatchLogId
  const processStartTime = moment.utc().format(dateFormat.DATE_TIME_ZONE)
  let totalCount = 0

  try {
    parentBatchLogId = await sequenceRepository.updateAndGetBatchId()

    parentBatchLogId && await batchLogRepository.createNewBatchLogBegin(parentBatchLogId, batchTypes.INDUCED_TRADERS)

    // send message to AWS SQS
    const sqsMessage = utility.generateSqsMessage(parentBatchLogId, resultDetailIds.E_1026002)

    if (parentBatchLogId) {
      // timeout of function: 60s
      await aws.sendSqsMessage(sqsMessage, 60)
    }

    const timer = Date.now()
    console.log('====== Job Induced traders regist data start ======', event)
    // Get data crawl (limit 10000 record)
    console.log('====== START Get data crawl_traders: ', moment.utc().format(dateFormat.DATE_TIME_ZONE_1))
    const crawlTraders = await crawlTradersRepository.getCrawlTraderForImport(isReImport === true ? reImportIds : false)
    console.log('====== Data crawl_traders: ', crawlTraders.length)
    console.log('====== END Get data crawl_traders: ', moment.utc().format(dateFormat.DATE_TIME_ZONE_1))
    totalCount = crawlTraders.length
    if (totalCount) {
      console.log('====== START format data before insert/update: ', moment.utc().format(dateFormat.DATE_TIME_ZONE_1))

      const [listCountry, listAccountType, crawlTraderIdsExists] = await Promise.all([
        countryRepository.getAll(),
        accountTypeRepository.getAll(),
        inducedTradersRepository.getCrawlTraderIds(),
      ])

      const countriesGroupBy = groupBy(listCountry, 'displayName')
      const accountTypeGroupBy = groupBy(listAccountType, (item) => `${item.broker_id}-${item.account_type_name}`)

      const crawlTraderIds = []
      const payload = []
      const payloadUpdate = []

      for (const obj of crawlTraders) {
        const country_id = countriesGroupBy[obj.area?.toUpperCase()] ?
          countriesGroupBy[obj.area?.toUpperCase()][0].code :
          null

        const account_type_id = accountTypeGroupBy[`${obj.broker_id}-${obj.ac_type.trim()}`] ?
          accountTypeGroupBy[`${obj.broker_id}-${obj.ac_type.trim()}`][0].id :
          null

        const commonPayload = {
          crawl_trader_id: obj.id,
          account_closed_date_broker: obj.account_closed_date_broker,
          account_closed_date_gmt: obj.account_closed_date_gmt,
          account_closed_flag: obj.account_closed_flag,
          ac_status: obj.ac_status,
          summary_flag: summaryFlag.NOT_COUNTED,
        }

        if (isReImport === true) {
          payloadUpdate.push({
            broker_id: obj.broker_id,
            site_id: obj.site_id,
            client_id: obj.client_id,
            mt_account_no: obj.mt_account_no,
            mt_account_name: obj.account_name,
            area: obj.area,
            country_id,
            signup_date_broker: obj.signup_date_broker,
            signup_date_gmt: obj.signup_date_gmt,
            new_client_flag: obj.new_client_flag,
            registration_site: obj.registration_site,
            ac_type: obj.ac_type,
            account_type_id,
            platform: `mt${obj.platform}`,
            ac_currency: obj.ac_currency,
            it_status_code: statusCode.APPROVED,
            it_status_label_number: 0,
            action_method: actionMethod.OPERATOR_ACTION,
            updated_by_user_id: staffId,
            decision_date: moment().utc().format(dateFormat.DATE_TIME),
            ...commonPayload,
          })
        } else {
          if (crawlTraderIdsExists.includes(obj.id)) {
            payloadUpdate.push(commonPayload)
          } else {
            payload.push({
              id: `${moment().utc().format(dateFormat.DATE_5)}-${obj.id}`,
              broker_id: obj.broker_id,
              site_id: obj.site_id,
              client_id: obj.client_id,
              mt_account_no: obj.mt_account_no,
              mt_account_name: obj.account_name,
              area: obj.area,
              country_id,
              signup_date_broker: obj.signup_date_broker,
              signup_date_gmt: obj.signup_date_gmt,
              new_client_flag: obj.new_client_flag,
              registration_site: obj.registration_site,
              ac_type: obj.ac_type,
              account_type_id,
              platform: `mt${obj.platform}`,
              ac_currency: obj.ac_currency,
              it_status_code: statusCode.APPROVED,
              it_status_label_number: 0,
              action_method: actionMethod.SYSTEM_ACTION,
              decision_date: moment().utc().format(dateFormat.DATE_TIME),
              ...commonPayload,
            })
          }
        }

        crawlTraderIds.push(obj.id)
      }

      console.log('====== END format data before insert/update: ', moment.utc().format(dateFormat.DATE_TIME_ZONE_1))

      if (payload.length || payloadUpdate.length) {
        // Insert data
        await inducedTradersRepository.saveInducedTraders(crawlTraderIds, payload, payloadUpdate)
      }
    }

    parentBatchLogId && await batchLogRepository.createNewBatchLogProcessResult(
      parentBatchLogId,
      batchTypes.INDUCED_TRADERS,
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
    console.log('====== Job Induced traders regist data done ======')
    return utility.createResponse(true)
  } catch (error) {
    console.log(error)

    parentBatchLogId && await batchLogRepository.createNewBatchLogProcessResult(
      parentBatchLogId,
      batchTypes.INDUCED_TRADERS,
      resultTypes.ERROR,
      {
        total_count: totalCount,
        result_count: 0,
        process_start_time: processStartTime,
        process_end_time: moment.utc().format(dateFormat.DATE_TIME_ZONE),
        result_detail: {
          // eslint-disable-next-line new-cap
          result_detail_message: resultDetailMessages.E_1026001(error.sqlMessage || error.message),
        },
      },
      resultDetailIds.E_1026001,
    )

    await errorLogRepository.createSystemLog(event, code.ERROR, message.server_error, error)
    return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
  } finally {
    parentBatchLogId && await batchLogRepository.createNewBatchLogEnd(parentBatchLogId, batchTypes.INDUCED_TRADERS)
  }
}

const reImportInducedTraders = async (event) => {
  try {
    const { crawlTraderIds } = JSON.parse(event.body) || {}
    const staffId = utility.getUserIdByToken(event)

    if (crawlTraderIds) {
      return scheduleInducedTraders(event, crawlTraderIds, true, staffId)
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    await errorLogRepository.createSystemLog(event, code.ERROR, message.server_error, error)
    return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
  }
}

module.exports = {
  getListInducedTraders,
  scheduleInducedTraders,
  reImportInducedTraders,
}
