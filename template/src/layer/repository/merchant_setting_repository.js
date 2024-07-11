const { flag } = require('constant')
const db = require('db').helper

const getMerchantSetting = async (id) => {
  const res = await db('merchant_setting')
    .select(
      'id',
      'api_advanced_setting_id',
      'merchant_id',
      'enable',
      'display_order',
      'default_id',
      'staff_id',
      'ts_update',
      'ts_regist',
    )
    .where('delete_flag', flag.FALSE)
    .where('id', id)
    .first()

  return res
}

const checkMerchantIdExist = async (merchantId, apiAdvancedSettingId) => {
  const res = await db('merchant_setting')
    .select(
      'id',
    )
    .where('delete_flag', flag.FALSE)
    .where('merchant_id', merchantId)
    .where('api_advanced_setting_id', apiAdvancedSettingId)
    .first()

  return res ? true : false
}

const getListMerchantSetting = async (bankApiId) => {
  const res = await db('merchant_setting')
    .innerJoin(
      'api_advanced_setting',
      'merchant_setting.api_advanced_setting_id',
      'api_advanced_setting.id',
    )
    .select(
      'merchant_setting.id',
      'merchant_setting.api_advanced_setting_id',
      'merchant_id',
      'enable',
      'display_order',
      'default_id',
      'merchant_setting.staff_id',
      'merchant_setting.ts_update',
      'merchant_setting.ts_regist',
    )
    .where('merchant_setting.delete_flag', flag.FALSE)
    .where('api_advanced_setting.delete_flag', flag.FALSE)
    .where('api_advanced_setting.bank_api_id', bankApiId)
    .orderBy('display_order', 'asc')

  return res
}

const getMaxMerchantDisplayOrder = async (apiSettingId) => {
  const res = await db('merchant_setting')
    .max(
      'display_order as max',
    )
    .where('api_advanced_setting_id', apiSettingId)
    .where('delete_flag', flag.FALSE)

  return res[0].max || 0
}

const createMerchantSetting = async (data) => {
  const result = await db.transaction(async (trx) => {
    await trx('merchant_setting')
      .increment('display_order', 1).where('display_order', '>=', data.display_order)
      .where('delete_flag', flag.FALSE)
      .where('api_advanced_setting_id', data.api_advanced_setting_id)

    const id = await trx('merchant_setting')
      .insert(data)

    return await trx('merchant_setting')
      .select(
        'id',
        'api_advanced_setting_id',
        'merchant_id',
        'enable',
        'display_order',
        'default_id',
        'staff_id',
        'ts_update',
        'ts_regist',
      )
      .where('delete_flag', flag.FALSE)
      .where('id', id)
      .first()
  })
  return result
}

const deleteMerchantSetting = async (merchantSetting) => {
  try {
    return await db.transaction(async (trx) => {
      await trx('merchant_setting')
        .update({ delete_flag: flag.TRUE })
        .where('default_id', flag.FALSE)
        .where('delete_flag', flag.FALSE)
        .where('id', merchantSetting.id)

      await trx('merchant_setting')
        .decrement('display_order', 1).where('display_order', '>', merchantSetting.display_order)
        .where('delete_flag', flag.FALSE)
        .where('api_advanced_setting_id', merchantSetting.api_advanced_setting_id)

      return true
    })
  } catch (error) {
    console.log(error)
    return false
  }
}

const countMerchantSettingEnable = async (apiAdvancedSettingId) => {
  const result = await db('merchant_setting')
    .count('id as count')
    .where('delete_flag', flag.FALSE)
    .where('enable', flag.TRUE)
    .where('api_advanced_setting_id', apiAdvancedSettingId)

  return result[0].count
}

const updateMerchantSetting = async (id, enable) => {
  try {
    return await db.transaction(async (trx) => {
      await trx('merchant_setting')
        .update({ enable: enable })
        .where('delete_flag', flag.FALSE)
        .where('id', id)

      return await trx('merchant_setting')
        .select(
          'id',
          'api_advanced_setting_id',
          'merchant_id',
          'enable',
          'display_order',
          'default_id',
          'staff_id',
          'ts_update',
          'ts_regist',
        )
        .where('delete_flag', flag.FALSE)
        .where('id', id)
        .first()
    })
  } catch (error) {
    console.log(error)
    return false
  }
}

module.exports = {
  getMerchantSetting,
  checkMerchantIdExist,
  getListMerchantSetting,
  getMaxMerchantDisplayOrder,
  createMerchantSetting,
  deleteMerchantSetting,
  updateMerchantSetting,
  countMerchantSettingEnable,
}
