const utility = require('utility')

const { axios } = require('helper')

/* constant */
const { resCheck, code, message } = require('constant')

const scheduleClearBrowserProcess = async (event) => {
  try {
    console.log('Begin running clear browser process.')
    const apiSecretKey = process.env.CRAWL_DATA_ACCESS_TOKEN

    // Make API call
    const apiUrl = `${process.env.URL_CRAWL_DATA_API}/api/clear-process`
    const response = await axios.post(apiUrl, {}, {
      headers: { 'API_SECRET_KEY': apiSecretKey },
    })

    return utility.createResponse(true, response)
  } catch (error) {
    console.error(error)
    return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
  }
}

module.exports = {
  scheduleClearBrowserProcess,
}
