/* eslint-disable require-jsdoc */
const db = require('db').helper
const { flag } = require('constant')

async function getCommonMessageCode(msg) {
  const result = await db('m_service_provider_api_message')
    .select('common_message_code')
    .where('message', msg)
    .first()

  return result
}

const getCommonMessageCodeByMessageCode = async (messageCode) => {
  const result = await db('m_service_provider_api_message')
    .select('common_message_code')
    .where('message_code', messageCode)
    .where('delete_flag', flag.FALSE)
    .first()

  return result ? result : null
}

module.exports = {
  getCommonMessageCode,
  getCommonMessageCodeByMessageCode,
}
