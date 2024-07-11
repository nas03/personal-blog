const utility = require('utility')

const { axios } = require('helper')

/* constant */
const { resCheck, code, message } = require('constant')

const scheduleDetectChangesHTML = async (event) => {
  try {
    console.log('Begin running process detect changes html of broker.')
    const apiSecretKey = process.env.CRAWL_DATA_ACCESS_TOKEN

    // Make API call
    const apiPath = `${process.env.URL_CRAWL_DATA_API}/api/schedule-check-html`
    const response = await axios.get(apiPath, {
      headers: { 'API_SECRET_KEY': apiSecretKey },
    })

    return utility.createResponse(true, response)
  } catch (error) {
    console.error(error)
    return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
  }
}

module.exports = {
  scheduleDetectChangesHTML,
}
