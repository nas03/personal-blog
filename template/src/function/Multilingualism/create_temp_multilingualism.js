/* function */
const {
  readJson,
  renderKeyBucketAWS,
  saveFileS3,
} = require('./common')
const utility = require('utility')

/* constant */
const {
  multilingualismType,
  errorMessageCodeConstant,
} = require('constant')

/* library */
const moment = require('moment')
const { errorLogRepository } = require('repository')

/*
  Temporarily save the administrator's multilingual changes
*/
const createTempMultilingualism = async (event) =>{
  try {
    const { site, application, category, edit_data } = JSON.parse(event.body)

    // Validate required
    if (
      (!category && !site && !application) ||
      ((category === multilingualismType.item_on_screen ||
        category === multilingualismType.validate) &&
        (!site || !application)) ||
      ((category === multilingualismType.email ||
        category === multilingualismType.csv_pdf) &&
        !site)
    ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // GET TEMP
    const tempName = 'temp.json'
    const tempBackupName = `backup/temp_${moment().utc().format('yyyymmddHHmmss')}.json`
    const tempFolder = renderKeyBucketAWS(site, application, category, 'temp')
    const tempPath = tempFolder + tempName
    const tempBackupPath = tempFolder + tempBackupName
    const tempJson = await readJson(tempPath)
    if (tempJson.status === false) {
      return await errorLogRepository.createResponseAndLog(event, { message: tempJson.data }, null,
        [errorMessageCodeConstant.CREATE_TEMP_MULTILINGUALISM.READ_JSON])
    }

    // SYNC TEMP versions together
    tempJson.data.forEach((temp) => {
      const { key, lang } = temp
      const find = edit_data.find((el) => el.key === key && el.lang === lang)
      if (!find) {
        edit_data.push(temp)
      }
    })
    await saveFileS3(tempPath, tempBackupPath, edit_data)
    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  createTempMultilingualism,
}
