const utility = require('utility')
const moment = require('moment/moment')
const {
  errorLogRepository,
  sequenceRepository,
  batchLogRepository,
} = require('repository')
const {
  code,
  message,
  resCheck,
  dateFormat,
  batchTypes,
  resultTypes,
  resultDetailMessages,
  resultDetailIds,
} = require('constant')
const {
  rebateHistoryRepository,
  rebateStatisticsRepository,
} = require('repository')
const aws = require('helper').aws


const scheduleRebateStatistics = async (event) => {
  let parentBatchLogId
  const processStartTime = moment.utc().format(dateFormat.DATE_TIME_ZONE)
  let totalCount = 0

  try {
    event.body = { ...event }
    event.path = '/schedule-rebate-statistics'

    parentBatchLogId = await sequenceRepository.updateAndGetBatchId()

    parentBatchLogId && await batchLogRepository.createNewBatchLogBegin(parentBatchLogId, batchTypes.INSERT_REBATE_STATISTICS)

    const sqsMessage = utility.generateSqsMessage(parentBatchLogId, resultDetailIds.E_1022002)

    parentBatchLogId && await aws.sendSqsMessage(sqsMessage)

    const timer = Date.now()
    console.log('====== Job rebate statistics start ======')

    // GET date ranges
    let closeDates
    if (event.Records?.[0]?.body) {
      closeDates = JSON.parse(event.Records[0].body)
      console.log('Close date data: ', closeDates)
    } else {
      closeDates = await rebateHistoryRepository.getCloseDates()
    }

    totalCount = closeDates.length
    for (let i = 0; i < closeDates.length; i++) {
      const closeDatesBatch = closeDates.slice(i, i + 1)

      // GET rebate histories by date ranges and concat close_date-broker_id-site_id-products_type_name
      const rebateHistories = await rebateHistoryRepository.getRebateHistoryForStatistics(closeDatesBatch)

      const rebateHistoriesData = rebateHistories[0]
      const rebateHistoryUpdatedConditions = []

      // Round 2 numbers after decimal: trading_volume and e_rebate_usd
      rebateHistoriesData.forEach((rebate) => {
        rebate.trading_volume = utility.roundNumber(rebate.trading_volume, 2)
        rebate.e_rebate_usd = utility.roundNumber(rebate.e_rebate_usd, 2)

        rebateHistoryUpdatedConditions.push({
          close_date: rebate.close_date,
          broker_id: rebate.broker_id,
          site_id: rebate.site_id,
          products_type_name: rebate.products_type_name,
          max_ts_update: rebate.max_ts_update,
        })
        delete rebate.max_ts_update
      })

      const concatRebateHistories = rebateHistoriesData.map((rebate) => {
        return `${rebate.close_date}-${rebate.broker_id}-${rebate.site_id}-${rebate.products_type_name}`
      })

      // DELETE from rebate_statistic by rebate history
      await rebateStatisticsRepository.deleteAndInsertRebateStatistics(concatRebateHistories, rebateHistoriesData)

      // UPDATE summary flag
      await rebateHistoryRepository.updateSummaryFlag(rebateHistoryUpdatedConditions)
    }

    parentBatchLogId && await batchLogRepository.createNewBatchLogProcessResult(
      parentBatchLogId,
      batchTypes.INSERT_REBATE_STATISTICS,
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
    console.log('====== Job rebate statistics done ======')

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)

    parentBatchLogId && await batchLogRepository.createNewBatchLogProcessResult(
      parentBatchLogId,
      batchTypes.INSERT_REBATE_STATISTICS,
      resultTypes.ERROR,
      {
        total_count: totalCount,
        result_count: 0,
        process_start_time: processStartTime,
        process_end_time: moment.utc().format(dateFormat.DATE_TIME_ZONE),
        result_detail: {
          // eslint-disable-next-line new-cap
          result_detail_message: resultDetailMessages.E_1022001(error.sqlMessage || error.message),
        },
      },
      resultDetailIds.E_1022001,
    )

    await errorLogRepository.createSystemLog(event, code.ERROR, message.server_error, error)
    return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
  } finally {
    parentBatchLogId && await batchLogRepository.createNewBatchLogEnd(parentBatchLogId, batchTypes.INSERT_REBATE_STATISTICS)
  }
}

module.exports = {
  scheduleRebateStatistics,
}
