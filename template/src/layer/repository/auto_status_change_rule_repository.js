const db = require('db').helper
const { flag } = require('constant')

const getAutoStatusChangeRuleByBankApiId = async (bankApiId) => {
  // get auto status change by bank api id
  const res = await db('auto_status_change_rule as a')
    .innerJoin(
      'api_advanced_setting as s',
      'a.api_advanced_setting_id',
      's.id',
    )
    .select(
      'a.id',
      'a.api_advanced_setting_id',
      'a.pending_matching_rule',
      'a.p_status_change_exception',
      'a.p_enable_compare_deposit_amount',
      'a.p_compare_deposit_amount',
      'a.p_enable_compare_specific_user',
      'a.p_compare_specific_user',
      'a.p_enable_compare_user_status',
      'a.p_compare_user_status',
      'a.a_status_change_exception',
      'a.a_enable_compare_deposit_amount',
      'a.a_compare_deposit_amount',
      'a.a_enable_compare_same_transaction_num',
      'a.a_compare_same_transaction_num',
      'a.a_enable_compare_day_num',
      'a.a_compare_day_num',
      'a.a_compare_total_deposit_amount',
      'a.a_enable_compare_specific_user',
      'a.a_compare_specific_user',
      'a.a_enable_compare_user_attention')
    .where('a.delete_flag', flag.FALSE)
    .where('s.delete_flag', flag.FALSE)
    .where('s.bank_api_id', bankApiId)
    .first()

  return res
}

const getAutoStatusChangeRuleByApiId = async (id) => {
  // get auto status change by advanced setting id api id
  const res = await db('auto_status_change_rule')
    .select('id')
    .where('api_advanced_setting_id', id)
    .where('delete_flag', flag.FALSE)
    .first()

  return res
}

const updateAutoStatusChangeRule = async (objAutoStatusChange, id) => {
  // update auto status change
  const result = await db('auto_status_change_rule')
    .update(objAutoStatusChange)
    .where('id', id)
    .where('delete_flag', flag.FALSE)

  if (!result) {
    return false
  }

  return true
}

module.exports = {
  updateAutoStatusChangeRule,
  getAutoStatusChangeRuleByApiId,
  getAutoStatusChangeRuleByBankApiId,
}
