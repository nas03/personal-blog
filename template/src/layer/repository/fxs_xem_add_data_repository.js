const db = require('db').helper
const { flag } = require('constant')

const { getUserAccountStatus } = require('./users_basic_data_repository')

const getTradingAccountFxsInfo = async (userBasicId) => {
  const query = db('fxs_xem_add_data as fxs')
    .leftJoin('m_account_leverage as mal', 'mal.id', 'fxs.account_leverage_id')
    .leftJoin('m_account_type as mat', 'mat.id', 'mal.account_type_id')
    .select(
      'fxs.id',
      'fxs.platform',
      'fxs.currency',
      'fxs.account_leverage_id',
      'mal.account_leverage',
      'mal.account_type_id',
      'mat.account_type_name',
      'fxs.trading_bonus_flag',
      'fxs.address_in_english',
    )
    .where({
      'fxs.delete_flag': flag.FALSE,
      'fxs.user_basic_data_id': userBasicId,
    })

  return await query
}

const updateDataById = async (id, payload) =>{
  return await db('fxs_xem_add_data')
    .where('id', id)
    .update(payload)
}

const checkAccountStatusClosed = async (id)=>{
  return await db('fxs_xem_add_data as fxs')
    .join('users_basic_data', 'users_basic_data.id', 'fxs.user_basic_data_id')
    .join(getUserAccountStatus(), 'gsh.target_id', 'users_basic_data.id')
    .select(
      'fxs.user_basic_data_id as user_id',
      'gsh.status_code as account_status_code',
    )
    .where({
      'fxs.id': id,
      'fxs.delete_flag': flag.FALSE,
    })
    .first()
}

module.exports = {
  getTradingAccountFxsInfo,
  updateDataById,
  checkAccountStatusClosed,
}
