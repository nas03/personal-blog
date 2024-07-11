/* eslint-disable require-jsdoc */
const db = require('db').helper
const utility = require('utility')

async function createAccessHistory(obj, currentUserId) {
  const temp = {}
  const accessHistory = {
    ...temp,
    related_access_id: obj.relatedAccessId,
    staff_id: obj.staffId,
    access_ip: obj.accessIp,
    access_agent: obj.accessAgent,
    access_time: obj.accessTime,
    suspicious_level: obj.suspiciousLevel,
    fraud_alert_json: obj.fraudAlertJson ? JSON.stringify(obj.fraudAlertJson) : '',
    is_success: obj.isSuccess,
  }
  const insertObject = utility.addAutoField(accessHistory)
  const result = await db('access_history').insert(insertObject)
  return result
}

module.exports = {
  createAccessHistory,
}
