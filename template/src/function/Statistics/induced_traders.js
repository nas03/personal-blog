const utility = require('utility')
const {
  inducedTradersRepository,
  inducedTradersStatisticsRepository,
  sequenceRepository,
  batchLogRepository,
  errorLogRepository,
} = require('repository')
const moment = require('moment')
const {
  code,
  message,
  dateFormat,
  resCheck,
  batchTypes,
  resultTypes,
  resultDetailIds,
  resultDetailMessages,
} = require('constant')
const { aws } = require('helper')

const DEFAULT_TOTAL_COUNT = 0

async function importInducedTradersStatistics(event) {
  let parentBatchLogId
  const processStartTime = moment.utc().format(dateFormat.DATE_TIME_ZONE)
  let totalCount = 0

  try {
    parentBatchLogId = await sequenceRepository.updateAndGetBatchId()
    parentBatchLogId && await batchLogRepository.createNewBatchLogBegin(parentBatchLogId, batchTypes.INDUCED_TRADERS_STATISTICS)

    // send message to AWS SQS
    const sqsMessage = utility.generateSqsMessage(parentBatchLogId, resultDetailIds.E_1027002)

    if (parentBatchLogId) {
      // timeout of function: 900s
      await aws.sendSqsMessage(sqsMessage, 900)
    }

    const timer = Date.now()
    console.log('====== Job Induced traders statistics start ======', event)

    console.log('====== START Get signup date in induced_traders: ', moment.utc().format(dateFormat.DATE_TIME_ZONE_1))
    // GET date ranges
    const signUpDates = await inducedTradersRepository.getSignUpDates()
    console.log('====== END Get signup date in induced_traders: ', moment.utc().format(dateFormat.DATE_TIME_ZONE_1))

    for (let i = 0; i < signUpDates.length; i++) {
      const signUpDatesBatch = signUpDates.slice(i, i + 1)

      // GET induced traders by date ranges and concat signup_date_gmt-broker_id-site_id-registration_site
      const inducedTraders = await inducedTradersRepository.getInducedTradersForStatistics(signUpDatesBatch)

      const inducedTradersData = inducedTraders[0]
      totalCount += inducedTradersData.length

      // Prepare delete conditions
      const insertData = inducedTradersData.map((item) => {
        return {
          signup_date_gmt: item.signup_date,
          broker_id: item.broker_id,
          site_id: item.site_id,
          new_account_number: item.new_account_number,
          active_account_number: item.active_account_number,
          add_account_number: item.add_account_number,
          registration_site: item.registration_site,
        }
      })
      const concatInducedTraders = insertData.map((item) => {
        return `${item.signup_date_gmt}-${item.broker_id}-${item.site_id}-${item.registration_site}`
      })

      // DELETE and INSERT into induced_traders_statistics
      await inducedTradersStatisticsRepository.deleteAndInsertInducedTradersStatistics(concatInducedTraders, insertData)

      // UPDATE summary flag
      await inducedTradersRepository.updateSummaryFlag(signUpDatesBatch)
    }

    parentBatchLogId && await batchLogRepository.createNewBatchLogProcessResult(
      parentBatchLogId,
      batchTypes.INDUCED_TRADERS_STATISTICS,
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
    console.log('====== Job Induced traders statistics done ======')

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    // Save batch_log process
    parentBatchLogId && await batchLogRepository.createNewBatchLogProcessResult(
      parentBatchLogId,
      batchTypes.INDUCED_TRADERS_STATISTICS,
      resultTypes.ERROR,
      {
        total_count: totalCount,
        result_count: DEFAULT_TOTAL_COUNT,
        process_start_time: processStartTime,
        process_end_time: moment().utc().format(dateFormat.DATE_TIME_ZONE),
        result_detail: {
          // eslint-disable-next-line new-cap
          result_detail_message: resultDetailMessages.E_1027001(error.sqlMessage || error.message),
        },
      },
      resultDetailIds.E_1027001,
    )

    await errorLogRepository.createSystemLog(event, code.ERROR, message.server_error, error)
    return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
  } finally {
    parentBatchLogId && await batchLogRepository.createNewBatchLogEnd(parentBatchLogId, batchTypes.INDUCED_TRADERS_STATISTICS)
  }
}

module.exports = {
  importInducedTradersStatistics,
}
