/* Lib */
const moment = require('moment')

/* constant */
const utility = require('utility')
const { resultTypes, dateFormat, errorMessageCodeConstant } = require('constant')

/* DB */
const { batchLogRepository, errorLogRepository } = require('repository')

const SUCCESS_BATCH_LOG_LENGTH = 3
const LACK_OF_BATCH_LOG_RECORD = 1

const handleBatchLogTimeOut = async (event) => {
  try {
    event.body = { ...event }
    event.path = '/handle-batchlog-timeout'
    const messageBody = JSON.parse(event.Records[0].body)

    const {
      parent_batch_log_id: parentBatchLogId,
      result_detail: resultDetail,
      result_detail_id: resultDetailId,
    } = messageBody

    const batchLogs = await batchLogRepository.getBatchLogsByParentId(parentBatchLogId)

    if (batchLogs.length === SUCCESS_BATCH_LOG_LENGTH) return

    if (batchLogs.length === LACK_OF_BATCH_LOG_RECORD) {
      resultDetail.process_end_time = moment().utc().format(dateFormat.DATE_TIME_ZONE)

      await batchLogRepository.createNewBatchLogProcessResult(
        parentBatchLogId,
        batchLogs[0].batch_type,
        resultTypes.ERROR,
        resultDetail,
        resultDetailId,
      )
    }

    await batchLogRepository.createNewBatchLogEnd(parentBatchLogId, batchLogs[0].batch_type)

    return utility.createResponse(true, {})
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  handleBatchLogTimeOut,
}
