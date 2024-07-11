const { flag } = require('constant')
const db = require('db').helper

const { getUserAccountStatus } = require('./users_basic_data_repository')

const updateFinanceById = async (id, payload) =>{
  return await db('users_finance')
    .where('id', id)
    .update(payload)
}

const getProfileByFinanceId = async (user_finance_id, type_profile) => {
  return await db('users_basic_data as ubd')
    .join(getUserAccountStatus(), 'gsh.target_id', 'ubd.id')
    .leftJoin(
      db.raw(`${type_profile === 'corporate' ? 'users_corporate' : 'users_personal'} as profile`),
      'profile.user_basic_data_id',
      'ubd.id',
    )
    .leftJoin(
      'users_finance as uf',
      db.raw(`${type_profile === 'corporate' ? 'uf.user_corporate_id' : 'uf.user_personal_id'}`),
      'profile.id',
    )
    .where({
      'uf.id': user_finance_id,
      'ubd.delete_flag': flag.FALSE,
      'profile.delete_flag': flag.FALSE,
      'uf.delete_flag': flag.FALSE,
    })
    .select(
      'ubd.id as user_id',
      'ubd.site_id',
      'ubd.corporate_flag',
      'uf.occupation_id',
      'uf.funding_source_id',
      'uf.industry_id',
      'uf.annual_income',
      'uf.net_worth',
      'uf.planned_annual_investment',
      'uf.purpose_of_investment',
      'uf.us_tax_obligations',
      'uf.us_taxpayer_number',
      'profile.status_items',
      'gsh.status_code as account_status_code',
    )
    .first()
}

module.exports = {
  updateFinanceById,
  getProfileByFinanceId,
}
