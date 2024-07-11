/* constant */
const { apiInfo, category, contentUpdate, statusCode, passwordDisplay, enable, tradingAccountType,
  flag, envCommon, server, errorMessageCodeConstant, errorKeyServer } = require('constant')

/* DB */
const { tradingAccountRepository, errorLogRepository, accountLeverageRepository, mtGroupsRepository,
  usersBasicDataRepository } = require('repository')

/* func */
const { createOperationHistory } = require('../History/operation_history')
const utility = require('utility')

/* helper */
const { convertFullToHalf } = require('helper').regex

/* library */
const CryptoJS = require('crypto-js')
const PasswordValidator = require('password-validator')

const changeAccountTrading = async (event) => {
  try {
    const id = event.pathParameters.id
    const ipAddress = event.requestContext.identity.sourceIp
    const deviceBrowser = event.headers['User-Agent']
    const authorizedPerson = utility.getUserIdByToken(event)
    const eventBody = JSON.parse(event.body)
    const { fieldName, fieldData } = eventBody

    // check account close
    if (!await tradingAccountRepository.checkUserCloseByMTAccount(id) ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.CHANGE_ACCOUNT_TRADING.ACCOUNT_CLOSE])
    }

    let response
    let leverage

    // get env from aws parameter store
    const env = await utility.getEnvConfig([
      envCommon.APIKEY_MT_CHANGE_LEVERAGE,
      envCommon.APIKEY_MT_CHANGE_READ_ONLY,
      envCommon.APIKEY_MT_CHANGE_REPORTS,
    ])

    // change leverage
    switch (fieldName) {
      case 'leverage':
        if (!fieldData.leverage) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
        }
        // get leverage
        leverage = await accountLeverageRepository.getAccountLeverageById(fieldData.leverage)
        if (!leverage || leverage.enable_flag === flag.FALSE) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }
        // update data
        response = await handleChangeAccount(
          id,
          apiInfo.CHANGE_LEVERAGE,
          { account_leverage_id: fieldData.leverage },
          { Leverage: Number(leverage.account_leverage.substring(2)) },
          true,
          event,
          env[envCommon.APIKEY_MT_CHANGE_LEVERAGE],
        )
        break

      // change read only
      case 'read_only':
        if (fieldData.read_only !== enable.OFF && fieldData.read_only !== enable.ON) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }
        response = await handleChangeAccount(
          id,
          apiInfo.CHANGE_READ_ONLY,
          { readonly: fieldData.read_only },
          { Readonly: fieldData.read_only },
          false,
          event,
          env[envCommon.APIKEY_MT_CHANGE_READ_ONLY],
        )
        break

      // change reports
      case 'reports':
        if (fieldData.reports !== enable.OFF && fieldData.reports !== enable.ON) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }
        response = await handleChangeAccount(
          id,
          apiInfo.CHANGE_REPORTS,
          { report: fieldData.reports },
          { Reports: fieldData.reports },
          false,
          event,
          env[envCommon.APIKEY_MT_CHANGE_REPORTS],
        )
        break
      default:
        break
    }
    if (response.isError ) {
      if (response.key === errorKeyServer.RESULT_NULL.TRADING_ACCOUNT_MT_INFO) {
        return await errorLogRepository.createResponseAndLog(event, response.errorDetail, null,
          [errorMessageCodeConstant.CHANGE_ACCOUNT_TRADING.RESULT_NULL.TRADING_ACCOUNT_MT_INFO])
      }
      if (response.key === errorKeyServer.RESULT_NULL.MT_GROUP) {
        return await errorLogRepository.createResponseAndLog(event, response.errorDetail, null,
          [errorMessageCodeConstant.CHANGE_ACCOUNT_TRADING.RESULT_NULL.MT_GROUP])
      }
      if (response.key === errorKeyServer.RESULT_NULL.GET_POSITION_MT) {
        return await errorLogRepository.createResponseAndLog(event, response.errorDetail, null,
          [errorMessageCodeConstant.CHANGE_ACCOUNT_TRADING.RESULT_NULL.GET_POSITION_MT])
      }

      if (response.messageConstant) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [response.messageConstant])
      }

      return await errorLogRepository.createResponseAndLog(event, response, null,
        [errorMessageCodeConstant.CHANGE_ACCOUNT_TRADING.UPDATE_FAIL.CHANGE_ACCOUNT_TRADING_DB])
    }

    if (fieldName === 'leverage' || fieldName === 'read_only') {
      // create operation history
      await createOperationHistory(
        response.data.user_id,
        response.data.site_id,
        category.TRADING_ACCOUNT_INFORMATION,
        fieldName === 'leverage' ? contentUpdate.CHANGE_LEVERAGE : contentUpdate.READ_ONLY_SETTING,
        fieldName === 'leverage' ? `${response.data.account_leverage}` : _renderDataEmailReceptionUpdate(response.data.readonly),
        fieldName === 'leverage' ? `${leverage.account_leverage}` : _renderDataEmailReceptionUpdate(fieldData.read_only),
        ipAddress,
        deviceBrowser,
        authorizedPerson,
        response.data.mt_account_no ? response.data.mt_account_no : null,
        id,
      )
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    switch (error.errorKey) {
      case errorKeyServer.UPDATE_FAIL.TRADING_ACCOUNT_MT_INFO:
        return await errorLogRepository.createResponseAndLog(event, error, null,
          [errorMessageCodeConstant.CHANGE_ACCOUNT_TRADING.UPDATE_FAIL.TRADING_ACCOUNT_MT_INFO])
      case errorKeyServer.UPDATE_FAIL.MT_GROUP:
        return await errorLogRepository.createResponseAndLog(event, error, null,
          [errorMessageCodeConstant.CHANGE_ACCOUNT_TRADING.UPDATE_FAIL.MT_GROUP])
      case errorKeyServer.UPDATE_FAIL.PORTFOLIO_MYFOREX:
        return await errorLogRepository.createResponseAndLog(event, error, null,
          [errorMessageCodeConstant.CHANGE_ACCOUNT_TRADING.UPDATE_FAIL.PORTFOLIO_MYFOREX])
      case errorKeyServer.GET_FAIL.POSITION_MT_ACCOUNT:
        return await errorLogRepository.createResponseAndLog(event, error, null,
          [errorMessageCodeConstant.CHANGE_ACCOUNT_TRADING.GET_FAIL.POSITION_MT_ACCOUNT])
      default:
        return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
    }
  }
}

