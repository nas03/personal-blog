/* DB */
const db = require('db').helper

const getListTemplate = async () => {
  try {
    const result = await db('m_rule_template')
      .select(
        'id',
        'ja_name',
        'en_name',
        'cn_name',
        'kr_name',
      )

    return result
  } catch (error) {
    console.log(error)
    return null
  }
}

module.exports = {
  getListTemplate,
}
