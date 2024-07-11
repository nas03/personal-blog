/* eslint-disable require-jsdoc */
const db = require('db').helper

async function getListMessageUnavailable() {
  const result = await db('m_message_unavailable')
    .select(
      'id',
      'ja_content',
      'en_content',
      'cn_content',
      'kr_content',
    )

  return result
}

module.exports = {
  getListMessageUnavailable,
}
