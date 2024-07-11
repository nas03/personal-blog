const { pathPayment, version } = require('constant')

module.exports.verifyTokenPayment = (event, context, callback) => {
  try {
    context.callbackWaitsForEmptyEventLoop = false

    verifyFunc(event).then((data) => {
      if (data.code === 200) {
        callback(null, data.result)
      } else {
        callback(data.result)
      }
    })
  } catch (error) {
    callback('Unauthorized')
  }
}

const verifyFunc = async (event) => {
  console.log('====== Request data: ', event)
  const authorizationToken = event.authorizationToken
  const mcToken = authorizationToken ? authorizationToken.split(' ')[1] : ''
  const action = 'execute-api:Invoke'
  let effect = 'Deny'
  if (
    event.methodArn.includes(pathPayment.MAX_CONNECT) && mcToken !== process.env.MAXCONNECT_ACCESS_TOKEN ||
    event.methodArn.includes(pathPayment.GO_LIVE_WEB) && mcToken !== process.env.GOLIVEWEB_ACCESS_TOKEN
  ) {
    return {
      code: 401,
      result: 'Unauthorized',
    }
  } else {
    effect = 'Allow'
    return {
      code: 200,
      result: {
        principalId: Date.now(),
        policyDocument: {
          Version: version,
          Statement: [
            {
              Action: action,
              Effect: effect,
              Resource: event.methodArn,
            },
          ],
        },
      },
    }
  }
}
