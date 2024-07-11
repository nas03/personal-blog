// LIBRARY
const { axios } = require('helper')
const moment = require('moment')
const authHeadersBuilder = require('./auth_headers_builder')

// CONSTANT
const { dateFormat } = require('constant')
const { envCommon, commonSiteId } = require('constant')
const utility = require('utility')

const contentType = 'application/json'

async function createScreeningCase(name, dob) {
  const env = await utility.getEnvConfig([
    envCommon.WC1_API_KEY,
    envCommon.WC1_API_SECRET,
    envCommon.WC1_URL,
    envCommon.WC1_GROUP_ID,
  ], commonSiteId.P2TECH)
  const WC1_API_KEY = env[envCommon.WC1_API_KEY]
  const WC1_API_SECRET = env[envCommon.WC1_API_SECRET]
  const WC1_URL = env[envCommon.WC1_URL]
  const WC1_GROUP_ID = env[envCommon.WC1_GROUP_ID]
  const apiKey = WC1_API_KEY
  const apiSecret = WC1_API_SECRET
  const groupId = WC1_GROUP_ID
  const url = WC1_URL + '/cases/screeningRequest'
  const method = 'POST'

  const payload = JSON.stringify({
    groupId: groupId,
    entityType: 'INDIVIDUAL',
    caseId: '',
    providerTypes: ['WATCHLIST'],
    caseScreeningState: {
      WATCHLIST: 'INITIAL',
    },
    name: name,
    nameTransposition: false,
    secondaryFields: [
      {
        typeId: 'SFCT_2',
        dateTimeValue: {
          timelinePrecision: 'ON',
          pointInTimePrecision: 'DAY',
          utcDateTime: moment.utc(dob, dateFormat.DATE).valueOf(),
          timeZone: null,
        },
      },
    ],
    customFields: [],
  })
  const authHeaders = authHeadersBuilder.generateAuthorizationHeaders(apiKey, apiSecret, method, url, contentType, payload)
  const options = {
    method: method,
    url: url,
    headers: authHeaders,
    data: payload,
  }
  console.log('Auth Headers:', authHeaders)
  try {
    const response = await axios(options)
    console.log('Success Response Headers:', response.headers)
    return response
  } catch (error) {
    if (error.response) {
      console.log('Error Response Headers:', error.response.headers)
    } else {
      // Handle other errors (e.g. network errors)
      console.error('Error:', error.message)
    }
  }
}

async function onGoingScreeningCase(caseSystemId) {
  const env = await utility.getEnvConfig([
    envCommon.WC1_API_KEY,
    envCommon.WC1_API_SECRET,
    envCommon.WC1_URL,
  ], commonSiteId.P2TECH)
  const WC1_API_KEY = env[envCommon.WC1_API_KEY]
  const WC1_API_SECRET = env[envCommon.WC1_API_SECRET]
  const WC1_URL = env[envCommon.WC1_URL]
  const apiKey = WC1_API_KEY
  const apiSecret = WC1_API_SECRET
  const method = 'PUT'
  const url = WC1_URL + `/cases/${caseSystemId}/ongoingScreening`

  const payload = JSON.stringify({ providerTypes: ['WATCHLIST'], note: 'string' })
  const authHeaders = authHeadersBuilder.generateAuthorizationHeaders(apiKey, apiSecret, method, url, contentType, payload)
  const options = {
    method: method,
    url: url,
    headers: authHeaders,
    data: payload,
  }

  console.log('Auth Headers:', authHeaders)
  try {
    const response = await axios(options)
    console.log('Success Response Headers:', response.headers)
    return response
  } catch (error) {
    if (error.response) {
      console.log('Error Response Headers:', error.response.headers)
    } else {
      // Handle other errors (e.g. network errors)
      console.error('Error:', error.message)
    }
  }
}

async function getListWorldCheck(case_id) {
  const env = await utility.getEnvConfig([
    envCommon.WC1_API_KEY,
    envCommon.WC1_API_SECRET,
    envCommon.WC1_URL,
  ], commonSiteId.P2TECH)
  const WC1_API_KEY = env[envCommon.WC1_API_KEY]
  const WC1_API_SECRET = env[envCommon.WC1_API_SECRET]
  const WC1_URL = env[envCommon.WC1_URL]
  const apiKey = WC1_API_KEY
  const apiSecret = WC1_API_SECRET
  const method = 'GET'
  const url = WC1_URL + '/cases/' + case_id + '/results'
  const authHeaders = authHeadersBuilder.generateAuthorizationHeaders(apiKey, apiSecret, method, url)
  const options = {
    method: method,
    url: url,
    headers: authHeaders,
  }

  console.log('Auth Headers:', authHeaders)
  try {
    const response = await axios(options)
    console.log('Success Response Headers:', response.headers)
    return response
  } catch (error) {
    if (error.response) {
      console.log('Error Response Headers:', error.response.headers)
    } else {
      // Handle other errors (e.g. network errors)
      console.error('Error:', error.message)
    }
  }
}

async function getDetailsWorldCheck(ref_id) {
  const env = await utility.getEnvConfig([
    envCommon.WC1_API_KEY,
    envCommon.WC1_API_SECRET,
    envCommon.WC1_URL,
  ], commonSiteId.P2TECH)
  const WC1_API_KEY = env[envCommon.WC1_API_KEY]
  const WC1_API_SECRET = env[envCommon.WC1_API_SECRET]
  const WC1_URL = env[envCommon.WC1_URL]
  const apiKey = WC1_API_KEY
  const apiSecret = WC1_API_SECRET
  const method = 'GET'
  const url = WC1_URL + '/reference/records/' + ref_id
  const authHeaders = authHeadersBuilder.generateAuthorizationHeaders(apiKey, apiSecret, method, url)
  const options = {
    method: method,
    url: url,
    headers: authHeaders,
  }

  console.log('Auth Headers:', authHeaders)
  try {
    const response = await axios(options)
    console.log('Success Response Headers:', response.headers)
    return response
  } catch (error) {
    if (error.response) {
      console.log('Error Response Headers:', error.response.headers)
    } else {
      // Handle other errors (e.g. network errors)
      console.error('Error:', error.message)
    }
  }
}

module.exports = {
  getListWorldCheck,
  getDetailsWorldCheck,
  createScreeningCase,
  onGoingScreeningCase,
}