const changePartnerCode = async (event) => {
  try {
    const id = event.pathParameters.id
    const eventBody = JSON.parse(event.body)
    const { partner_code } = eventBody

    if (!partner_code ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }
    // check account close
    if (!await tradingAccountRepository.checkUserCloseByMTAccount(id) ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.CHANGE_PARTNER_CODE.ACCOUNT_CLOSED])
    }

    const tradingAccountInfo = await tradingAccountRepository.getTradingAccountById(id)
    event.user_id = tradingAccountInfo?.user_id
    if (!tradingAccountInfo ) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.CHANGE_PARTNER_CODE.DO_NOT_EXIST.TRADING_ACCOUNT])
    }

    if (tradingAccountInfo.customer_partner_code !== partner_code) {
      const checkPartnerCode = await usersBasicDataRepository.checkMemberIdExist(partner_code)
      if (!checkPartnerCode) {
        return await errorLogRepository.createResponseAndLog(event, null, null,
          [errorMessageCodeConstant.CHANGE_PARTNER_CODE.DO_NOT_EXIST.PARTNER_CODE])
      }
    }

    if (tradingAccountInfo.mt_status_code === statusCode.REJECTED || tradingAccountInfo.mt_status_code === statusCode.CLOSED) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    if (tradingAccountInfo.mt_status_code === statusCode.APPROVED) {
      // get env from aws parameter store
      const env = await utility.getEnvConfig([envCommon.APIKEY_MT_CHANGE_AGENT])

      const dataTrading = {
        ServerKey: tradingAccountInfo.server_key,
        ApiKey: env[envCommon.APIKEY_MT_CHANGE_AGENT],
        MTAccount: `${tradingAccountInfo.mt_account_no}`,
        Agent: partner_code,
      }
      const url = utility.getMTURL(tradingAccountInfo.env_param_name, tradingAccountInfo.platform, apiInfo.CHANGE_AGENT)

      // update trading account mt info
      const userErrorLog = {
        user_id: tradingAccountInfo.user_id,
        site_id: tradingAccountInfo.site_id,
      }
      // eslint-disable-next-line max-len
      const isUpdateMTAccount = await tradingAccountRepository.updateTradingAccountMtInfo(id, { partner_code }, url, dataTrading, tradingAccountInfo, event, userErrorLog)
      if (isUpdateMTAccount.isError ) {
        if (isUpdateMTAccount.key === errorKeyServer.RESULT_NULL.TRADING_ACCOUNT_MT_INFO) {
          return await errorLogRepository.createResponseAndLog(event, isUpdateMTAccount.errorDetail, null,
            [errorMessageCodeConstant.CHANGE_PARTNER_CODE.RESULT_NULL.TRADING_ACCOUNT_MT_INFO])
        }
        if (isUpdateMTAccount.key === errorKeyServer.RESULT_NULL.MT_GROUP) {
          return await errorLogRepository.createResponseAndLog(event, isUpdateMTAccount.errorDetail, null,
            [errorMessageCodeConstant.CHANGE_PARTNER_CODE.RESULT_NULL.MT_GROUP])
        }
        return await errorLogRepository.createResponseAndLog(event, null, null,
          [errorMessageCodeConstant.CHANGE_PARTNER_CODE.UPDATE_FAIL.CHANGE_PARTNER_CODE])
      }
    } else {
      // update trading account (only database)
      const isUpdateMTAccount = await tradingAccountRepository.updateTradingAccount({ partner_code }, id)
      if (isUpdateMTAccount.isError) {
        return await errorLogRepository.createResponseAndLog(event, isUpdateMTAccount.error, null,
          [errorMessageCodeConstant.CHANGE_PARTNER_CODE.UPDATE_FAIL.CHANGE_PARTNER_CODE])
      }
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    switch (error.errorKey) {
      case errorKeyServer.UPDATE_FAIL.TRADING_ACCOUNT_MT_INFO:
        return await errorLogRepository.createResponseAndLog(event, error, null,
          [errorMessageCodeConstant.CHANGE_PARTNER_CODE.UPDATE_FAIL.TRADING_ACCOUNT_MT_INFO])
      case errorKeyServer.UPDATE_FAIL.MT_GROUP:
        return await errorLogRepository.createResponseAndLog(event, error, null,
          [errorMessageCodeConstant.CHANGE_PARTNER_CODE.UPDATE_FAIL.MT_GROUP])
      case errorKeyServer.UPDATE_FAIL.PORTFOLIO_MYFOREX:
        return await errorLogRepository.createResponseAndLog(event, error, null,
          [errorMessageCodeConstant.CHANGE_PARTNER_CODE.UPDATE_FAIL.PORTFOLIO_MYFOREX])
      default:
        return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
    }
  }
}

