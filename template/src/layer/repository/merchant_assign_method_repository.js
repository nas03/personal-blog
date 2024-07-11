const { flag } = require('constant')
const db = require('db').helper

const getMerchantAssignMethod = async (bankApiId) => {
  const res = await db('merchant_assign_method')
    .innerJoin(
      'api_advanced_setting',
      'merchant_assign_method.api_advanced_setting_id',
      'api_advanced_setting.id',
    )
    .leftJoin(
      'm_timezones',
      'merchant_assign_method.display_time_zone',
      'm_timezones.id',
    )
    .select(
      'merchant_assign_method.id',
      'api_advanced_setting.bank_api_id',
      'merchant_assign_method.api_advanced_setting_id',
      'merchant_assign_method.in_chronological_order',
      'merchant_assign_method.in_chronological_order_new',
      'merchant_assign_method.depend_deposit_amount',
      'merchant_assign_method.depend_deposit_amount_new',
      'merchant_assign_method.apply_latest_transaction',
      'merchant_assign_method.ts_apply',
      'merchant_assign_method.display_time_zone',
      'merchant_assign_method.staff_id',
      'm_timezones.timezone',
    )
    .where('merchant_assign_method.delete_flag', flag.FALSE)
    .where('api_advanced_setting.delete_flag', flag.FALSE)
    .where('api_advanced_setting.bank_api_id', bankApiId)
    .first()

  return res
}

const updateMerchantAssignMethod = async (id, payload) => {
  const res = await db('merchant_assign_method')
    .update(payload)
    .where('delete_flag', flag.FALSE)
    .where('id', id)

  return res
}

module.exports = {
  getMerchantAssignMethod,
  updateMerchantAssignMethod,
}
