const { depositLocalBankApiRepository, errorLogRepository } = require('repository')
const utility = require('utility')
const { errorMessageCodeConstant } = require('constant')
const getAllMerchantId = async (event) => {
  try {
    // List merchant_id of local bank
    const response = await depositLocalBankApiRepository.getListMerchantId()
    return utility.createResponse(true, response)
  } catch (err) {
    console.log(err)
    return await errorLogRepository.createResponseAndLog(event, err, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  getAllMerchantId,
}
