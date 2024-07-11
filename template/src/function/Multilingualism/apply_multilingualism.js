/* function */
const { syncData } = require('./get_multilingualism_index')
const { readJson, renderKeyBucketAWS, saveFileS3 } = require('./common')
const utility = require('utility')

/* constant */
const {
  multilingualismType,
  language,
  errorMessageCodeConstant,
} = require('constant')

/* library */
const moment = require('moment')

/* db */
const { masterDataRepository, errorLogRepository } = require('repository')

const applyMultilingualism = async (event) =>{
  try {
    const { site, application, category } = JSON.parse(event.body)

    // Validate required
    if (
      !category ||
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
        [errorMessageCodeConstant.APPLY_MULTILINGUALISM.READ_JSON])
    }

    if (category === multilingualismType.master_data) {
      await applyMasterData(tempJson.data)
    } else {
      const releaseFolder = renderKeyBucketAWS(site, application, category, 'release')
      const tsSync = moment().utc().format('yyyymmddHHmmss')

      // SYNC TEMP and RELEASE
      const enObj = await syncData(`${releaseFolder}en.json`, tempJson.data, language.EN)
      const jaObj = await syncData(`${releaseFolder}ja.json`, tempJson.data, language.JA)
      const cnObj = await syncData(`${releaseFolder}cn.json`, tempJson.data, language.CN)
      const krObj = await syncData(`${releaseFolder}kr.json`, tempJson.data, language.KR)
      if (!enObj || !jaObj || !cnObj || !krObj) {
        return await errorLogRepository.createResponseAndLog(event, null, null,
          [errorMessageCodeConstant.APPLY_MULTILINGUALISM.SYNC_TEMP_FAIL])
      }

      // SAVE new RELEASE + BACKUP EX-RELEASE
      await saveFileS3(`${releaseFolder}en.json`, `${releaseFolder}backup/en_${tsSync}.json`, enObj)
      await saveFileS3(`${releaseFolder}ja.json`, `${releaseFolder}backup/ja_${tsSync}.json`, jaObj)
      await saveFileS3(`${releaseFolder}cn.json`, `${releaseFolder}backup/cn_${tsSync}.json`, cnObj)
      await saveFileS3(`${releaseFolder}kr.json`, `${releaseFolder}backup/kr_${tsSync}.json`, krObj)
    }

    // DEFAULT TEMP
    await saveFileS3(tempPath, tempBackupPath, [])
    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const applyMasterData = async (data) => {
  await Promise.all(data.map(async (el) => {
    const { key, value, lang } = el
    const table = key.split('--')[0]
    const id = key.split('--')[1]
    const tableProp = database.find((el) => el.table === table) || {}
    await masterDataRepository.updateMultilingualMasterData(
      table,
      id,
      { [tableProp[lang]]: value },
    )
  }))
}

const database = [
  {
    table: 'm_api_common_message',
    ja: 'ja_short_msg',
    en: 'en_short_msg',
    cn: 'cn_short_msg',
    kr: 'kr_short_msg',
    ja_description: 'ja_long_msg',
    en_description: 'en_long_msg',
    cn_description: 'cn_long_msg',
    kr_description: 'kr_long_msg',
  },
  {
    table: 'm_authorization',
    ja: 'ja_description',
    en: 'en_description',
    cn: 'cn_description',
    kr: 'kr_description',
    ja_description: null,
    en_description: null,
    cn_description: null,
    kr_description: null,
  },
  {
    table: 'm_bank_api',
    ja: 'ja_name',
    en: 'en_name',
    cn: 'cn_name',
    kr: 'kr_name',
    ja_description: 'ja_description',
    en_description: 'en_description',
    cn_description: 'cn_description',
    kr_description: 'kr_description',
  },
  {
    table: 'm_broker',
    ja: 'ja_broker_name',
    en: 'en_broker_name',
    cn: 'cn_broker_name',
    kr: 'kr_broker_name',
    ja_description: null,
    en_description: null,
    cn_description: null,
    kr_description: null,
  },
  {
    table: 'm_category',
    ja: 'ja_category_name',
    en: 'en_category_name',
    cn: 'cn_category_name',
    kr: 'kr_category_name',
    ja_description: null,
    en_description: null,
    cn_description: null,
    kr_description: null,
  },
  {
    table: 'm_content_update',
    ja: 'ja_content_name',
    en: 'en_content_name',
    cn: 'cn_content_name',
    kr: 'kr_content_name',
    ja_description: null,
    en_description: null,
    cn_description: null,
    kr_description: null,
  },
  {
    table: 'm_countries',
    ja: 'japanese_notation',
    en: 'english_notation',
    cn: 'chinese_notation',
    kr: 'korean_notation',
    ja_description: null,
    en_description: null,
    cn_description: null,
    kr_description: null,
  },
  {
    table: 'm_distribution_service',
    ja: 'ja_title',
    en: 'en_title',
    cn: 'cn_title',
    kr: 'kr_title',
    ja_description: 'ja_description',
    en_description: 'en_description',
    cn_description: 'cn_description',
    kr_description: 'kr_description',
  },
  {
    table: 'm_finance_info',
    ja: 'ja_name',
    en: 'en_name',
    cn: 'cn_name',
    kr: 'kr_name',
    ja_description: null,
    en_description: null,
    cn_description: null,
    kr_description: null,
  },
  {
    table: 'm_message',
    ja: 'ja_short_content_msg',
    en: 'en_short_content_msg',
    cn: 'cn_short_content_msg',
    kr: 'kr_short_content_msg',
    ja_description: 'ja_content_msg',
    en_description: 'en_content_msg',
    cn_description: 'cn_content_msg',
    kr_description: 'kr_content_msg',
  },
  {
    table: 'm_message_unavailable',
    ja: 'ja_content',
    en: 'en_content',
    cn: 'cn_content',
    kr: 'kr_content',
    ja_description: null,
    en_description: null,
    cn_description: null,
    kr_description: null,
  },
  {
    table: 'm_payment_category',
    ja: 'ja_name',
    en: 'en_name',
    cn: 'cn_name',
    kr: 'kr_name',
    ja_description: null,
    en_description: null,
    cn_description: null,
    kr_description: null,
  },
  {
    table: 'm_payment_company_account',
    ja: 'ja_company_name',
    en: 'en_company_name',
    cn: 'cn_company_name',
    kr: 'kr_company_name',
    ja_description: 'ja_account_name',
    en_description: 'en_account_name',
    cn_description: 'cn_account_name',
    kr_description: 'kr_account_name',
  },
  {
    table: 'm_payment_detail',
    ja: 'ja_name',
    en: 'en_name',
    cn: 'cn_name',
    kr: 'kr_name',
    ja_description: null,
    en_description: null,
    cn_description: null,
    kr_description: null,
  },
  {
    table: 'm_payment_method',
    ja: 'ja_name',
    en: 'en_name',
    cn: 'cn_name',
    kr: 'kr_name',
    ja_description: null,
    en_description: null,
    cn_description: null,
    kr_description: null,
  },
  {
    table: 'm_payment_service_account_no',
    ja: 'ja_service_name',
    en: 'en_service_name',
    cn: 'cn_service_name',
    kr: 'kr_service_name',
    ja_description: null,
    en_description: null,
    cn_description: null,
    kr_description: null,
  },
  {
    table: 'm_prefectures',
    ja: 'ja_name',
    en: 'en_name',
    cn: 'cn_name',
    kr: 'kr_name',
    ja_description: null,
    en_description: null,
    cn_description: null,
    kr_description: null,
  },
  {
    table: 'm_symbol_name',
    ja: 'ja_symbol_name',
    en: 'en_symbol_name',
    cn: 'cn_symbol_name',
    kr: 'kr_symbol_name',
    ja_description: null,
    en_description: null,
    cn_description: null,
    kr_description: null,
  },
  {
    table: 'm_reasons',
    ja: 'ja_short_reason',
    en: 'en_short_reason',
    cn: 'cn_short_reason',
    kr: 'kr_short_reason',
    ja_description: 'ja_reason',
    en_description: 'en_reason',
    cn_description: 'cn_reason',
    kr_description: 'kr_reason',
  },
  {
    table: 'm_rule_template',
    ja: 'ja_name',
    en: 'en_name',
    cn: 'cn_name',
    kr: 'kr_name',
    ja_description: null,
    en_description: null,
    cn_description: null,
    kr_description: null,
  },
  {
    table: 'm_timezones',
    ja: 'ja_short_name',
    en: 'en_short_name',
    cn: 'cn_short_name',
    kr: 'kr_short_name',
    ja_description: 'ja_full_name',
    en_description: 'en_full_name',
    cn_description: 'cn_full_name',
    kr_description: 'kr_full_name',
  },
]

module.exports = {
  applyMultilingualism,
}
