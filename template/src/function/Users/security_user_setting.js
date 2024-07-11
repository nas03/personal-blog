'use strict'

/* constant */
const { flag, category, contentUpdate, twoFactorAuthentication, passwordDisplay, notifyUnusualLogin,
  apiInfo, baseCurrency, commonSiteId, distributionService, passwordStrength, envCommon, statusCode,
  errorMessageCodeConstant } = require('constant')

/* func */
const utility = require('utility')
const operationHistory = require('../History/operation_history.js').createOperationHistory
const { formattedEmailSiteUser, notTextJapanValidate, mustNotEmoji, notSpaceValidate,
  middleLevelPassword, highLevelPassword } = require('helper').regex

/* db */
const { sendMailSettingRepository, tradingAccountRepository,
  serverInfoRepository, errorLogRepository, usersBasicDataRepository, usersPortalDataRepository } = require('repository')

/* library */
const passwordHash = require('password-hash')
const _ = require('lodash')

const updateSecurityUserSetting = async (event) => {
  try {
    const { user_id } = event.pathParameters
    event.user_id = user_id || null
    const { fieldName, fieldData } = JSON.parse(event.body)
    if (!fieldName && !fieldData) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }
    const directIpAddress = event.requestContext.identity.sourceIp
    const directUserAgent = event.headers['User-Agent']
    const staff_id = utility.getUserIdByToken(event)

    // GET USER DATA
    const userInfor = await usersBasicDataRepository.getUserSettingById(user_id)
    // check account status
    if (userInfor.account_status_code === statusCode.CLOSED) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UPDATE_SECURITY_USER_SETTING.ACCOUNT_CLOSED])
    }


    const userErrorLog = {
      user_id,
      site_id: userInfor.site_id,
    }

    let categoryId
    let contentTypeId
    let beforeUpdate
    let afterUpdate
    let contentTypeId2
    let beforeUpdate2
    let afterUpdate2

    // get env from aws parameter store
    const env = await utility.getEnvConfig([
      envCommon.APIKEY_MT_CHANGE_EMAIL,
      envCommon.APIKEY_MT_CHANGE_PHONE,
      envCommon.APIKEY_MT_CHANGE_REPORTS,
    ])

    switch (fieldName) {
      // case 1: change email
      case 'email':
        if (!fieldData.email) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
        }

        const isValidateEmail = formattedEmailSiteUser(fieldData.email)
        if (!isValidateEmail) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        // check email existed
        const isExistedEmail = await usersBasicDataRepository.isDuplicateField({
          email: fieldData.email,
          site_id: userInfor.site_id,
        })
        if (isExistedEmail) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.UPDATE_SECURITY_USER_SETTING.EMAIL_EXIST_IN_SYSTEM])
        }
        let emailUpdate
        const tradingAccountActive = await tradingAccountRepository.getTradingAccountsActive(
          { user_basic_data_id: user_id },
        )
        if (tradingAccountActive.length && userInfor.site_id === commonSiteId.FXT) {
          const groupBy = _.groupBy(tradingAccountActive, 'mt_server_id')

          const servers = await serverInfoRepository.getAllMtServerInfo()
          const apiKey = {
            api_key: env[envCommon.APIKEY_MT_CHANGE_EMAIL],
            api_name: apiInfo.CHANGE_EMAIL,
          }

          const groupServer = renderGroupMtAccount(groupBy)
          // update user info and account mt server
          emailUpdate = await usersBasicDataRepository.updateUserMtInfo(
            user_id,
            { email: fieldData.email },
            groupServer,
            servers,
            apiKey,
            { Email: fieldData.email },
            userInfor,
            event,
            userErrorLog,
          )
          if (emailUpdate.isError) {
            if (emailUpdate.data) {
              const error = {
                isAxiosError: true,
                config: {
                  data: emailUpdate.data,
                  url: emailUpdate.url,
                },
              }
              return await errorLogRepository.createResponseAndLog(event, error, null,
                [errorMessageCodeConstant.UPDATE_SECURITY_USER_SETTING.MT_SERVER_RESULTS_EMAIL_IS_NULL])
            } else {
              return await errorLogRepository.createResponseAndLog(event, null, null,
                [errorMessageCodeConstant.UPDATE_SECURITY_USER_SETTING.UPDATE_FAIL.EMAIL_FXT])
            }
          }
        } else {
          // update user
          emailUpdate = await usersBasicDataRepository.updateUserById(user_id, { email: fieldData.email })
          if (!emailUpdate) {
            return await errorLogRepository.createResponseAndLog(event, null, null,
              [errorMessageCodeConstant.UPDATE_SECURITY_USER_SETTING.UPDATE_FAIL.EMAIL_OTHER])
          }
        }

        categoryId = category.SECURITY_INFORMATION
        contentTypeId = contentUpdate.EMAIL_ADDRESS
        beforeUpdate = userInfor.email
        afterUpdate = fieldData.email
        break

      // case 2: change password
      case 'password':
        if (!fieldData.password) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
        }

        if (!notTextJapanValidate(fieldData.password) || !mustNotEmoji(fieldData.password) || !notSpaceValidate(fieldData.password)) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        const newPassword = passwordHash.generate(fieldData.password, { algorithm: 'sha256' })

        const payload = { hash_password: newPassword }

        if (userInfor.site_id === commonSiteId.MY_FOREX) {
          payload.password_strength = checkPasswordStrength(fieldData.password)
        }

        // update user
        const passUpdate = await usersBasicDataRepository.updateUserById(user_id, payload)
        if (!passUpdate) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.UPDATE_SECURITY_USER_SETTING.UPDATE_FAIL.PASSWORD])
        }
        categoryId = category.SECURITY_INFORMATION
        contentTypeId = contentUpdate.LOGIN_PASSWORD
        beforeUpdate = passwordDisplay
        afterUpdate = passwordDisplay
        break

      // case 3: change phone number
      case 'phone_number':
        if (!fieldData.phone_number_country_id || !fieldData.phone_number) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
        }

        // check existed phone number
        const isExistedPhoneNumber = await usersBasicDataRepository.isDuplicateField({
          phone_number: fieldData.phone_number,
          phone_number_country_id: fieldData.phone_number_country_id,
          site_id: userInfor.site_id,
        })
        if (isExistedPhoneNumber) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.UPDATE_SECURITY_USER_SETTING.PHONE_NUMBER_EXIST_IN_SYSTEM])
        }
        let phoneUpdate
        const accountsActive = await tradingAccountRepository.getTradingAccountsActive( { user_basic_data_id: user_id } )
        if (accountsActive.length && userInfor.site_id === commonSiteId.FXT) {
          const groupBy = _.groupBy(accountsActive, 'mt_server_id')

          const servers = await serverInfoRepository.getAllMtServerInfo()
          const apiKey = {
            api_key: env[envCommon.APIKEY_MT_CHANGE_PHONE],
            api_name: apiInfo.CHANGE_PHONE,
          }

          const groupServer = renderGroupMtAccount(groupBy)

          // update user info and account mt server
          phoneUpdate = await usersBasicDataRepository.updateUserMtInfo(
            user_id,
            {
              phone_number_country_id: fieldData.phone_number_country_id,
              phone_number: fieldData.phone_number,
            },
            groupServer,
            servers,
            apiKey,
            { PhoneNo: fieldData.phone_number },
            null,
            event,
            userErrorLog,
          )
          if (phoneUpdate.isError) {
            if (phoneUpdate.data) {
              const error = {
                isAxiosError: true,
                config: {
                  data: phoneUpdate.data,
                  url: phoneUpdate.url,
                },
              }
              return await errorLogRepository.createResponseAndLog(event, error, null,
                [errorMessageCodeConstant.UPDATE_SECURITY_USER_SETTING.MT_SERVER_RESULTS_PHONE_NUMBER_IS_NULL])
            } else {
              return await errorLogRepository.createResponseAndLog(event, null, null,
                [errorMessageCodeConstant.UPDATE_SECURITY_USER_SETTING.UPDATE_FAIL.PHONE_NUMBER_FXT])
            }
          }
        } else {
          // update user
          phoneUpdate = await usersBasicDataRepository.updateUserById(user_id, {
            phone_number_country_id: fieldData.phone_number_country_id,
            phone_number: fieldData.phone_number,
          })
          if (!phoneUpdate) {
            return await errorLogRepository.createResponseAndLog(event, null, null,
              [errorMessageCodeConstant.UPDATE_SECURITY_USER_SETTING.UPDATE_FAIL.PHONE_NUMBER_OTHER])
          }
        }


        categoryId = category.SECURITY_INFORMATION
        contentTypeId = contentUpdate.PHONE_NUMBER
        beforeUpdate = userInfor.phone_number
        afterUpdate = fieldData.phone_number
        break

      // case 4 : change google sso
      case 'google_sso':
        // update user
        const ggSsoUpdate = await usersPortalDataRepository.updateUserSetting(user_id, { google_sns_id: null })
        if (!ggSsoUpdate) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.UPDATE_SECURITY_USER_SETTING.UPDATE_FAIL.GOOGLE_SSO])
        }
        categoryId = category.SOCIAL_LOGIN_SETTING
        contentTypeId = contentUpdate.GOOGLE_SSO_LOGIN
        beforeUpdate = _renderDataSocialUpdate(userInfor.google_sns_id)
        afterUpdate = _renderDataSocialUpdate(null)
        break

      // case 5: change twitter_id
      case 'x_sns_id':
        // update user
        const xSnsIdUpdate = await usersPortalDataRepository.updateUserSetting(user_id, { x_sns_id: null })
        if (!xSnsIdUpdate) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.UPDATE_SECURITY_USER_SETTING.UPDATE_FAIL.X_SNS])
        }
        categoryId = category.SOCIAL_LOGIN_SETTING
        contentTypeId = contentUpdate.TWITTER_ID_LOGIN
        beforeUpdate = _renderDataSocialUpdate(userInfor.x_sns_id)
        afterUpdate = _renderDataSocialUpdate(null)
        break

      // case 6: change facebook_id
      case 'facebook_id':
        // update user
        const facebookUpdate = await usersPortalDataRepository.updateUserPortalData(user_id, { facebook_sns_id: null })
        if (!facebookUpdate) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.UPDATE_SECURITY_USER_SETTING.UPDATE_FAIL.FACEBOOK])
        }
        categoryId = category.SOCIAL_LOGIN_SETTING
        contentTypeId = contentUpdate.FACEBOOK_ID_LOGIN
        beforeUpdate = _renderDataSocialUpdate(userInfor.facebook_sns_id)
        afterUpdate = _renderDataSocialUpdate(null)
        break

      // case 7: change notification_method
      case 'notification_method':
        if (fieldData.notification_method !== 1 && fieldData.notification_method !== 2) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }
        // eslint-disable-next-line max-len
        const notificationUpdate =
          await usersPortalDataRepository.updateUserSetting(user_id, { unusual_login_notify_class: fieldData.notification_method })
        if (!notificationUpdate) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.UPDATE_SECURITY_USER_SETTING.UPDATE_FAIL.NOTIFICATION])
        }
        categoryId = category.SECURITY_INFORMATION
        contentTypeId = contentUpdate.NOTIFICATION_UNUSUAL_LOGIN
        beforeUpdate = _renderDataUnusualUpdate(userInfor.unusual_login_notify_class)
        afterUpdate = _renderDataUnusualUpdate(fieldData.notification_method)
        break

      // case 8: change authentication_method
      case 'authentication_method':
        if (fieldData.authentication_method !== 1 && fieldData.authentication_method !== 2 && fieldData.authentication_method !== 3) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }
        const authenUpdate = await usersPortalDataRepository.updateUserSetting(user_id, { twofa_method_class: fieldData.authentication_method })
        if (!authenUpdate) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.UPDATE_SECURITY_USER_SETTING.UPDATE_FAIL.AUTH])
        }
        categoryId = category.SECURITY_INFORMATION
        contentTypeId = contentUpdate.TWO_FA_METHOD
        beforeUpdate = _renderDataTwofaUpdate(userInfor.twofa_method_class)
        afterUpdate = _renderDataTwofaUpdate(fieldData.authentication_method)
        break

      // case 9: change mail_setting
      case 'mail_settings':
        const mailSetting = fieldData['mail_setting'] || {}
        const oldMailSetting = userInfor['mail_settings'].filter((ms) => {
          return ms['distribution_service_id'] === mailSetting['distribution_service_id']
        })[0]

        if (!oldMailSetting || ![flag.FALSE, flag.TRUE].includes(mailSetting['enabled'])) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        if (!await sendMailSettingRepository.hasServiceExisted(mailSetting['distribution_service_id'])) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }
        if (mailSetting.distribution_service_id === distributionService.DAILY_CONFIRMATION_MONTHLY_STATEMENT) {
          //  get accounts trading is active,pending,access
          const listMTAccount = await tradingAccountRepository.getTradingAccountsByStatus(
            { user_basic_data_id: user_id },
            [statusCode.REQUIRED, statusCode.PROCESSING, statusCode.APPROVED],
          )

          if (!listMTAccount) {
            const result = await sendMailSettingRepository.upsertService(
              user_id,
              userInfor.site_id,
              mailSetting['distribution_service_id'],
              mailSetting['enabled'],
            )
            if (!result) {
              return await errorLogRepository.createResponseAndLog(event, null, null,
                [errorMessageCodeConstant.UPDATE_SECURITY_USER_SETTING.UPDATE_FAIL.MAIL_SETTING.DAILY_CONFIRMATION.ACCOUNT_ACTIVE_PENDING_ACCESS])
            }
          } else {
            const listApprovedMTAccount = listMTAccount.filter((el) => el.mt_status_code === statusCode.APPROVED)
            const listProcessingAndRequiredMTAccount = listMTAccount.filter((el) => {
              return el.mt_status_code === statusCode.REQUIRED || el.mt_status_code === statusCode.PROCESSING
            })

            //  update setting email with account approved
            if (listApprovedMTAccount.length) {
              const groupBy = _.groupBy(listApprovedMTAccount, 'mt_server_id')
              const servers = await serverInfoRepository.getAllMtServerInfo()
              const apiKey = {
                api_key: env[envCommon.APIKEY_MT_CHANGE_REPORTS],
                api_name: apiInfo.CHANGE_REPORTS,
              }
              const groupMtAccByServer = renderGroupMtAccount(groupBy)
              const listApprovedMTAccountId = listApprovedMTAccount.map((el) => el.id)
              const result = await sendMailSettingRepository.upsertServiceMtAccountInfo(
                user_id,
                userInfor.site_id,
                mailSetting['distribution_service_id'],
                mailSetting['enabled'],
                groupMtAccByServer,
                servers,
                apiKey,
                listApprovedMTAccountId,
                event,
              )
              if (result.isError) {
                if (result.data) {
                  const error = {
                    isAxiosError: true,
                    config: {
                      data: result.data,
                      url: result.url,
                    },
                  }
                  return await errorLogRepository.createResponseAndLog(event, error, null,
                    [errorMessageCodeConstant.UPDATE_SECURITY_USER_SETTING.MT_SERVER_REPORT_ACCCOUNT_APPROVED])
                } else {
                  return await errorLogRepository.createResponseAndLog(event, null, null,
                    [errorMessageCodeConstant.UPDATE_SECURITY_USER_SETTING.UPDATE_FAIL.MAIL_SETTING.DAILY_CONFIRMATION.ACCOUNT_APPROVED])
                }
              }
            }

            //  update setting email with accounts are required or processing
            if (listProcessingAndRequiredMTAccount.length) {
              const listProcessingAndRequiredMTAccountId = listProcessingAndRequiredMTAccount.map((el) => el.id)
              const result = await sendMailSettingRepository.upsertServiceMtAccountInfo(
                user_id,
                userInfor.site_id,
                mailSetting['distribution_service_id'],
                mailSetting['enabled'],
                [],
                null,
                null,
                listProcessingAndRequiredMTAccountId,
                null,
              )
              if (result.isError) {
                if (result.data) {
                  const error = {
                    isAxiosError: true,
                    config: {
                      data: result.data,
                      url: result.url,
                    },
                  }
                  return await errorLogRepository.createResponseAndLog(event, error, null,
                    [errorMessageCodeConstant.UPDATE_SECURITY_USER_SETTING.MT_SERVER_REPORT_ACCCOUNT_REQUIRED_PROCESSING])
                } else {
                  return await errorLogRepository.createResponseAndLog(event, null, null,
                    [errorMessageCodeConstant.UPDATE_SECURITY_USER_SETTING.UPDATE_FAIL.MAIL_SETTING.DAILY_CONFIRMATION.ACCOUNT_REQUIRED_PROCESSING])
                }
              }
            }
          }
        } else {
          const result = await sendMailSettingRepository.upsertService(
            user_id,
            userInfor.site_id,
            mailSetting['distribution_service_id'],
            mailSetting['enabled'],
          )
          if (!result) {
            return await errorLogRepository.createResponseAndLog(event, null, null,
              [errorMessageCodeConstant.UPDATE_SECURITY_USER_SETTING.UPDATE_FAIL.MAIL_SETTING.OTHER])
          }
        }

        categoryId = category.EMAIL_RECEPTION_SETTING
        contentTypeId = oldMailSetting['content_update_id']
        beforeUpdate = _renderDataEmailReceptionUpdate(oldMailSetting['enabled'])
        afterUpdate = _renderDataEmailReceptionUpdate(mailSetting['enabled'])

        break

      // case 13: change lang portal && lang mail
      case 'language_portal_mail':
        if (fieldData.language_portal !== 'en' && fieldData.language_portal !== 'ja' &&
          fieldData.language_portal !== 'kr' && fieldData.language_portal !== 'cn') {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }
        if (fieldData.language_email !== 'en' && fieldData.language_email !== 'ja' &&
          fieldData.language_email !== 'kr' && fieldData.language_email !== 'cn') {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }
        const languageUpdate = await usersPortalDataRepository.updateUserSetting(user_id, {
          language_portal: fieldData.language_portal,
          language_email: fieldData.language_email,
        })
        if (!languageUpdate) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.UPDATE_SECURITY_USER_SETTING.UPDATE_FAIL.LANGUAGE])
        }
        if (userInfor.language_portal !== fieldData.language_portal) {
          categoryId = category.DISPLAY_SETTING
          contentTypeId = contentUpdate.DISPLAY_LANGUAGE
          beforeUpdate = _renderDataPortalUpdate('language_portal', userInfor.language_portal)
          afterUpdate = _renderDataPortalUpdate('language_portal', fieldData.language_portal)
        }
        if (userInfor.language_email !== fieldData.language_email) {
          categoryId = category.DISPLAY_SETTING
          contentTypeId2 = contentUpdate.DISPLAY_LANGUAGE_MAIL
          beforeUpdate2 = _renderDataPortalUpdate('language_email', userInfor.language_email)
          afterUpdate2 = _renderDataPortalUpdate('language_email', fieldData.language_email)
        }
        break

      // case 14: change display_date_time
      case 'display_date_time':
        if (fieldData.display_date_time !== 1 && fieldData.display_date_time !== 2 && fieldData.display_date_time !== 3) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }
        const dateTimeUpdate = await usersPortalDataRepository.updateUserSetting(user_id, { display_date_time: fieldData.display_date_time })
        if (!dateTimeUpdate) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.UPDATE_SECURITY_USER_SETTING.UPDATE_FAIL.DISPLAY_DATE_TIME])
        }

        categoryId = category.DISPLAY_SETTING
        contentTypeId = contentUpdate.DISPLAY_DATE_TIME_FORMAT
        beforeUpdate = _renderDataPortalUpdate('display_date_time', userInfor.display_date_time)
        afterUpdate = _renderDataPortalUpdate('display_date_time', fieldData.display_date_time)
        break

      // case 15: change display_time_zone
      case 'display_time_zone':
        if (!fieldData.display_time_zone) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }
        const timeZoneUpdate = await usersPortalDataRepository.updateUserSetting(user_id, { display_time_zone_id: fieldData.display_time_zone })
        if (!timeZoneUpdate) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.UPDATE_SECURITY_USER_SETTING.UPDATE_FAIL.DISPLAY_TIME_ZONE])
        }

        categoryId = category.DISPLAY_SETTING
        contentTypeId = contentUpdate.DISPLAY_TIMEZONE
        beforeUpdate = _renderDataPortalUpdate('display_time_zone', userInfor.display_time_zone_id)
        afterUpdate = _renderDataPortalUpdate('display_time_zone', fieldData.display_time_zone)
        break

      // case 16: change default_currency
      case 'default_currency':
        if (!fieldData.default_currency ||
          ![baseCurrency.JPY, baseCurrency.USD, baseCurrency.EUR].includes(fieldData.default_currency.toUpperCase())) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        const updateDefaultCurrency =
          await usersPortalDataRepository.updateUserSetting(user_id, { default_currency_display: fieldData.default_currency.toUpperCase() })
        if (!updateDefaultCurrency) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.UPDATE_SECURITY_USER_SETTING.UPDATE_FAIL.DEFAULT_CURRENCY])
        }
        break

      // case 17: change receiver_name
      case 'receiver_name':
        if (fieldData.receiver_name && fieldData.receiver_name.length > 30) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }
        const updateReceiverName = await usersPortalDataRepository.updateUserSetting(user_id,
          { receiver_name: fieldData.receiver_name ? fieldData.receiver_name : null })
        if (!updateReceiverName) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.UPDATE_SECURITY_USER_SETTING.UPDATE_FAIL.RECEIVER_NAME])
        }

        const receiver_name_default = generateReceiverName(userInfor.first_name_romaji + ' ' + userInfor.last_name_romaji)
        categoryId = category.SECURITY_INFORMATION
        contentTypeId = contentUpdate.RECEIVER_NAME
        beforeUpdate = userInfor.receiver_name ? userInfor.receiver_name : receiver_name_default
        afterUpdate = fieldData.receiver_name ? fieldData.receiver_name : receiver_name_default
        break

      default:
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }
    // // create record in table operation_history
    if (contentTypeId && beforeUpdate && afterUpdate) {
      await operationHistory(
        user_id,
        userInfor.site_id,
        categoryId,
        contentTypeId,
        beforeUpdate,
        afterUpdate,
        directIpAddress,
        directUserAgent,
        staff_id,
      )
    }

    if (contentTypeId2 && beforeUpdate2 && afterUpdate2) {
      await operationHistory(
        user_id,
        userInfor.site_id,
        categoryId,
        contentTypeId2,
        beforeUpdate2,
        afterUpdate2,
        directIpAddress,
        directUserAgent,
        staff_id,
      )
    }
    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null,
      error.isAxiosError ? [errorMessageCodeConstant.UPDATE_SECURITY_USER_SETTING.MT_SERVER_NOT_CONNECT] :
        [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getSecurityUserSetting = async (event) => {
  try {
    const { user_id } = event.pathParameters
    event.user_id = user_id || null
    const userSettingInfo = await usersBasicDataRepository.getUserSettingById(user_id)

    if (!userSettingInfo) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
    }
    const response = {
      ...userSettingInfo,
      email: userSettingInfo.email,
      site_id: userSettingInfo.site_id,
      phone_number_country_id: userSettingInfo.phone_number_country_id,
      phone_number: userSettingInfo.phone_number,
      notify_unusual_login: userSettingInfo.notify_unusual_login,
      twofa: userSettingInfo.twofa,
      language_portal: userSettingInfo.language_portal,
      language_email: userSettingInfo.language_email,
      display_date_time: userSettingInfo.display_date_time,
      display_time_zone: userSettingInfo.display_time_zone,
      google_sns_id: userSettingInfo.google_sns_id ? 'enable' : null,
      x_sns_id: userSettingInfo.x_sns_id ? 'enable' : null,
      default_currency: userSettingInfo.default_currency,
      receiver_name: userSettingInfo.receiver_name ? userSettingInfo.receiver_name : null,
    }
    return utility.createResponse(true, response)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const checkDuplicateField = async (event) => {
  try {
    const { user_id } = event.pathParameters
    event.user_id = user_id || null
    const { fieldName, fieldData } = JSON.parse(event.body)
    if (!fieldName && !fieldData) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    if (fieldData.hasOwnProperty('user_name')) {
      if (!fieldData.user_name) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
      } else if (fieldData.user_name.includes(' ') || fieldData.user_name.length > 50) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
      }
    }

    // GET USER DATA
    const userInfor = await usersBasicDataRepository.getUserSettingById(user_id)
    if (userInfor.site_id !== commonSiteId.FXS_XEM) {
      const isDuplicateField = await usersBasicDataRepository.isDuplicateField({
        ...fieldData,
        site_id: userInfor.site_id,
      })

      if (isDuplicateField) {
        if (fieldName === 'email') {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.CHECK_DUPLICATE_FIELD.EMAIL_EXIST_IN_SYSTEM])
        } else if (fieldName === 'phone_number') {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.CHECK_DUPLICATE_FIELD.PHONE_NUMBER_EXIST_IN_SYSTEM])
        } else if (fieldName === 'user_name') {
          const data = await suggestUsername(fieldData.user_name, userInfor.site_id)
          if (userInfor.site_id === commonSiteId.FXT) {
            return await errorLogRepository.createResponseAndLog(event, null, data, [errorMessageCodeConstant.CHECK_DUPLICATE_FIELD.USER_NAME.FXON])
          }
          if (userInfor.site_id === commonSiteId.MY_FOREX) {
            return await errorLogRepository.createResponseAndLog(event, null, data,
              [errorMessageCodeConstant.CHECK_DUPLICATE_FIELD.USER_NAME.MY_FOREX])
          }
        }
      }
    }
    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const _renderDataSocialUpdate = (data) => {
  if (data) {
    return 'trans.update_history.social_login.on'
  } else {
    return 'trans.update_history.social_login.off'
  }
}

