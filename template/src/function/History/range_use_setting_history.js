const moment = require('moment')
const { dataStatus, arrLocale, dateFormat, statusRule, contentUpdate, errorMessageCodeConstant } = require('constant')
const { rangeUseSettingHistoryRepository, errorLogRepository } = require('repository')

const { json2csvAsync } = require('json-2-csv')
const { uploadCSV } = require('helper').upload
const utility = require('utility')

const defaultLang = 'ja'

const createHistory = async (
  staff_id,
  range_use_setting_id,
  content,
  before_update,
  after_update,
) => {
  try {
    const obj = {
      id: moment().utc().format('YYYYMMDD') + '-' + moment().utc().format('HHmmssSSS'),
      staff_id,
      range_use_setting_id,
      content,
      before_update,
      after_update,
    }
    const result = await rangeUseSettingHistoryRepository.createHistory(obj)
    return { status: dataStatus.COMPLETE, data: result }
  } catch (error) {
    console.log(error)
    return { status: dataStatus.FAIL }
  }
}

const initObjHistory = (
  staff_id,
  range_use_setting_id,
  content,
  before_update,
  after_update,
  msAddMoment = 0,
) => {
  return {
    id: moment().utc().format('YYYYMMDD') + '-' + moment().utc().add(msAddMoment, 'milliseconds').format('HHmmssSSS'),
    staff_id,
    range_use_setting_id,
    content,
    before_update,
    after_update,
  }
}

const exportRangeUseSettingHistory = async (event) => {
  try {
    const { id } = event.pathParameters
    const queryString = event.queryStringParameters || {}
    const { locale } = queryString

    // check locale
    let typeLang
    if (locale && arrLocale.includes(locale)) {
      typeLang = locale
    } else {
      typeLang = defaultLang
    }
    const lang = await utility.getMultilingualism(process.env.LOCALES_SOURCE, typeLang)
    const rusLang = lang.csv_pdf.range_use_setting

    const histories = await rangeUseSettingHistoryRepository.getRangeUseSettingHistory(id)

    histories.forEach((el) => {
      el.ts_regist = moment(el.ts_regist).format(dateFormat.DATE_TIME_2)

      if (el.content === contentUpdate.ENABLE_RULE_UPDATE && (el.before_update === statusRule.ENABLE || el.before_update === statusRule.DISABLE)) {
        el.before_update = rusLang[el.before_update]
      }
      if (el.content === contentUpdate.ENABLE_RULE_UPDATE && (el.after_update === statusRule.ENABLE || el.after_update === statusRule.DISABLE)) {
        el.after_update = rusLang[el.after_update]
      }

      el.content = rusLang[el.content]
    })

    // Handling csv parsing and uploading to S3
    const headers = [
      { field: 'id', title: rusLang.rus_title.id },
      { field: 'content', title: rusLang.rus_title.content },
      { field: 'rule_name', title: rusLang.rus_title.rule_name },
      { field: 'before_update', title: rusLang.rus_title.before_update },
      { field: 'after_update', title: rusLang.rus_title.after_update },
      { field: 'staff_name', title: rusLang.rus_title.staff_name },
      { field: 'ts_regist', title: rusLang.rus_title.ts_regist },
    ]

    const csvData = await json2csvAsync(histories, { keys: headers, emptyFieldValue: '', excelBOM: true, expandArrayObjects: true })
    const fileName = histories[0] ? `${histories[0].rule_name}_` : 'operation_log_'
    const result = await uploadCSV(csvData, fileName)

    const response = {
      url_download: result.Location,
    }
    return utility.createResponse(true, response)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}


module.exports = {
  createHistory,
  initObjHistory,
  exportRangeUseSettingHistory,
}
