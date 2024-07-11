/* eslint-disable require-jsdoc */
const db = require('db').helper
const moment = require('moment')
const { commonSiteId, flag, dateFormat } = require('constant')

async function verifyTokenAuthority(payload) {
  return await db('token_authority')
    .where(payload)
    .where('activation_key_expire_datetime', '>=', moment().utc().format(dateFormat.DATE_TIME))
    .where('delete_flag', flag.FALSE)
    .first()
}

async function createTokenAuthority(payload) {
  await commonCreateTokenAuthority(db('token_authority'), payload)

  return true
}

async function deleteTokenAuthority(id) {
  try {
    return await db('token_authority')
      .update({ delete_flag: flag.TRUE })
      .where({ id: id })
  } catch (error) {
    console.log(error)
    return false
  }
}

const getUserInfoByFraudAlertKey = async (fraud_alert_key) => {
  return await db('token_authority as ta')
    .select(
      'ta.id as token_authority_id',
      'users_basic_data.id',
      'users_basic_data.phone_number',
      'users_basic_data.user_name',
      'users_basic_data.email',
      'ta.activation_key as fraud_alert_key',
      'ta.activation_key_expire_datetime as fraud_alert_expire',
    )
    .leftJoin('users_basic_data', function() {
      // eslint-disable-next-line no-invalid-this
      this.on('ta.email', '=', 'users_basic_data.email')
        .andOn('ta.site_id', '=', commonSiteId.P2TECH)
        .andOn('users_basic_data.delete_flag', '=', flag.FALSE)
    })
    .where('ta.activation_key', fraud_alert_key)
    .where('ta.delete_flag', flag.FALSE)
    .first()
}

const commonCreateTokenAuthority = async (db, payload) => {
  const { action_class, target_id, activation_key, activation_key_expire_datetime, site_id, email } = payload
  let _payload = {
    site_id,
    action_class,
    target_id,
  }
  if (email) {
    _payload = {
      ..._payload,
      email,
    }
  }
  const tokenAuthority = await db
    .where(_payload)
    .first()
  if (tokenAuthority) {
    await db
      .update({
        activation_key: activation_key,
        activation_key_expire_datetime: activation_key_expire_datetime,
        delete_flag: flag.FALSE,
      })
      .where({ id: tokenAuthority.id })
  } else {
    await db.insert(payload)
  }
}

module.exports = {
  verifyTokenAuthority,
  createTokenAuthority,
  deleteTokenAuthority,
  getUserInfoByFraudAlertKey,
  commonCreateTokenAuthority,
}
