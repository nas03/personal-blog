/* constant */
const { platform: platformCM, dateFormat, flag, lotRebateCurrency, cbRebateCurrency, baseCurrency,
  errorMessageCodeConstant, errorKeyServer } = require('constant')

/* DB */
const { errorLogRepository } = require('repository')
const { checkBrokerExistById } = require('repository').brokerRepository
const { checkAccountTypeExist, getAccountTypeByBrokerId } = require('repository').accountTypeRepository
const { checkIbRankExist, getlistIbRankByborkerId } = require('repository').ibRankRepository
const { getListIdProductType } = require('repository').productTypeRepository
const { getDefaultSymbol } = require('repository').symbolRepository
const { rebatesMasterRepository } = require('repository')

/* library */
const moment = require('moment')
const _ = require('lodash')

/* utility */
const utility = require('utility')
const { axios } = require('helper')

const createRebateMaster = async (event) => {
  try {
    const eventBody = JSON.parse(event.body) || {}
    const { broker_id, account_type_id, ib_rank_id, product_type_id, platform,
      master_name, ts_start, ts_end, description, rebate_detail } = eventBody
    const staff_id = utility.getUserIdByToken(event)

    // validate field require
    if (!broker_id ||
      !account_type_id ||
      !ib_rank_id ||
      !product_type_id ||
      !platform ||
      !master_name ||
      !ts_start ||
      !ts_end ||
      !description ||
      !rebate_detail
    ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    if (!moment(ts_start, dateFormat.DATE_TIME).isBefore(moment(ts_end, dateFormat.DATE_TIME))) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.CREATE_REBATE_MASTER.TIMESTAMP_INVALID])
    }

    // validate field format
    const arrValid = await Promise.all(
      [
        checkBrokerExistById(broker_id),
        checkAccountTypeExist(broker_id, account_type_id),
        checkIbRankExist(broker_id, ib_rank_id),
        getListIdProductType(product_type_id),
        [platformCM.MT4, platformCM.MT5].includes(platform),
        (moment(ts_start, dateFormat.DATE_TIME, true).isValid() && moment(ts_end, dateFormat.DATE_TIME, true).isValid()),
        (_.isArray(rebate_detail) && rebate_detail.length > 0 && _.every(rebate_detail, _.isObject)),
      ],
    )

    if (!arrValid.every((item) => item)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    const checkEnableFlag = [arrValid[0], arrValid[1], arrValid[2]]

    if (!checkEnableFlag.every((item) => item.enable_flag === flag.TRUE) ||
      !arrValid[3].length ||
      arrValid[3].every((item) => item.enable_flag === flag.FALSE) ||
      arrValid[0].enable_flag === flag.FALSE
    ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.CREATE_REBATE_MASTER.CHECK_ENABLE_FLAG])
    }


    // check rebate exist by broker,ib_rank , account_type and ts_start -> ts_end not duplicate
    const checkRebateExist = await rebatesMasterRepository.checkRebateExist(
      broker_id,
      ib_rank_id,
      account_type_id,
      product_type_id,
      ts_start,
      ts_end,
      platform,
    )

    if (checkRebateExist.length) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.CREATE_REBATE_MASTER.TIMESTAMP_INVALID])
    }

    // compare lot rebate and cashback rebate ,compare input list symbol with list symbol in DB
    const validateRebate = await _validateRebateDetail(
      event,
      platform,
      rebate_detail,
      arrValid[0].broker_code,
      arrValid[1].account_type_code,
      arrValid[3],
      broker_id,
      account_type_id,
    )

    if (validateRebate === errorKeyServer.NOT_VALID.LOT_REBATE) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.CREATE_REBATE_MASTER.NOT_VALID.LOT_REBATE])
    }

    if (validateRebate === errorKeyServer.GET_FAIL.RATE_BY_BASE_AND_SYMBOL) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.CREATE_REBATE_MASTER.VALIDATE_RATE_FAIL])
    }

    const payloadParentRebateMaster = {
      broker_id,
      account_type_id,
      ib_rank_id,
      platform,
      product_type_id: arrValid[3]
        .filter((item) => item.enable_flag === flag.TRUE)
        .map((item) => item.id)
        .join(),
      master_name,
      description,
      ts_start,
      ts_end,
      staff_id,
      enable_flag: flag.TRUE,
    }

    // create parent rebate master and create child rebate master
    await rebatesMasterRepository.createRebateMaster(payloadParentRebateMaster, rebate_detail)

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

