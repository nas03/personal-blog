const { flag, defaultApiSetting, bankApi } = require('constant')
const db = require('db').helper

const getApiSettingByBankApiId = async (bankApiId) => {
  const res = await db('api_advanced_setting')
    .select(
      'id',
    )
    .where('bank_api_id', bankApiId)
    .where('delete_flag', flag.FALSE)
    .first()

  return res
}

const createDefaultIfNotExists = async (bankApiId, siteId, staffId) => {
  try {
    await db.transaction(async (trx) => {
      const apiSetting = await getApiSettingByBankApiId(bankApiId)
      if (!apiSetting) {
        // Create api_advanced_setting if not exitst
        const result = await trx('api_advanced_setting').insert({
          site_id: siteId,
          bank_api_id: bankApiId,
          staff_id: staffId,
        })

        switch (bankApiId) {
          case bankApi.FXT_MAXCONNECT:
            // Create default value merchant_assign_method (tab 2)
            await trx('merchant_assign_method').insert({
              api_advanced_setting_id: result[0],
              staff_id: staffId,
              depend_deposit_amount: JSON.stringify({
                text: defaultApiSetting.DEPEND_DEPOSIT_AMOUNT,
                data: [],
              }),
            })

            // Create default value user_matching_rule (tab 3)
            await trx('user_matching_rule').insert({
              api_advanced_setting_id: result[0],
              staff_id: staffId,
              matching_conditions: defaultApiSetting.MATCHING_CONDITIONS_MAXCONNECT,
            })

            // Create default value auto_status_change_rule (tab 4)
            await trx('auto_status_change_rule').insert({
              api_advanced_setting_id: result[0],
              staff_id: staffId,
              p_compare_specific_user: defaultApiSetting.COMPARE_SPECIFIC_USER,
              a_compare_specific_user: defaultApiSetting.COMPARE_SPECIFIC_USER,
            })
            break
          case bankApi.FXT_INFINITAS:
            // Create default value user_matching_rule (tab 3)
            await trx('user_matching_rule').insert({
              api_advanced_setting_id: result[0],
              staff_id: staffId,
              matching_conditions: defaultApiSetting.MATCHING_CONDITIONS_INFINITAS,
            })

            // Create default value auto_status_change_rule (tab 4)
            await trx('auto_status_change_rule').insert({
              api_advanced_setting_id: result[0],
              staff_id: staffId,
              p_compare_specific_user: defaultApiSetting.COMPARE_SPECIFIC_USER,
              a_compare_specific_user: defaultApiSetting.COMPARE_SPECIFIC_USER,
            })
            break
          default:
            // Create default value auto_status_change_rule (tab 4)
            await trx('auto_status_change_rule').insert({
              api_advanced_setting_id: result[0],
              staff_id: staffId,
              p_compare_specific_user: defaultApiSetting.COMPARE_SPECIFIC_USER,
              a_compare_specific_user: defaultApiSetting.COMPARE_SPECIFIC_USER,
            })
            break
        }
      }

      return true
    })
    return { isError: false }
  } catch (error) {
    console.log(error)
    return { isError: true, error }
  }
}

module.exports = {
  getApiSettingByBankApiId,
  createDefaultIfNotExists,
}
