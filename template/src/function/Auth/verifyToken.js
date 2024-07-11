// CONSTANT
const { statusCode, code, version, errorMessageCodeConstant } = require('constant')
const { SUCCESS, FORBIDDEN, AUTHORIZATION } = code
const action = 'execute-api:Invoke'

// REPOSITORY
const { usersBasicDataRepository, siteMenuRepository, errorLogRepository } = require('repository')

const permissionsConfig = require('./permissions_config')
const jwt = require('jsonwebtoken')

module.exports.verifyToken = (event, context, callback) => {
  try {
    context.callbackWaitsForEmptyEventLoop = false
    verifyFunc(event).then((data) => {
      if (data.code === SUCCESS) {
        callback(null, data.result)
      } else if (data.code === FORBIDDEN) {
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
  // ON SERVER
  // HEADER -> AUTHORIZATION IN MIDDLEWARE IS "authorization"
  // HEADER -> AUTHORIZATION IN FUNCTION IS "Authorization"
  // FOR CONVENIENCE WHEN TEST API POSTMAN, WE CONFIG:
  console.log(event)
  const authorizationToken = event.headers.authorization || event.headers.Authorization
  const jwtToken = authorizationToken ? authorizationToken.split(' ')[1] : ''
  return jwt.verify(jwtToken, process.env.JWT_SECRET, async (err, decode) => {
    if (err) {
      await errorLogRepository.createResponseAndLog(event, err, null, [errorMessageCodeConstant.P2T_COMMON.ACCESS_TOKEN_INVALID], null, AUTHORIZATION)
      return createResponseVerifyFunc(AUTHORIZATION)
    }

    const userData = await usersBasicDataRepository.getUserLoginData({ 'ubd.id': decode.user_id })

    if (!userData || userData.account_status_code !== statusCode.APPROVED) {
      await errorLogRepository.createResponseAndLog(event, userData, null,
        [errorMessageCodeConstant.CHECK_PERMISSION.ACCOUNT_IS_NOT_ACTIVE], null, FORBIDDEN)
      return createResponseVerifyFunc(FORBIDDEN, errorMessageCodeConstant.CHECK_PERMISSION.ACCOUNT_IS_NOT_ACTIVE, decode, event)
    }

    // CHECK USER ACCESS RESOURCE
    const access = await accessPermission(event, {
      authorization_id: userData.authorization_id,
      admin_with_site_id: userData.admin_with_site_id.split(',').map(Number),
    })

    if (!access) {
      await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.CHECK_PERMISSION.NOT_ACCESS_PERMISSION], null, FORBIDDEN)
      return createResponseVerifyFunc(FORBIDDEN, errorMessageCodeConstant.CHECK_PERMISSION.NOT_ACCESS_PERMISSION, decode, event)
    }

    return createResponseVerifyFunc(SUCCESS, null, decode, event)
  })
}

const accessPermission = async (event, adminInfo) => {
  try {
    const { authorization_id, admin_with_site_id } = adminInfo
    // CHECK API IS UNRESTRICTED
    const unRestricted = !permissionsConfig.some((el) =>
      el.path === event.requestContext.resourcePath &&
      el.method === event.requestContext.httpMethod)

    if (unRestricted) return true

    // GET MENU KEY BY HTTP
    const menuKeys = permissionsConfig.find((el) =>
      el.path === event.requestContext.resourcePath &&
      el.method === event.requestContext.httpMethod)?.menu_key || false

    if (!menuKeys) return false

    // CHECK USER PERMISSION
    const userAccess = await siteMenuRepository.checkResourceAccess(authorization_id, admin_with_site_id, menuKeys)
    if (!userAccess) return false

    return true
  } catch (error) {
    console.log(error)
    return false
  }
}

const createResponseVerifyFunc = (code, message, decode, event ) =>{
  if (code === AUTHORIZATION) {
    return {
      code: AUTHORIZATION,
      result: 'Unauthorized',
    }
  }

  return {
    code: code,
    result: {
      principalId: decode.iat,
      policyDocument: {
        Version: version,
        Statement: [
          {
            Action: action,
            Effect: code === SUCCESS ? 'Allow' : 'Deny',
            Resource: event.methodArn,
          },
        ],
      },
      ...(code === SUCCESS ? {} : { context: { message: message } }),
    },
  }
}
