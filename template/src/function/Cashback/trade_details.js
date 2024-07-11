// library
const utility = require('utility')
const { errorLogRepository, cashbackManagementRepository, tradeDetailRepository } = require('repository')
const { code, message, rebateStatus, resCheck } = require('constant')

const scheduleCreateTradeDetail = async (event) => {
  try {
    console.log('====== Job 2 trade details start ======')
    // get cash back management
    const listCachBackManagement = await cashbackManagementRepository.getCashBackJob2(process.env.CASHBACK_UNPROCESSED_LIMIT)

    // handle init data trade detail
    const listId = []
    const listDataTradeDetails = listCachBackManagement.map((item) => {
      listId.push(item.id)
      return {
        id: _generateIdTradeDetail(),
        cashback_management_id: item.id,
        broker_id: item.broker_id,
        mt_account_no: item.mt_account_no,
        portfolio_id: item.portfolio_id,
        order_no: item.order_no,
        deal_no: item.deal_no,
        ticket: item.ticket,
        order_type: item.order_type,
        platform: item.platform,
        account_type_id: item.account_type_id,
        myforex_symbol_id: item.myforex_symbol_id,
        open_time: item.open_time,
        close_time: item.close_time,
        profit: item.profit,
        volume: item.volume,
        rebate_status: rebateStatus.DURING_VERIFICATION,
        rebate_currency: item.add_cb_rebates_currency,
        rebate_amount: item.add_cb_rebates,
      }
    })

    // create trade details
    const result = await tradeDetailRepository.createTradeDetail(listId, listDataTradeDetails)
    if (!result) {
      await errorLogRepository.createSystemLog(event, code.ERROR, message.server_error)
      return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
    }
    return utility.createResponse(true)
  } catch (error) {
    console.error(error)
    await errorLogRepository.createSystemLog(event, code.ERROR, message.server_error, error)
    return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
  }
}

const _generateIdTradeDetail = () => {
  const min = Math.pow(10, 8)
  const max = Math.pow(10, 9)
  return Math.floor(Math.random() * (max - min)) + min
}

module.exports = {
  scheduleCreateTradeDetail,
}
