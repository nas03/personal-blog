const { flag } = require('constant')

const db = require('db').helper
const utility = require('utility')
const setEmailSetting = async (id, data) => {
  try {
    const result = await db.transaction(async (trx) => {
      const isUpdate = await trx('send_mail_setting')
        .where({
          user_id: id,
          delete_flag: flag.FALSE,
        })
        .update(data)
      if (!isUpdate) {
        return false
      } else {
        return true
      }
    })
    return result
  } catch (error) {
    console.log(error)
    return false
  }
}

const hasServiceExisted = async (serviceId) => {
  try {
    const existed = await db('m_distribution_service')
      .select('id')
      .where('id', serviceId)

    return existed.length > 0
  } catch (err) {
    console.log(err)
    return false
  }
}

const upsertService = async (userId, siteId, serviceId, enabled) => {
  return db.transaction(async (trx) => {
    const existed = await trx('send_mail_setting')
      .select('id')
      .where( 'user_basic_data_id', userId)
      .where('site_id', siteId)
      .where('distribution_service_id', serviceId)

    if (existed.length) {
      return trx('send_mail_setting')
        .update({
          enabled: enabled,
        })
        .where('user_basic_data_id', userId)
        .where('site_id', siteId)
        .where('distribution_service_id', serviceId)
    }
    return trx('send_mail_setting')
      .insert({
        user_basic_data_id: userId,
        site_id: siteId,
        distribution_service_id: serviceId,
        enabled: enabled,
      })
  })
}

// eslint-disable-next-line max-len
const upsertServiceMtAccountInfo = async (userId, siteId, serviceId, enabled, groupMtAccount, server_data, apiKey, tradingAccountIds, event = null) => {
  const trx = await db.transaction()
  try {
    //  update setting email
    const userUpdate = await trx('send_mail_setting')
      .select('id')
      .where('user_basic_data_id', userId)
      .where('site_id', siteId)
      .where('distribution_service_id', serviceId)

    if (userUpdate.length) {
      await trx('send_mail_setting')
        .update({
          enabled: enabled,
        })
        .where('user_basic_data_id', userId)
        .where('site_id', siteId)
        .where('distribution_service_id', serviceId)
    } else {
      await trx('send_mail_setting')
        .insert({
          user_basic_data_id: userId,
          site_id: siteId,
          distribution_service_id: serviceId,
          enabled: enabled,
        })
    }

    // notify 3rd server by calling api
    for (let i = 0; i < groupMtAccount.length; i++) {
      // eslint-disable-next-line eqeqeq
      const server = server_data.find((sev) => sev.id == groupMtAccount[i].mt_server_id)
      const url = utility.getMTURL(server.env_param_name, server.platform, apiKey.api_name)
      const dataTrading = {
        ServerKey: server.server_key,
        ApiKey: apiKey.api_key,
        MTAccount: groupMtAccount[i].mt_account_no,
        Reports: enabled,
      }
      const isCreateMTServer = await utility.requestRetry(
        'POST',
        url,
        dataTrading,
      )
      if (isCreateMTServer.ReturnCode !== '0') {
        console.log(isCreateMTServer)
        await trx.rollback()
        return { isError: true, data: dataTrading, url }
      }
    }

    //  update report filed of trading account table
    const updateReport = await trx('trading_accounts')
      .update({
        report: enabled,
      })
      .whereIn('id', tradingAccountIds)

    if (!updateReport) {
      await trx.rollback()
      return { isError: true }
    }

    await trx.commit()
    return { isError: false }
  } catch (err) {
    console.log(err)
    await trx.rollback()
    throw err
  }
}

module.exports = {
  setEmailSetting,
  upsertService,
  hasServiceExisted,
  upsertServiceMtAccountInfo,
}