const checkPartnerCode = async (event) => {
  try {
    const eventBody = JSON.parse(event.body)
    const { partner_code, user_id } = eventBody || {}
    event.user_id = user_id

    if (!partner_code || !user_id) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    const user = await usersBasicDataRepository.checkUserExist(user_id)
    if (!user) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }
    if (user.customer_partner_code !== partner_code) {
      const checkPartnerCode = await usersBasicDataRepository.checkMemberIdExist(partner_code)
      if (!checkPartnerCode) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.CHECK_PARTNER.NOT_EXIST])
      }
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const changePassword = async (event) => {
  try {
    const { id } = event.pathParameters
    const eventBody = JSON.parse(event.body)

    // check account close
    if (!await tradingAccountRepository.checkUserCloseByMTAccount(id) ) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.CHANGE_TRADE_PASS.ACCOUNT_CLOSED])
    }

    const schema = new PasswordValidator()
    schema
      .is().min(8)
      .is().max(15)
      .has().uppercase(1)
      .has().lowercase(1)
      .has().digits(1)
      .has().symbols(1)
      .has().not().spaces()

    // validate password
    const payload = {}
    for (const item of Object.keys(eventBody)) {
      if (['trading_password', 'readonly_password'].includes(item)) {
        if (!eventBody[item]) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
        }

        // convert fullwidth to halfwidth
        const passwordConvert = convertFullToHalf(eventBody[item])
        const isValidatePass = schema.validate(passwordConvert)
        if (!isValidatePass) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        payload[item] = CryptoJS.AES.encrypt(eventBody[item], process.env.SECRET_KEY_PASSWORD).toString()
      }
    }

    // get detail account by Id
    const account = await tradingAccountRepository.getTradingAccountById(id)
    event.user_id = account?.user_id
    if (!account) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.CHANGE_TRADE_PASS.ACCOUNT_NOT_EXIST])
    }

    if (account.mt_status_code === statusCode.APPROVED) {
      // update password
      // get env from aws parameter store
      const env = await utility.getEnvConfig([envCommon.APIKEY_MT_CHANGE_PASS])

      if (eventBody.trading_password) {
        const resTradePassword = await changePassAccount(account, env[envCommon.APIKEY_MT_CHANGE_PASS], eventBody.trading_password, 1, event)
        if (resTradePassword.isError ) {
          if (resTradePassword.key === errorKeyServer.RESULT_NULL.TRADING_ACCOUNT_MT_INFO) {
            return await errorLogRepository.createResponseAndLog(event, resTradePassword.errorDetail, null,
              [errorMessageCodeConstant.CHANGE_TRADE_PASS.RESULT_NULL.TRADING_PASSWORD.TRADING_ACCOUNT_MT_INFO])
          }
          if (resTradePassword.key === errorKeyServer.RESULT_NULL.MT_GROUP) {
            return await errorLogRepository.createResponseAndLog(event, resTradePassword.errorDetail, null,
              [errorMessageCodeConstant.CHANGE_TRADE_PASS.RESULT_NULL.TRADING_PASSWORD.MT_GROUP])
          }
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.CHANGE_TRADE_PASS.UPDATE_FAIL.TRADING_PASSWORD_DB])
        }
      }

      if (eventBody.readonly_password) {
        const resInvPassword = await changePassAccount(account, env[envCommon.APIKEY_MT_CHANGE_PASS], eventBody.readonly_password, 0, event)
        if (resInvPassword.isError ) {
          if (resInvPassword.key === errorKeyServer.RESULT_NULL.TRADING_ACCOUNT_MT_INFO) {
            return await errorLogRepository.createResponseAndLog(event, resInvPassword.errorDetail, null,
              [errorMessageCodeConstant.CHANGE_TRADE_PASS.RESULT_NULL.TRADING_PASSWORD.TRADING_ACCOUNT_MT_INFO])
          }
          if (resInvPassword.key === errorKeyServer.RESULT_NULL.MT_GROUP) {
            return await errorLogRepository.createResponseAndLog(event, resInvPassword.errorDetail, null,
              [errorMessageCodeConstant.CHANGE_TRADE_PASS.RESULT_NULL.TRADING_PASSWORD.MT_GROUP])
          }
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.CHANGE_TRADE_PASS.UPDATE_FAIL.READONLY_PASSWORD_DB])
        }
      }
    } else {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }


    // create operation history
    const deviceBrowser = event.headers['User-Agent']
    const ipAddress = event.requestContext.identity.sourceIp
    const authorizedPerson = utility.getUserIdByToken(event)

    const target = !account.mt_account_no ? null : account.mt_account_no
    await createOperationHistory(
      account.user_id,
      account.site_id,
      category.TRADING_ACCOUNT_INFORMATION,
      contentUpdate.CHANGE_PASSWORD,
      passwordDisplay,
      passwordDisplay,
      ipAddress,
      deviceBrowser,
      authorizedPerson,
      target,
      id,
    )
    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    switch (error.errorKey) {
      case errorKeyServer.UPDATE_FAIL.TRADING_ACCOUNT_MT_INFO:
        return await errorLogRepository.createResponseAndLog(event, error, null,
          [errorMessageCodeConstant.CHANGE_TRADE_PASS.UPDATE_FAIL.TRADING_ACCOUNT_MT_INFO])
      case errorKeyServer.UPDATE_FAIL.MT_GROUP:
        return await errorLogRepository.createResponseAndLog(event, error, null,
          [errorMessageCodeConstant.CHANGE_TRADE_PASS.UPDATE_FAIL.MT_GROUP])
      case errorKeyServer.UPDATE_FAIL.PORTFOLIO_MYFOREX:
        return await errorLogRepository.createResponseAndLog(event, error, null,
          [errorMessageCodeConstant.CHANGE_TRADE_PASS.UPDATE_FAIL.PORTFOLIO_MYFOREX])
      default:
        return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
    }
  }
}

