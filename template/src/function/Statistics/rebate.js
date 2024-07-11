const {
  errorLogRepository,
  rebateStatisticsRepository,
  brokerRepository } = require('repository')
const { code, message, resCheck, dateFormat, siteGroupConstant } = require('constant')
const utility = require('utility')
const moment = require('moment')
const {
  split,
  isInteger,
  every,
  toNumber,
  map,
  filter,
} = require('lodash')

const getRebateStatistics = async (event) => {
  try {
    // GET query
    const {
      close_date = '',
      broker_ids = '',
      products_type_name = '',
    } = event.queryStringParameters

    const broker_ids_arr = broker_ids ? split(broker_ids, ',') : ''

    // VALIDATE close_date
    if (!close_date || !moment(close_date, dateFormat.DATE_4, true).isValid()) {
      await errorLogRepository.createSystemLog(event, code.ERROR, message.fields_invalid, null)
      return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.fields_invalid)
    }

    // VALIDATE broker_ids
    if (!every(broker_ids_arr, (value) => isInteger(toNumber(value)) || value === '')) {
      await errorLogRepository.createSystemLog(event, code.ERROR, message.fields_invalid, null)
      return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.fields_invalid)
    }

    // GET statistic rebate with conditions: close_date, broker_ids, products_type_name
    // And GET the start month has data
    const close_date_from = moment(close_date, dateFormat.DATE_4).startOf('month').format(dateFormat.DATE)
    const close_date_to = moment(close_date, dateFormat.DATE_4).endOf('month').format(dateFormat.DATE)

    let [rebate_statistics, list_broker] = await Promise.all([
      rebateStatisticsRepository.searchRebateStatistics(close_date_from, close_date_to, broker_ids_arr, products_type_name),
      brokerRepository.getBrokersForStatistics(broker_ids_arr),
    ])

    // Filter and group by site
    rebate_statistics = rebate_statistics.filter((item) => {
      // Check site
      const siteObject = [siteGroupConstant.FX_PLUS, siteGroupConstant.FXS, siteGroupConstant.MY_FOREX]
        .find((site) => site.SITE_IDS.includes(item.site_id))

      if (!siteObject) {
        return false
      }

      item.site_key = siteObject.KEY

      return !siteObject.BROKER_IDS || siteObject.BROKER_IDS[siteObject.SITE_IDS.indexOf(item.site_id)] === item.broker_id
    })

    // Return all days in the specified month.
    // If the specified month is the current month: return all days until today
    // If the specified month is not the current month: return all days in the month
    // If the day has data, return the data, else return an empty array
    const is_current_month = moment().isSame(moment(close_date, dateFormat.DATE_4, true), 'month')
    const start_date = moment(close_date, dateFormat.DATE_4, true).startOf('month')
    const end_date = is_current_month ? moment() : moment(close_date, dateFormat.DATE_4, true).endOf('month')

    const result = []
    for (let current_date = end_date.startOf('day'); current_date.isSameOrAfter(start_date); current_date.subtract(1, 'day')) {
      result.push({
        close_date: current_date.clone().toISOString(),
        brokers: map(list_broker, (objBroker) => {
          let statistics = []
          const brokerFilter = filter(rebate_statistics, (obj) => {
            return objBroker.id === obj.broker_id && moment(obj.close_date, dateFormat.DATE_TIME_ZONE).isSame(current_date, 'day')
          })
          if (brokerFilter.length) {
            statistics = map(brokerFilter, (broker) => ({
              site_id: broker.site_id,
              site_key: broker.site_key,
              trading_volume: broker.trading_volume,
              number_of_trade: broker.number_of_trade,
              e_rebate_usd: broker.e_rebate_usd,
              average: utility.roundNumber(broker.e_rebate_usd / broker.number_of_trade, 2),
            }))
          }

          return {
            broker_code: objBroker.broker_code,
            broker_name: objBroker.broker_name,
            ja_broker_name: objBroker.ja_broker_name,
            en_broker_name: objBroker.en_broker_name,
            cn_broker_name: objBroker.cn_broker_name,
            kr_broker_name: objBroker.kr_broker_name,
            statistics,
          }
        }),
      })
    }

    return utility.createResponse(true, result)
  } catch (error) {
    console.log(error)
    await errorLogRepository.createSystemLog(event, code.ERROR, message.server_error, error)
    return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
  }
}

const getRebateStatisticsDropdown = async (event) => {
  try {
    let [{ start_month_has_data }, brokers] =
        await Promise.all([
          rebateStatisticsRepository.getStartMonthHasData(),
          brokerRepository.getAll(true),
        ])

    if (!start_month_has_data) {
      start_month_has_data = moment().toLocaleString()
    }

    return utility.createResponse(true, { start_month_has_data, brokers })
  } catch (error) {
    console.log(error)
    await errorLogRepository.createSystemLog(event, code.ERROR, message.server_error, error)
    return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
  }
}

module.exports = {
  getRebateStatistics,
  getRebateStatisticsDropdown,
}
