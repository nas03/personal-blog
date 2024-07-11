'use strict'

const { flag, category, contentUpdate, gender, statusCode, errorMessageCodeConstant } = require('constant')

/* function */
const utility = require('utility')
const { createOperationHistory } = require('../History/operation_history')

/* DB */
const { userUboRepository, errorLogRepository, usersBasicDataRepository,
  usersCorporateRepository, usersPersonalRepository } = require('repository')

const addPersonal = async (event) => {
  try {
    const userId = event.pathParameters.userId
    event.user_id = userId
    const user = await usersBasicDataRepository.getDetailUserById(userId)

    if (!user) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // check account status
    if (user.account_status === statusCode.CLOSED) {
      return await errorLogRepository.createResponseAndLog(
        event,
        null,
        null,
        [errorMessageCodeConstant.ADD_PERSONAL.UPDATE_FAILED.ACCOUNT_CLOSED],
      )
    }

    const currentCorporate = await usersCorporateRepository.getCorporateByUserId(userId, flag.FALSE)

    if (!currentCorporate) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }
    const numberShareholdersPerson = currentCorporate.number_shareholders_person || 0

    // Get shareholders_person
    const shareholderPersonData = await usersPersonalRepository.getShareholderPersonForValidate(currentCorporate.user_id)

    currentCorporate.shareholders_person = shareholderPersonData

    if (numberShareholdersPerson !== currentCorporate.shareholders_person.length + 1) {
      return await errorLogRepository.createResponseAndLog(
        event,
        null,
        null,
        [errorMessageCodeConstant.ADD_PERSONAL.UPDATE_FAILED.CANNOT_ADD],
      )
    }

    const eventBody = JSON.parse(event.body) || {}

    const arrayKeyCreate = [
      'nationality_id',
      'first_name_romaji',
      'last_name_romaji',
      'first_name_kanji',
      'last_name_kanji',
      'first_name_katakana',
      'last_name_katakana',
      'gender',
      'date_of_birth',
      'country_id',
      'zip_postal_code',
      'state_province',
      'city',
      'address_line_1',
      'address_line_2',
      'phone_number_country_id',
      'contact_phone_number',
      'voting_ratio',
    ]

    const status_items = {
      nationality_id: 3,
      name_romaji: 3,
      name_kanji: eventBody.first_name_kanji && eventBody.last_name_kanji ? 3 : 0,
      name_katakana: eventBody.first_name_katakana && eventBody.last_name_katakana ? 3 : 0,
      gender: 3,
      date_of_birth: 3,
      country_id: 3,
      zip_postal_code: 2,
      state_province: 2,
      city: 2,
      address_line_1: 2,
      address_line_2: eventBody.address_line_2 ? 2 : 0,
      contact_phone_number: 2,
      voting_ratio: 3,
    }

    const payload = {
      user_basic_data_id: userId,
      user_corporate_id: 0,
      transaction_person: 1,
      representative_person: 1,
      beneficial_owner: 1,
      status_items: JSON.stringify(status_items),
    }

    for (const item of arrayKeyCreate) {
      if (item === 'gender' &&
          Number(eventBody[item]) !== gender.MALE &&
          Number(eventBody[item]) !== gender.FEMALE &&
          Number(eventBody[item]) !== gender.OTHER
      ) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
      } else if (
        item !== 'first_name_katakana' &&
        item !== 'last_name_katakana' &&
        item !== 'first_name_kanji' &&
        item !== 'last_name_kanji' &&
        item !== 'address_line_2' &&
        !eventBody[item]
      ) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
      } else if (eventBody[item]) {
        payload[item] = eventBody[item]
      }
    }

    const personal = await usersPersonalRepository.insertPersonalInfo(payload)

    return utility.createResponse(true, personal)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const addCompany = async (event) => {
  try {
    const userId = event.pathParameters.userId
    event.user_id = userId
    const user = await usersBasicDataRepository.getDetailUserById(userId)

    if (!user) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // check account status
    if (user.account_status === statusCode.CLOSED) {
      return await errorLogRepository.createResponseAndLog(
        event,
        null,
        null,
        [errorMessageCodeConstant.ADD_COMPANY.UPDATE_FAILED.ACCOUNT_CLOSED],
      )
    }

    const currentCorporate = await usersCorporateRepository.getCorporateByUserId(userId, flag.FALSE)

    if (!currentCorporate) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }
    const numberShareholdersCorporate = currentCorporate.number_shareholders_corporate || 0

    // Get shareholders_corporate
    const shareholderCorporateData = await usersCorporateRepository.getShareholderCorporateForValidate(currentCorporate.user_id)

    currentCorporate.shareholders_corporate = shareholderCorporateData.data

    if (numberShareholdersCorporate !== currentCorporate.shareholders_corporate.length + 1) {
      return await errorLogRepository.createResponseAndLog(
        event,
        null,
        null,
        [errorMessageCodeConstant.ADD_COMPANY.UPDATE_FAILED.CANNOT_ADD],
      )
    }

    const eventBody = JSON.parse(event.body) || {}
    const corporateData = eventBody.corporate || {}
    const personalData = eventBody.personal || {}

    // add corporate
    const arrayCorporateKeyCreate = [
      'country_id',
      'corporate_name_registered',
      'corporate_name_english',
      'corporate_name_katakana',
      'date_of_establish',
      'zip_postal_code',
      'state_province',
      'city',
      'address_line_1',
      'address_line_2',
      'phone_number_country_id',
      'corporate_phone_number',
      'voting_ratio',
      'industry_id',
      'business_content',
      'website_url',
    ]

    const corporateStatusItems = {
      country_id: 3,
      corporate_name_registered: 3,
      corporate_name_english: 3,
      corporate_name_katakana: corporateData.corporate_name_katakana ? 3 : 0,
      date_of_establish: 3,
      zip_postal_code: 2,
      state_province: 2,
      city: 2,
      address_line_1: 2,
      address_line_2: corporateData.address_line_2 ? 2 : 0,
      corporate_phone_number: 2,
      voting_ratio: 3,
      industry_id: 3,
      business_content: corporateData.business_content ? 3 : 0,
      website_url: corporateData.website_url ? 2 : 0,
    }

    const payloadCorporate = {
      user_basic_data_id: userId,
      beneficial_owner: 1,
      status_items: JSON.stringify(corporateStatusItems),
    }

    for (const item of arrayCorporateKeyCreate) {
      if (
        item !== 'address_line_2' &&
        item !== 'business_content' &&
        item !== 'website_url' &&
        item !== 'corporate_name_katakana' &&
        !corporateData[item]
      ) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
      } else if (corporateData[item]) {
        payloadCorporate[item] = corporateData[item]
      }
    }

    // add personal
    const arrayKeyCreate = [
      'nationality_id',
      'first_name_romaji',
      'last_name_romaji',
      'first_name_kanji',
      'last_name_kanji',
      'first_name_katakana',
      'last_name_katakana',
      'gender',
      'date_of_birth',
      'country_id',
      'zip_postal_code',
      'state_province',
      'city',
      'address_line_1',
      'address_line_2',
      'phone_number_country_id',
      'contact_phone_number',
    ]

    const status_items = {
      nationality_id: 3,
      name_romaji: 3,
      name_kanji: personalData.first_name_kanji && personalData.last_name_kanji ? 3 : 0,
      name_katakana: personalData.first_name_katakana && personalData.last_name_katakana ? 3 : 0,
      gender: 3,
      date_of_birth: 3,
      country_id: 3,
      zip_postal_code: 2,
      state_province: 2,
      city: 2,
      address_line_1: 2,
      address_line_2: personalData.address_line_2 ? 2 : 0,
      contact_phone_number: 2,
    }

    const payloadPersonal = {
      user_basic_data_id: userId,
      user_corporate_id: 0,
      transaction_person: 0,
      representative_person: 1,
      beneficial_owner: 0,
      status_items: JSON.stringify(status_items),
    }

    for (const item of arrayKeyCreate) {
      if (item === 'gender' &&
          Number(personalData[item]) !== gender.MALE &&
          Number(personalData[item]) !== gender.FEMALE &&
          Number(personalData[item]) !== gender.OTHER
      ) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
      } else if (
        item !== 'first_name_katakana' &&
        item !== 'last_name_katakana' &&
        item !== 'first_name_kanji' &&
        item !== 'last_name_kanji' &&
        item !== 'address_line_2' &&
        !personalData[item]
      ) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
      } else if (personalData[item]) {
        payloadPersonal[item] = personalData[item]
      }
    }

    await usersCorporateRepository.insertCorporateInfo(payloadCorporate, payloadPersonal)

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const updateAmountShareholders = async (event) => {
  try {
    const id = event.pathParameters.id

    const currentCorporate = await usersCorporateRepository.getCorporateById(id, flag.FALSE)
    event.user_id = currentCorporate.user_id || null
    if (!currentCorporate) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // check account status
    if (currentCorporate.account_status_code === statusCode.CLOSED) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UPDATE_AMOUNT_SHAREHOLDERS.ACCOUNT_IS_CLOSE])
    }

    // Get shareholders_person
    const shareholderPersonData = await usersPersonalRepository.getShareholderPersonForValidate(currentCorporate.user_id)
    currentCorporate.shareholders_person = shareholderPersonData.data

    // Get shareholders_corporate
    const shareholderCorporateData = await usersCorporateRepository.getShareholderCorporateForValidate(currentCorporate.user_id)

    currentCorporate.shareholders_corporate = shareholderCorporateData.data

    const eventBody = JSON.parse(event.body) || {}

    let numberShareholdersCorporate = currentCorporate.number_shareholders_corporate || 0
    let numberShareholdersPerson = currentCorporate.number_shareholders_person || 0

    if (numberShareholdersCorporate + numberShareholdersPerson > 3) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_AMOUNT_SHAREHOLDERS.CANNOT_ADD_SHAREHOLDERS_MAXIMUM])
    }

    if (numberShareholdersPerson !== currentCorporate.shareholders_person.length ||
      numberShareholdersCorporate !== currentCorporate.shareholders_corporate.length
    ) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_AMOUNT_SHAREHOLDERS.CANNOT_ADD_SHAREHOLDERS_INVALID])
    }

    const payload = {}

    if (eventBody.isAddPerson === flag.TRUE) {
      payload.number_shareholders_person = ++numberShareholdersPerson
    } else if (eventBody.isAddPerson === flag.FALSE) {
      payload.number_shareholders_corporate = ++numberShareholdersCorporate
    } else {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    const result = await userUboRepository.updateAmountShareholders(id, payload)

    // save history
    const ipAddress = event.requestContext.identity.sourceIp
    const deviceBrowser = event.headers['User-Agent']
    const authorizedPerson = utility.getUserIdByToken(event)

    const content = eventBody.isAddPerson ?
      contentUpdate.CHANGE_NUMBER_BENEFICIAL_OWNER_PERSONAL : contentUpdate.CHANGE_NUMBER_BENEFICIAL_OWNER_CORPORATE
    const beforeUpdate = eventBody.isAddPerson ?
      currentCorporate.number_shareholders_person : currentCorporate.number_shareholders_corporate
    const afterUpdate = eventBody.isAddPerson ?
      numberShareholdersPerson : numberShareholdersCorporate

    await createOperationHistory(
      currentCorporate.user_id,
      currentCorporate.site_id,
      category.BENEFICIAL_OWNER_INFORMATION,
      content,
      beforeUpdate,
      afterUpdate,
      ipAddress,
      deviceBrowser,
      authorizedPerson,
    )

    return utility.createResponse(true, result)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  addPersonal,
  addCompany,
  updateAmountShareholders,
}