const _renderDataUnusualUpdate = (data) => {
  switch (data) {
    case notifyUnusualLogin.SMS:
      return 'trans.update_history.unusual_login_setting.sms'
    case notifyUnusualLogin.EMAIL:
      return 'trans.update_history.unusual_login_setting.email'
    default:
      return null
  }
}

const _renderDataTwofaUpdate = (data) => {
  switch (data) {
    case twoFactorAuthentication.PASSWORD:
      return 'trans.update_history.twofa_setting.password'
    case twoFactorAuthentication.SMS:
      return 'trans.update_history.twofa_setting.sms'
    case twoFactorAuthentication.APP:
      return 'trans.update_history.twofa_setting.app'
    default:
      return null
  }
}

const _renderDataEmailReceptionUpdate = (data) => {
  switch (data) {
    case 1:
      return 'trans.update_history.email_reception_setting.yes'
    case 0:
      return 'trans.update_history.email_reception_setting.no'
    default:
      return null
  }
}

const _renderDataPortalUpdate = (fieldName, data) => {
  switch (fieldName) {
    case 'language_portal':
    case 'language_email':
      return `trans.update_history.language_settings.${data}`
    case 'display_date_time':
      if (data === 1) {
        return 'trans.update_history.dis_date_time.format_YYYYMMDD'
      } else if (data === 2) {
        return 'trans.update_history.dis_date_time.format_MMDDYYYY'
      } else if (data === 3) {
        return 'trans.update_history.dis_date_time.format_DDMMYYYY'
      } else {
        return null
      }
    case 'display_time_zone':
      return `trans.update_history.timezone.tz_${data}`
    default:
      break
  }
}

