const { batchLogRepository } = require('repository')
const utility = require('utility')

/* constant */
const { resCheck, code, message } = require('constant')

const scheduleDeleteBatchLog = async () => {
  try {
    console.log('Begin running process delete batch log')
    await batchLogRepository.deleteBatchLog()
    return utility.createResponse(true)
  } catch (error) {
    console.error(error)
    return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
  }
}

module.exports = {
  scheduleDeleteBatchLog,
}
