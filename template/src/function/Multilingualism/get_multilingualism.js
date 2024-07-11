/* function */
const {
  readJson,
} = require('./common')
const utility = require('utility')

/* constant */
const { arrLocale, errorMessageCodeConstant } = require('constant')
const { errorLogRepository } = require('repository')

const getMultilingualism = async (event) =>{
  try {
    const { application, locale, site } = event.queryStringParameters
    if (
      !arrLocale.includes(locale) ||
      !['web', 'mobile'].includes(application) ||
      (site && site !== 'ekyc')
    ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    const path = `files/multilingualism/${site === 'ekyc' ? 'ekyc' : 'p2tech'}/${application}/release`

    const jsonS3 = await readJson(`${path}/${locale}.json`)
    if (jsonS3.status === false) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
    }
    return utility.createResponse(true, jsonS3.data)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  getMultilingualism,
}
