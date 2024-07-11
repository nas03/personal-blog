const { errorLogRepository, usersBasicDataRepository, usersManagementDataRepository, serverInfoRepository, usersPersonalRepository,
  tradingAccountRepository } = require('repository')
const utility = require('utility')
const { statusCode, flag, commonSiteId, category, contentUpdate, envCommon, apiInfo,
  errorMessageCodeConstant } = require('constant')
const _ = require('lodash')
const { regex } = require('helper')
const { createListOperationHistory } = require('../History/operation_history.js')
const { renderGroupMtAccount } = require('../Users/security_user_setting.js')

const updateUserById = async (event) => {
  try {
    const userId = event.pathParameters.id
    event.user_id = userId
    const staff_id = utility.getUserIdByToken(event)
    const eventBody = JSON.parse(event.body) || {}

    // Validate field require
    const requiredFields = [
      'first_name_romaji',
      'last_name_romaji',
      'phone_number_country_id',
      'phone_number',
      'email',
    ]

    const userInfo = await usersBasicDataRepository.getDetailUserById(userId)
    // Check user not closed
    if (!userInfo || userInfo.account_status === statusCode.CLOSED) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UPDATE_USER_DETAIL.ACCOUNT_CLOSE])
    }

    if (userInfo.site_id !== commonSiteId.FXS_XEM && userInfo.site_id !== commonSiteId.ICPAY) {
      requiredFields.push('user_name')
    }

    if (requiredFields.find((field) => !_.isUndefined(eventBody[field]) && (_.isNull(eventBody[field])) || eventBody[field] === '')) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // Get field from event body
    const {
      test_flag,
      attention_flag,
      support_status_code,
      first_name_romaji,
      last_name_romaji,
      phone_number_country_id,
      phone_number,
      email,
      user_name,
    } = eventBody

    // Validate field format
    if ((!_.isUndefined(test_flag) && !Object.values(flag).includes(test_flag)) ||
        (!_.isUndefined(attention_flag) && !Object.values(flag).includes(attention_flag)) ||
        (!_.isUndefined(support_status_code) && ![null, statusCode.WORKING].includes(support_status_code)) ||
        (!_.isUndefined(first_name_romaji) && (!_.isString(first_name_romaji) || first_name_romaji.length > 64)) ||
        (!_.isUndefined(last_name_romaji) && (!_.isString(first_name_romaji) || first_name_romaji.length > 64)) ||
        (!_.isUndefined(phone_number_country_id) && isNaN(phone_number_country_id)) ||
        (!_.isUndefined(phone_number) && isNaN(phone_number)) ||
        (!_.isUndefined(email) && !regex.emailValidator(email))
    ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // Check email, phone exists in database
    if (!_.isUndefined(email) && userInfo.site_id !== commonSiteId.FXS_XEM) {
      const isDuplicateField = await usersBasicDataRepository.isDuplicateField({ email, site_id: userInfo.site_id })

      if (isDuplicateField) {
        return await errorLogRepository.createResponseAndLog(event, null, null,
          [errorMessageCodeConstant.UPDATE_USER_DETAIL.EMAIL_EXIST_IN_SYSTEM])
      }
    }


    if (userInfo.site_id !== commonSiteId.FXS_XEM) {
      // Check phone exists in database
      if (!_.isUndefined(phone_number)) {
        const isDuplicateField = await usersBasicDataRepository.isDuplicateField({ phone_number_country_id, phone_number, site_id: userInfo.site_id })

        if (isDuplicateField) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.UPDATE_USER_DETAIL.PHONE_NUMBER_EXIST_IN_SYSTEM])
        }
      }
    }

    // Check user_name exists in database
    if (!_.isUndefined(user_name)) {
      const isDuplicateField = await usersBasicDataRepository.isDuplicateField({ user_name, site_id: userInfo.site_id })
      if (isDuplicateField && userInfo.site_id === commonSiteId.MY_FOREX) {
        return await errorLogRepository.createResponseAndLog(event, null, null,
          [errorMessageCodeConstant.UPDATE_USER_DETAIL.EXIST_IN_SYSTEM_USER_NAME.MY_FOREX])
      }
      if (isDuplicateField && userInfo.site_id === commonSiteId.FXT) {
        return await errorLogRepository.createResponseAndLog(event, null, null,
          [errorMessageCodeConstant.UPDATE_USER_DETAIL.EXIST_IN_SYSTEM_USER_NAME.FXON])
      }
    }

    // Define payload for update into users_basic_data without undefined field
    const payloadBasic = _.pickBy({
      first_name_romaji,
      last_name_romaji,
      phone_number_country_id,
      phone_number,
      email,
      user_name,
    }, (value, key) => value && value !== userInfo[key])

    // update if payload not empty
    if (!_.isEmpty(payloadBasic)) {
      if (
        userInfo.site_id === commonSiteId.FXT &&
          (payloadBasic.first_name_romaji || payloadBasic.last_name_romaji || payloadBasic.phone_number || payloadBasic.email)) {
        const accountsActive = await tradingAccountRepository.getTradingAccountsActive({ user_basic_data_id: userId })
        if (!accountsActive.length) {
          const updated = await usersBasicDataRepository.updateUserBasicData(userId, payloadBasic)
          if (!updated) {
            return await errorLogRepository.createResponseAndLog(event, null, null,
              [errorMessageCodeConstant.UPDATE_USER_DETAIL.UPDATE_FAIL_USERS_BASIC_DATA.SITE_FXT])
          }
        }
        const groupBy = _.groupBy(accountsActive, 'mt_server_id')
        const servers = await serverInfoRepository.getAllMtServerInfo()
        const groupServer = renderGroupMtAccount(groupBy)

        let payloadMT
        if (payloadBasic.email) {
          payloadMT = await renderPayloadUpdateMT('email', { email: email })
        }
        if (payloadBasic.phone_number) {
          payloadMT = await renderPayloadUpdateMT('phone_number', { phone_number: phone_number })
        }
        if (payloadBasic.first_name_romaji || payloadBasic.last_name_romaji) {
          payloadMT = await renderPayloadUpdateMT('name_romaji', {
            first_name_romaji: first_name_romaji || userInfo.last_name_romaji,
            last_name_romaji: last_name_romaji || userInfo.last_name_romaji,
          })
        }

        if (payloadMT) {
          // update user info and account mt server
          const updatedMtInfoError = await usersBasicDataRepository.updateUserMtInfo(
            userId,
            payloadBasic,
            groupServer,
            servers,
            payloadMT.mt_key,
            payloadMT.mt_data,
            null,
            event,
            {
              user_id: userId,
              site_id: userInfo.site_id,
            },
          )
          if (updatedMtInfoError.isError) {
            if (updatedMtInfoError.data) {
              const error = {
                isAxiosError: true,
                config: {
                  data: updatedMtInfoError.data,
                  url: updatedMtInfoError.url,
                },
              }
              return await errorLogRepository.createResponseAndLog(event, error, null,
                [errorMessageCodeConstant.UPDATE_USER_DETAIL.MT_SERVER_RESULTS_IS_NULL])
            } else {
              return await errorLogRepository.createResponseAndLog(event, null, null,
                [errorMessageCodeConstant.UPDATE_USER_DETAIL.UPDATE_FAIL_USERS_BASIC_DATA.MT_SERVER])
            }
          }
        }
      } else {
        const updated = await usersBasicDataRepository.updateUserBasicData(userId, payloadBasic)
        if (!updated) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.UPDATE_USER_DETAIL.UPDATE_FAIL_USERS_BASIC_DATA.OTHER_SITE_FXT])
        }
      }

      if (payloadBasic.first_name_romaji || payloadBasic.last_name_romaji) {
        const personal = await usersPersonalRepository.getRepresentativePersonInfo(userId)
        if (personal?.like_transaction_person === 1) {
          const updated = await usersPersonalRepository.updatePersonalInfo(personal.id, {
            first_name_romaji: payloadBasic.first_name_romaji,
            last_name_romaji: payloadBasic.last_name_romaji,
          })

          if (!updated) {
            return await errorLogRepository.createResponseAndLog(event, null, null,
              [errorMessageCodeConstant.UPDATE_USER_DETAIL.UPDATE_FAIL_PERSONAL_INFO])
          }
        }
      }

      // CREATE OPERATION HISTORY
      if (userInfo.site_id !== commonSiteId.FXS_XEM) {
        const listOperationHistory = []
        if (payloadBasic.first_name_romaji) {
          listOperationHistory.push({
            site_id: userInfo.site_id,
            category_id: category.BASIC_INFORMATION_PERSON_OR_CORPORATE,
            content_update: contentUpdate.CHANGE_FIRST_NAME_ROMAJI,
            before_update: userInfo.first_name_romaji,
            after_update: first_name_romaji,
          })
        }
        if (payloadBasic.last_name_romaji) {
          listOperationHistory.push({
            site_id: userInfo.site_id,
            category_id: category.BASIC_INFORMATION_PERSON_OR_CORPORATE,
            content_update: contentUpdate.CHANGE_LAST_NAME_ROMAJI,
            before_update: userInfo.last_name_romaji,
            after_update: last_name_romaji,
          })
        }
        if (payloadBasic.user_name) {
          listOperationHistory.push({
            site_id: userInfo.site_id,
            category_id: category.BASIC_INFORMATION_PERSON_OR_CORPORATE,
            content_update: contentUpdate.CHANGE_USER_NAME,
            before_update: userInfo.user_name,
            after_update: user_name,
          })
        }
        if (payloadBasic.phone_number) {
          listOperationHistory.push({
            site_id: userInfo.site_id,
            category_id: category.SECURITY_INFORMATION,
            content_update: contentUpdate.PHONE_NUMBER,
            before_update: userInfo.phone_number,
            after_update: phone_number,
          })
        }
        if (payloadBasic.email) {
          listOperationHistory.push({
            site_id: userInfo.site_id,
            category_id: category.SECURITY_INFORMATION,
            content_update: contentUpdate.EMAIL_ADDRESS,
            before_update: userInfo.email,
            after_update: email,
          })
        }
        await createListOperationHistory(userInfo.user_id, listOperationHistory, event, staff_id)
      }
    }

    // Define payload for update into users_management_data without undefined field
    const payloadManage = _.omitBy({ test_flag, attention_flag, support_status_code }, _.isUndefined)
    if (!_.isUndefined(support_status_code)) {
      if (support_status_code === statusCode.WORKING) {
        payloadManage.support_by_admin_id = utility.getUserIdByToken(event)
      } else {
        payloadManage.support_by_admin_id = null
      }
    }

    // update if payload not empty
    if (!_.isEmpty(payloadManage)) {
      const updated = await usersManagementDataRepository.updateByUserId(userId, payloadManage)
      if (!updated) {
        return await errorLogRepository.createResponseAndLog(event, null, null,
          [errorMessageCodeConstant.UPDATE_USER_DETAIL.UPDATE_FAIL_USERS_MANAGEMENT_DATA])
      }
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)

    return await errorLogRepository.createResponseAndLog(event, error, null, [
      error.isAxiosError ? errorMessageCodeConstant.UPDATE_USER_DETAIL.UNABLE_CONNECT_TO_MT_SERVER :
        errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const renderPayloadUpdateMT = async (fieldName, fieldData) => {
  const payload = {
    mt_key: {
      api_key: null,
      api_name: null,
    },
    mt_data: {},
  }
  try {
    // get env from aws parameter store
    const env = await utility.getEnvConfig([
      envCommon.APIKEY_MT_CHANGE_EMAIL,
      envCommon.APIKEY_MT_CHANGE_PHONE,
      envCommon.APIKEY_MT_CHANGE_NAME,
      envCommon.APIKEY_MT_CHANGE_COUNTRY,
    ])

    switch (fieldName) {
      case 'email':
        payload.mt_key.api_key = env[envCommon.APIKEY_MT_CHANGE_EMAIL]
        payload.mt_key.api_name = apiInfo.CHANGE_EMAIL
        payload.mt_data = { Email: fieldData.email }
        break
      case 'phone_number':
        payload.mt_key.api_key = env[envCommon.APIKEY_MT_CHANGE_PHONE]
        payload.mt_key.api_name = apiInfo.CHANGE_PHONE
        payload.mt_data = { PhoneNo: fieldData.phone_number }
        break
      case 'name_romaji':
        payload.mt_key.api_key = env[envCommon.APIKEY_MT_CHANGE_NAME]
        payload.mt_key.api_name = apiInfo.CHANGE_NAME
        payload.mt_data = { Name: `${fieldData.first_name_romaji} ${fieldData.last_name_romaji}` }
        break
      case 'country_id':
        payload.mt_key.api_key = env[envCommon.APIKEY_MT_CHANGE_COUNTRY]
        payload.mt_key.api_name = apiInfo.CHANGE_COUNTRY
        payload.mt_data = { Country: fieldData.country }
        break
      default:
        break
    }
    return payload
  } catch (error) {
    console.log(error)
    return payload
  }
}

module.exports = {
  updateUserById,
  renderPayloadUpdateMT,
}
