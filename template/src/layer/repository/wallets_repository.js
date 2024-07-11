// DB
const db = require('db').helper

// constant
const { flag } = require('constant')

const getWalletByUserId = async (user_id, type_wallet) => {
  const result = await db('wallets')
    .select(
      'id',
      'type_wallet',
      'currency',
      'total_assets',
      'wallet_status',
    )
    .where('user_basic_data_id', user_id)
    .where('type_wallet', type_wallet)
    .where('delete_flag', flag.FALSE)
    .first()
  return result ? result : null
}

const getWalletByWalletId = async (wallet_id) => {
  const result = await db('wallets')
    .select(
      'id',
      'type_wallet',
      'currency',
      'total_assets',
      'wallet_status',
    )
    .where('id', wallet_id)
    .where('delete_flag', flag.FALSE)
    .first()
  return result ? result : null
}

const getWalletByListWalletId = async (list_wallet_id) => {
  const result = await db('wallets')
    .select(
      'id',
      'type_wallet',
      'currency',
      'total_assets',
      'wallet_status',
    )
    .whereIn('id', list_wallet_id)
    .where('delete_flag', flag.FALSE)
  return result.length ? result : null
}

const getWalletsByUserId = async (user_id) => {
  return await db('wallets')
    .select(
      'id',
      'type_wallet',
      'currency',
      'total_assets',
      'wallet_status',
    )
    .where('user_basic_data_id', user_id)
    .where('delete_flag', flag.FALSE)
}

module.exports = {
  getWalletByUserId,
  getWalletByWalletId,
  getWalletByListWalletId,
  getWalletsByUserId,
}
