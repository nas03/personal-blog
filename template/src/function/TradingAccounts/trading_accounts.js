'use strict'

const {
  message, tradingAccountType, statusCode, server,
  openingResonId, apiInfo, baseCurrency, platform, accountType, commonSiteId, category, contentUpdate,
  dataStatus, closeAccount, enable, groupType, envCommon, currencyAccountType, flag,
  csvFileName, statusClassConstant, actionMethod, emailDetailContentId, errorMessageCodeConstant,
  errorKeyServer, accountMode,
} = require('constant')
const defaultLang = 'en'

/* function */
const utility = require('utility')
const { formatCurrency } = require('../Payment/get_payment_transaction')
const { commonGetAdminData } = require('../Config/sites')

/* helper */
const { mailer, upload } = require('helper')

/* DB */
const {
  tradingAccountRepository,
  serverInfoRepository, rateRepository,
  mtGroupsRepository,
  errorLogRepository,
  statusMasterRepository,
  usersBasicDataRepository,
  accountTypeRepository,
  accountLeverageRepository,
  statusHistoryRepository,
  emailHistoryRepository,
  emailDetailContentRepository,
} = require('repository')
const { createListOperationHistory } = require('../History/operation_history')

/* library */
const CryptoJS = require('crypto-js')
const generator = require('generate-password')
const _ = require('lodash')
const { json2csvAsync } = require('json-2-csv')

