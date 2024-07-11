const db = require('db').helper

const getLanguageParams = async (payload)=>{
  return await db('m_language_param')
    .select(
      'id',
      'language_param_key',
      'display_text',
    )
    .where(payload)
}

module.exports = {
  getLanguageParams,
}
