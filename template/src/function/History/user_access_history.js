/* library */
const moment = require('moment')

/* func && const */
const { dateFormat, decisionIdSiftApi, suspiciousLevel } = require('constant')
const { userAccessHistoryRepository } = require('repository')

/* global */
const defaultId = -99

const createAccessHistory = async (directIpAddress, directUserAgent, isSuccess, responseFraudAlert = null, userBasicDataId = defaultId,
  relatedAccessId = defaultId) => {
  let fraudAlertJson = ''
  try {
    fraudAlertJson = JSON.parse(responseFraudAlert)
  } catch (error) {
    fraudAlertJson = responseFraudAlert
  }

  const objAccessHistory = {
    relatedAccessId: relatedAccessId,
    userBasicDataId: userBasicDataId ? userBasicDataId : defaultId,
    accessIp: directIpAddress,
    accessAgent: directUserAgent,
    accessTime: moment().utc().format(dateFormat.DATE_TIME),
    suspiciousLevel: _setSuspiciousLevel(fraudAlertJson, relatedAccessId),
    fraudAlertJson: fraudAlertJson ? fraudAlertJson : '',
    isSuccess: isSuccess,
  }

  try {
    const accessHistory = await userAccessHistoryRepository.createAccessHistory(objAccessHistory)
    return { status: true, data: accessHistory }
  } catch (error) {
    console.error(error)
    return { status: false, message: error.sqlMessage || error.message }
  }
}

const _setSuspiciousLevel = (fraudAlert, relatedAccessId) =>{
  if (relatedAccessId !== defaultId) {
    return suspiciousLevel.LOW[0]
  }
  switch (fraudAlert?.score_response?.workflow_statuses[0]?.history[0]?.config?.decision_id) {
    case decisionIdSiftApi.SESSION_LOOKS_BAD:
      return suspiciousLevel.LOW[0]
    case decisionIdSiftApi.WATCH_SESSION:
      return suspiciousLevel.MIDDLE[0]
    default:
      return suspiciousLevel.HIGH[0]
  }
}

module.exports = {
  createAccessHistory,
}
