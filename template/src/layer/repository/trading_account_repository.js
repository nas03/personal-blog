
// db
const db = require('db').helper

// constant
const { flag, statusCode, tradingAccountType, apiInfo, dateFormat, enable, distributionService, platform,
  baseCurrency, accountTypeShort, accountTypeID, brokerID, actionMethod, displayDateTime, statusClassConstant,
  emailDetailContentId, errorKeyServer, errorMessageCodeConstant } = require('constant')
const defaultLang = 'en'

// function
const utility = require('utility')
const moment = require('moment')

// repository
const { createResponseAndLog } = require('./error_log_repository')
const { createEmailHistory } = require('./email_history_repository')
const { getLatestStatus } = require('./status_history_repository')
const { getTemplateSendEmailById } = require('./m_email_detail_content_repository')
/* helper */
const { mailer } = require('helper')

/* library */
const he = require('he')
const { getUserAccountStatus } = require('./users_basic_data_repository')

const getLatestMtStatus = getLatestStatus({
  status_class_id: statusClassConstant.MT_STATUS,
})


async function getListAccount(userId) {
  const query = db('trading_accounts as ta')
    .leftJoin('users_basic_data as users', 'users.id', 'ta.user_basic_data_id')
    .leftJoin('m_reasons', 'm_reasons.id', 'ta.open_reason_id')
    .leftJoin('m_mt_servers', 'm_mt_servers.id', 'ta.mt_server_id')
    .leftJoin('m_account_leverage', 'm_account_leverage.id', 'ta.account_leverage_id')
    .leftJoin('m_account_type', 'm_account_type.id', 'm_mt_servers.account_type_id')
    .leftJoin(getLatestMtStatus, 'status_history.target_id', 'ta.id')
    .leftJoin('m_status', function() {
      // eslint-disable-next-line no-invalid-this
      this.on('m_status.status_code', '=', 'status_history.status_code')
        .andOn('m_status.status_label_number', flag.FALSE)
    })
    .select(
      'ta.id',
      'ta.mt_server_id',
      'm_mt_servers.server',
      'm_mt_servers.server_name',
      'm_mt_servers.server_key',
      'm_mt_servers.env_param_name',
      'm_mt_servers.account_type_id',
      'm_account_type.account_type_code',
      'm_account_type.account_type_name as account_type',
      'users.id as user_id',
      'ta.mt_account_no',
      'ta.portfolio_id',
      'ta.portfolio_name',
      'ta.portfolio_description',
      'ta.portfolio_description_default',
      'ta.trading_method',
      'ta.publish_range',
      'ta.publish_target',
      'ta.account_mode as trading_account_kind',
      'ta.platform',
      'ta.currency',
      'ta.account_leverage_id',
      'm_account_leverage.account_leverage as leverage',
      'ta.partner_code',
      'ta.open_reason_id',
      'ta.open_reason_other',
      'ta.support_comment',
      'm_status.status_code as mt_status_code',
      'm_status.status_label_number as mt_status_label_number',
      'ta.readonly',
      'ta.report',
      'ta.ts_regist',
      'm_reasons.ja_reason',
      'm_reasons.en_reason',
      'm_reasons.cn_reason',
      'm_reasons.kr_reason',
      'm_status.status_name',
      'm_status.frame_color',
      'm_status.paint_color',
      'm_status.text_color',
      'm_status.en_name',
      'm_status.ja_name',
      'm_status.cn_name',
      'm_status.kr_name',
    )
    .where('ta.delete_flag', flag.FALSE)
    .where('users.delete_flag', flag.FALSE)
    .where('ta.user_basic_data_id', userId)
  const orderArr = [{ column: 'trading_account_kind', order: 'DESC' }, { column: 'mt_status_code', order: 'ASC' }, { column: 'ta.id', order: 'DESC' }]
  return await query.orderBy(orderArr)
}

async function getAccountAcceptedAmount(userId) {
  return await db('trading_accounts')
    .leftJoin(getLatestMtStatus, 'status_history.target_id', 'trading_accounts.id')
    .count('trading_accounts.id as count')
    .where('status_history.status_code', statusCode.REQUIRED)
    .where('trading_accounts.account_mode', tradingAccountType.REAL)
    .where('trading_accounts.user_basic_data_id', userId)
    .where('trading_accounts.delete_flag', flag.FALSE)
    .first()
}

async function getTradingAccountById(id) {
  try {
    const result = await db('trading_accounts as ta')
      .leftJoin('m_mt_servers', 'm_mt_servers.id', 'ta.mt_server_id')
      .leftJoin('m_account_leverage', 'm_account_leverage.id', 'ta.account_leverage_id')
      .leftJoin('users_basic_data as users', 'users.id', 'ta.user_basic_data_id')
      .leftJoin('users_management_data', 'users_management_data.user_basic_data_id', 'ta.user_basic_data_id')
      .leftJoin('m_account_type', 'm_account_type.id', 'm_mt_servers.account_type_id')
      .leftJoin(getLatestMtStatus, 'status_history.target_id', 'ta.id')
      .select(
        'ta.id',
        'ta.user_basic_data_id as user_id',
        'ta.account_leverage_id as leverage',
        'm_account_leverage.account_leverage',
        'm_account_leverage.account_type_id',
        'ta.mt_account_no',
        'ta.account_mode as trading_account_kind',
        'ta.platform',
        'ta.currency',
        'ta.trading_password',
        'ta.readonly_password',
        'ta.readonly',
        'ta.portfolio_id',
        'ta.mt_server_id',
        'm_mt_servers.server_name',
        'm_mt_servers.server_key',
        'm_mt_servers.env_param_name',
        'users_management_data.customer_partner_code',
        'users.email',
        'users.first_name_romaji',
        'users.last_name_romaji',
        'users.member_id',
        'users.site_id',
        'status_history.status_code as mt_status_code',
        'm_account_type.account_type_name as account_type',
      )
      .where('ta.delete_flag', flag.FALSE)
      .where('ta.id', id)
    return result.length ? result[0] : null
  } catch (error) {
    throw error
  }
}

