const utility = require('utility')

const { axios } = require('helper')

/* constant */
const { resCheck, code, message, brokerCrawl, brokerID } = require('constant')

const scheduleCrawlTransaction = async (event) => {
  try {
    const brokerAbbrev = event.queryStringParameters.broker
    let params = {}
    if (brokerID[brokerAbbrev] === brokerID.EXN) {
      const rangDate = event.queryStringParameters.range_date
      const apiRequest = event.queryStringParameters.api_request
      const rangDays = event.queryStringParameters.range_days

      params = {
        range_date: rangDate,
        api_request: apiRequest,
        range_days: rangDays,
      }
    }

    console.log(`${brokerAbbrev} transaction crawl schedule begin`)
    const apiSecretKey = process.env.CRAWL_DATA_ACCESS_TOKEN


    // Make API call
    const apiPath = `${process.env.URL_CRAWL_DATA_API}/crawl/${brokerCrawl[brokerAbbrev]}`
    const response = await axios.get(apiPath, {
      headers: { 'API_SECRET_KEY': apiSecretKey },
      params: params,
    })

    return utility.createResponse(true, response)
  } catch (error) {
    console.error(error)
    return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
  }
}

module.exports = {
  scheduleCrawlTransaction,
}
