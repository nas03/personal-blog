/* constant */
const { commonSiteId, errorMessageCodeConstant } = require('constant')
const { errorLogRepository, usersBasicDataRepository } = require('repository')

/* db*/

/* utility*/
const utility = require('utility')

const getTokenForRedirectSite = async (event) => {
  try {
    const userId = event.pathParameters.userId
    event.user_id = userId
    const userInfo = await usersBasicDataRepository.getUserInfo(userId)

    if (userInfo.site_id === commonSiteId.MY_FOREX || userInfo.site_id === commonSiteId.FXT) {
      const response = {
        accessToken: utility.setTokenForRedirectSite(userInfo),
      }
      return utility.createResponse(true, response)
    }

    return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  } catch (err) {
    console.log(err)
    return await errorLogRepository.createResponseAndLog(event, err, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  getTokenForRedirectSite,
}