const updateTradingAccountMtInfo = async (accId, obj, url, dataTrading, dataOther = null, event = null, userErrorLog = null) => {
  // setup form error_log
  const trx = await db.transaction()
  try {
    // update trading account DB info
    if (obj) {
      const userUpdate = await trx('trading_accounts')
        .update(obj)
        .where({
          id: accId,
          delete_flag: flag.FALSE,
        })

      if (!userUpdate) {
        await trx.rollback()
        return { isError: true }
      }
    }

    // update trading account mt info
    if (!dataTrading.Leverage) {
      try {
        const isUpdateMTAccount = await utility.requestRetry(
          'POST',
          url,
          dataTrading,
        )
        if (isUpdateMTAccount.ReturnCode !== '0') {
          console.log(isUpdateMTAccount)
          await trx.rollback()
          return {
            isError: true,
            key: errorKeyServer.RESULT_NULL.TRADING_ACCOUNT_MT_INFO,
            errorDetail: {
              user_id: userErrorLog?.user_id,
              isAxiosError: true,
              config: {
                data: dataTrading,
                url,
              },
            },
          }
        }
      } catch (error) {
        error.errorKey = errorKeyServer.UPDATE_FAIL.TRADING_ACCOUNT_MT_INFO
        Object.assign(error, { user_id: userErrorLog?.user_id } )
        throw error
      }
    }

    // sync password with portfolio
    if (dataTrading.NewPass && dataTrading.IsTradePass === 1 && dataOther.portfolio_id) {
      const token = utility.setTokenForRedirectSite({
        id: dataOther.user_id,
        member_id: dataOther.member_id,
        site_id: dataOther.site_id,
      })
      const header = { 'Authorization': `Bearer ${token}` }
      try {
        await utility.requestPortfolioMyforex(
          'PUT',
          `${process.env.URL_PORTFOLIO_MYFOREX}/${dataOther.portfolio_id}`,
          header,
          { password: dataTrading.NewPass },
        )
      } catch (error) {
        error.errorKey = errorKeyServer.UPDATE_FAIL.PORTFOLIO_MYFOREX
        Object.assign(error, { user_id: userErrorLog?.user_id } )
        throw error
      }
    }

    // change mt group

    if (dataOther && dataTrading.Leverage) {
      try {
        const isUpdateGroup = await utility.requestRetry(
          'POST',
          dataOther.url,
          dataOther.data,
        )
        if (isUpdateGroup.ReturnCode !== '0') {
          console.log(isUpdateGroup)
          await trx.rollback()
          return { isError: true,
            key: errorKeyServer.RESULT_NULL.MT_GROUP,
            errorDetail: {
              user_id: userErrorLog?.user_id,
              isAxiosError: true,
              config: {
                data: dataOther.data,
                url: dataOther.url,
              },
            },
          }
        }
      } catch (error) {
        error.errorKey = errorKeyServer.UPDATE_FAIL.MT_GROUP
        Object.assign(error, { user_id: userErrorLog?.user_id })
        throw error
      }
    }

    // update send mail DAILY_CONFIRMATION_MONTHLY_STATEMENT
    if (dataTrading.Reports === enable.OFF || dataTrading.Reports === enable.ON) {
      const userInfo = await db('trading_accounts').select('user_basic_data_id as user_id').where({ id: accId }).first()
      const listReports = await db('trading_accounts')
        .leftJoin(getLatestMtStatus, 'status_history.target_id', 'trading_accounts.id')
        .select(
          'trading_accounts.id',
          'trading_accounts.user_basic_data_id as user_id',
          'trading_accounts.report',
        )
        .where({
          'trading_accounts.user_basic_data_id': userInfo.user_id,
          'trading_accounts.report': dataTrading.Reports === enable.OFF ? enable.ON : enable.OFF,
          'trading_accounts.delete_flag': flag.FALSE,
        })
        .whereIn('status_history.status_code', [statusCode.REQUIRED, statusCode.PROCESSING, statusCode.APPROVED])

      if (listReports.length === 1 && listReports[0].id === Number(accId)) {
        const isUpdate = await trx('send_mail_setting')
          .update({ enabled: dataTrading.Reports })
          .where({
            user_basic_data_id: userInfo.user_id,
            distribution_service_id: distributionService.DAILY_CONFIRMATION_MONTHLY_STATEMENT,
            delete_flag: flag.FALSE,
          })
        if (!isUpdate) {
          await trx.rollback()
          return { isError: true }
        }
      }
    }

    await trx.commit()
    return { isError: false }
  } catch (error) {
    await trx.rollback()
    console.log(error)
    Object.assign(error, { user_id: userErrorLog?.user_id })
    throw error
  }
}

