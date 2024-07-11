const { flag } = require('constant')
const db = require('db').helper

const getUserMatchingRule = async (bankApiId) => {
  const res = await db('user_matching_rule')
    .innerJoin(
      'api_advanced_setting',
      'user_matching_rule.api_advanced_setting_id',
      'api_advanced_setting.id',
    )
    .select(
      'user_matching_rule.id',
      'user_matching_rule.api_advanced_setting_id',
      'user_matching_rule.match_api_response',
      'user_matching_rule.matching_conditions',
      'user_matching_rule.transfer_name_check',
      'user_matching_rule.ignore_honorific',
      'user_matching_rule.check_corporate_name_registered',
      'user_matching_rule.check_corporate_name_english',
      'user_matching_rule.check_corporate_name_katakana',
    )
    .where('user_matching_rule.delete_flag', flag.FALSE)
    .where('api_advanced_setting.delete_flag', flag.FALSE)
    .where('api_advanced_setting.bank_api_id', bankApiId)
    .first()

  return res
}

async function updateUserMatchingRule(id, data) {
  const res = await db('user_matching_rule')
    .update(data)
    .where('delete_flag', flag.FALSE)
    .where('id', id)

  return res
}

module.exports = {
  getUserMatchingRule,
  updateUserMatchingRule,
}
