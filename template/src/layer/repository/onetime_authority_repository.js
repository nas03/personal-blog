const db = require('db').helper
const moment = require('moment')
const { flag, message, dateFormat } = require('constant')

async function verifyOneTimeAuthorityCode(payload) {
  const oneTimeCode = await db('onetime_authority')
    .where(payload)
    .where('onetime_authority.delete_flag', flag.FALSE)
    .first()
    // VERIFY CODE
  if (!oneTimeCode) {
    return { status: false, message: message.wrong_code }
  }

  // VERIFY EXPIRIED DATETIME
  if (moment(oneTimeCode.code_expire_datetime).format(dateFormat.DATE_TIME) < moment().utc().format(dateFormat.DATE_TIME)) {
    return { status: false, message: message.expired_code }
  }

  return { status: true, data: oneTimeCode }
}

async function createOneTimeAuthorityCode(payload) {
  const { site_id, action_class, phone_number, email, code, code_expire_datetime } = payload
  const oneTimeAuthorityCode = await db('onetime_authority')
    .where({
      site_id: site_id,
      action_class: action_class || null,
      phone_number: phone_number || null,
      email: email || null,
    })
    .first()
  if (oneTimeAuthorityCode) {
    await db('onetime_authority')
      .update({
        code: code,
        code_expire_datetime: code_expire_datetime,
        delete_flag: flag.FALSE,
      })
      .where({ id: oneTimeAuthorityCode.id })
  } else {
    await db('onetime_authority').insert(payload)
  }
  return true
}

async function deleteOneTimeAuthorityCode(id) {
  try {
    return await db('onetime_authority')
      .update({ delete_flag: flag.TRUE })
      .where({ id: id })
  } catch (error) {
    console.log(error)
    return false
  }
}

module.exports = {
  verifyOneTimeAuthorityCode,
  createOneTimeAuthorityCode,
  deleteOneTimeAuthorityCode,
}
