const { batchLogRepository, batchSettingRepository } = require('repository')
const moment = require('moment')
const utility = require('utility')

/* helper */
const { mailer, slack } = require('helper')

/* constant */
const { resCheck, code, message, resultTypes, dateFormat } = require('constant')

const scheduleSendMailAlertBatchLog = async (event) => {
  try {
    console.log('STEP-1: Begin running process send email alert batch log')

    console.log('STEP-2: Get data from batch_setting table')
    const listBatch = await batchSettingRepository.getListBatchEnable()

    if (!listBatch) {
      console.error('STEP-2.1: Cannot get data from batch_setting table')
      return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
    }

    console.log('STEP-3: Get data from batch_log table')

    for (const batchObj of listBatch) {
      const batchType = batchObj.id
      const errorCountToCheck = batchObj.alert_count
      const alertInterval = batchObj.alert_interval
      const tsLastNotification = batchObj.ts_last_notification
      const sendTo = batchObj.send_to ? batchObj.send_to.split(',') : []
      const slackWebHookUrls = batchObj.slack_webhook_url ? batchObj.slack_webhook_url.split(',') : []

      // Define the two date-time values
      const nowUTC = moment()
      const tsLastNotificationDateTime = moment(tsLastNotification)

      // Calculate the difference between the two date-time values in hours
      const diffInHours = tsLastNotification ? nowUTC.diff(tsLastNotificationDateTime, 'hours') : null

      const result = await batchLogRepository.getBatchLogProcessResult(batchType, errorCountToCheck)

      if (!result) {
        console.error(`STEP-3.1: Cannot get data from batch_log table with batch_type = ${batchType}`)
        continue
      }

      if (result.length !== errorCountToCheck || result.some((val) => val.result_type === resultTypes.SUCCESS)) {
        continue
      }

      const lastBatchLogError = result[0]

      if (batchObj.last_batch_log_id !== null && lastBatchLogError.id <= batchObj.last_batch_log_id) {
        continue
      }

      if (alertInterval && diffInHours !== null && diffInHours < alertInterval) {
        continue
      }

      console.log(`STEP-4: Send email alert batch log for batch_type = ${batchType}`)

      const batchLogAlertError = await batchLogRepository.getBatchLogAlertError(batchType)

      const countBatchLogAlertError = await batchLogRepository.getCountingBatchLogAlertError(batchType, batchLogAlertError[0].id)

      const timeInUTC = moment.utc(batchLogAlertError[0].ts_regist)

      const timeInPlus9 = timeInUTC.clone().utcOffset('+09:00')

      const resultDetail = JSON.parse(lastBatchLogError.result_detail)

      resultDetail.process_start_time =
        moment(resultDetail.process_start_time).clone().utcOffset('+09:00').format(dateFormat.DATE_TIME_ZONE)
      resultDetail.process_end_time =
        moment(resultDetail.process_end_time).clone().utcOffset('+09:00').format(dateFormat.DATE_TIME_ZONE)

      lastBatchLogError.result_detail = JSON.stringify(resultDetail)

      const messageObj = {
        ...lastBatchLogError,
        sendTo,
        slackWebHookUrls,
        batch_error_time: timeInPlus9.format(dateFormat.DATE_TIME_ZONE),
        batch_error_count: countBatchLogAlertError[0].count,
        jobName: batchObj.batch_name,
      }

      const mailerResponse = await mailer.sendMailBatchLogAlert(messageObj)

      const slackResponse = await slack.sendMessageBatchLogAlert(messageObj)

      if (!slackResponse && !mailerResponse) {
        continue
      }

      await batchSettingRepository.updateTsLastNotification(batchType, lastBatchLogError.id)
    }

    console.log('STEP-5: Email alerts for batch logs sent successfully')
    return utility.createResponse(true)
  } catch (error) {
    console.error(error)
    return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
  }
}

module.exports = {
  scheduleSendMailAlertBatchLog,
}
