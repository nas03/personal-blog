'use strict'
/* eslint-disable eqeqeq */

/* constant */
const {
  category,
  contentUpdate,
  commonSiteId,
  typeData,
  splitContentUpdate,
  gender,
  statusCode,
  errorMessageCodeConstant,
} = require('constant')

/* utility */
const utility = require('utility')
const { createListOperationHistory } = require('../History/operation_history')

/* repository */
const {
  errorLogRepository,
  usersCorporateRepository,
  usersPersonalRepository,
} = require('repository')

const updateBeneficialOnwerCorporate = async (event) => {
  try {
    const id = event.pathParameters.id
    const eventBody = JSON.parse(event.body)

    const basicAttributes = [
      'country_id',
      'corporate_name_registered',
      'corporate_name_english',
      'corporate_name_katakana',
      'industry_id',
      'business_content',
      'voting_ratio',
      'voting_ratio_shareholder',
    ]

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

    const corporateInfo = await usersCorporateRepository.getCorporateCheckUpdate(id)
    event.user_id = corporateInfo.user_id || null
    // check account status
    if (corporateInfo.account_status_code === statusCode.CLOSED) {
      return await errorLogRepository.createResponseAndLog(
        event,
        null,
        null,
        [errorMessageCodeConstant.UPDATE_BENEFICIAL_ONWER_CORPORATE.UPDATE_FAILED.ACCOUNT_CLOSED],
      )
    }

    const userId = corporateInfo.user_id
    const siteId = commonSiteId.ICPAY
    const authorizedPerson = utility.getUserIdByToken(event)

    let payload = {}
    const statusItems = JSON.parse(corporateInfo.status_items)
    const payloadOperationHistory = []

    for (const attribute of basicAttributes) {
      if (Object.keys(eventBody).includes(attribute)) {
        if (attribute !== 'corporate_name_katakana' && attribute !== 'business_content' && !eventBody[attribute]) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
        }
        if (eventBody[attribute] != corporateInfo[attribute]) {
          payload[attribute] = eventBody[attribute]
          statusItems[attribute] = 3

          payloadOperationHistory.push( {
            site_id: siteId,
            category_id: category.BENEFICIAL_OWNER_INFORMATION,
            content_update: _renderBOContentTypeId(attribute, corporateInfo, eventBody),
            before_update: _renderDataUpdate(attribute, corporateInfo[attribute], corporateInfo),
            after_update: _renderDataUpdate(attribute, eventBody[attribute], corporateInfo, eventBody),
          } )
        }
      }
    }

    for (const attribute of contactAttributes) {
      if (Object.keys(eventBody).includes(attribute)) {
        if (attribute !== 'address_line_2' && attribute !== 'website_url' && !eventBody[attribute]) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
        }
        if (eventBody[attribute] != corporateInfo[attribute]) {
          payload[attribute] = eventBody[attribute]
          statusItems[attribute] = 2
          if (attribute === 'phone_number_country_id') {
            continue
          }

          payloadOperationHistory.push( {
            site_id: siteId,
            category_id: category.BENEFICIAL_OWNER_INFORMATION,
            content_update: _renderBOContentTypeId(attribute, corporateInfo, eventBody),
            before_update: _renderDataUpdate(attribute, corporateInfo[attribute], corporateInfo),
            after_update: _renderDataUpdate(attribute, eventBody[attribute], corporateInfo, eventBody),
          } )
        }
      }
    }

    if (Object.keys(payload).length) {
      payload = {
        ...payload,
        status_items: JSON.stringify(statusItems),
      }
      const result = await usersCorporateRepository.updateCorporateInfo(id, payload)
      if (!result) {
        return await errorLogRepository.createResponseAndLog(
          event,
          null,
          null,
          [errorMessageCodeConstant.UPDATE_BENEFICIAL_ONWER_CORPORATE.UPDATE_FAILED.UPDATE_DB],
        )
      }
    }

    if (payloadOperationHistory.length) {
      await createListOperationHistory(userId, payloadOperationHistory, event, authorizedPerson)
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}


