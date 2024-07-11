const crypto = require('crypto')

function generateAuthorizationHeaders(apiKey, apiSecret, method, url, contentType, payload) {
  validatePayload(contentType, payload)

  const date = getDate()
  const authorization = generateAuthorizationHeader(apiKey, apiSecret, method, url, contentType, payload, date)
  const authorizationHeaders = {
    'Date': date,
    'Authorization': authorization,
  }
  if (!!payload) {
    authorizationHeaders['Content-Type'] = contentType
    authorizationHeaders['Content-Length'] = payload.length?.toString()
  }

  return authorizationHeaders
}

function validatePayload(contentType, payload) {
  // eslint-disable-next-line eqeqeq
  if (contentType != null && !contentType.toString().startsWith('application/json')) {
    throw new Error('Unsupported content type: ' + contentType)
  }
  // eslint-disable-next-line eqeqeq
  if (payload == null && contentType != null) {
    throw new Error('The request payload (body) has not been provided')
  }
  // eslint-disable-next-line eqeqeq
  if (contentType == null && payload != null) {
    throw new Error('The content type of request payload (body) has not been provided')
  }
}

function getDate() {
  return new Date().toUTCString()
}

function generateAuthorizationHeader(apiKey, apiSecret, method, url, contentType, payload, date) {
  const httpMethod = method.toLowerCase()
  const dataToSign = createDataToSign(httpMethod, url, contentType, payload, date)
  const signature = generateHmacBase(dataToSign, apiSecret)

  return getAuthHeader(signature, apiKey, payload)
}

function createDataToSign(method, url, contentType, payload, date) {
  const parsedUrl = new URL(url)
  let dataToSign = '(request-target): ' + method + ' ' + parsedUrl.pathname + '\nhost: ' + parsedUrl.host + '\ndate: ' + date
  if (!!payload) {
    dataToSign += '\ncontent-type: ' + contentType + '\n' + 'content-length: ' + payload.length + '\n' + payload
  }

  return dataToSign
}

function generateHmacBase(dataToSign, apiSecret) {
  return crypto.createHmac('sha256', apiSecret).update(dataToSign).digest('base64')
}

function getAuthHeader(signature, apiKey, payload) {
  const headers = !!payload ? '(request-target) host date content-type content-length' :
    '(request-target) host date'
  return 'Signature keyId="' + apiKey + '",algorithm="hmac-sha256",headers="' + headers + '",signature="' + signature + '"'
}

exports.generateAuthorizationHeaders = generateAuthorizationHeaders
