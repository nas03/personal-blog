/* library */
const db = require('db').helper

/* constant */
const { flag } = require('constant')

async function findByTypeData(listTypeData) {
  return await db('m_finance_info')
    .whereIn('type_data', listTypeData)
    .where('delete_flag', flag.FALSE)
    .select(
      'id',
      'type_data',
      'ja_name',
      'en_name',
      'cn_name',
      'kr_name',
    )
}

module.exports = {
  findByTypeData,
}