const changePassAccount = async (account, api_key, newPass, isTradePass, event) => {
  const url = utility.getMTURL(account.env_param_name, account.platform, apiInfo.CHANGE_PASS)
  const bodyMetaServer = {
    ServerKey: account.server_key,
    ApiKey: api_key,
    MTAccount: `${account.mt_account_no}`,
    NewPass: newPass,
    IsTradePass: isTradePass,
  }
  const payload = {}
  if (isTradePass === 1) {
    payload.trading_password = CryptoJS.AES.encrypt(newPass, process.env.SECRET_KEY_PASSWORD).toString()
  } else if (isTradePass === 0) {
    payload.readonly_password = CryptoJS.AES.encrypt(newPass, process.env.SECRET_KEY_PASSWORD).toString()
  }
  const userErrorLog = {
    user_id: account.user_id,
    site_id: account.site_id,
  }
  return await tradingAccountRepository.updateTradingAccountMtInfo(account.id, payload, url, bodyMetaServer, account, event, userErrorLog)
}

const handleChangeAccount = async (id, apiInfoChange, objDB, objMT, isChangeLeverage = false, event, api_key) => {
  const userErrorLog = {}
  const tradingAccountInfo = await tradingAccountRepository.getTradingAccountById(id)
  event.user_id = tradingAccountInfo.user_id
  userErrorLog.user_id = tradingAccountInfo.user_id
  userErrorLog.site_id = tradingAccountInfo.site_id
  let result
  if (tradingAccountInfo.mt_status_code === statusCode.PROCESSING || tradingAccountInfo.mt_status_code === statusCode.REQUIRED) {
    result = await tradingAccountRepository.updateTradingAccount(objDB, id)
    if (result.isError) {
      return result
    }
  } else if (tradingAccountInfo.mt_status_code === statusCode.APPROVED) {
    const dataTrading = {
      ServerKey: tradingAccountInfo.server_key,
      ApiKey: api_key,
      MTAccount: `${tradingAccountInfo.mt_account_no}`,
      ...objMT,
    }
    const url = utility.getMTURL(tradingAccountInfo.env_param_name, tradingAccountInfo.platform, apiInfoChange)

    if (isChangeLeverage && tradingAccountInfo.trading_account_kind === tradingAccountType.REAL) {
      // get env from aws parameter store
      const env = await utility.getEnvConfig([
        envCommon.APIKEY_MT_GET_OPEN_POSITIONS,
        envCommon.APIKEY_MT_GET_PENDING_POSITIONS,
      ])
      const arrApiPosition = [
        { api_key: env[envCommon.APIKEY_MT_GET_OPEN_POSITIONS],
          api_name: apiInfo.GET_OPEN_POSITIONS,
        },
        { api_key: env[envCommon.APIKEY_MT_GET_PENDING_POSITIONS],
          api_name: apiInfo.GET_PENDING_POSITIONS,
        },
      ]


      try {
        const resApiposition = await Promise.all(arrApiPosition.map((apiPosition) => {
          return utility.requestRetry(
            'post',
            utility.getMTURL(tradingAccountInfo.env_param_name, tradingAccountInfo.platform, apiPosition.api_name),
            {
              ServerKey: tradingAccountInfo.server_key,
              ApiKey: apiPosition.api_key,
              MTAccount: `${tradingAccountInfo.mt_account_no}`,
            },
          )
        }))

        // check position
        if (resApiposition[0].ReturnCode !== '0' || resApiposition[1].ReturnCode !== '0') {
          console.log(resApiposition)
          if (resApiposition[0].ReturnCode !== '0' ) {
            userErrorLog.config = {
              data: {
                ServerKey: tradingAccountInfo.server_key,
                ApiKey: env[envCommon.APIKEY_MT_GET_OPEN_POSITIONS],
                MTAccount: `${tradingAccountInfo.mt_account_no}`,
              },
              url: utility.getMTURL(tradingAccountInfo.env_param_name, tradingAccountInfo.platform, apiInfo.GET_OPEN_POSITIONS),
            }
          } else {
            userErrorLog.config = {
              data: {
                ServerKey: tradingAccountInfo.server_key,
                ApiKey: env[envCommon.APIKEY_MT_GET_PENDING_POSITIONS],
                MTAccount: `${tradingAccountInfo.mt_account_no}`,
              },
              url: utility.getMTURL(tradingAccountInfo.env_param_name, tradingAccountInfo.platform, apiInfo.GET_PENDING_POSITIONS),
            }
          }

          return { isError: true, key: errorKeyServer.RESULT_NULL.GET_POSITION_MT, errorDetail: { ...userErrorLog } }
        }

        if (resApiposition[0].OpenPositions.length || resApiposition[1].PendingPositions.length) {
          return { isError: true, messageConstant: errorMessageCodeConstant.CHANGE_ACCOUNT_TRADING.HAVING_POSITION }
        }
      } catch (error) {
        error.errorKey = errorKeyServer.GET_FAIL.POSITION_MT_ACCOUNT
        Object.assign(error, userErrorLog)
        throw error
      }
    }

    // get payload change MT Groups when change leverage
    let dataOther
    if (isChangeLeverage) {
      const env = await utility.getEnvConfig([
        envCommon.APIKEY_MT_CHANGE_GROUP,
      ])

      const tradingSearch = {
        platform: tradingAccountInfo.platform,
        account_mode: tradingAccountInfo.trading_account_kind,
        account_leverage_id: objDB.account_leverage_id,
        currency: tradingAccountInfo.currency,
      }

      const newGroups = await mtGroupsRepository.getMTgroups(
        tradingSearch,
        process.env.NODE_ENV.toLowerCase() === server.Dev.toLowerCase() ? server.Dev : server.Prod,
      )

      const isGroup = newGroups.find((el) => el.b_book_group_name.slice(-1) === 'h') ||
        newGroups.find((el) => el.b_book_group_name.slice(-1) === 'm') ||
        newGroups.find((el) => el.b_book_group_name.slice(-1) === 'l') ||
        newGroups.find((el) => el.b_book_group_name.slice(-1) === 's') ||
        newGroups[0]

      dataOther = {
        url: utility.getMTURL(tradingAccountInfo.env_param_name, tradingAccountInfo.platform, apiInfo.CHANGE_GROUP),
        data: {
          ServerKey: tradingAccountInfo.server_key,
          ApiKey: env[envCommon.APIKEY_MT_CHANGE_GROUP],
          MTAccount: `${tradingAccountInfo.mt_account_no}`,
          Group: isGroup.b_book_group_name,
        },
      }
    }

    // update trading account info and account mt server
    result = await tradingAccountRepository.updateTradingAccountMtInfo(
      id,
      objDB,
      url,
      dataTrading,
      dataOther,
      event,
      userErrorLog,
    )
    if (result.isError ) {
      return result
    }
  } else {
    return { isError: true, messageConstant: errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID }
  }

  return { isError: false, data: tradingAccountInfo }
}

const _renderDataEmailReceptionUpdate = (data) => {
  switch (data) {
    case 1:
      return 'trans.update_history.read_only_setting.yes'
    case 0:
      return 'trans.update_history.read_only_setting.no'
    default:
      return null
  }
}

const getDropdownLeverage = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}

    // get dropdown leverage
    const listLeverage = await accountLeverageRepository.getLeverageByAccountType([queryString.account_type_id])

    return utility.createResponse(true, listLeverage)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  changePartnerCode,
  checkPartnerCode,
  changePassword,
  changeAccountTrading,
  getDropdownLeverage,
}
