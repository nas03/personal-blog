'use strict'
/* eslint-disable eqeqeq */

/* constant */
const {

  category,
  contentUpdate,
  typeData,
  splitContentUpdate,
  gender,
  statusCode,
  statusItemsConstant,
  errorMessageCodeConstant,
} = require('constant')

/* utility */
const utility = require('utility')
const { createListOperationHistory } = require('../History/operation_history.js')

/* repository */
const { errorLogRepository,
  usersCorporateRepository,
} = require('repository')

const updateCorporateInfo = async (event) => {
  try {
    const id = event.pathParameters.id
    const eventBody = JSON.parse(event.body)
    if (!id) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }
    const corporateInfo = await usersCorporateRepository.getCorporateInfo(null, id)
    event.user_id = corporateInfo.user_id || null
    // check account status
    if (corporateInfo.account_status_code === statusCode.CLOSED) {
      return await errorLogRepository.createResponseAndLog(
        event,
        null,
        null,
        [errorMessageCodeConstant.UPDATE_CORPORATE_INFO.UPDATE_FAILED.ACCOUNT_CLOSED],
      )
    }

    const contactAttributes = [
      'zip_postal_code',
      'state_province',
      'city',
      'address_line_1',
      'address_line_2',
      'phone_number_country_id',
      'corporate_phone_number',
      'website_url',
    ]

    const userId = corporateInfo.user_id
    const siteId = corporateInfo.site_id
    const authorizedPerson = utility.getUserIdByToken(event)

    const payload = {}
    const statusItems = JSON.parse(corporateInfo.status_items)
    const payloadOperationHistory = []

    const _isEmpty = (value) => {
      return (value === undefined || value === null || value === '')
    }

    for (const item of Object.keys(eventBody)) {
      if (item !== 'address_line_2' &&
          item !== 'business_content' &&
          item !== 'website_url' &&
          item !== 'corporate_name_katakana' &&
          _isEmpty(eventBody[item])
      ) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
      }

      if (corporateInfo[item] !== undefined && eventBody[item] !== corporateInfo[item]) {
        // prepare payload to update corporate with changed value
        payload[item] = eventBody[item]

        // handle status items
        if (contactAttributes.includes(item)) {
          statusItems[item] = statusItemsConstant.CONFIRMED
        } else {
          statusItems[item] = statusItemsConstant.CONFIRMED_CANNOT_BE_CHANGED
        }

        // prepare payload to update operation history
        if (item !== 'phone_number_country_id') {
          payloadOperationHistory.push( {
            site_id: siteId,
            category_id: category.BASIC_INFORMATION_PERSON_OR_CORPORATE,
            content_update: _renderBasicContentTypeId(item, corporateInfo, eventBody),
            before_update: _renderDataUpdate(item, corporateInfo[item], corporateInfo),
            after_update: _renderDataUpdate(item, eventBody[item], corporateInfo, eventBody),
          } )
        }
      }
    }

    if (Object.keys(payload).length) {
      payload.status_items = JSON.stringify(statusItems)
      const updated = await usersCorporateRepository.updateCorporateInfo(id, payload)
      if (!updated) {
        return await errorLogRepository.createResponseAndLog(
          event,
          null,
          null,
          [errorMessageCodeConstant.UPDATE_CORPORATE_INFO.UPDATE_FAILED.UPDATE_DB],
        )
      }
    }

    // Insert operation history
    await createListOperationHistory(userId, payloadOperationHistory, event, authorizedPerson)

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const _renderBasicContentTypeId = (field, corporateInfo, eventBody) => {
  switch (field) {
    case 'country_id':
      return contentUpdate.CHANGE_COUNTRY_RESIDENCE_CORPORATE
    case 'corporate_name_registered':
      return contentUpdate.CHANGE_CORPORATE_NAME_REGISTERED
    case 'corporate_name_english':
      return contentUpdate.CHANGE_CORPORATE_NAME_ENGLISH
    case 'corporate_name_katakana':
      return contentUpdate.CHANGE_CORPORATE_NAME_KATAKANA
    case 'us_tax_obligations':
      return contentUpdate.CHANGE_US_TAX_OBLIGATIONS
    case 'us_taxpayer_number':
      return contentUpdate.CHANGE_US_TAXPAYER
    case 'zip_postal_code':
      return checkContentUpdate(eventBody, corporateInfo, field)
    case 'state_province':
      return checkContentUpdate(eventBody, corporateInfo, field)
    case 'city':
      return checkContentUpdate(eventBody, corporateInfo, field)
    case 'address_line_1':
      return checkContentUpdate(eventBody, corporateInfo, field)
    case 'address_line_2':
      return checkContentUpdate(eventBody, corporateInfo, field)
    case 'corporate_phone_number':
      return contentUpdate.CHANGE_CORPORATE_PHONE_NUMBER
    case 'industry_id':
      return contentUpdate.CHANGE_INDUSTRY_CORPOTATE
    case 'business_content':
      return contentUpdate.CHANGE_BUSINESS_CONTENT
    case 'website_url':
      return contentUpdate.CHANGE_WEBSITE_URL
  }
}