const updateBeneficialOnwerPersonal = async (event) => {
  try {
    const id = event.pathParameters.id
    const eventBody = JSON.parse(event.body)

    if (eventBody.gender &&
        Number(eventBody.gender) !== gender.MALE &&
        Number(eventBody.gender) !== gender.FEMALE &&
        Number(eventBody.gender) !== gender.OTHER
    ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    const basicAttributes = [
      'nationality_id',
      'first_name_romaji',
      'last_name_romaji',
      'first_name_kanji',
      'last_name_kanji',
      'first_name_katakana',
      'last_name_katakana',
      'country_id',
      'voting_ratio',
      'voting_ratio_shareholder',
      'gender',
    ]

    const contactAttributes = [
      'zip_postal_code',
      'state_province',
      'city',
      'address_line_1',
      'address_line_2',
      'phone_number_country_id',
      'contact_phone_number',
    ]

    let personalInfo
    switch (eventBody.type_person) {
      case 'personal':
        personalInfo = await usersPersonalRepository.getPersonalCheckUpdate(id)
        event.user_id = personalInfo.user_id || null
        break
      case 'representative_person':
        personalInfo = await usersPersonalRepository.getRepresentPersonCheckUpdate(id)
        event.user_id = personalInfo.user_id || null
        break
      default:
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }
    if (!personalInfo) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }
    // check account status
    if (personalInfo.account_status_code === statusCode.CLOSED) {
      return await errorLogRepository.createResponseAndLog(
        event,
        null,
        null,
        [errorMessageCodeConstant.UPDATE_BENEFICIAL_ONWER_PERSONAL.UPDATE_FAILED.ACCOUNT_CLOSED],
      )
    }

    const authorizedPerson = utility.getUserIdByToken(event)
    const userId = personalInfo.user_id
    const siteId = personalInfo.site_id

    let payload = {}
    const statusItems = JSON.parse(personalInfo.status_items)
    const payloadOperationHistory = []
    for (const attribute of basicAttributes) {
      if (Object.keys(eventBody).includes(attribute)) {
        if (attribute !== 'first_name_kanji' &&
          attribute !== 'last_name_kanji' &&
          attribute !== 'first_name_katakana' &&
          attribute !== 'last_name_katakana' &&
          !eventBody[attribute]
        ) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
        }
        if (eventBody[attribute] != personalInfo[attribute]) {
          payload[attribute] = eventBody[attribute]
          statusItems[attribute] = 3

          payloadOperationHistory.push( {
            site_id: siteId,
            category_id: category.BENEFICIAL_OWNER_INFORMATION,
            content_update: _renderBOContentTypeId(attribute, personalInfo, eventBody, 'personal'),
            before_update: _renderDataUpdate(attribute, personalInfo[attribute], personalInfo),
            after_update: _renderDataUpdate(attribute, eventBody[attribute], personalInfo, eventBody),
          } )
        }
      }
    }
    for (const attribute of contactAttributes) {
      if (Object.keys(eventBody).includes(attribute)) {
        if (attribute !== 'address_line_2' && !eventBody[attribute]) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
        }
        if (eventBody[attribute] != personalInfo[attribute]) {
          payload[attribute] = eventBody[attribute]
          statusItems[attribute] = 2
          if (attribute === 'phone_number_country_id') {
            continue
          }

          payloadOperationHistory.push( {
            site_id: siteId,
            category_id: category.BENEFICIAL_OWNER_INFORMATION,
            content_update: _renderBOContentTypeId(attribute, personalInfo, eventBody, 'personal'),
            before_update: _renderDataUpdate(attribute, personalInfo[attribute], personalInfo),
            after_update: _renderDataUpdate(attribute, eventBody[attribute], personalInfo, eventBody),
          } )
        }
      }
    }

    if (Object.keys(payload).length) {
      payload = {
        ...payload,
        status_items: JSON.stringify(statusItems),
      }
      const result = await usersPersonalRepository.updatePersonalInfo(id, payload)
      if (!result) {
        return await errorLogRepository.createResponseAndLog(
          event,
          null,
          null,
          [errorMessageCodeConstant.UPDATE_BENEFICIAL_ONWER_PERSONAL.UPDATE_FAILED.UPDATE_DB],
        )
      }
    }
    if (payloadOperationHistory.length) {
      await createListOperationHistory(userId, payloadOperationHistory, event, authorizedPerson)
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const updateNationalInstitution = async (event) => {
  try {
    const eventBody = JSON.parse(event.body)
    const userId = event.pathParameters.id
    event.user_id = userId

    if (typeof eventBody.is_national_institution === 'undefined' || !userId
    ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    const corporateInfo = await usersCorporateRepository.getNationalInstitutionInfo(userId)

    // check account status
    if (!corporateInfo || corporateInfo.account_status_code === statusCode.CLOSED) {
      return await errorLogRepository.createResponseAndLog(
        event,
        null,
        null,
        [errorMessageCodeConstant.UPDATE_NATIONAL_INSTITUTION.UPDATE_FAILED.ACCOUNT_CLOSED],
      )
    }
    let payload = {}
    const payloadOperationHistory = []
    const authorizedPerson = utility.getUserIdByToken(event)
    const siteId = corporateInfo.site_id

    if (eventBody.is_national_institution !== corporateInfo.is_national_institution) {
      switch (eventBody.is_national_institution) {
        case 0:
          payload = {
            is_national_institution: 0,
            number_shareholders_person: 0,
            number_shareholders_corporate: 0,
          }
          break
        case 1:
          payload = {
            is_national_institution: 1,
            number_shareholders_person: 0,
            number_shareholders_corporate: 0,
            like_shareholder_corporate: 0,
            like_shareholder_person: 0,
          }
          break
        default:
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
      }
    }

    if (Object.keys(payload).length) {
      const result = await usersCorporateRepository.updateNationalInstitution(corporateInfo.corporate_id, payload, eventBody, userId)
      if (result.isError) {
        return await errorLogRepository.createResponseAndLog(
          event,
          result.error,
          null,
          [errorMessageCodeConstant.UPDATE_NATIONAL_INSTITUTION.UPDATE_FAILED.UPDATE_DB],
        )
      }

      if (payload.number_shareholders_person !== corporateInfo.number_shareholders_person) {
        payloadOperationHistory.push( {
          site_id: siteId,
          category_id: category.BENEFICIAL_OWNER_INFORMATION,
          content_update: contentUpdate.CHANGE_NUMBER_BENEFICIAL_OWNER_PERSONAL,
          before_update: corporateInfo.number_shareholders_person,
          after_update: payload.number_shareholders_person,
        } )
      }

      if (payload.number_shareholders_corporate !== corporateInfo.number_shareholders_corporate) {
        payloadOperationHistory.push( {
          site_id: siteId,
          category_id: category.BENEFICIAL_OWNER_INFORMATION,
          content_update: contentUpdate.CHANGE_NUMBER_BENEFICIAL_OWNER_CORPORATE,
          before_update: corporateInfo.number_shareholders_corporate,
          after_update: payload.number_shareholders_corporate,
        } )
      }
    }

    payloadOperationHistory.push( {
      site_id: siteId,
      category_id: category.BENEFICIAL_OWNER_INFORMATION,
      content_update: contentUpdate.CHANGE_CORPORATE_FORM_BENEFICIAL_OWNER,
      before_update: _renderDataUpdate('is_national_institution', corporateInfo.is_national_institution),
      after_update: _renderDataUpdate('is_national_institution', eventBody.is_national_institution),
    } )

    if (Object.keys(payloadOperationHistory).length) {
      await createListOperationHistory(userId, payloadOperationHistory, event, authorizedPerson)
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const deleteBeneficialOwner = async (event) => {
  try {
    const id = event.pathParameters.id
    const eventBody = JSON.parse(event.body)
    event.user_id = eventBody.user_id

    if (!eventBody.user_id || !eventBody.personalShareholder || !eventBody.corporateShareholder) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }
    const userId = eventBody.user_id
    const corporateInfo = await usersCorporateRepository.getCorporateByUserId(userId)

    if (!corporateInfo) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // check account status
    if (corporateInfo.account_status_code === statusCode.CLOSED) {
      return await errorLogRepository.createResponseAndLog(
        event,
        null,
        null,
        [errorMessageCodeConstant.DELETE_BENEFICIAL_OWNER.UPDATE_FAILED.ACCOUNT_CLOSED],
      )
    }
    // Get shareholders_person
    const shareholderPersonData = await usersPersonalRepository.getShareholderPersonForValidate(userId)
    corporateInfo.shareholders_person = shareholderPersonData

    // Get shareholders_corporate
    const shareholderCorporateData = await usersCorporateRepository.getShareholderCorporateForValidate(userId)

    corporateInfo.shareholders_corporate = shareholderCorporateData

    const amountPerson = corporateInfo.number_shareholders_person
    const amountCorporate = corporateInfo.number_shareholders_corporate

    const totalAmount = amountPerson + amountCorporate
    if (eventBody.personalShareholder.length + eventBody.corporateShareholder.corporate.length >= totalAmount
    ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // Validate delete id
    for (const personId of eventBody.personalShareholder) {
      if (typeof personId === 'number' && !corporateInfo.shareholders_person.find( (person) => person.personal_id === personId)) {
        return await errorLogRepository.createResponseAndLog(
          event,
          null,
          null,
          [errorMessageCodeConstant.DELETE_BENEFICIAL_OWNER.UPDATE_FAILED.PERSON_NOT_FOUND],
        )
      }
    }
    for (const corporateId of eventBody.corporateShareholder.corporate) {
      if (typeof corporateId === 'number' && !corporateInfo.shareholders_corporate.find( (corporate) => corporate.corporate_id === corporateId)) {
        return await errorLogRepository.createResponseAndLog(
          event,
          null,
          null,
          [errorMessageCodeConstant.DELETE_BENEFICIAL_OWNER.UPDATE_FAILED.CORPORATE_NOT_FOUND],
        )
      }
    }

    const newAmountPerson = amountPerson - eventBody.personalShareholder.length
    const newAmountCorporate = amountCorporate - eventBody.corporateShareholder.corporate.length

    const countEmptyStringPerson = eventBody.personalShareholder.filter( (item) => typeof item !== 'number').length
    const countEmptyStringCorporate = eventBody.corporateShareholder.corporate.filter( (item) => typeof item !== 'number').length
    if (countEmptyStringPerson + countEmptyStringCorporate > 1) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    } else if (
      countEmptyStringPerson + countEmptyStringCorporate === 1
    ) {
      if (countEmptyStringPerson && corporateInfo.shareholders_person.length !== amountPerson - 1) {
        return await errorLogRepository.createResponseAndLog(
          event,
          null,
          null,
          [errorMessageCodeConstant.DELETE_BENEFICIAL_OWNER.UPDATE_FAILED.NUMBER_PERSON_INVALID],
        )
      }
      if (countEmptyStringCorporate && corporateInfo.shareholders_corporate.length !== amountCorporate - 1) {
        return await errorLogRepository.createResponseAndLog(
          event,
          null,
          null,
          [errorMessageCodeConstant.DELETE_BENEFICIAL_OWNER.UPDATE_FAILED.NUMBER_CORPORATE_INVALID],
        )
      }
    }

    const updateNationalInfo = await usersCorporateRepository.updateNationalInstitution(id, {
      number_shareholders_person: newAmountPerson,
      number_shareholders_corporate: newAmountCorporate,
    }, eventBody)

    if ( updateNationalInfo.isError ) {
      return await errorLogRepository.createResponseAndLog(
        event,
        updateNationalInfo.error,
        null,
        [errorMessageCodeConstant.DELETE_BENEFICIAL_OWNER.UPDATE_FAILED.UPDATE_DB],
      )
    }

    const authorizedPerson = utility.getUserIdByToken(event)
    const payloadOperationHistory = []
    if (amountPerson !== newAmountPerson) {
      payloadOperationHistory.push( {
        site_id: commonSiteId.ICPAY,
        category_id: category.BENEFICIAL_OWNER_INFORMATION,
        content_update: contentUpdate.CHANGE_NUMBER_BENEFICIAL_OWNER_PERSONAL,
        before_update: amountPerson,
        after_update: newAmountPerson,
      } )
    }
    if (amountCorporate !== newAmountCorporate) {
      payloadOperationHistory.push( {
        site_id: commonSiteId.ICPAY,
        category_id: category.BENEFICIAL_OWNER_INFORMATION,
        content_update: contentUpdate.CHANGE_NUMBER_BENEFICIAL_OWNER_CORPORATE,
        before_update: amountCorporate,
        after_update: newAmountCorporate,
      } )
    }

    await createListOperationHistory(userId, payloadOperationHistory, event, authorizedPerson)
    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const _renderBOContentTypeId = (field, info, eventBody, isPersonal) => {
  switch (field) {
    case 'country_id':
      return isPersonal === 'personal' ?
        contentUpdate.CHANGE_COUNTRY_RESIDENCE_PERSONAL_BENEFICIAL_OWNER : contentUpdate.CHANGE_COUNTRY_RESIDENCE_CORPORATE_BENEFICIAL_OWNER
    case 'corporate_name_registered':
      return contentUpdate.CHANGE_CORPORATE_NAME_REGISTERED_BENEFICIAL_OWNER
    case 'corporate_name_english':
      return contentUpdate.CHANGE_CORPORATE_NAME_ENGLISH_BENEFICIAL_OWNER
    case 'corporate_name_katakana':
      return contentUpdate.CHANGE_CORPORATE_NAME_KATAKANA_BENEFICIAL_OWNER
    case 'nationality_id':
      return contentUpdate.CHANGE_NATIONALITY_BENEFICIAL_OWNER
    case 'first_name_romaji':
      return contentUpdate.CHANGE_FIRST_NAME_ROMAJI_BENEFICIAL_OWNER
    case 'last_name_romaji':
      return contentUpdate.CHANGE_LAST_NAME_ROMAJI_BENEFICIAL_OWNER
    case 'first_name_kanji':
      return contentUpdate.CHANGE_FIRST_NAME_KANJI_BENEFICIAL_OWNER
    case 'last_name_kanji':
      return contentUpdate.CHANGE_LAST_NAME_KANJI_BENEFICIAL_OWNER
    case 'first_name_katakana':
      return contentUpdate.CHANGE_FIRST_NAME_KATAKANA_BENEFICIAL_OWNER
    case 'last_name_katakana':
      return contentUpdate.CHANGE_LAST_NAME_KATAKANA_BENEFICIAL_OWNER
    case 'gender':
      return contentUpdate.CHANGE_GENDER_BENEFICIAL_OWNER
    case 'zip_postal_code':
      return checkContentUpdate(eventBody, info, field)
    case 'state_province':
      return checkContentUpdate(eventBody, info, field)
    case 'city':
      return checkContentUpdate(eventBody, info, field)
    case 'address_line_1':
      return checkContentUpdate(eventBody, info, field)
    case 'address_line_2':
      return checkContentUpdate(eventBody, info, field)
    case 'corporate_phone_number':
      return contentUpdate.CHANGE_CONTACT_CORPORATE_PHONE_NUMBER_BENEFICIAL_OWNER
    case 'industry_id':
      return contentUpdate.CHANGE_INDUSTRY_BENEFICIAL_OWNER
    case 'business_content':
      return contentUpdate.CHANGE_BUSINESS_CONTENT_BENEFICIAL_OWNER
    case 'website_url':
      return contentUpdate.CHANGE_WEBSITE_URL_BENEFICIAL_OWNER
    case 'voting_ratio':
    case 'voting_ratio_shareholder':
      return contentUpdate.CHANGE_VOTING_RIGHTS_RATIO_BENEFICIAL_OWNER
    case 'contact_phone_number':
      return contentUpdate.CHANGE_CONTACT_PESONAL_PHONE_NUMBER_BENEFICIAL_OWNER
  }
}


const _renderDataUpdate = (fieldName, data, info, eventBody = false) => {
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
    case 'is_national_institution':
      if (data === 0) {
        return 'trans.update_history.national_institution.no'
      } else if (data === 1) {
        return 'trans.update_history.national_institution.yes'
      } else {
        return '-'
      }
    case 'state_province':
      if (info.country_id === 113 && !eventBody) {
        return `${data}${splitContentUpdate}${typeData.PREFECTURES}`
      } else if (info.country_id !== 113 && !eventBody) {
        return data
      } else if (eventBody.country_id && Number(eventBody.country_id ) === 113) {
        return `${data}${splitContentUpdate}${typeData.PREFECTURES}`
      } else if (eventBody.country_id && Number(eventBody.country_id ) !== 113) {
        return data
      } else if (info.country_id === 113) {
        return `${data}${splitContentUpdate}${typeData.PREFECTURES}`
      } else {
        return data
      }
    case 'nationality_id':
      return `${data}${splitContentUpdate}${typeData.NATIONALITIES}`
    case 'country_id':
      return `${data}${splitContentUpdate}${typeData.COUNTRIES}`
    case 'industry_id':
      return `${data}${splitContentUpdate}${typeData.INDUSTRIES}`
    default:
      return data !== null && data !== '' ? data : '-'
  }
}

const checkContentUpdate = (eventBody, info, field) => {
  const returnValueContentJA = () => {
    switch (field) {
      case 'zip_postal_code':
        return contentUpdate.CHANGE_ZIP_POSTAL_CODE_JA_BENEFICIAL_OWNER
      case 'state_province':
        return contentUpdate.CHANGE_PREFECTURE_JA_BENEFICIAL_OWNER
      case 'city':
        return contentUpdate.CHANGE_CITY_JA_BENEFICIAL_OWNER
      case 'address_line_1':
        return contentUpdate.CHANGE_ADDRESS_JA_BENEFICIAL_OWNER
      case 'address_line_2':
        return contentUpdate.CHANGE_BUILDING_BENEFICIAL_OWNER
    }
  }
  const returnValueContentOther = () => {
    switch (field) {
      case 'zip_postal_code':
        return contentUpdate.CHANGE_ZIP_POSTAL_CODE_BENEFICIAL_OWNER
      case 'state_province':
        return contentUpdate.CHANGE_STATE_PROVINCE_BENEFICIAL_OWNER
      case 'city':
        return contentUpdate.CHANGE_CITY_BENEFICIAL_OWNER
      case 'address_line_1':
        return contentUpdate.CHANGE_ADDRESS_LINE1_BENEFICIAL_OWNER
      case 'address_line_2':
        return contentUpdate.CHANGE_ADDRESS_LINE2_BENEFICIAL_OWNER
    }
  }
  if (eventBody.country_id && eventBody.country_id === 113) {
    return returnValueContentJA()
  } else if (eventBody.country_id && eventBody.country_id !== 113) {
    return returnValueContentOther()
  } else if (info.country_id === 113) {
    return returnValueContentJA()
  } else {
    return returnValueContentOther()
  }
}

module.exports = {
  updateNationalInstitution,
  updateBeneficialOnwerCorporate,
  updateBeneficialOnwerPersonal,
  deleteBeneficialOwner,
}
