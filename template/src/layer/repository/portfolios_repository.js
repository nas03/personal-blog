const { flag, portfolioAccountMode } = require('constant')
const db = require('db').helper

const checkPortfolioIsExist = async (portfolioId, userId) => {
  const data = await db('portfolios')
    .select('id')
    .where({
      'portfolio_id': portfolioId,
      'user_basic_data_id': userId,
      'delete_flag': flag.FALSE,
    })
    .first()
  return data ? true : false
}

const getListPortfolioByUserId = async (userId) => {
  const dataPortfolios = await db('portfolios as p')
    .leftJoin('users_basic_data as users', 'users.id', 'p.user_basic_data_id')
    .select(
      'p.id',
      'p.user_basic_data_id as user_id',
      'p.portfolio_id',
      'p.order_by_user',
      'p.portfolio_name',
      'p.portfolio_name_default',
      'p.portfolio_description',
      'p.portfolio_description_default',
      'p.publish_target',
      'p.publish_range',
      'p.broker_name',
      'p.trading_method',
      'p.setting_status',
      'p.account_no',
      'p.server_id',
      'p.account_mode',
      'p.leverage',
      'p.currency',
      'p.platform',
      'p.account_type',
      'p.currency',
      'p.leverage',
      'p.ts_regist',
    )
    .where({
      'p.delete_flag': flag.FALSE,
      'p.user_basic_data_id': userId,
      'users.delete_flag': flag.FALSE,
    })
    .orderBy('p.ts_regist', 'desc')

  return dataPortfolios
}

const getListPortfolioByOriginName = async (portfolio_name, user_id) => {
  const result = await db('portfolios')
    .select('portfolio_name as name')
    .where({
      user_basic_data_id: user_id,
      delete_flag: flag.FALSE,
    })
    .whereILike('portfolio_name', `${portfolio_name}%`)

  return result
}

const updatePortfolioSetting = async (objectUpdate, portlolioId) => {
  const result = await db.transaction(async (trx) => {
    const isUpdate = await trx('portfolios')
      .update(objectUpdate)
      .where('portfolio_id', portlolioId)
      .where('delete_flag', flag.FALSE)

    if (!isUpdate) {
      return false
    } else {
      return true
    }
  })

  return result
}

const getPortfolioDetail = async (portfolio_id) => {
  const result = await db('portfolios as p')
    .select(
      'p.id',
      'p.user_basic_data_id as user_id',
      'p.account_no',
      'p.portfolio_name',
      'p.portfolio_description',
      'p.trading_method',
      'p.publish_target',
      'p.publish_range',
    )
    .where('p.delete_flag', flag.FALSE)
    .where('p.portfolio_id', portfolio_id)
  return result.length ? result[0] : null
}

const getPortfolioRegisteredCashback = async (accountNo, brokerCode, platform) => {
  const data = await db('portfolios')
    .select(
      'id',
      'user_basic_data_id as user_id',
      'portfolio_id',
      'account_no',
      'broker_id',
      'platform',
      'cashback_flag',
      'cashback_usable_flag',
    )
    .where({
      'account_no': accountNo,
      'broker_id': brokerCode,
      'platform': platform,
      'account_mode': portfolioAccountMode.REAL,
      'delete_flag': flag.FALSE,
    })
    .first()

  if (!data) {
    return null
  } else if (data.cashback_usable_flag === flag.FALSE) {
    await db('portfolios')
      .update({ cashback_usable_flag: flag.TRUE })
      .where({ id: data.id })

    return null
  } else if (data.cashback_flag === flag.TRUE) {
    return data
  }

  return null
}

module.exports = {
  getListPortfolioByUserId,
  updatePortfolioSetting,
  checkPortfolioIsExist,
  getListPortfolioByOriginName,
  getPortfolioDetail,
  getPortfolioRegisteredCashback,
}