async function _validateRebateDetail(
  event,
  platform,
  listChildRebateMaster,
  broker_code,
  account_type_code,
  listProductType,
  broker_id,
  account_type_id,
) {
  let valid = _.every(listChildRebateMaster, (obj) => {
    return [flag.TRUE, flag.FALSE].includes(obj.enable_flag) &&
      (!isNaN(obj.lot_rebate)) &&
      (Object.values(lotRebateCurrency).includes(obj.lot_rebate_currency)) &&
      (!isNaN(obj.cb_rebate)) &&
      (Object.values(cbRebateCurrency).includes(obj.cb_rebate_currency)) &&
      obj.symbol_id
  })

  if (!valid) return errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID

  const listSymbol = await getDefaultSymbol(
    broker_id,
    account_type_id,
    listProductType
      .filter((item) => item.enable_flag === flag.TRUE)
      .map((item) => item.id),
    platform,
    null,
    {})


  const listSymbolDifferent = _.differenceBy(listChildRebateMaster, listSymbol, 'symbol_id')

  if (listSymbolDifferent.length) return errorKeyServer.GET_FAIL.RATE_BY_BASE_AND_SYMBOL


  valid = listChildRebateMaster.map(async (item) => {
    return await validateCashbackRebate(event, platform, broker_code, account_type_code, item)
  })

  valid = await Promise.all(valid)

  for (const el of valid) {
    if (el === errorKeyServer.NOT_VALID.LOT_REBATE || el === errorKeyServer.GET_FAIL.RATE_BY_BASE_AND_SYMBOL) return el
  }
}

