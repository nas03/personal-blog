const utility = require('utility')
const { accountOverseaBankRepository, accountLocalBankRepository, errorLogRepository } = require('repository')
const { errorMessageCodeConstant } = require('constant')

const getListAccountBank = async (event) => {
  try {
    const userId = event.pathParameters.userId
    event.user_id = userId || null
    const accountBank = await Promise.all([
      accountLocalBankRepository.getListAccountLocalBank(userId),
      accountOverseaBankRepository.getListOverseasBank(userId),
    ])

    return utility.createResponse(true, { localBank: accountBank[0], overseaBank: accountBank[1] })
  } catch (error) {
    console.error(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  getListAccountBank,
}