const renderGroupMtAccount = (groupBy) => {
  const groupArr = []
  for (const key in groupBy) {
    if (groupBy.hasOwnProperty(key)) {
      groupArr.push({
        mt_server_id: key,
        mt_account_no: groupBy[key].map((item) => item.mt_account_no).join(','),
      })
    }
  }
  return groupArr
}

const suggestUsername = async (userName, siteId) => {
  const listUsernameSimilar = await usersBasicDataRepository.getUsernameSimilar(userName, siteId)

  if (!listUsernameSimilar) {
    return false
  }

  const listOnlyUsername = listUsernameSimilar.map((el) => (el.user_name))
  const listSuggestUsername = []

  if (userName.length > 46) {
    userName = userName.substring(0, 46)
  }

  while (true) {
    if (listSuggestUsername.length === 5) {
      break
    }

    const randomNumber = Math.floor(1000 + Math.random() * 9000)
    const newUserName = `${userName}${randomNumber}`

    if (!listOnlyUsername.includes(newUserName) && !listSuggestUsername.includes(newUserName)) {
      listSuggestUsername.push(newUserName)
    }
  }

  return listSuggestUsername
}

const checkPasswordStrength = (password) => {
  let check
  check = highLevelPassword(password)
  if (check) {
    return passwordStrength.HIGH
  }

  check = middleLevelPassword(password)
  if (check) {
    return passwordStrength.MIDDLE
  }

  return passwordStrength.LOW
}

const generateReceiverName = (str) => {
  // Split string to array at space
  const arrStr = str.split(' ')

  const newArrStr = arrStr.map((str) => {
    // Convert string to array character
    const arrChar = str.split('')

    // Replace char to *
    for (let i = 0; i <= arrChar.length - 1; i++) {
      if (i % 2 !== 0) {
        arrChar[i] = '*'
      }
    }

    return arrChar.join('')
  })

  return newArrStr.join(' ')
}

module.exports = {
  updateSecurityUserSetting,
  getSecurityUserSetting,
  checkDuplicateField,
  renderGroupMtAccount,
  checkPasswordStrength,
}
