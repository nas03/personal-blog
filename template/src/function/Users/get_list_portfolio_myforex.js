const { portfoliosRepository, tradingAccountRepository, brokerRepository, usersBasicDataRepository, errorLogRepository } = require('repository')
const { errorMessageCodeConstant, commonSiteId, brokerID } = require('constant')

/* utility*/
const utility = require('utility')

const getListPortfolioMyforex = async (event)=>{
  const userErrorLog = {}
  try {
    const userId = event.pathParameters.userId
    event.user_id = userId

    // get user info
    const userInfo = await usersBasicDataRepository.getUserInfo(userId)
    userErrorLog.user_id = userInfo.user_id
    userErrorLog.site_id = userInfo.site_id

    let listPortfolio = []
    let listPortfolioId = []
    if (userInfo.site_id === commonSiteId.FXT) {
      // get list portfolio by userId
      listPortfolio = await tradingAccountRepository.getListPortfolioByUserId(userId)
      const broker = await brokerRepository.getBrokerById(brokerID.FXON)
      listPortfolio = listPortfolio.map((el) => ({ ...el, broker_name: broker.broker_name }))

      // get portfolio from server
      listPortfolioId = listPortfolio.map((item)=>item.portfolio_id)
    } else if (userInfo.site_id === commonSiteId.MY_FOREX) {
      // get list portfolio by userId
      listPortfolio = await portfoliosRepository.getListPortfolioByUserId(userId)

      // get portfolio from server
      listPortfolioId = listPortfolio.map((item)=>item.portfolio_id)
    }

    if (listPortfolioId.length) {
      const arrId = listPortfolioId.toString()

      const token = utility.setTokenForRedirectSite(userInfo)

      const headers = { 'Authorization': `Bearer ${token}` }

      const { data: data } = await utility.requestPortfolioMyforex('GET', `${process.env.URL_PORTFOLIO_MYFOREX}/${arrId}`, headers, null)

      // mapping data from server
      for (let i = 0; i < listPortfolio.length; i++) {
        for (let j = 0; j < data.length; j++) {
          if (listPortfolio[i].portfolio_id === data[j].alias_id) {
            listPortfolio[i] = {
              ...listPortfolio[i],
              operation_start: data[j].info?.start_time || null,
              account_type_name: data[j].info?.account_name || null,
            }
            break
          }
        }
      }
    }

    return utility.createResponse(true, _formatPortfolio(listPortfolio, userInfo.site_id))
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const _formatPortfolio = (listPortfolio, site_id) => {
  const portfolioKey = [
    'id',
    'user_id',
    'portfolio_id',
    'order_by_user',
    'portfolio_name',
    'portfolio_name_default',
    'portfolio_description',
    'portfolio_description_default',
    'publish_target',
    'publish_range',
    'broker_name',
    'operation_start',
    'account_type_name',
    'trading_method',
    'setting_status',
    'account_no',
    'server_id',
    'account_mode',
    'leverage',
    'currency',
    'platform',
    'account_type',
    'currency',
    'leverage',
    'ts_regist',
  ]

  return listPortfolio.map((portfolio) => {
    const newPortfolio = {}
    for (const key of portfolioKey) {
      if (site_id === commonSiteId.MY_FOREX) {
        newPortfolio[key] = portfolio[key] !== undefined ? portfolio[key] : null
      } else if (site_id === commonSiteId.FXT) {
        newPortfolio[key] = portfolio[key]
      }
    }

    return newPortfolio
  })
}

module.exports = {
  getListPortfolioMyforex,
}
