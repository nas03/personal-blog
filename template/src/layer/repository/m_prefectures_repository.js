/* library */
const db = require('db').helper

/* constant */
const { flag } = require('constant')

async function findAll() {
  return await db('m_prefectures')
    .where('delete_flag', flag.FALSE)
    .select(
      'id',
      'country_code',
      'ja_name',
      'en_name',
      'cn_name',
      'kr_name',
    )
}

async function getPrefecture(payload) {
  try {
    const result = await db('m_prefectures')
      .where(payload)
      .select(
        'id',
        'country_code',
        'ja_name',
        'en_name',
        'cn_name',
        'kr_name',
      )
      .first()
    return result
  } catch (error) {
    console.log(error)
    return false
  }
}

module.exports = {
  findAll,
  getPrefecture,
}
