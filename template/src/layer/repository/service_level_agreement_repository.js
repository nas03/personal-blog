// constant
const { flag, statusCode, walletStatus, triggerConditionClass, actionMethod, statusClassConstant } = require('constant')

// db
const db = require('db').helper

// function
const { getUserAccountStatus } = require('./users_basic_data_repository')

const getAccountStatusTrigger = async (site_id) =>{
  return await db('service_level_agreement')
    .select(
      'id',
      'site_id',
      'trigger_condition_class',
      'trigger_minute_number',
      'enable_setting_flag',
    )
    .whereIn('site_id', site_id)
    .where('delete_flag', flag.FALSE)
    .first()
}

const saveAccountStatusTrigger = async (payload) =>{
  const result = await db.transaction(async (trx) =>{
    const isExisted = await trx('service_level_agreement')
      .where({
        'delete_flag': flag.FALSE,
        'site_id': payload.site_id,
      }).first()

    if (!isExisted) {
      await trx('service_level_agreement')
        .insert(payload)
    } else {
      await trx('service_level_agreement')
        .update(payload)
        .where('id', isExisted.id )
    }

    return true
  })

  return result
}

const scheduleChangeAccountStatus = async () =>{
  return await db.transaction(async (trx) =>{
    // GET LIST USERS AND FIRST TIME CHANGE STATUS TO ACTIVE
    const firstTimeAccountStatusActive = trx('general_status_history')
      .select(
        'target_id',
        db.raw('Min(ts_regist) as ts_active_status'),
      )
      .where({
        status_code: statusCode.ACTIVATED,
        delete_flag: flag.FALSE,
        status_class_id: statusClassConstant.ACCOUNT_STATUS,
      })
      .groupBy('target_id')
      .groupBy('status_code')
      .groupBy('status_class_id')
      .as('first_time_account_status_active')

    const users = await trx('users_basic_data as users')
      .select(
        'users.id as user_id',
        'users.site_id',
      )
      .join('service_level_agreement as sla', 'sla.site_id', 'users.site_id')
      .join('m_site', 'm_site.id', 'sla.site_id')
      .join(firstTimeAccountStatusActive, 'users.id', 'first_time_account_status_active.target_id')
      .join(getUserAccountStatus(), 'users.id', 'gsh.target_id')
      .where({
        'gsh.status_code': statusCode.ACTIVATED,
        'users.delete_flag': flag.FALSE,
        'sla.enable_setting_flag': flag.TRUE,
        'sla.delete_flag': flag.FALSE,
        'm_site.enable_flag': flag.TRUE,
        'm_site.delete_flag': flag.FALSE,
      })
      .whereRaw('first_time_account_status_active.ts_active_status <= DATE_SUB(UTC_TIMESTAMP(), INTERVAL sla.trigger_minute_number MINUTE)')
      // IF THE ADMIN HAS CHANGED THE ACCOUNT STATUS THEN THIS USER NOT QUALIFIED
      .whereNotExists(
        function() {
          // eslint-disable-next-line no-invalid-this
          this.select(1)
            .from('general_status_history')
            .whereNotNull('updated_by_user_id')
            .whereRaw(`general_status_history.action_method = ${actionMethod.OPERATOR_ACTION}`)
            .whereRaw('users.id = general_status_history.target_id')
            .whereRaw(`general_status_history.delete_flag =  ${flag.FALSE}`)
            .whereRaw(`general_status_history.status_class_id = ${statusClassConstant.ACCOUNT_STATUS}`)
        })
      .where(function() {
        // SCHEDULE JOB RUN ALL USERS TRIGEER OR USER HAS BALANCE IN WALLET
        // eslint-disable-next-line no-invalid-this
        this.where('sla.trigger_condition_class', triggerConditionClass.ALL_USERS)
          .orWhere(function() {
            // eslint-disable-next-line no-invalid-this
            this.where('sla.trigger_condition_class', triggerConditionClass.BALANCE_IN_WALLET_USERS)
              .whereExists(function() {
              // eslint-disable-next-line no-invalid-this
                this.select(1)
                  .from('wallets')
                  .where('wallets.total_assets', '>', 0)
                  .whereRaw('users.id = wallets.user_basic_data_id')
                  .whereRaw(`wallets.wallet_status =  ${walletStatus.ACTIVATED}`)
                  .whereRaw(`wallets.delete_flag =  ${flag.FALSE}`)
              })
          })
      }).limit(process.env.LIMIT_USERS_UPDATE_STATUS_REQUIRED)

    const userIds = users.map((el) => el.user_id)

    if (userIds.length > 0) {
      const payloadStatusHistory = userIds.map((el) => ({
        target_id: el,
        status_code: statusCode.REQUIRED,
        status_class_id: statusClassConstant.ACCOUNT_STATUS,
        action_method: actionMethod.SYSTEM_ACTION,
      }))

      await trx('general_status_history').insert(payloadStatusHistory)

      console.log('LIST_USER_ID_UPDATE_SUCCESS', userIds)
    }

    return true
  })
}


module.exports = {
  saveAccountStatusTrigger,
  getAccountStatusTrigger,
  scheduleChangeAccountStatus,
}

