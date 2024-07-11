/* function */
const utility = require('utility')
const { putObject } = require('helper').aws
const { json2csvAsync } = require('json-2-csv')
const { getMultilingualism } = require('./get_multilingualism_index')
const moment = require('moment')
const { errorLogRepository } = require('repository')

/* constant */
const {
  errorMessageCodeConstant,
  multilingualismType,
} = require('constant')

const exportMultilingualism = async (event) =>{
  try {
    const { site, application, category, screen, keyword } = event.queryStringParameters

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

    const lang = await getMultilingualism(site, application, category, screen, keyword)
    if (lang === false) {
      throw new Error('Unable to get files from S3')
    }

    // Handling csv parsing and uploading to S3
    const headers =
      category === multilingualismType.master_data ?
        [
          { field: 'key', title: 'KEY' },
          { field: 'en', title: 'EN SHORT' },
          { field: 'ja', title: 'JA SHORT' },
          { field: 'cn', title: 'CN SHORT' },
          { field: 'kr', title: 'KR SHORT' },
          { field: 'en_description', title: 'EN LONG' },
          { field: 'ja_description', title: 'JA LONG' },
          { field: 'cn_description', title: 'CN LONG' },
          { field: 'kr_description', title: 'KR LONG' },
        ] :
        [
          { field: 'key', title: 'KEY' },
          { field: 'en', title: 'EN' },
          { field: 'ja', title: 'JA' },
          { field: 'cn', title: 'CN' },
          { field: 'kr', title: 'KR' },
        ]


    const csvFilterSearch = _renderFilterSearch(site, application, category, screen, keyword)
    const tsCreate = moment().utc().format('YYYYMMDDHHmmss')
    const csvFileName = `language_${tsCreate}.csv`
    const csvS3Path = `files/multilingualism/csv-export/${csvFileName}`
    lang.multilingualism.push({
      key: csvFilterSearch,
    })
    const csvData = await json2csvAsync(lang.multilingualism, { keys: headers, emptyFieldValue: '', excelBOM: true, expandArrayObjects: true })
    await putObject(csvS3Path, csvData, 'text/csv')
    const url = `https://${process.env.BUCKET}.s3.${process.env.REGION}.amazonaws.com/${csvS3Path}`
    return utility.createResponse(true, {
      fileName: csvFileName,
      fileUrl: url,
      tsCreate: tsCreate,
    })
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const _renderFilterSearch = (site, application, category, screen, keyword) => {
  const params = []
  if (site) {
    params.push(`site=${site}`)
  }
  if (application) {
    application =
      application === 'web' ?
        'portal' :
        application === 'mobile' ?
          'application' :
          ''
    params.push(`tool=${application}`)
  }
  if (category) {
    params.push(`category=${category}`)
  }
  if (screen) {
    params.push(`page=${screen}`)
  }
  if (keyword) {
    params.push(`keyword=${keyword}`)
  }
  return params.join('&')
}

module.exports = {
  exportMultilingualism,
}
