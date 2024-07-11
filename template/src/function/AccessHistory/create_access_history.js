/* eslint-disable linebreak-style */
'use strict'

// func && const
const { errorMessageCodeConstant } = require('constant')
const { accessHistoryRepository, errorLogRepository } = require('repository')
const moment = require('moment')
const jwt = require('jsonwebtoken')

/* controller create access history */
module.exports.createAccessHistory = async (event) => {
  try {
    const { Authorization } = event.headers
    const directIpAddress = event.requestContext.identity.sourceIp
    const directUserAgent = event.headers['User-Agent']
    const jwtToken = Authorization.split(' ')[1]
    const { user_id, related_access_id } = jwt.verify(jwtToken, process.env.JWT_SECRET)

    const objAccessHistory = {
      relatedAccessId: related_access_id || -99,
      staffId: user_id ? user_id : -99,
      accessIp: directIpAddress,
      accessAgent: directUserAgent,
      accessTime: moment().utc().format('YYYY-MM-DD'),
      suspiciousLevel: 0,
      fraudAlertJson: '',
      isSuccess: 1,
    }
    return await accessHistoryRepository.createAccessHistory(objAccessHistory)
  } catch (err) {
    return await errorLogRepository.createResponseAndLog(event, err, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

