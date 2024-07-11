const db = require('db').helper
const moment = require('moment')
const { dateFormat, alertEnableStatus } = require('constant')

const TABLE_NAME = 'batch_setting'

const getListBatchEnable = async () => {
  try {
    const result = await db(TABLE_NAME)
      .select(
        'id',
        'batch_name',
        'alert_count',
        'alert_enable',
        'ts_last_notification',
        'alert_interval',
        'send_to',
        'slack_webhook_url',
        'last_batch_log_id',
      )
      .where('alert_enable', alertEnableStatus.ON)
      .orderBy('id')

    return result ? result : null
  } catch (error) {
    console.log(error)
    return false
  }
}

const updateTsLastNotification = async (id, batchLogId) => {
  const result = await db(TABLE_NAME)
    .update({
      'ts_last_notification': moment().format(dateFormat.DATE_TIME),
      'last_batch_log_id': batchLogId,
    })
    .where('id', id)

  if (!result) {
    return false
  }

  return true
}

const updateAlertEnable = async (id, value) => {
  const result = await db(TABLE_NAME)
    .update({
      'alert_enable': value,
    })
    .where('id', id)

  if (!result) {
    return false
  }

  return true
}

module.exports = {
  getListBatchEnable,
  updateTsLastNotification,
  updateAlertEnable,
}