const getDefaulRebateMaster = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}
    const { broker_id, account_type_id, product_type_id, platform } = queryString

    if (!broker_id || !account_type_id || !product_type_id || !platform) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    const [listIdProductType, accountType, broker] = await Promise.all([
      getListIdProductType(product_type_id),
      checkAccountTypeExist(broker_id, account_type_id),
      checkBrokerExistById(broker_id),
    ])


    if (!listIdProductType.length ||
      !accountType ||
      accountType.enable_flag === flag.FALSE ||
      !broker ||
      broker.enable_flag === flag.FALSE
    ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    const pagination = utility.getPagination(queryString)
    const listSymbol = await getDefaultSymbol(
      broker_id,
      account_type_id,
      listIdProductType
        .filter((item) => item.enable_flag === flag.TRUE)
        .map((item) => item.id),
      platform,
      pagination,
      queryString,
    )

    const response = listSymbol.map((item) => {
      return {
        lot_rebate: '0.00',
        lot_rebate_currency: lotRebateCurrency.USD,
        cb_rebate: '0.00',
        cb_rebate_currency: cbRebateCurrency.USD,
        enable_flag: flag.FALSE,
        ...item,
      }
    })

    return utility.createResponse(true, response)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getRebateDropdown = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}
    const { broker_id, isShowOnlyEnable } = queryString
    if (!broker_id) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    const listBrokerId = broker_id.split(',').filter(Number)
    let [ibRanks, accountTypes] = await Promise.all([
      getlistIbRankByborkerId(listBrokerId, isShowOnlyEnable),
      getAccountTypeByBrokerId(listBrokerId, isShowOnlyEnable),
    ])


    if (!isShowOnlyEnable) {
      const groupedBroker = _.groupBy(ibRanks.filter((item) => item.enable_flag === flag.TRUE), 'broker_id')

      ibRanks = ibRanks.map((item) => {
        if (item.enable_flag) {
          item.total_enable = groupedBroker[`${item.broker_id}`].length
        }
        return item
      })
    }

    const response = {
      ib_ranks: ibRanks,
      account_types: accountTypes,
      platform: [platformCM.MT4, platformCM.MT5],
    }

    return utility.createResponse(true, response)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const checkValidityRebate = async (event) => {
  try {
    const eventBody = JSON.parse(event.body) || {}
    const { broker_code, account_type_code, rebate_detail, platform } = eventBody

    if (!broker_code || !account_type_code || !rebate_detail || !platform) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    let valid = rebate_detail.map(async (item) => {
      return await validateCashbackRebate(event, platform, broker_code, account_type_code, item, true)
    })

    valid = await Promise.all(valid)

    if (valid.every((item) => item === errorKeyServer.NOT_VALID.LOT_REBATE)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.CHECK_VALIDITY_REBATE.NOT_VALID.LOT_REBATE])
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const validateCashbackRebate = async (event, platform, broker_code, account_type_code, rebate_detail, isShowValid = false) => {
  let { lot_rebate, lot_rebate_currency, cb_rebate, cb_rebate_currency, contract_size, digit_size, profit_currency } = rebate_detail

  // check lot_rebate_currency is point or pips or SP%
  if ([lotRebateCurrency.POINTS, lotRebateCurrency.PIPS, lotRebateCurrency.SPP].includes(lot_rebate_currency) &&
    cb_rebate_currency === lot_rebate_currency) {
    return cb_rebate <= lot_rebate || errorKeyServer.NOT_VALID.LOT_REBATE
  }

  // check lot_rebate_currency EUR ,USD ,JPY
  if ([lotRebateCurrency.EUR, lotRebateCurrency.USD, lotRebateCurrency.JPY].includes(lot_rebate_currency)) {
    if ([cbRebateCurrency.SPP, cbRebateCurrency.P].includes(cb_rebate_currency)) return

    if (cb_rebate_currency === lot_rebate_currency) return cb_rebate <= lot_rebate || errorKeyServer.NOT_VALID.LOT_REBATE


    if (lot_rebate_currency !== lotRebateCurrency.USD) {
      const rate = await getRateByBaseAndSymbol(event, {
        broker: broker_code,
        kind: account_type_code,
        platform,
        pair: `${baseCurrency.USD}${lot_rebate_currency}`,
      }, `${lot_rebate_currency}${baseCurrency.USD}`)

      if (!rate && isShowValid) return

      if (!rate) return errorKeyServer.GET_FAIL.RATE_BY_BASE_AND_SYMBOL

      lot_rebate /= rate
    }

    if (cb_rebate_currency !== cbRebateCurrency.USD) {
      if (cb_rebate_currency === cbRebateCurrency.PIPS) {
        cb_rebate_currency = profit_currency
        cb_rebate = cb_rebate * contract_size * digit_size * 10
      } else if (cb_rebate_currency === cbRebateCurrency.POINTS) {
        cb_rebate_currency = profit_currency
        cb_rebate = cb_rebate * (contract_size * digit_size)
      }

      if (cb_rebate_currency !== cbRebateCurrency.USD) {
        const rate = await getRateByBaseAndSymbol(event, {
          broker: broker_code,
          kind: account_type_code,
          platform,
          pair: `${baseCurrency.USD}${cb_rebate_currency}`,
        }, `${cb_rebate_currency}${baseCurrency.USD}`)

        console.log(rate)

        if (!rate && isShowValid) return

        if (!rate) return errorKeyServer.GET_FAIL.RATE_BY_BASE_AND_SYMBOL

        cb_rebate /= rate
      }
    }

    return cb_rebate <= lot_rebate || errorKeyServer.NOT_VALID.LOT_REBATE
  }
}


const getRateByBaseAndSymbol = async (event, params, pairPermutation) => {
  try {
    const rate = await axios.get(`${process.env.URL_API_SYNC_RATE}/rates/getFromTick`, {
      params,
    })
    if (rate && rate.ask) return rate.ask
  } catch (error) {
    console.log(error)
    await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.RATE_BASE_SYMBOL.GET])
  }

  try {
    const rate = await axios.get(`${process.env.URL_API_SYNC_RATE}/rates/getFromTick`, {
      params: {
        ...params,
        pair: pairPermutation,
      },
    })

    if (rate && rate.bid) return 1 / rate.bid
  } catch (error) {
    console.log(error)
    await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.RATE_BASE_SYMBOL.GET])
  }

  return false
}

module.exports = {
  createRebateMaster,
  getDefaulRebateMaster,
  getRebateDropdown,
  checkValidityRebate,
  validateCashbackRebate,
}