const checkUserCloseByMTAccount = async (accountId) => {
  const result = await db('trading_accounts as t')
    .join('users_basic_data as u', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('u.delete_flag', flag.FALSE)
        .on('t.user_basic_data_id', 'u.id')
    })
    .join(getUserAccountStatus(), function() {
      /* eslint-disable no-invalid-this */
      this
        .on('gsh.target_id', 'u.id')
    })
    .select(
      't.user_basic_data_id as user_id',
      'gsh.status_code as account_status_code',
    )
    .where('t.id', accountId)
    .where('gsh.status_code', '<>', statusCode.CLOSED)
    .first()
  return result ? true : false
}

async function updateTradingAccount(payload, accountId) {
  try {
    const res = await db.transaction(async (trx) => {
      const result = await trx('trading_accounts')
        .update(payload)
        .where('id', accountId)

      if (!result) {
        throw Object.assign(new Error('update trading_account failed'), { isCustomError: true })
      }

      // update send mail DAILY_CONFIRMATION_MONTHLY_STATEMENT
      if (payload.report === enable.OFF || payload.report === enable.ON) {
        const userInfo = await db('trading_accounts').select('user_basic_data_id as user_id').where({ id: accountId }).first()
        const listReports = await db('trading_accounts')
          .leftJoin(getLatestMtStatus, 'status_history.target_id', 'trading_accounts.id')
          .select('trading_accounts.id', 'trading_accounts.user_basic_data_id as user_id', 'trading_accounts.report')
          .where({
            'trading_accounts.user_basic_data_id': userInfo.user_id,
            'trading_accounts.report': payload.report === enable.OFF ? enable.ON : enable.OFF,
            'trading_accounts.delete_flag': flag.FALSE,
          })
          .whereIn('status_history.status_code', [statusCode.REQUIRED, statusCode.PROCESSING, statusCode.APPROVED])
        if (listReports.length === 1 && listReports[0].id === Number(accountId)) {
          const isUpdate = await trx('send_mail_setting')
            .update({ enabled: payload.report })
            .where({
              user_basic_data_id: userInfo.user_id,
              distribution_service_id: distributionService.DAILY_CONFIRMATION_MONTHLY_STATEMENT,
              delete_flag: flag.FALSE,
            })
          if (!isUpdate) {
            throw Object.assign(new Error('update send_mail_setting failed'), { isCustomError: true })
          }
        }
      }

      return true
    })
    return { isError: false, data: res }
  } catch (error) {
    console.log(error)
    if (error.isCustomError) {
      return { isError: true, error }
    }
    throw error
  }
}

const checkDuplicateAccount = async (obj, isReject = false) => {
  const query = db('trading_accounts')
    .leftJoin(getLatestMtStatus, 'status_history.target_id', 'trading_accounts.id')
    .select(
      'trading_accounts.user_basic_data_id as user_id',
      'trading_accounts.account_mode as trading_account_kind',
      'trading_accounts.platform',
      'trading_accounts.partner_code',
      'trading_accounts.currency',
    )
    .where({
      ...obj,
      'trading_accounts.delete_flag': flag.FALSE,
    })

  if (isReject) {
    query.where('status_history.status_code', statusCode.REJECTED).first()
  } else {
    query.whereIn('status_history.status_code', [statusCode.APPROVED, statusCode.CLOSED]).first()
  }

  return await query ? true : false
}

