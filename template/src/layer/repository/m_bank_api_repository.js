const { flag } = require('constant')

const db = require('db').helper

const getListBankApi = async (siteId) => {
  const res = await db('m_bank_api')
    .leftJoin('m_site', 'm_bank_api.site_id', 'm_site.id')
    .select(
      'm_bank_api.id',
      'm_bank_api.site_id',
      'm_bank_api.ja_name',
      'm_bank_api.en_name',
      'm_bank_api.cn_name',
      'm_bank_api.kr_name',
      'm_bank_api.ja_description',
      'm_bank_api.en_description',
      'm_bank_api.cn_description',
      'm_bank_api.kr_description',
      'm_site.site_name',
    )
    .whereIn('site_id', siteId)
    .where('enable_flag', flag.TRUE)

  return res
}

const getById = async (id) => {
  const res = await db('m_bank_api')
    .select(
      'id',
      'site_id',
    )
    .where('id', id)
    .first()

  return res
}

module.exports = {
  getListBankApi,
  getById,
}
