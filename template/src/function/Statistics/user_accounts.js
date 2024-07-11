const utility = require('utility')
const moment = require('moment')
const {
  code,
  message,
  resCheck,
  dateFormat,
  registrationSiteConstant,
  siteGroupConstant,
} = require('constant')
const {
  errorLogRepository,
  brokerRepository,
  inducedTradersStatisticsRepository,
} = require('repository')
const { split,
  isInteger,
  every,
  toNumber,
  map,
  reduce,
  filter,
} = require('lodash')

const getUserStatistics = async (event) => {
  try {
    // GET query
    const {
      signup_date = '',
      broker_ids = '',
    } = event.queryStringParameters

    const broker_ids_arr = broker_ids ? split(broker_ids, ',') : ''

    // VALIDATE signup_date
    if (!signup_date || !moment(signup_date, dateFormat.DATE_4, true).isValid()) {
      await errorLogRepository.createSystemLog(event, code.ERROR, message.fields_invalid, null)
      return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.fields_invalid)
    }

    if (moment(signup_date, dateFormat.DATE_4).isAfter(moment())) {
      return utility.createResponse(true, [])
    }

    // VALIDATE broker_ids
    if (!every(broker_ids_arr, (value) => isInteger(toNumber(value)) || value === '')) {
      await errorLogRepository.createSystemLog(event, code.ERROR, message.fields_invalid, null)
      return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.fields_invalid)
    }

    // GET user accounts with conditions: signup_date, broker_ids
    const signup_date_from = moment(signup_date, dateFormat.DATE_4).startOf('month').format(dateFormat.DATE)
    const signup_date_to = moment(signup_date, dateFormat.DATE_4).endOf('month').format(dateFormat.DATE)

    const [user_accounts, list_broker] = await Promise.all([
      inducedTradersStatisticsRepository.searchUserAccounts(signup_date_from, signup_date_to, broker_ids_arr),
      brokerRepository.getBrokersForStatistics(broker_ids_arr),
    ])

    // Calculate rate_user_active, total_user, new_account_number, add_account_number, active_account_number,
    // Add properties new_account_number_fxs, active_account_number_fxs, add_account_number_fxs for each user_account.
    user_accounts.forEach((account) => {
      // Check registration site
      const isRegistrationFXS = siteGroupConstant.FXS.SITE_IDS.includes(account.site_id) &&
        account.registration_site === registrationSiteConstant.FXS_SITE

      account.new_account_number_fxs = isRegistrationFXS ? account.new_account_number : 0
      account.active_account_number_fxs = isRegistrationFXS ? account.active_account_number : 0
      account.add_account_number_fxs = isRegistrationFXS ? account.add_account_number : 0
    })

    const user_accounts_grouped = reduce(user_accounts, (account, item) => {
      // Filter and group by site
      // Check site
      const siteObject = [siteGroupConstant.FX_PLUS, siteGroupConstant.FXS, siteGroupConstant.MY_FOREX]
        .find((site) => site.SITE_IDS.includes(item.site_id))

      if (!siteObject || (siteObject.BROKER_IDS && siteObject.BROKER_IDS[siteObject.SITE_IDS.indexOf(item.site_id)] !== item.broker_id)) {
        return account
      }

      const key = `${item.broker_id}-${item.site_id}-${item.signup_date}`

      if (!account[key]) {
        account[key] = {
          signup_date: item.signup_date,
          site_id: item.site_id,
          site_key: siteObject.KEY,
          broker_id: item.broker_id,
          broker_code: item.broker_code,
          broker_name: item.broker_name,
          ja_broker_name: item.ja_broker_name,
          en_broker_name: item.en_broker_name,
          cn_broker_name: item.cn_broker_name,
          kr_broker_name: item.kr_broker_name,
          new_account_number: item.new_account_number,
          active_account_number: item.active_account_number,
          add_account_number: item.add_account_number,
          new_account_number_fxs: item.new_account_number_fxs,
          active_account_number_fxs: item.active_account_number_fxs,
          add_account_number_fxs: item.add_account_number_fxs,
        }
      } else {
        account[key].new_account_number += item.new_account_number
        account[key].active_account_number += item.active_account_number
        account[key].add_account_number += item.add_account_number
        account[key].new_account_number_fxs += item.new_account_number_fxs
        account[key].active_account_number_fxs += item.active_account_number_fxs
        account[key].add_account_number_fxs += item.add_account_number_fxs
      }

      return account
    }, {})

    // Convert the result into an array of desired objects using lodash
    const user_accounts_final = map(Object.values(user_accounts_grouped), (account) => ({
      signup_date: account.signup_date,
      site_id: account.site_id,
      site_key: account.site_key,
      broker_id: account.broker_id,
      broker_code: account.broker_code,
      broker_name: account.broker_name,
      ja_broker_name: account.ja_broker_name,
      en_broker_name: account.en_broker_name,
      cn_broker_name: account.cn_broker_name,
      kr_broker_name: account.kr_broker_name,
      new_account_number: account.new_account_number,
      active_account_number: account.active_account_number,
      add_account_number: account.add_account_number,
      new_account_number_fxs: account.new_account_number_fxs,
      active_account_number_fxs: account.active_account_number_fxs,
      add_account_number_fxs: account.add_account_number_fxs,
    }))

    // Return all days in the specified month.
    // If the specified month is the current month: return all days until today
    // If the specified month is not the current month: return all days in the month
    // If the day has data, return the data, else return an empty array
    const is_current_month = moment().isSame(moment(signup_date, dateFormat.DATE_4, true), 'month')
    const start_date = moment(signup_date, dateFormat.DATE_4, true).startOf('month')
    const end_date = is_current_month ? moment() : moment(signup_date, dateFormat.DATE_4, true).endOf('month')

    const result = []
    for (let current_date = end_date.startOf('day'); current_date.isSameOrAfter(start_date); current_date.subtract(1, 'day')) {
      result.push({
        signup_date: current_date.clone().toISOString(),
        brokers: map(list_broker, (objBroker) => {
          let accounts = []
          const brokerFilter = filter(user_accounts_final, (obj) => {
            return objBroker.id === obj.broker_id && moment(obj.signup_date, dateFormat.DATE_TIME_ZONE).isSame(current_date, 'day')
          })
          if (brokerFilter.length) {
            accounts = map(brokerFilter, (broker) => {
              const rate_user_active_divide = utility.divideNumber(broker.active_account_number, broker.new_account_number)
              const rate_user_active_fxs_divide = utility.divideNumber(broker.active_account_number_fxs, broker.new_account_number_fxs)

              const rate_user_active_percent = utility.roundNumber((rate_user_active_divide * 100), 1)
              const rate_user_active_fxs_percent = utility.roundNumber((rate_user_active_fxs_divide * 100), 1)

              const rate_user_active = utility.toFixedNumber(rate_user_active_percent, 1)
              const rate_user_active_fxs = utility.toFixedNumber(rate_user_active_fxs_percent, 1)

              return {
                site_id: broker.site_id,
                site_key: broker.site_key,
                new_account_number: broker.new_account_number,
                new_account_number_fxs: broker.new_account_number_fxs,
                active_account_number: broker.active_account_number,
                active_account_number_fxs: broker.active_account_number_fxs,
                rate_user_active: rate_user_active,
                rate_user_active_fxs: rate_user_active_fxs,
                add_account_number: broker.add_account_number,
                add_account_number_fxs: broker.add_account_number_fxs,
                total_user: broker.new_account_number + broker.add_account_number,
                total_user_fxs: broker.new_account_number_fxs + broker.add_account_number_fxs,
              }
            })
          }

          return {
            broker_code: objBroker.broker_code,
            broker_name: objBroker.broker_name,
            ja_broker_name: objBroker.ja_broker_name,
            en_broker_name: objBroker.en_broker_name,
            cn_broker_name: objBroker.cn_broker_name,
            kr_broker_name: objBroker.kr_broker_name,
            accounts,
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

const getUserStatisticsDropdown = async (event) => {
  try {
    const [{ start_month_has_data }, brokers] =
        await Promise.all([
          inducedTradersStatisticsRepository.getStartMonthHasData(),
          brokerRepository.getAll(true),
        ])

    let start_month_has_data_result = moment(start_month_has_data, dateFormat.DATE_TIME_ZONE).format(dateFormat.DATE)
    if (!start_month_has_data) {
      start_month_has_data_result = moment().format(dateFormat.DATE)
    }

    return utility.createResponse(true, { start_month_has_data_result, brokers })
  } catch (error) {
    console.log(error)
    await errorLogRepository.createSystemLog(event, code.ERROR, message.server_error, error)
    return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
  }
}

module.exports = {
  getUserStatistics,
  getUserStatisticsDropdown,
}
