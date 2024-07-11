const axios = require('axios')
const https = require('https')
const { code, resCheck, message } = require('constant')
// const qs = require('qs')
const querystring = require('querystring')

// utility
const utility = require('utility')

const { getObjectPaypay } = require('helper').aws

const testApiPaypay = async (event) =>{
  try {
    console.log('event:', event)
    const authorizationToken = event.headers.Authorization
    const mcToken = authorizationToken ? authorizationToken.split(' ')[1] : ''
    if (mcToken !== 'Y1nvosYE1FKmmVoldYc1GNM3cgg9DmPx') {
      return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
    }

    let bodyData = event.body
    const { method, url, isUseSSL, isAddHeaders } = event.queryStringParameters || {}

    // GET SSL
    const clientCrt = await getObjectPaypay('dev/clcerts.crt')
    const caCrt = await getObjectPaypay('dev/cacerts.crt')
    const clientKey = await getObjectPaypay('dev/nocerts.key')

    const clientCrtString = await streamToString(clientCrt.Body)
    const caCrtString = await streamToString(caCrt.Body)
    const clientKeyString = await streamToString(clientKey.Body)

    const httpsAgent = new https.Agent({
      cert: clientCrtString,
      ca: caCrtString,
      key: clientKeyString,
    })

    let config = {}
    if (isUseSSL) {
      config = {
        httpsAgent: httpsAgent,
      }
    }

    console.log(bodyData)
    const bodyObj = querystring.parse(bodyData)
    let headers = {}
    if (bodyObj['headers']) {
      headers = JSON.parse(bodyObj['headers'])
      delete bodyObj.headers
      bodyData = querystring.stringify(bodyObj)
    }

    if (isAddHeaders) {
      headers = {
        'HD_VL': '0101',
        'HD_MsgClass': 'RQ',
        'HD_Kind': 'RN10',
        'HD_CompCode': '0000',
        'HD_ReqDateTime': '20230912131636777',
        'HD_TranId': 'J12023091213163600000002',
      }
    }

    // const result = {}
    const instance = axios.create()

    const result = await instance({
      method: method,
      url: url,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        ...headers,
      },
      data: bodyData,
      ...config,
    })

    console.log('result:', result)
    return utility.createResponse(true, result?.data)
  } catch (error) {
    console.log(error)
    return utility.createResponse(resCheck.ERROR, { message: error.message, data: error }, code.ERROR, message.server_error)
  }
}

const streamToString = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = []
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  })

module.exports = {
  testApiPaypay,
}
