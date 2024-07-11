const utility = require('utility')

const { axios } = require('helper')

/* constant */
const { resCheck, code, message } = require('constant')

const scheduleCreateFileMT4 = async (event) => {
  try {
    console.log('Begin running process create file date time of MQ_MT4 system.')
    const apiKey = process.env.MQ_CRAWL_DATA_API_KEY

    // Make API call
    const apiPath = `${process.env.URL_MQ_CRAWL_API_MT4}/CreateFileDateTimeEventBridge/mq-crawl-schedule-create-file`
    axios.post(apiPath, {}, {
      headers: { 'XApiKey': apiKey },
    })

    return utility.createResponse(true, {})
  } catch (error) {
    console.error(error)
    return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
  }
}

const scheduleCreateFileMT5 = async (event) => {
  try {
    console.log('Begin running process create file date time of MQ_MT5 system.')
    const apiKey = process.env.MQ_CRAWL_DATA_API_KEY

    // Make API call
    const apiPath = `${process.env.URL_MQ_CRAWL_API_MT5}/CreateFileDateTimeEventBridge/mq-crawl-schedule-create-file`
    axios.post(apiPath, {}, {
      headers: { 'XApiKey': apiKey },
    })

    return utility.createResponse(true, {})
  } catch (error) {
    console.error(error)
    return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
  }
}

module.exports = {
  scheduleCreateFileMT4,
  scheduleCreateFileMT5,
}