const getListTradingAccount = async (event) => {
  const userLogError = {}
  try {
    const userId = event.pathParameters.userId
    event.user_id = userId
    const userInfo = await usersBasicDataRepository.getUserInfo(userId)
    userLogError.user_id = userInfo.id
    userLogError.site_id = userInfo.site_id

    // Calculate the total balance of the active real account
    const total = [
      {
        id: baseCurrency.USD,
        equity: 0,
        balance: 0,
      },
      {
        id: baseCurrency.JPY,
        equity: 0,
        balance: 0,
      },
      {
        id: baseCurrency.EUR,
        equity: 0,
        balance: 0,
      },
      {
        id: baseCurrency.BTC,
        equity: 0,
        balance: 0,
      },
    ]

    // get data based on account
    const listAccount = await tradingAccountRepository.getListAccount(userId)
    let numberOfApprovedRealAccount = 0
    let numberOfDemoAccount = 0
    let tradingAccountRequired = 0

    const groupAccount = {}
    for (let i = 0; i < listAccount.length; i++) {
      const account = listAccount[i]
      // Count the number of accounts
      if (account.trading_account_kind === tradingAccountType.DEMO && account.mt_status_code === statusCode.APPROVED) {
        numberOfDemoAccount++
      } else if (account.trading_account_kind === tradingAccountType.REAL && account.mt_status_code === statusCode.APPROVED) {
        numberOfApprovedRealAccount++
      } else if (account.trading_account_kind === tradingAccountType.REAL && account.mt_status_code === statusCode.REQUIRED) {
        tradingAccountRequired++
      }

      // Create an audience containing the reason for opening an account
      account.opening_reason = {
        id: account.open_reason_id,
        ja_reason: account.ja_reason,
        en_reason: account.en_reason,
        cn_reason: account.cn_reason,
        kr_reason: account.kr_reason,
        open_reason_other: account.open_reason_id === openingResonId.OTHER ? account.open_reason_other : null,
      }

      // Group accounts by server
      if (account.mt_status_code === statusCode.APPROVED || account.mt_status_code === statusCode.CLOSED) {
        if (!groupAccount[account.mt_server_id]) {
          groupAccount[account.mt_server_id] = [account]
        } else {
          groupAccount[account.mt_server_id].push(account)
        }
      }
    }
    // get env from aws parameter store
    const env = await utility.getEnvConfig([envCommon.APIKEY_MT_GET_ACCOUNT_INFO])
    // Get account information from MT server
    let listGroupAccountResponse = await Promise.all(
      Object.values(groupAccount).map(
        (group) => _getAccountInfo(group, env[envCommon.APIKEY_MT_GET_ACCOUNT_INFO], event, userLogError),
      ),
    )

    // Map the result to the original input
    listGroupAccountResponse = listGroupAccountResponse.flat()
    for (let i = 0; i < listGroupAccountResponse.length; i++) {
      for (let j = 0; j < listAccount.length; j++) {
        if (
          Number(listGroupAccountResponse[i].LoginId) === Number(listAccount[j].mt_account_no) &&
          listGroupAccountResponse[i].mt_server_id === listAccount[j].mt_server_id
        ) {
          listAccount[j] = {
            ...listAccount[j],
            group_name: listGroupAccountResponse[i].AccountGroup,
          }

          if (listAccount[j].mt_status_code !== statusCode.CLOSE) {
            listAccount[j] = {
              ...listAccount[j],
              balance: listGroupAccountResponse[i].Balance,
              credit: listGroupAccountResponse[i].Credit,
              equity: listGroupAccountResponse[i].Equity,
              total_profit_and_loss: listGroupAccountResponse[i].Profit,
              margin_maintenace_rate: listGroupAccountResponse[i].MarginLevel,
              readonly: listGroupAccountResponse[i].Readonly,
              report: listGroupAccountResponse[i].EnableReports,
              nickname: listGroupAccountResponse[i].AccountName,
            }
          }

          break
        }
      }
    }

    const listRate = await rateRepository.getListLatestRate()

    for (const account of listAccount) {
      if (account.trading_account_kind === tradingAccountType.REAL && account.mt_status_code === statusCode.APPROVED) {
        for (const totalItem of total) {
          if (account.currency === totalItem.id) {
            totalItem.equity = totalItem.equity + parseFloat(account.equity || 0)
            totalItem.balance = totalItem.balance + parseFloat(account.balance || 0)
          } else {
            const rate = _getRate(account.currency, totalItem.id, listRate)
            totalItem.equity = totalItem.equity + parseFloat(account.equity || 0) * rate
            totalItem.balance = totalItem.balance + parseFloat(account.balance || 0) * rate
          }
        }
      }
    }

    return utility.createResponse(true, {
      total,
      listAccount: _formatAccount(listAccount),
      number_of_demo_account: numberOfDemoAccount,
      number_of_approved_real_account: numberOfApprovedRealAccount,
      trading_account_required: tradingAccountRequired,
    })
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getAllTradingAccount = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}
    const pagination = utility.getPagination(queryString)

    // Get staff display date time and timezone
    const staffId = await utility.getUserIdByToken(event)
    const staffInfo = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': staffId })
    queryString.utc = staffInfo.timezone || null
    queryString.display_date_time = staffInfo.display_date_time

    const _renderDateTime = (data_time) => {
      return data_time ? utility.getDateTimeFormatted(data_time, staffInfo.display_date_time, queryString.utc) : null
    }

    const listAccount = await tradingAccountRepository.getAllTradingAccount(queryString, pagination, staffInfo)


    if (queryString.isExportCSV === 'true') {
      await _getBalanceCreditFromMT(listAccount, _renderDateTime, event, true)

      // Handling csv parsing and uploading to S3
      const headers = [
        { field: 'id', title: 'ID' },
        { field: 'ts_regist', title: 'Request date & time' },
        { field: 'trading_account_kind', title: 'Account mode' },
        { field: 'site_name', title: 'Site' },
        { field: `status_${staffInfo.language_portal}_name`, title: 'MT Status' },
        { field: `label_status_${staffInfo.language_portal}_name`, title: 'Label' },
        { field: 'account_type', title: 'Account type' },
        { field: 'currency', title: 'Currency' },
        { field: 'leverage', title: 'Leverage' },
        { field: 'partner_code', title: 'Account Partner ID' },
        { field: 'ts_active', title: 'Open date & time' },
        { field: 'mt_account_no', title: 'MT Account number' },
        { field: 'server_name', title: 'MT Server name' },
        { field: 'balance', title: 'Account Balance' },
        { field: 'credit', title: 'Account Credit' },
        { field: 'full_name', title: 'Name' },
        { field: 'email', title: 'Email' },
        { field: 'portfolio_id', title: 'Portfolio ID' },
        { field: 'decision_date', title: 'Update' },
        { field: 'action_method', title: 'Action method or Staff' },
      ]

      // eslint-disable-next-line max-len
      let csvData = 'ID,Request date & time,Account mode,Site,MT Status,Label,Account type,Currency,Leverage,Account Partner ID,Open date & time,MT Account number,MT Server name,Account Balance,Account Credit,Name,Email,Portfolio ID,Update,Action method or Staff'

      if (listAccount.length) {
        csvData = await json2csvAsync(listAccount, { keys: headers, emptyFieldValue: '-', excelBOM: true })
      }

      const result = await upload.uploadCSV(csvData, csvFileName.MT_ACCOUNTS)

      return utility.createResponse(true, result)
    }

    await _getBalanceCreditFromMT(listAccount.data, _renderDateTime, event)

    return utility.createResponse(true, listAccount)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getDropdownTradingAccount = async (event) => {
  try {
    const adminId = utility.getUserIdByToken(event)

    const queryString = event.queryStringParameters || {}
    const [adminData, accountTypes, mtServers, leverages] = await Promise.all([
      commonGetAdminData(adminId),
      accountTypeRepository.getAccountTypeForTradingAccount(),
      serverInfoRepository.getAllMtServerInfo(true, true),
      accountLeverageRepository.getLeverageByAccountTypeDropdown(queryString.account_type_ids),
    ])

    const currency = []

    const allAccountType = queryString.account_type_ids

    accountTypes.forEach((obj) => {
      if (allAccountType) {
        if (allAccountType.split(',').includes(`${obj.id}`)) {
          currency.push(
            ...([
              (obj.base_currency_usd === flag.TRUE ? currencyAccountType.USD : null),
              (obj.base_currency_jpy === flag.TRUE ? currencyAccountType.JPY : null),
              (obj.base_currency_eur === flag.TRUE ? currencyAccountType.EUR : null),
              (obj.base_currency_sgd === flag.TRUE ? currencyAccountType.SGD : null),
              (obj.base_currency_aud === flag.TRUE ? currencyAccountType.AUD : null),
              (obj.base_currency_nzd === flag.TRUE ? currencyAccountType.NZD : null),
              (obj.base_currency_gbp === flag.TRUE ? currencyAccountType.GBP : null),
            ].filter((el) => el !== null)),
          )
        }
      } else {
        currency.push(
          ...([
            (obj.base_currency_usd === flag.TRUE ? currencyAccountType.USD : null),
            (obj.base_currency_jpy === flag.TRUE ? currencyAccountType.JPY : null),
            (obj.base_currency_eur === flag.TRUE ? currencyAccountType.EUR : null),
            (obj.base_currency_sgd === flag.TRUE ? currencyAccountType.SGD : null),
            (obj.base_currency_aud === flag.TRUE ? currencyAccountType.AUD : null),
            (obj.base_currency_nzd === flag.TRUE ? currencyAccountType.NZD : null),
            (obj.base_currency_gbp === flag.TRUE ? currencyAccountType.GBP : null),
          ].filter((el) => el !== null)),
        )
      }
    })

    return utility.createResponse(true, {
      sites: adminData.admin_with_sites,
      account_mode: [tradingAccountType.DEMO, tradingAccountType.REAL],
      account_types: accountTypes,
      currency: _.uniq(currency).sort((a, b) => {
        const desiredOrder = [
          currencyAccountType.USD,
          currencyAccountType.JPY,
          currencyAccountType.EUR,
          currencyAccountType.SGD,
          currencyAccountType.AUD,
          currencyAccountType.NZD,
          currencyAccountType.GBP,
        ]
        return desiredOrder.indexOf(a) - desiredOrder.indexOf(b)
      }),
      leverages: leverages,
      mt_servers: mtServers,
    })
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

async function _getBalanceCreditFromMT(listAccount, _renderDateTime, event, isExportCSV) {
  const groupAccount = {}
  for (let i = 0; i < listAccount.length; i++) {
    if (isExportCSV) {
      listAccount[i].ts_regist = _renderDateTime(listAccount[i].ts_regist)
      listAccount[i].ts_active = _renderDateTime(listAccount[i].ts_active)
      listAccount[i].decision_date = _renderDateTime(listAccount[i].decision_date)
      if (!listAccount[i].mt_account_no) {
        listAccount[i].mt_account_no = null
      }
      listAccount[i].balance = 0
      listAccount[i].credit = 0
    }

    const account = listAccount[i]
    // Group accounts by server
    if (account.mt_status_code === statusCode.APPROVED) {
      if (!groupAccount[account.mt_server_id]) {
        groupAccount[account.mt_server_id] = [account]
      } else {
        groupAccount[account.mt_server_id].push(account)
      }
    }
  }

  // get env from aws parameter store
  const env = await utility.getEnvConfig([envCommon.APIKEY_MT_GET_ACCOUNT_INFO])
  // Get account information from MT server
  let listGroupAccountResponse = await Promise.all(
    Object.values(groupAccount).map(
      (group) => _getAccountInfo(group, env[envCommon.APIKEY_MT_GET_ACCOUNT_INFO], event, {}),
    ),
  )

  // Map the result to the original input
  listGroupAccountResponse = listGroupAccountResponse.flat()
  for (let i = 0; i < listGroupAccountResponse.length; i++) {
    for (let j = 0; j < listAccount.length; j++) {
      if (
        Number(listGroupAccountResponse[i].LoginId) === Number(listAccount[j].mt_account_no) &&
        listGroupAccountResponse[i].mt_server_id === listAccount[j].mt_server_id
      ) {
        listAccount[j] = {
          ...listAccount[j],
          balance:
            (formatCurrency(listAccount[j].currency, listGroupAccountResponse[i].Balance) ?
              formatCurrency(listAccount[j].currency, listGroupAccountResponse[i].Balance) :
              listGroupAccountResponse[i].Balance),
          credit:
            (formatCurrency(listAccount[j].currency, listGroupAccountResponse[i].Credit) ?
              formatCurrency(listAccount[j].currency, listGroupAccountResponse[i].Credit) :
              listGroupAccountResponse[i].Credit),
        }
        break
      }
    }
  }
}

const getMtServer = async (event) => {
  try {
    const mtServer = await serverInfoRepository.getServerInfo()

    return utility.createResponse(true, mtServer)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const updateSupportingComment = async (event) => {
  try {
    const accountId = event.pathParameters.accountId

    // check account close
    if (!await tradingAccountRepository.checkUserCloseByMTAccount(accountId)) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_SUPPORTING_COMMENT.ACCOUNT_STATUS_CLOSE])
    }

    // check mt account close
    const tradingAccount = await tradingAccountRepository.getAccountDetailById(accountId)
    event.user_id = tradingAccount?.user_id
    if ( tradingAccount.mt_status_code === statusCode.CLOSED ) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_SUPPORTING_COMMENT.MT_ACCOUNT_STATUS_CLOSE])
    }

    const bodyData = JSON.parse(event.body)
    if (typeof bodyData.support_comment !== 'string') {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    const result = await tradingAccountRepository.updateTradingAccount({
      support_comment: bodyData.support_comment,
    }, accountId)

    if (result.isError) {
      return await errorLogRepository.createResponseAndLog(event, result.error, null,
        [errorMessageCodeConstant.UPDATE_SUPPORTING_COMMENT.UPDATE_TRADING_ACCOUNT_ERROR])
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}
const updateTradingAccountStatus = async (event) => {
  const userErrorLog = {}
  const admin_id = utility.getUserIdByToken(event)
  try {
    const accountId = event.pathParameters.accountId

    // check account close
    if (!await tradingAccountRepository.checkUserCloseByMTAccount(accountId)) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_ACCOUNT_STATUS.ACCOUNT_CLOSED])
    }

    let account = await tradingAccountRepository.getTradingAccountById(accountId)
    event.user_id = account?.user_id
    userErrorLog.user_id = account?.user_id
    userErrorLog.site_id = account?.site_id
    if (!account) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_ACCOUNT_STATUS.UPDATE_FAILED.ACCOUNT_NOT_EXIST])
    }

    const userInfo = await usersBasicDataRepository.getBaseUserInfo(account.user_id)

    const bodyData = JSON.parse(event.body)

    const authorizedPerson = utility.getUserIdByToken(event)
    // get env from aws parameter store
    const env = await utility.getEnvConfig([
      envCommon.APIKEY_MT_GET_ACCOUNT_INFO,
      envCommon.APIKEY_MT_GET_OPEN_POSITIONS,
      envCommon.APIKEY_MT_GET_PENDING_POSITIONS,
      envCommon.APIKEY_MT_CHANGE_ENABLE,
      envCommon.APIKEY_MT_ACCOUNT_ADD,
    ])

    const { is_send_email } = bodyData?.data || {}
    switch (bodyData.mt_status_code) {
      case statusCode.PROCESSING:
        if (
          account.mt_status_code !== statusCode.REQUIRED ||
          account.trading_account_kind !== tradingAccountType.REAL
        ) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        break
      case statusCode.APPROVED:
        let updateData = {}

        // Validate body data
        if (
          (account.mt_status_code !== statusCode.REQUIRED &&
            account.mt_status_code !== statusCode.PROCESSING) ||
          account.trading_account_kind !== tradingAccountType.REAL
        ) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        if (!bodyData.data) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }
        const { partner_code, mt_group_id, group_type, readonly, report } = bodyData.data
        if (!partner_code || !mt_group_id || !group_type || (is_send_email !== enable.ON && is_send_email !== enable.OFF) ||
          (readonly !== enable.ON && readonly !== enable.OFF) || (report !== enable.ON && report !== enable.OFF)
        ) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        if (userInfo.customer_partner_code !== partner_code) {
          const checkAccountPartnerCode = await usersBasicDataRepository.checkMemberIdExist(partner_code)
          if (!checkAccountPartnerCode) {
            return await errorLogRepository.createResponseAndLog(event, null, null,
              [errorMessageCodeConstant.UPDATE_ACCOUNT_STATUS.PARTNER_CODE_NOT_EXIST])
          }
        }

        // get mt server
        const mtServer = await serverInfoRepository.getServerById(account.mt_server_id)
        if (
          !mtServer || mtServer && mtServer.trading_account_kind !== tradingAccountType.REAL
        ) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }
        // check mt server
        if (
          mtServer.trading_account_kind !== account.trading_account_kind ||
          mtServer.account_type_id !== account.account_type_id ||
          mtServer.platform !== account.platform
        ) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.UPDATE_ACCOUNT_STATUS.UPDATE_FAILED.MT_SERVER_NOT_MATCH])
        }
        updateData = {
          partner_code,
          mt_server_id: account.mt_server_id,
          account_mode: mtServer.trading_account_kind,
          platform: mtServer.platform,
          readonly,
          report,
        }

        let tradePassword
        let invPassword
        if (account.trading_password) {
          tradePassword = CryptoJS.AES.decrypt(account.trading_password, process.env.SECRET_KEY_PASSWORD).toString(CryptoJS.enc.Utf8)
        }
        if (account.readonly_password) {
          invPassword = CryptoJS.AES.decrypt(account.readonly_password, process.env.SECRET_KEY_PASSWORD).toString(CryptoJS.enc.Utf8)
        }

        if (!tradePassword) {
          tradePassword = _generatePassword()
          updateData.trading_password = CryptoJS.AES.encrypt(tradePassword, process.env.SECRET_KEY_PASSWORD).toString()
        }
        if (!invPassword) {
          invPassword = _generatePassword()
          updateData.readonly_password = CryptoJS.AES.encrypt(invPassword, process.env.SECRET_KEY_PASSWORD).toString()
        }

        account = {
          ...account,
          ...updateData,
          tradePassword,
          invPassword,
          server_key: mtServer.server_key,
          server_name: mtServer.server_name,
          fqdn_name: mtServer.fqdn_name,
          env_param_name: mtServer.env_param_name,
        }

        let dataTrading = await _getDataTrading(account, userInfo)

        const getGroupMT = await mtGroupsRepository.getDetailMTGroup(mt_group_id)

        const groupMT = group_type === groupType.A_GROUP ? getGroupMT.a_api_params : getGroupMT.b_api_params

        if (groupMT) {
          dataTrading.Group = groupMT
        }

        dataTrading = {
          ServerKey: account.server_key,
          ApiKey: env[envCommon.APIKEY_MT_ACCOUNT_ADD],
          ...dataTrading,
        }
        // check existed accout
        const tradingAccountExisted = await tradingAccountRepository.checkDuplicateAccount({
          'trading_accounts.user_basic_data_id': account.user_id,
          'trading_accounts.account_mode': tradingAccountType.REAL,
        })

        // // Setting send mail
        const mailInfo = {
          tradingAccountExisted,
          userInfo,
          is_send_email,
        }

        const updateResponse = await tradingAccountRepository.updateStatusAndCreateTradingAccount(
          accountId, dataTrading, account, updateData, event, userErrorLog, mailInfo, mtServer.server,
        )

        if (updateResponse.isError) {
          return await errorLogRepository.createResponseAndLog(event, updateResponse.error, null,
            [errorMessageCodeConstant.UPDATE_ACCOUNT_STATUS.UPDATE_FAILED.CANNOT_UPDATE_STATUS_DB])
        }

        account.mt_account_no = updateResponse.data.Account.LoginId
        account.portfolio_info = updateResponse.portfolio_info
        break
      case statusCode.REJECTED:
        const { mt_status_label_number, status_label_message } = bodyData.data
        let reasonReject = status_label_message

        // Validate fields
        if (account.mt_status_code !== statusCode.REQUIRED && account.mt_status_code !== statusCode.PROCESSING ||
          account.trading_account_kind !== tradingAccountType.REAL || !bodyData.data || !mt_status_label_number ||
          (!is_send_email && status_label_message)) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        if (status_label_message === null || status_label_message === undefined) {
          const isExisted = await statusMasterRepository.getStatusMaster({
            status_code: bodyData.mt_status_code,
            status_label_number: mt_status_label_number,
          })

          // VALIDATE
          if (!isExisted.length) {
            return await errorLogRepository.createResponseAndLog(event, null, null,
              [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
          }

          const typeLang = userInfo.language_email ? userInfo.language_email : defaultLang
          const rejectStatusLabel = isExisted[0]
          reasonReject = rejectStatusLabel[typeLang + '_status_label_detail'] || ''
        }

        if (is_send_email) await _sendEmailRejectAccountSuccess(account, userInfo, reasonReject, admin_id)
        break
      case statusCode.CLOSED:
        if (account.mt_status_code !== statusCode.APPROVED) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        if (account.trading_account_kind !== tradingAccountType.DEMO) {
          const listApiPlugin = [
            {
              api_key: env[envCommon.APIKEY_MT_GET_ACCOUNT_INFO],
              api_name: apiInfo.GET_ACCOUNT_INFO,
            },
            {
              api_key: env[envCommon.APIKEY_MT_GET_OPEN_POSITIONS],
              api_name: apiInfo.GET_OPEN_POSITIONS,
            },
            {
              api_key: env[envCommon.APIKEY_MT_GET_PENDING_POSITIONS],
              api_name: apiInfo.GET_PENDING_POSITIONS,
            },
          ]

          // call Api MetaServer
          const resMetaServe = await Promise.all(listApiPlugin.map((apiPlugin) => {
            return utility.requestRetry(
              'post',
              utility.getMTURL(account.env_param_name, account.platform, apiPlugin.api_name),
              {
                ServerKey: account.server_key,
                ApiKey: apiPlugin.api_key,
                MTAccount: `${account.mt_account_no}`,
              },
            )
          }))

          if (resMetaServe[0].ReturnCode !== '0' || resMetaServe[1].ReturnCode !== '0' || resMetaServe[2].ReturnCode !== '0') {
            console.log(resMetaServe)
            return await errorLogRepository.createResponseAndLog(event, resMetaServe, null,
              [errorMessageCodeConstant.UPDATE_ACCOUNT_STATUS.RESPONSE_NULL.MT_API])
          }

          // check balance
          if (resMetaServe[0].Accounts[0].Balance > 0) {
            return await errorLogRepository.createResponseAndLog(event, null, null,
              [errorMessageCodeConstant.UPDATE_ACCOUNT_STATUS.BALANCE_NOT_ZERO])
          }

          // check position
          if (resMetaServe[1].OpenPositions.length || resMetaServe[2].PendingPositions.length) {
            return await errorLogRepository.createResponseAndLog(event, null, null,
              [errorMessageCodeConstant.UPDATE_ACCOUNT_STATUS.HAVING_POSITION])
          }
        }

        // update status close and metaSV (knex transactions)
        const urlChangeEnable = utility.getMTURL(account.env_param_name, account.platform, apiInfo.CHANGE_ENABLE)
        const dataBody = {
          serverKey: account.server_key,
          apiKey: env[envCommon.APIKEY_MT_CHANGE_ENABLE],
          mtAccount: `${account.mt_account_no}`,
          Enable: closeAccount.DISABLE,
        }

        const isUpdate = await tradingAccountRepository.updateTradingAccountMtInfo(
          accountId,
          null,
          urlChangeEnable,
          dataBody,
          null,
          event,
          userErrorLog,
        )

        if (isUpdate.isError ) {
          if (isUpdate.key === errorKeyServer.RESULT_NULL.TRADING_ACCOUNT_MT_INFO) {
            return await errorLogRepository.createResponseAndLog(event, isUpdate.errorDetail, null,
              [errorMessageCodeConstant.UPDATE_ACCOUNT_STATUS.RESULT_NULL.TRADING_ACCOUNT_MT_INFO])
          }
          if (isUpdate.key === errorKeyServer.RESULT_NULL.MT_GROUP) {
            return await errorLogRepository.createResponseAndLog(event, isUpdate.errorDetail, null,
              [errorMessageCodeConstant.UPDATE_ACCOUNT_STATUS.RESULT_NULL.MT_GROUP])
          }
          if (isUpdate.key === errorKeyServer.RESULT_NULL.GET_POSITION_MT) {
            return await errorLogRepository.createResponseAndLog(event, isUpdate.errorDetail, null,
              [errorMessageCodeConstant.UPDATE_ACCOUNT_STATUS.RESULT_NULL.GET_POSITION_MT])
          }

          if (isUpdate.messageConstant) {
            return await errorLogRepository.createResponseAndLog(event, null, null, [isUpdate.messageConstant])
          }

          return await errorLogRepository.createResponseAndLog(event, isUpdate, null,
            [errorMessageCodeConstant.UPDATE_ACCOUNT_STATUS.UPDATE_FAILED.CANNOT_UPDATE_STATUS_DB])
        }
        await _sendMailCloseAccount(account, userInfo)
        break
      default:
        return await errorLogRepository.createResponseAndLog(event, null, null,
          [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    const target = !account.mt_account_no ? null : account.mt_account_no

    // SAVE OPERATION HISTORY
    const listOperationHistory = []

    listOperationHistory.push( {
      site_id: commonSiteId.FXT,
      category_id: category.TRADING_ACCOUNT_INFORMATION,
      content_update: bodyData.mt_status_code === statusCode.CLOSED ? contentUpdate.APPLICATION_CANCEL : contentUpdate.CHANGE_STATUS,
      before_update: bodyData.mt_status_code === statusCode.CLOSED ? account.mt_account_no : _renderStatusHistory(account.mt_status_code),
      after_update: bodyData.mt_status_code === statusCode.CLOSED ? '-' : _renderStatusHistory(bodyData.mt_status_code),
      target,
      trading_account_id: accountId,
    } )

    if (account.portfolio_info?.portfolio_name) {
      listOperationHistory.push( {
        site_id: commonSiteId.FXT,
        category_id: category.PORTFOLIO,
        content_update: contentUpdate.PORTFOLIO_NAME,
        before_update: '-',
        after_update: account.portfolio_info?.portfolio_name,
        target: account.portfolio_info.portfolio_id,
      } )
    }
    if (account.portfolio_info?.portfolio_description) {
      listOperationHistory.push( {
        site_id: commonSiteId.FXT,
        category_id: category.PORTFOLIO,
        content_update: contentUpdate.PORTFOLIO_DESCRIPTION,
        before_update: '-',
        after_update: account.portfolio_info?.portfolio_description,
        target: account.portfolio_info.portfolio_id,
      } )
    }

    // SAVE GENERAL STATUS HISTORY
    const payloadInsertStatusHistory = {
      target_id: accountId,
      status_code: bodyData.mt_status_code,
      status_label_number: bodyData?.data?.mt_status_label_number || flag.FALSE,
      status_label_message: !(bodyData?.data?.status_label_message === null) ||
        !(bodyData?.data?.status_label_message === undefined) ? bodyData?.data?.status_label_message : null,
      status_class_id: statusClassConstant.MT_STATUS,
      action_method: actionMethod.OPERATOR_ACTION,
      updated_by_user_id: admin_id,
    }

    await Promise.all([
      createListOperationHistory(account.user_id, listOperationHistory, event, authorizedPerson),
      statusHistoryRepository.insertStatusHistory(payloadInsertStatusHistory),
    ])

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    switch (error.errorKey) {
      case errorKeyServer.UPDATE_FAIL.TRADING_ACCOUNT_MT_INFO:
        return await errorLogRepository.createResponseAndLog(event, error, null,
          [errorMessageCodeConstant.UPDATE_ACCOUNT_STATUS.UPDATE_FAILED.TRADING_ACCOUNT_MT_INFO])
      case errorKeyServer.UPDATE_FAIL.MT_GROUP:
        return await errorLogRepository.createResponseAndLog(event, error, null,
          [errorMessageCodeConstant.UPDATE_ACCOUNT_STATUS.UPDATE_FAILED.MT_GROUP])
      case errorKeyServer.UPDATE_FAIL.PORTFOLIO_MYFOREX:
        return await errorLogRepository.createResponseAndLog(event, error, null,
          [errorMessageCodeConstant.UPDATE_ACCOUNT_STATUS.UPDATE_FAILED.PORTFOLIO_MYFOREX])
      case errorKeyServer.UPDATE_MT_ACCOUNT_STATUS.CALL_API_MT_FAILED:
        return await errorLogRepository.createResponseAndLog(event, error, null,
          [errorMessageCodeConstant.UPDATE_ACCOUNT_STATUS.UPDATE_FAILED.CALL_API_MT_FAILED])
      default:
        if (error.isAxiosError) {
          return await errorLogRepository.createResponseAndLog(event, error, null,
            [errorMessageCodeConstant.UPDATE_ACCOUNT_STATUS.UPDATE_FAILED.CALL_API_MT_INFO_FAILED])
        }
        return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
    }
  }
}

const getDropdownchangeStatus = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}

    // get trading account
    const tradingAccount = await tradingAccountRepository.getAccountDetailById(queryString.trading_account_id)
    event.user_id = tradingAccount?.user_id
    if (!tradingAccount) {
      return utility.createResponse(true)
    }

    // get mt group
    const mtListGroup = await mtGroupsRepository.getMTgroups(
      tradingAccount,
      process.env.NODE_ENV.toLowerCase() === server.Dev.toLowerCase() ? server.Dev : server.Prod,
    )

    const listAGroup = tradingAccount.account_mode === accountMode.REAL ? mtListGroup.map((item) => ({
      id: item.id,
      group_name: item.a_book_group_name,
      group_type: groupType.A_GROUP,
      server: item.server,
    })) : []

    const listBGroup = mtListGroup.map((item) => ({
      id: item.id,
      group_name: item.b_book_group_name,
      group_type: groupType.B_GROUP,
      server: item.server,
    }))

    return utility.createResponse(true, { ListGroups: [...listBGroup.sort(_customSort), ...listAGroup.sort(_customSort)] })
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const _getDataTrading = async (account, userInfo) => {
  // Group: account.mt_group,
  let country_name
  country_name = userInfo.english_notation

  if (country_name.length > 15) {
    country_name = country_name.slice(0, 15)
  }

  return {
    Name: `${userInfo.first_name_romaji} ${userInfo.last_name_romaji}`,
    Phone: userInfo.phone_number,
    Email: userInfo.email,
    Leverage: 1,
    Deposit: 0,
    Credit: 0,
    Agent: account.partner_code,
    Comment: userInfo.member_id,
    Readonly: account.readonly,
    Reports: account.report,
    Country: country_name,
    TradePassword: account.tradePassword,
    InvPassword: account.invPassword,
    Enable: enable.ON,
  }
}

const _sendEmailRejectAccountSuccess = async (account, userInfo, rejectReason, admin_id) => {
  try {
    // check existed accout
    const tradingAccountExisted = await tradingAccountRepository.checkDuplicateAccount({
      'trading_accounts.user_basic_data_id': account.user_id,
      'trading_accounts.account_mode': tradingAccountType.REAL,
    }, true)

    // Setting send mail
    const typeLang = userInfo.language_email ? userInfo.language_email : defaultLang
    const portalLang = userInfo.language_portal ? userInfo.language_portal : defaultLang
    const lang = await utility.getMultilingualism(process.env.LOCALES_SOURCE, typeLang)
    const cTaLang = lang.email.create_real_trading_account

    // Mail info
    const to = `${userInfo.email}`
    const userName = `${userInfo.first_name_romaji} ${userInfo.last_name_romaji}`

    const emailTemplateId = !tradingAccountExisted ? emailDetailContentId.CHANGE_MT_STATUS_REJECTED :
      emailDetailContentId.CHANGE_MT_STATUS_REJECTED_ADDITIONAL
    const emailTemplate = await emailDetailContentRepository.getTemplateSendEmailById(emailTemplateId)
    const emailParameters = {
      user_name: userName.toUpperCase(),
      url_login: `${process.env.URL_FE_FXT}/login/?lang=${portalLang}`,
      reason_for_rejection: rejectReason,
      platform: account.platform === platform.MT4 ? 'MetaTrader 4' : 'MetaTrader 5',
      account_type: account.account_type === accountType.ELITE ? cTaLang.ta_cd_block2_data2.content.content1 :
        cTaLang.ta_cd_block2_data2.content.content2,
      leverage: `${account.account_leverage}`,
      base_currency: _renderBaseCurrency(account.currency, cTaLang),
    }
    emailTemplate.subject = emailTemplate[`${typeLang}_subject`]
    // Render email
    const html = utility.renderEmail(emailParameters, emailTemplate, typeLang)

    // SEND MAIL AND SAVE EMAIL HISTORY
    const responseSendMail = await mailer.sendMailFXT(to, emailTemplate.subject, '', html, emailTemplate)

    if (responseSendMail) {
      // Create email history
      await emailHistoryRepository.createEmailHistory({
        ...responseSendMail,
        email_detail_content_id: emailTemplate.id,
        user_basic_data_id: account.user_id,
      })
    }
  } catch (error) {
    console.log(error)
    return {
      status: dataStatus.FAIL,
      message: message.server_error,
    }
  }
}

const _renderBaseCurrency = (currency, lang) => {
  switch (currency) {
    case baseCurrency.USD:
      return lang.ta_cd_block2_data4.content.content1
    case baseCurrency.JPY:
      return lang.ta_cd_block2_data4.content.content2
    case baseCurrency.EUR:
      return lang.ta_cd_block2_data4.content.content3
    case baseCurrency.BTC:
      return lang.ta_cd_block2_data4.content.content4
    default:
      break
  }
}

const _renderStatusHistory = (data) => {
  switch (data) {
    case statusCode.REQUIRED:
      return `${statusCode.REQUIRED}/$/status`
    case statusCode.PROCESSING:
      return `${statusCode.PROCESSING}/$/status`
    case statusCode.APPROVED:
      return `${statusCode.APPROVED}/$/status`
    case statusCode.REJECTED:
      return `${statusCode.REJECTED}/$/status`
    case statusCode.CLOSED:
      return `${statusCode.CLOSED}/$/status`
    default:
      return ''
  }
}

const _sendMailCloseAccount = async (account, userInfo) => {
  try {
    const typeLang = userInfo.language_email ? userInfo.language_email : defaultLang
    const portalLang = userInfo.language_portal ? userInfo.language_portal : defaultLang
    const lang = await utility.getMultilingualism(process.env.LOCALES_SOURCE)
    const clTaLang = lang.email.close_trading_account
    const to = `${userInfo.email}`
    const userName = `${userInfo.first_name_romaji} ${userInfo.last_name_romaji}`
    const url_login = `${process.env.URL_FE_FXT}/login/?lang=${portalLang}`

    const emailTemplate = await emailDetailContentRepository.getTemplateSendEmailById(emailDetailContentId.EMAIL_CLOSE_TRADING_ACCOUNT)
    const emailParameters = {
      user_name: userName.toUpperCase(),
      url_login,
      login_id: account.mt_account_no,
      account_type: account.trading_account_kind === tradingAccountType.REAL ? clTaLang.content1 :
        clTaLang.content2,
    }
    emailTemplate.subject = `${emailTemplate[`${typeLang}_subject`]}`
    // Render email
    const html = utility.renderEmail(emailParameters, emailTemplate, typeLang)
    // Send mail
    const responseSendMail = await mailer.sendMailFXT(to, emailTemplate.subject, '', html, emailTemplate)

    if (responseSendMail) {
      // Create email history
      await emailHistoryRepository.createEmailHistory({
        ...responseSendMail,
        email_detail_content_id: emailTemplate.id,
        user_basic_data_id: account.user_id,
      })
    }
  } catch (error) {
    console.log(error)
    return {
      status: dataStatus.FAIL,
      message: message.server_error,
    }
  }
}

const _getAccountInfo = (listAccount, api_key, event, userLogError) => {
  return new Promise(async (resolve, reject) => {
    try {
      const firstAccount = listAccount[0]
      const ListAccountInfoResponse = await utility.requestRetry(
        'post',
        utility.getMTURL(firstAccount.env_param_name, firstAccount.platform, apiInfo.GET_ACCOUNT_INFO),
        {
          ServerKey: firstAccount.server_key,
          ApiKey: api_key,
          MTAccount: listAccount.map((item) => item.mt_account_no).join(','),
        },
      )

      if (ListAccountInfoResponse.ReturnCode !== '0') {
        console.log(ListAccountInfoResponse)
        resolve([])
      }

      resolve(ListAccountInfoResponse.Accounts.map((account) => {
        account.mt_server_id = firstAccount.mt_server_id
        return account
      }))
    } catch (error) {
      console.log(error)
      await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
      resolve([])
    }
  })
}

const _getRate = (base, symbol, listRate) => {
  if (base === symbol) {
    return 1
  } else {
    const rateObj = listRate.find((item) => item.base === base && item.symbol === symbol)
    let rate = 0
    if (rateObj) {
      rate = parseFloat(rateObj.rate)
    }
    return rate
  }
}

const _formatAccount = (listAccount) => {
  const accountKey = [
    'id',
    'server',
    'mt_server_id',
    'server_name',
    'account_type_id',
    'user_id',
    'mt_account_no',
    'portfolio_id',
    'portfolio_name',
    'portfolio_description',
    'portfolio_description_default',
    'trading_method',
    'publish_range',
    'publish_target',
    'broker_name',
    'operation_start',
    'trading_account_kind',
    'platform',
    'account_type',
    'account_type_code',
    'currency',
    'leverage',
    'partner_code',
    'support_comment',
    'mt_status_code',
    'mt_status_label_number',
    'status_name',
    'status_label_number',
    'frame_color',
    'paint_color',
    'text_color',
    'en_name',
    'ja_name',
    'cn_name',
    'kr_name',
    'opening_reason',
    'balance',
    'credit',
    'equity',
    'mt_group_name',
    'total_profit_and_loss',
    'margin_maintenace_rate',
    'readonly',
    'report',
    'group_name',
    'ts_regist',
  ]

  return listAccount.map((account) => {
    const newAccount = {}
    for (const key of accountKey) {
      newAccount[key] = account[key] !== undefined ? account[key] : null
      if (['readonly', 'report'].includes(key) && (account[key] === enable.ON || account[key] === enable.OFF)) {
        newAccount[key] = account[key].toString()
      }
    }

    return newAccount
  })
}

const _generatePassword = () => {
  return generator.generate({
    length: 8,
    numbers: true,
    lowercase: true,
    uppercase: true,
    symbols: true,
    strict: true,
    exclude: ['*', '=', '|', ';', '"', '>', '<', ',', '`'],
  })
}

const _customSort = (a, b) => {
  const order = { h: 0, m: 1, l: 2, s: 3 }

  const lastCharA = a.group_name.charAt(a.length - 1)
  const lastCharB = b.group_name.charAt(b.length - 1)

  if (order[lastCharA] !== undefined && order[lastCharB] !== undefined) {
    // Both strings end with 'h', 'm', 'l', 's'
    return order[lastCharA] - order[lastCharB]
  } else if (order[lastCharA] !== undefined) {
    // Only string A ends with 'h', 'm', 'l', 's'
    return -1
  } else if (order[lastCharB] !== undefined) {
    // Only string B ends with 'h', 'm', 'l', 's'
    return 1
  } else {
    // Both strings don't end with 'h', 'm', 'l', 's'
    return 0
  }
}

module.exports = {
  getListTradingAccount,
  getMtServer,
  updateSupportingComment,
  updateTradingAccountStatus,
  getDropdownchangeStatus,
  getAllTradingAccount,
  getDropdownTradingAccount,
}