const checkContentUpdate = (eventBody, corporateInfo, field) => {
  const returnValueContentJA = () => {
    switch (field) {
      case 'zip_postal_code':
        return contentUpdate.CHANGE_ZIP_POSTAL_CODE_JA
      case 'state_province':
        return contentUpdate.CHANGE_PREFECTURE_JA
      case 'city':
        return contentUpdate.CHANGE_CITY_JA
      case 'address_line_1':
        return contentUpdate.CHANGE_ADDRESS_JA
      case 'address_line_2':
        return contentUpdate.CHANGE_BUILDING
    }
  }
  const returnValueContentOther = () => {
    switch (field) {
      case 'zip_postal_code':
        return contentUpdate.CHANGE_ZIP_POSTAL_CODE
      case 'state_province':
        return contentUpdate.CHANGE_STATE_PROVINCE
      case 'city':
        return contentUpdate.CHANGE_CITY
      case 'address_line_1':
        return contentUpdate.CHANGE_ADDRESS_LINE1
      case 'address_line_2':
        return contentUpdate.CHANGE_ADDRESS_LINE2
    }
  }
  if (eventBody.country_id && Number(eventBody.country_id) === 113) {
    return returnValueContentJA()
  } else if (eventBody.country_id && Number(eventBody.country_id) !== 113) {
    return returnValueContentOther()
  } else if (corporateInfo.country_id === 113) {
    return returnValueContentJA()
  } else {
    return returnValueContentOther()
  }
}

const _renderDataUpdate = (fieldName, data, corporateInfo, eventBody = false) => {
  switch (fieldName) {
    case 'gender':
      data = Number(data)
      if (data === gender.MALE) {
        return 'trans.update_history.gender.male'
      } else if (data === gender.FEMALE) {
        return 'trans.update_history.gender.female'
      } else if (data === gender.OTHER) {
        return 'trans.update_history.gender.others'
      } else {
        return '-'
      }
    case 'us_tax_obligations':
      if (data === 0) {
        return 'trans.update_history.us_tax_obligations.no'
      } else if (data === 1) {
        return 'trans.update_history.us_tax_obligations.yes'
      } else {
        return '-'
      }
    case 'state_province':
      if (corporateInfo.country_id === 113 && !eventBody) {
        return `${data}${splitContentUpdate}${typeData.PREFECTURES}`
      } else if (corporateInfo.country_id !== 113 && !eventBody) {
        return data
      } else if (eventBody.country_id && Number(eventBody.country_id) === 113) {
        return `${data}${splitContentUpdate}${typeData.PREFECTURES}`
      } else if (eventBody.country_id && Number(eventBody.country_id) !== 113) {
        return data
      } else if (corporateInfo.country_id === 113) {
        return `${data}${splitContentUpdate}${typeData.PREFECTURES}`
      } else {
        return data
      }
    case 'country_id':
      return `${data}${splitContentUpdate}${typeData.COUNTRIES}`
    case 'industry_id':
      return `${data}${splitContentUpdate}${typeData.INDUSTRIES}`
    default:
      return data !== null && data !== '' ? data : '-'
  }
}

module.exports = {
  updateCorporateInfo,
}
