/* library */
const utility = require('utility')

/* repository */
const { errorLogRepository, supportHistoryRepository, usersBasicDataRepository } = require('repository')

/* constant */
const { flag, errorMessageCodeConstant, statusCode } = require('constant')

const createProfileSupportHistory = async (event) => {
  try {
    const user_basic_data_id = event.pathParameters.id
    event.user_id = user_basic_data_id || null
    const staffId = utility.getUserIdByToken(event)

    const user = await usersBasicDataRepository.getUserInfo(user_basic_data_id)
    if (!user || user.account_status_code === statusCode.CLOSED ) {
      return await errorLogRepository.createResponseAndLog(
        event,
        null,
        null,
        [errorMessageCodeConstant.CREATE_PROFILE_SUPPORT_HISTORY.ACCOUNT_CLOSED],
      )
    }

    const { support_comment } = JSON.parse(event.body) || {}

    if (!support_comment) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    await supportHistoryRepository.createSupportHistory({
      user_basic_data_id,
      support_by_admin_id: staffId,
      support_comment,
    })

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const deleteProfileSupportHistory = async (event) => {
  try {
    const support_id = event.pathParameters.id

    if (!support_id) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    const user = await supportHistoryRepository.getUserBySupportHistoryId(support_id)

    event.user_id = user?.user_id

    if (!user || user.account_status_code === statusCode.CLOSED ) {
      return await errorLogRepository.createResponseAndLog(
        event,
        null,
        null,
        [errorMessageCodeConstant.DELETE_PROFILE_SUPPORT_HISTORY.ACCOUNT_CLOSED],
      )
    }

    await supportHistoryRepository.updateSupportHistory(support_id, { delete_flag: flag.TRUE })

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  createProfileSupportHistory,
  deleteProfileSupportHistory,
}
