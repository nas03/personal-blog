/* DB */
const db = require('db').helper

const getMultilingualMasterData = async () => {
  try {
    const m_authorization = db('m_authorization').select(
      db.raw("CONCAT('m_authorization--',id) as 'key'"),
      'ja_description as ja',
      'en_description as en',
      'cn_description as cn',
      'kr_description as kr',
    )
    const m_bank_api = db('m_bank_api').select(
      db.raw("CONCAT('m_bank_api--',id) as 'key'"),
      'ja_name as ja',
      'en_name as en',
      'cn_name as cn',
      'kr_name as kr',
      'ja_description',
      'en_description',
      'cn_description',
      'kr_description',
    )
    const m_category = db('m_category').select(
      db.raw("CONCAT('m_category--',id) as 'key'"),
      'ja_category_name as ja',
      'en_category_name as en',
      'cn_category_name as cn',
      'kr_category_name as kr',
    )
    const m_content_update = db('m_content_update').select(
      db.raw("CONCAT('m_content_update--',id) as 'key'"),
      'ja_content_name as ja',
      'en_content_name as en',
      'cn_content_name as cn',
      'kr_content_name as kr',
    )
    const m_countries = db('m_countries').select(
      db.raw("CONCAT('m_countries--',id) as 'key'"),
      'japanese_notation as ja',
      'english_notation as en',
      'chinese_notation as cn',
      'korean_notation as kr',
    )
    const m_distribution_service = db('m_distribution_service').select(
      db.raw("CONCAT('m_distribution_service--',id) as 'key'"),
      'ja_title as ja',
      'en_title as en',
      'cn_title as cn',
      'kr_title as kr',
      'ja_description',
      'en_description',
      'cn_description',
      'kr_description',
    )
    const m_finance_info = db('m_finance_info').select(
      db.raw("CONCAT('m_finance_info--',id) as 'key'"),
      'ja_name as ja',
      'en_name as en',
      'cn_name as cn',
      'kr_name as kr',
    )
    const m_message = db('m_message').select(
      db.raw("CONCAT('m_message--',id) as 'key'"),
      'ja_short_content_msg as ja',
      'en_short_content_msg as en',
      'cn_short_content_msg as cn',
      'kr_short_content_msg as kr',
      'ja_content_msg as ja_description',
      'en_content_msg as en_description',
      'cn_content_msg as cn_description',
      'kr_content_msg as kr_description',
    )
    const m_message_unavailable = db('m_message_unavailable').select(
      db.raw("CONCAT('m_message_unavailable--',id) as 'key'"),
      'ja_content as ja',
      'en_content as en',
      'cn_content as cn',
      'kr_content as kr',
    )
    const m_payment_category = db('m_payment_category').select(
      db.raw("CONCAT('m_payment_category--',id) as 'key'"),
      'ja_name as ja',
      'en_name as en',
      'cn_name as cn',
      'kr_name as kr',
    )
    const m_payment_company_account = db('m_payment_company_account').select(
      db.raw("CONCAT('m_payment_company_account--',id) as 'key'"),
      'ja_company_name as ja',
      'en_company_name as en',
      'cn_company_name as cn',
      'kr_company_name as kr',
      'ja_account_name as ja_description',
      'en_account_name as en_description',
      'cn_account_name as cn_description',
      'kr_account_name as kr_description',
    )
    const m_payment_detail = db('m_payment_detail').select(
      db.raw("CONCAT('m_payment_detail--',id) as 'key'"),
      'ja_name as ja',
      'en_name as en',
      'cn_name as cn',
      'kr_name as kr',
    )
    const m_payment_method = db('m_payment_method').select(
      db.raw("CONCAT('m_payment_method--',id) as 'key'"),
      'ja_name as ja',
      'en_name as en',
      'cn_name as cn',
      'kr_name as kr',
    )
    const m_payment_service_account_no = db(
      'm_payment_service_account_no',
    ).select(
      db.raw("CONCAT('m_payment_service_account_no--',id) as 'key'"),
      'ja_service_name as ja',
      'en_service_name as en',
      'cn_service_name as cn',
      'kr_service_name as kr',
    )
    const m_prefectures = db('m_prefectures').select(
      db.raw("CONCAT('m_prefectures--',id) as 'key'"),
      'ja_name as ja',
      'en_name as en',
      'cn_name as cn',
      'kr_name as kr',
    )
    const m_reasons = db('m_reasons').select(
      db.raw("CONCAT('m_reasons--',id) as 'key'"),
      'ja_short_reason as ja',
      'en_short_reason as en',
      'cn_short_reason as cn',
      'kr_short_reason as kr',
      'ja_reason as ja_description',
      'en_reason as en_description',
      'cn_reason as cn_description',
      'kr_reason as kr_description',
    )
    const m_rule_template = db('m_rule_template').select(
      db.raw("CONCAT('m_rule_template--',id) as 'key'"),
      'ja_name as ja',
      'en_name as en',
      'cn_name as cn',
      'kr_name as kr',
    )
    const m_timezones = db('m_timezones').select(
      db.raw("CONCAT('m_timezones--',id) as 'key'"),
      'ja_short_name as ja',
      'en_short_name as en',
      'cn_short_name as cn',
      'kr_short_name as kr',
      'ja_full_name as ja_description',
      'en_full_name as en_description',
      'cn_full_name as cn_description',
      'kr_full_name as kr_description',
    )
    const m_api_common_message = db('m_api_common_message').select(
      db.raw("CONCAT('m_api_common_message--',id) as 'key'"),
      'ja_short_msg as ja',
      'en_short_msg as en',
      'cn_short_msg as cn',
      'kr_short_msg as kr',
      'ja_long_msg as ja_description',
      'en_long_msg as en_description',
      'cn_long_msg as cn_description',
      'kr_long_msg as kr_description',
    )
    const m_broker = db('m_broker').select(
      db.raw("CONCAT('m_broker--',id) as 'key'"),
      'ja_broker_name as ja',
      'en_broker_name as en',
      'cn_broker_name as cn',
      'kr_broker_name as kr',
    )
    const m_symbol_name = db('m_symbol_name').select(
      db.raw("CONCAT('m_symbol_name--',id) as 'key'"),
      'ja_symbol_name as ja',
      'en_symbol_name as en',
      'cn_symbol_name as cn',
      'kr_symbol_name as kr',
    )

    const master_data = await Promise.all([
      m_authorization,
      m_bank_api,
      m_category,
      m_content_update,
      m_countries,
      m_distribution_service,
      m_finance_info,
      m_message,
      m_message_unavailable,
      m_payment_category,
      m_payment_company_account,
      m_payment_detail,
      m_payment_method,
      m_payment_service_account_no,
      m_prefectures,
      m_reasons,
      m_rule_template,
      m_timezones,
      m_api_common_message,
      m_broker,
      m_symbol_name,
    ])
    return master_data
  } catch (error) {
    console.log(error)
    return null
  }
}

const updateMultilingualMasterData = async (table, id, data) => {
  const result = await db.transaction(async (trx) => {
    await trx(table).update(data).where('id', id)
    return true
  })
  return result
}

module.exports = {
  getMultilingualMasterData,
  updateMultilingualMasterData,
}