const updateStatusAndCreateTradingAccount = async (accountId, dataTrading, account, updateData, event = null,
  userErrorLog = null, mailInfo = null) => {
  try {
    // insert account MT server
    console.log('====== START Create MT Account: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
    const url = utility.getMTURL(account.env_param_name, account.platform, apiInfo.ACCOUNT_ADD)
    const isCreateMTServer = await utility.requestRetry(
      'POST',
      url,
      dataTrading,
    )
    if (isCreateMTServer.ReturnCode !== '0') {
      console.log(isCreateMTServer)
      const error = {
        isAxiosError: true,
        config: {
          url: url,
          data: dataTrading,
        },
        response: {
          data: isCreateMTServer,
          status: Number(isCreateMTServer.ReturnCode),
        },
      }
      throw error
    }
    console.log('====== END Create MT Account: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))

    // update trading accounts
    const isUpdate = await db('trading_accounts')
      .update({
        ...updateData,
        mt_account_no: isCreateMTServer.Account.LoginId,
      })
      .where({
        id: accountId,
        delete_flag: flag.FALSE,
      })
    if (!isUpdate) {
      throw Object.assign(new Error('insert DB failed'), { isCustomError: true })
    }

    const { tradingAccountExisted, userInfo, is_send_email } = mailInfo
    const portalLang = userInfo.language_portal ? userInfo.language_portal : defaultLang
    let sendMail
    if (is_send_email) {
      // Setting send mail
      const typeLang = userInfo.language_email ? userInfo.language_email : defaultLang
      const lang = await utility.getMultilingualism(process.env.LOCALES_SOURCE, typeLang)
      const taLang = lang.email.create_real_trading_account

      // Mail info
      const to = `${userInfo.email}`
      const text = ''
      const userName = `${userInfo.first_name_romaji} ${userInfo.last_name_romaji}`
      const emailTemplateId = !tradingAccountExisted ? emailDetailContentId.CHANGE_MT_STATUS_APPROVED :
        emailDetailContentId.CHANGE_MT_STATUS_APPROVED_ADDITIONAL
      // Get template mail
      const emailTemplate = await getTemplateSendEmailById(emailTemplateId)
      const emailParameters = {
        user_name: userName.toUpperCase(),
        url_login: `${process.env.URL_FE_FXT}/login/?lang=${portalLang}`,
        login_id: isCreateMTServer.Account.LoginId,
        trading_password: he.escape(account.tradePassword),
        readonly_password: he.escape(account.invPassword),
        server_name: account.server_name,
        server_address: account.fqdn_name.replace(/\./g, '<span>.</span>'),
        platform: account.platform === platform.MT4 ? 'MetaTrader 4' : 'MetaTrader 5',
        account_type: account.account_type_id === accountTypeID.ELITE ? taLang.ta_cd_block2_data2.content.content1 :
          taLang.ta_cd_block2_data2.content.content2,
        leverage: `${account.account_leverage}`,
        base_currency: _renderBaseCurrency(account.currency, taLang),
      }
      emailTemplate.subject = emailTemplate[`${typeLang}_subject`]
      // Render email
      const html = utility.renderEmail(emailParameters, emailTemplate, typeLang)

      // /// Send mail
      sendMail = async () => {
        try {
          console.log('====== START send mail: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
          const responseSendMail = await mailer.sendMailFXT(to, emailTemplate.subject, text, html, emailTemplate)
          if (responseSendMail.isError) {
            throw new Error('send mail create trading account failed')
          }

          // Create email history
          await createEmailHistory({
            ...responseSendMail,
            email_detail_content_id: emailTemplate.id,
            user_basic_data_id: userInfo.id,
          })
          console.log('====== END send mail: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
          return responseSendMail
        } catch (error) {
          console.log(error)
          await createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
        }
      }
    }

    // /// create portfolio
    const createPortfolio = async () => {
      let portfolioInfo
      let portfolio_name_default
      let portfolio_description_default

      try {
        // get broker info
        const broker_info = await db('m_broker')
          .select(
            'broker_code',
            'broker_name',
          )
          .where({
            id: brokerID.FXON,
            delete_flag: flag.FALSE,
          })
          .first()

        const token = utility.setTokenForRedirectSite(userInfo)
        const headers = { 'Authorization': `Bearer ${token}` }

        // get server MT id in portfolio
        console.log('====== START get server portfolio: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
        const serverGroup = await utility.requestPortfolioMyforex(
          'GET',
          `${process.env.URL_PORTFOLIO_MYFOREX}/servers/${account.platform}`,
          headers,
          { broker_id: broker_info.broker_code },
        )
        console.log('====== END get server portfolio: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
        const server_info = serverGroup.data.find((el) => el.server_name === account.server_name)
        const dataRequest = {
          platform: account.platform,
          server_id: server_info.id,
          account_no: isCreateMTServer.Account.LoginId,
          password: dataTrading.TradePassword,
          publish_datetime: moment().utc().format(dateFormat.DATE_TIME),
        }

        // create new portfolio
        console.log('====== START create portfolio: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
        portfolioInfo = await utility.requestPortfolioMyforex(
          'POST',
          `${process.env.URL_PORTFOLIO_MYFOREX}/`,
          headers,
          dataRequest,
        )
        console.log('====== END create portfolio: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))

        // generate portfolio name default
        portfolio_name_default = `${dataRequest.account_no} - ${account?.trading_account_kind} (${account?.currency})`
        const listTradingAccount = await db('trading_accounts')
          .leftJoin(getLatestMtStatus, 'status_history.target_id', 'trading_accounts.id')
          .select('trading_accounts.portfolio_name')
          .where('trading_accounts.user_basic_data_id', account.user_id)
          .where('trading_accounts.delete_flag', flag.FALSE)
          .where('status_history.status_code', statusCode.APPROVED)

        let suffixNumber = 1
        while (true) {
          const existedPortfolio = listTradingAccount.find((el) => el.portfolio_name === portfolio_name_default)
          if (!existedPortfolio) {
            break
          }
          portfolio_name_default = `${portfolio_name_default}${suffixNumber}`
          suffixNumber++
        }

        // generate portfolio description default
        switch (portalLang) {
          case 'en':
            // eslint-disable-next-line max-len
            portfolio_description_default = `${broker_info.broker_name}/${account.account_type_id === accountTypeID.STANDARD ? 'Standard' : 'Elite'} account, Discretionary trading ${Number(account.account_leverage.substring(2))}x leverage`
            break
          case 'ja':
            // eslint-disable-next-line max-len
            portfolio_description_default = `${broker_info.broker_name}/${account.account_type_id === accountTypeID.STANDARD ? 'スタンダード' : 'エリート'}口座、レバレッジ${Number(account.account_leverage.substring(2))}倍の裁量売買トレード`
            break
          case 'cn':
            // eslint-disable-next-line max-len
            portfolio_description_default = `${broker_info.broker_name}/${account.account_type_id === accountTypeID.STANDARD ? '标准' : '精英'}账户、${Number(account.account_leverage.substring(2))}倍杠杆全权委托交易`
            break
          case 'kr':
            // eslint-disable-next-line max-len
            portfolio_description_default = `${broker_info.broker_name}/${account.account_type_id === accountTypeID.STANDARD ? '스탠더드' : '엘리트'} 계좌, 레버리지 ${Number(account.account_leverage.substring(2))}배재량 매매`
            break
          default:
            break
        }
        // update trading accounts
        const isUpdate = await db('trading_accounts')
          .update({
            portfolio_id: portfolioInfo?.data,
            portfolio_name: portfolio_name_default,
            portfolio_description: portfolio_description_default,
            portfolio_description_default: flag.TRUE,
          })
          .where({
            id: accountId,
            delete_flag: flag.FALSE,
          })

        if (!isUpdate) {
          throw new Error('save portfolio_id, portfolio_name, portfolio description failed')
        }

        // sync portfolio
        console.log('====== START Sync portfolio: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
        await utility.requestPortfolioMyforex(
          'POST',
          `${process.env.URL_PORTFOLIO_MYFOREX}/${portfolioInfo.data}/sync`,
          headers,
        )
        console.log('====== END sync portfolio: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))

        // check sync result portfolio
        console.log('====== START check sync portfolio: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))
        let i = 1
        let resCheck
        while (true) {
          try {
            resCheck = await new Promise((resolve, reject) => {
              setTimeout(async () => {
                console.log('check sync portfolio =>> ' + i)
                const res = await utility.requestPortfolioMyforex(
                  'GET',
                  `${process.env.URL_PORTFOLIO_MYFOREX}/${portfolioInfo.data}`,
                  headers,
                )
                console.log('result check =>>', res)
                if (res.data[0].sync_progress === 2) {
                  resolve(true)
                } else {
                  // eslint-disable-next-line prefer-promise-reject-errors
                  reject(false)
                }
              }, 3000)
            })
          } catch (error) {
            resCheck = false
          }

          if (resCheck || i === 5) {
            break
          }
          i++
        }
        console.log('====== END check sync portfolio: ', moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS'))

        // update name portfolio in portfolio server
        if (resCheck) {
          await utility.requestPortfolioMyforex(
            'PUT',
            `${process.env.URL_PORTFOLIO_MYFOREX}/${portfolioInfo.data}`,
            headers,
            {
              kind: account.account_type_id === accountTypeID.STANDARD ? accountTypeShort.STANDARD : accountTypeShort.ELITE,
            },
          )
        }
      } catch (error) {
        console.log(error)
        await createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
      }
      return {
        portfolioInfo,
        portfolio_name_default,
        portfolio_description_default,
      }
    }

    let isSendMail
    let isPortfolio
    if (!sendMail) {
      isPortfolio = await createPortfolio()
    } else {
      [isSendMail, isPortfolio] = await Promise.all([
        sendMail(),
        createPortfolio(),
      ])

      console.log('send mail => ' + isSendMail)
    }

    return {
      isError: false,
      data: isCreateMTServer,
      portfolio_info: {
        portfolio_id: isPortfolio?.portfolioInfo?.data,
        portfolio_name: isPortfolio?.portfolio_name_default,
        portfolio_description: isPortfolio?.portfolio_description_default,
      },
    }
  } catch (error) {
    console.log(error)
    if (error.isCustomError) {
      return { isError: true, error }
    }

    if (error.isAxiosError) {
      error.errorKey = errorKeyServer.UPDATE_MT_ACCOUNT_STATUS.CALL_API_MT_FAILED
    }
    throw error
  }
}

const getTradingAccountsActive = async (payloadUser) => {
  const result = await db('trading_accounts')
    .leftJoin(getLatestMtStatus, 'status_history.target_id', 'trading_accounts.id')
    .select(
      'trading_accounts.mt_account_no',
      'trading_accounts.account_mode as trading_account_kind',
      'trading_accounts.currency',
      'trading_accounts.mt_server_id',
    )
    .where({
      ...payloadUser,
      'status_history.status_code': statusCode.APPROVED,
      'trading_accounts.delete_flag': flag.FALSE,
    })
  return result ? result : null
}

const getTradingAccountsByStatus = async (payloadUser, status) => {
  const result = await db('trading_accounts as ta')
    .leftJoin('m_mt_servers', 'm_mt_servers.id', 'ta.mt_server_id')
    .leftJoin('m_account_leverage', 'm_account_leverage.id', 'ta.account_leverage_id')
    .leftJoin('m_account_type', 'm_account_type.id', 'm_mt_servers.account_type_id')
    .leftJoin(getLatestMtStatus, 'status_history.target_id', 'ta.id')
    .select(
      'ta.id',
      'ta.user_basic_data_id',
      'ta.account_mode as trading_account_kind',
      'ta.platform',
      'm_account_type.account_type_name as account_type',
      db.raw('CAST(SUBSTRING_INDEX(m_account_leverage.account_leverage, ":",-1) AS SIGNED) as leverage'),
      'ta.partner_code',
      'ta.currency',
      'ta.mt_account_no',
      'ta.mt_server_id',
      'status_history.status_code as mt_status_code',
    )
    .where(payloadUser)
    .where('ta.delete_flag', flag.FALSE)
    .whereIn('status_history.status_code', status)
  return result.length ? result : null
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

const getTradingAccountsByPlatformAndCurrency = async (platform, currency, siteId) => {
  const result = await db('trading_accounts as t')
    .select(
      't.id',
      't.mt_account_no',
    )
    .join('users_basic_data as u', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('u.site_id', siteId)
        .on('u.delete_flag', flag.FALSE)
        .on('t.delete_flag', flag.FALSE)
        .on('t.user_basic_data_id', 'u.id')
    })
    .where({
      account_mode: tradingAccountType.REAL,
      currency: currency,
      platform: platform,
    })

  return result
}

const checkPortfolioExist = async (portfolioId, userId) => {
  const result = await db('trading_accounts')
    .select('id')
    .where({
      'user_basic_data_id': userId,
      'portfolio_id': portfolioId,
      'delete_flag': flag.FALSE,
    }).first()

  return result ? true : false
}

const updatePortfolioOfTradingAccount = async (objectUpdate, portfolioId, userInfo, event = null) => {
  return await db.transaction(async (trx) => {
    await trx('trading_accounts')
      .update(objectUpdate)
      .where('portfolio_id', portfolioId)
      .where('delete_flag', flag.FALSE)

    if (objectUpdate.portfolio_name) {
      const token = utility.setTokenForRedirectSite(userInfo)
      const headers = { 'Authorization': `Bearer ${token}` }

      const urlUpdatePortfolio = `${process.env.URL_PORTFOLIO_MYFOREX}/${portfolioId}`

      await utility.requestPortfolioMyforex('put', urlUpdatePortfolio, headers, { portfolio_name: objectUpdate.portfolio_name })
    }

    return true
  })
}

const getListPortfolioByOriginName = async (userId) => {
  const result = await db('trading_accounts')
    .select('portfolio_name as name')
    .where({
      'user_basic_data_id': userId,
      'delete_flag': flag.FALSE,
    })

  return result
}

const getPortfoliosToDelete = async (user_id) => {
  const result = await db('trading_accounts ')
    .select(
      'id',
      'portfolio_id',
    )
    .where('user_basic_data_id', user_id)
    .where('delete_flag', flag.FALSE)
    .whereNotNull('portfolio_id')
  return result ? result : null
}

const getTradingAccountDetail = async (portfolio_id) => {
  const result = await db('trading_accounts as ta')
    .select(
      'ta.id',
      'ta.user_basic_data_id as user_id',
      'ta.mt_account_no',
      'ta.portfolio_name',
      'ta.portfolio_description',
      'ta.trading_method',
      'ta.publish_target',
      'ta.publish_range',
    )
    .where('ta.delete_flag', flag.FALSE)
    .where('ta.portfolio_id', portfolio_id)
  return result.length ? result[0] : null
}

const getListPortfolioByUserId = async (userId) => {
  // GET LATEST CHANGE STATUS TO APPROVED
  const getLatestStatusApproved = getLatestStatus({
    status_class_id: statusClassConstant.MT_STATUS,
    status_code: statusCode.APPROVED,
  })

  const dataPortfolios = await db('trading_accounts as ta')
    .leftJoin('m_account_leverage as mal', 'ta.account_leverage_id', 'mal.id')
    .leftJoin('m_account_type as mat', 'mat.id', 'mal.account_type_id')
    .leftJoin(getLatestStatusApproved, 'status_history.target_id', 'ta.id')
    .select(
      'ta.id',
      'ta.user_basic_data_id as user_id',
      'ta.portfolio_id',
      'ta.portfolio_name',
      'ta.portfolio_description',
      'ta.portfolio_description_default',
      'ta.publish_target',
      'ta.publish_range',
      'ta.trading_method',
      'mat.account_type_name as account_type',
      db.raw('CAST(SUBSTRING_INDEX(mal.account_leverage, ":",-1) AS SIGNED) as leverage'),
      'status_history.ts_regist as ts_approved_status',
    )
    .where({
      'ta.delete_flag': flag.FALSE,
      'ta.user_basic_data_id': userId,
    })
    .whereNotNull('ta.portfolio_id')
    .orderBy('ts_approved_status', 'desc')

  return dataPortfolios
}

async function getAccountDetailById(id) {
  const result = await db('trading_accounts as ta')
    .leftJoin('m_account_leverage', 'm_account_leverage.id', 'ta.account_leverage_id')
    .leftJoin(getLatestMtStatus, 'status_history.target_id', 'ta.id')
    .select(
      'ta.id',
      'ta.user_basic_data_id as user_id',
      'status_history.status_code as mt_status_code',
      'ta.account_leverage_id',
      'ta.mt_account_no',
      'ta.account_mode',
      'ta.platform',
      'ta.currency',
      'ta.readonly',
      'ta.portfolio_id',
      'ta.mt_server_id',
      'm_account_leverage.account_type_id',
    )
    .where('ta.delete_flag', flag.FALSE)
    .where('ta.id', id)
    .first()
  return result
}

async function getAllTradingAccount(queryString, pagination, staffInfo) {
  const query = db('trading_accounts as ta')
    .leftJoin('m_mt_servers', 'm_mt_servers.id', 'ta.mt_server_id')
    .leftJoin('users_basic_data as users', 'users.id', 'ta.user_basic_data_id')
    .leftJoin('users_corporate as uc', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('ta.user_basic_data_id', 'uc.user_basic_data_id')
        .on('uc.beneficial_owner', flag.FALSE)
    })

    .leftJoin(getLatestMtStatus, 'status_history.target_id', 'ta.id')

    .leftJoin('m_status as ms1', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('status_history.status_code', 'ms1.status_code')
        .on('ms1.status_label_number', flag.FALSE)
        .on('ms1.delete_flag', flag.FALSE)
    })
    .leftJoin('m_status as ms3', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('status_history.status_code', 'ms3.status_code')
        .on('status_history.status_label_number', 'ms3.status_label_number')
        .on('ms3.status_label_number', '<>', flag.FALSE)
        .on('ms3.delete_flag', flag.FALSE)
    })

    .leftJoin('general_status_history as sh2', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('ta.id', 'sh2.target_id')
        .on('sh2.status_code', statusCode.APPROVED)
        .on('sh2.status_class_id', statusClassConstant.MT_STATUS)
    })


    .leftJoin('users_basic_data as ubd', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('ubd.id', 'status_history.updated_by_user_id')
        .on('ubd.delete_flag', flag.FALSE)
    })
    .leftJoin('m_account_leverage', 'm_account_leverage.id', 'ta.account_leverage_id')
    .leftJoin('m_account_type', 'm_account_type.id', 'm_account_leverage.account_type_id')
    .leftJoin('m_site', 'm_mt_servers.site_id', 'm_site.id')
    .select(
      db.raw('CONCAT(LEFT(ubd.last_name_romaji,1),".",ubd.first_name_romaji) as staff_name'),
      'users.email',
      'users.id as user_id',
      'ta.id',
      'm_mt_servers.server_name',
      'm_mt_servers.env_param_name',
      'm_mt_servers.server_key',
      'ta.platform',
      'm_account_type.account_type_name as account_type',
      'm_account_type.id as account_type_id',
      'm_site.id as site_id',
      'm_site.site_name',
      'm_site.side_logo_path',
      'ta.mt_account_no',
      'ta.portfolio_id',
      'ta.account_mode as trading_account_kind',
      'ta.currency',
      'ta.mt_server_id',
      'ta.account_leverage_id',
      'm_account_leverage.account_leverage as leverage',
      'ta.partner_code',
      'status_history.status_code as mt_status_code',
      'sh2.ts_update as ts_active',
      'ta.ts_regist',
      'status_history.ts_regist as decision_date',
      'ms1.en_name as status_en_name',
      'ms1.ja_name as status_ja_name',
      'ms1.cn_name as status_cn_name',
      'ms1.kr_name as status_kr_name',
      'ms1.frame_color as status_frame_color',
      'ms1.paint_color as status_paint_color',
      'ms1.text_color as status_text_color',
      'ms3.frame_color as label_status_frame_color',
      'ms3.paint_color as label_status_paint_color',
      'ms3.text_color as label_status_text_color',

      'ms3.en_name as label_status_en_name',
      'ms3.ja_name as label_status_ja_name',
      'ms3.cn_name as label_status_cn_name',
      'ms3.kr_name as label_status_kr_name',

      db.raw(`CASE WHEN status_history.status_label_message IS NULL THEN ms3.en_status_label_detail
      ELSE status_history.status_label_message END as reason_en_name_detail`),
      db.raw(`CASE WHEN status_history.status_label_message IS NULL THEN ms3.ja_status_label_detail
      ELSE status_history.status_label_message END as reason_ja_name_detail`),
      db.raw(`CASE WHEN status_history.status_label_message IS NULL THEN ms3.cn_status_label_detail
      ELSE status_history.status_label_message END as reason_cn_name_detail`),
      db.raw(`CASE WHEN status_history.status_label_message IS NULL THEN ms3.kr_status_label_detail
      ELSE status_history.status_label_message END as reason_kr_name_detail`),

      db.raw('CAST(SUBSTRING_INDEX(m_account_leverage.account_leverage, ":",-1) AS UNSIGNED) as account_leverage_order'),
      db.raw(`CASE
      WHEN (${queryString.display_name ? `"${queryString.display_name}"` : null} = "corporate" and users.corporate_flag = 1)
          THEN uc.corporate_name_english
      ELSE CONCAT(users.first_name_romaji," ",users.last_name_romaji) 
      END AS full_name`,
      ),
      db.raw(`CASE
      WHEN status_history.action_method = ${actionMethod.OPERATOR_ACTION} 
        THEN CONCAT(LEFT(ubd.last_name_romaji,1),".",ubd.first_name_romaji)
      WHEN status_history.action_method = ${actionMethod.USER_ACTION} 
        THEN "User action"
      ELSE "System action"
      END AS action_method`,
      ),
    )
    .where('ta.delete_flag', flag.FALSE)
    .where('m_site.enable_flag', flag.TRUE)

  if (queryString.id) {
    queryString.id = utility.escapeSql(queryString.id)
    query.whereILike('ta.id', `%${queryString.id}%`)
  }

  if (queryString.site_id) {
    query.whereIn('m_site.id', queryString.site_id.split(',').filter(Number))
  }

  if (queryString.trading_account_kind) {
    query.whereIn('ta.account_mode', queryString.trading_account_kind.split(','))
  }

  if (queryString.account_type_id) {
    query.whereIn('m_account_leverage.account_type_id', queryString.account_type_id.split(',').filter(Number))
  }

  if (queryString.currency) {
    query.whereIn('ta.currency', queryString.currency.split(','))
  }

  const utc = (queryString.utc || '').replace(/[()UTC]/g, '') || '+00:00'

  if (queryString.ts_from && queryString.ts_to) {
    const ts_from = moment(queryString.ts_from).startOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME)
    const ts_to = moment(queryString.ts_to).endOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME)

    if (queryString.ts_regist === 'true') {
      query.whereBetween('ta.ts_regist', [ts_from, ts_to])
    } else if (queryString.ts_active === 'true') {
      query.whereBetween('sh2.ts_update', [ts_from, ts_to])
    }
  }

  if (queryString.leverage_search) {
    queryString.leverage_search = utility.escapeSql(queryString.leverage_search)
    query.whereILike('m_account_leverage.account_leverage', `%${queryString.leverage_search}%`)
  }

  if (queryString.leverage) {
    query.whereIn('m_account_leverage.account_leverage', queryString.leverage.split(','))
  }

  if (queryString.partner_code) {
    queryString.partner_code = utility.escapeSql(queryString.partner_code)
    query.whereILike('ta.partner_code', `%${queryString.partner_code}%`)
  }

  if (queryString.mt_account_no) {
    queryString.mt_account_no = utility.escapeSql(queryString.mt_account_no)
    query.whereILike('ta.mt_account_no', `%${queryString.mt_account_no}%`)
  }

  if (queryString.mt_server_id) {
    query.whereIn('ta.mt_server_id', queryString.mt_server_id.split(',').filter(Number))
  }

  if (queryString.full_name) {
    queryString.full_name = utility.escapeSql(queryString.full_name)
    query.where(
      function() {
        this.where(db.raw(`CONCAT(users.first_name_romaji," ",users.last_name_romaji) like "%${queryString.full_name}%"`))
        if (queryString.display_name === 'corporate') {
          this.orWhereILike('uc.corporate_name_english', `%${queryString.full_name}%`)
        }
      },
    )
  }

  if (queryString.email) {
    queryString.email = utility.escapeSql(queryString.email)
    query.whereILike('users.email', `%${queryString.email}%`)
  }

  if (queryString.search) {
    const textSearch = utility.escapeSql(queryString.search)

    // handle display datetime
    let formatDisplay
    switch (queryString.display_date_time) {
      case displayDateTime.MM_DD_YYYY:
        formatDisplay = '%m.%d.%Y'
        break
      case displayDateTime.DD_MM_YYYY:
        formatDisplay = '%d.%m.%Y'
        break
      default:
        formatDisplay = '%Y.%m.%d'
        break
    }

    // eslint-disable-next-line no-invalid-this
    query.whereILike(db.raw(`DATE_FORMAT(CONVERT_TZ(ta.ts_regist, "+00:00","${utc}"),"${formatDisplay} %H:%i:%S")`), `%${textSearch}%`)
      .orWhereILike('ta.id', `%${textSearch}%`)
      .orWhereILike('ta.account_mode', `%${textSearch}%`)
      .orWhereILike('ta.ts_regist', `%${textSearch}%`)
      .orWhereILike('m_site.site_name', `%${textSearch}%`)
      .orWhereILike('m_account_type.account_type_name', `%${textSearch}%`)
      .orWhereILike('ta.currency', `%${textSearch}%`)
      .orWhereILike('m_account_leverage.account_leverage', `%${textSearch}%`)
      .orWhereILike(db.raw(`DATE_FORMAT(CONVERT_TZ(sh2.ts_update, "+00:00","${utc}"),"${formatDisplay} %H:%i:%S")`), `%${textSearch}%`)
      .orWhereILike('ta.mt_account_no', `%${textSearch}%`)
      .orWhereILike('m_mt_servers.server_name', `%${textSearch}%`)
      .orWhereILike(`ms1.${staffInfo.language_portal}_name`, `%${textSearch}%`)
      .orWhereILike(`ms3.${staffInfo.language_portal}_name`, `%${textSearch}%`)
      .orWhereILike(db.raw(`CASE
        WHEN status_history.action_method = ${actionMethod.OPERATOR_ACTION} 
          THEN CONCAT(LEFT(ubd.last_name_romaji,1),".",ubd.first_name_romaji)
        WHEN status_history.action_method = ${actionMethod.USER_ACTION} 
          THEN "User action"
        ELSE "System action"
        END`,
      ), `%${textSearch}%`)
      .orWhere(
        function() {
          this.where(db.raw(`CONCAT(users.first_name_romaji," ",users.last_name_romaji) like '%${textSearch}%'`))
          if (queryString.display_name === 'corporate') {
            this.orWhereILike('uc.corporate_name_english', `%${textSearch}%`)
          }
        },
      )
      .orWhereILike('users.email', `%${textSearch}%`)
      .orWhereILike('ta.portfolio_id', `%${textSearch}%`)
      .orWhereILike(db.raw(`DATE_FORMAT(CONVERT_TZ(status_history.ts_regist, "+00:00","${utc}"),"${formatDisplay} %H:%i:%S")`), `%${textSearch}%`)
  }

  const orderArr = [...pagination.sort, { column: 'ts_regist', order: 'DESC' }]

  if (queryString.isExportCSV === 'true') {
    return await query.orderBy(orderArr)
  }

  return await query.orderBy(orderArr).paginate(pagination)
}


module.exports = {
  getListAccount,
  getAccountAcceptedAmount,
  getTradingAccountById,
  updateTradingAccountMtInfo,
  updateTradingAccount,
  checkDuplicateAccount,
  updateStatusAndCreateTradingAccount,
  getTradingAccountsActive,
  getTradingAccountsByStatus,
  getTradingAccountsByPlatformAndCurrency,
  updatePortfolioOfTradingAccount,
  checkPortfolioExist,
  getListPortfolioByOriginName,
  getTradingAccountDetail,
  getListPortfolioByUserId,
  getAccountDetailById,
  getPortfoliosToDelete,
  checkUserCloseByMTAccount,
  getAllTradingAccount,
}
