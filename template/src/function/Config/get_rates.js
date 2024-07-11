const { dateFormat, rateType, errorMessageCodeConstant,
  batchTypes, resultTypes, resultDetailMessages, resultDetailIds } = require('constant')

/* library */
const { axios, aws } = require('helper')
const moment = require('moment')

/* function */
const utility = require('utility')

/* DB */
const { rateRepository, errorLogRepository, sequenceRepository, batchLogRepository } = require('repository')

const scheduleGetExchangeRates = async (event) => {
  let parentBatchLogId
  const processStartTime = moment.utc().format(dateFormat.DATE_TIME_ZONE)
  let totalCount = 0

  try {
    parentBatchLogId = await sequenceRepository.updateAndGetBatchId()

    parentBatchLogId && await batchLogRepository.createNewBatchLogBegin(parentBatchLogId, batchTypes.GET_EXCHANGE_RATE)

    // send message to AWS SQS
    const sqsMessage = utility.generateSqsMessage(parentBatchLogId, resultDetailIds.E_1028002)

    if (parentBatchLogId) {
      // timeout setting: 30s
      await aws.sendSqsMessage(sqsMessage, 30)
    }

    // get current rates
    const currentRates = await rateRepository.getRateByType(rateType.LATEST)

    // call exchange rate API
    const arrCurrency = [['JPY', 'USD,EUR'], ['USD', 'EUR,JPY'], ['EUR', 'JPY,USD']]
    const newRates = await Promise.all(arrCurrency.map((currency) => {
      return axios({
        method: 'get',
        url: `${process.env.URL_APILAYER}/exchangerates_data/latest`,
        params: {
          symbols: currency[1],
          base: currency[0],
        },
        headers: {
          'apikey': process.env.APIKEY_APILAYER,
        },
      })
    }))

    // update and create rates
    const arrBaseSymbol = [
      { base: 'JPY', symbol: 'USD' },
      { base: 'JPY', symbol: 'EUR' },
      { base: 'USD', symbol: 'EUR' },
      { base: 'USD', symbol: 'JPY' },
      { base: 'EUR', symbol: 'JPY' },
      { base: 'EUR', symbol: 'USD' },
    ]
    const objs = []
    for (let i = 0; i < 6; i++ ) {
      const difference = currentRates.length ? (newRates[Math.floor(i / 2)].rates[arrBaseSymbol[i].symbol] - currentRates[i].rate) : 0
      const obj = {
        base: arrBaseSymbol[i].base,
        symbol: arrBaseSymbol[i].symbol,
        tick_time: moment.unix(newRates[Math.floor(i / 2)].timestamp).utc().format(dateFormat.DATE_TIME),
        rate: newRates[Math.floor(i / 2)].rates[arrBaseSymbol[i].symbol],
        difference: difference,
      }
      objs.push(obj)
    }
    const ids = []
    // get list id to update
    for (let i = 0; i < currentRates.length; i++) {
      ids.push(currentRates[i].id)
    }
    await rateRepository.createRates(ids, objs)

    // Counts processed records
    totalCount = objs.length

    // Handle insert batch log success
    parentBatchLogId && await batchLogRepository.createNewBatchLogProcessResult(
      parentBatchLogId,
      batchTypes.GET_EXCHANGE_RATE,
      resultTypes.SUCCESS,
      {
        total_count: totalCount,
        result_count: totalCount,
        process_start_time: processStartTime,
        process_end_time: moment.utc().format(dateFormat.DATE_TIME_ZONE),
        result_detail: {},
      },
    )

    return utility.createResponse(true, newRates)
  } catch (error) {
    console.log(error)

    parentBatchLogId && await batchLogRepository.createNewBatchLogProcessResult(
      parentBatchLogId,
      batchTypes.GET_EXCHANGE_RATE,
      resultTypes.ERROR,
      {
        total_count: totalCount,
        result_count: 0,
        process_start_time: processStartTime,
        process_end_time: moment.utc().format(dateFormat.DATE_TIME_ZONE),
        result_detail: {
          // eslint-disable-next-line new-cap
          result_detail_message: resultDetailMessages.E_1028001(error.sqlMessage || error.message),
        },
      },
      resultDetailIds.E_1028001,
    )

    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  } finally {
    parentBatchLogId && await batchLogRepository.createNewBatchLogEnd(parentBatchLogId, batchTypes.GET_EXCHANGE_RATE)
  }
}

const getRates = async (event) => {
  try {
    const resultRates = await rateRepository.getRateByType(rateType.LATEST)
    return utility.createResponse(true, resultRates)
  } catch (error) {
    console.error(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  scheduleGetExchangeRates,
  getRates,
}
