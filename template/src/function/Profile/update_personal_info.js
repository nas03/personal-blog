const {
  tradingAccountRepository, serverInfoRepository, countryRepository, errorLogRepository,
  usersPersonalRepository, usersBasicDataRepository,
} = require('repository')
const utility = require('utility')
const { splitContentUpdate, typeData,
  commonSiteId, category, country,
  contentUpdate, gender, statusCode, statusItemsConstant,
  typeProfile, flag, errorMessageCodeConstant,
} = require('constant')
const _ = require('lodash')
const { createListOperationHistory } = require('../History/operation_history')
const renderGroupMtAccount = require('../Users/security_user_setting').renderGroupMtAccount
const { renderPayloadUpdateMT } = require('../Users/update_user_by_id')

const updatePersonalInfo = async (event) => {
  try {
    const personalId = event.pathParameters.id
    const eventBody = JSON.parse(event.body) || {}
    let personal
    switch (eventBody.type_person_update) {
      case typeProfile.TRANSACTION_PERSON:
        personal = await usersPersonalRepository.getTransactionPersonInfo(null, personalId)
        break
      case typeProfile.REPRESENTATIVE_PERSON:
        personal = await usersPersonalRepository.getRepresentativePersonInfo(null, personalId)
        break
      default:
        personal = await usersPersonalRepository.getPersonalInfo(null, personalId)
        break
    }

    event.user_id = personal?.user_id
    if (!personal) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }
    if (personal.account_status_code === statusCode.CLOSED) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UPDATE_PERSONAL.ACCOUNT_CLOSE])
    }

    let arrayKeyUpdate = [
      'nationality_id',
      'first_name_kanji',
      'last_name_kanji',
      'first_name_katakana',
      'last_name_katakana',
      'gender',
    ]

    if (eventBody.is_update_address) {
      arrayKeyUpdate = [
        'country_id',
        'zip_postal_code',
        'state_province',
        'city',
        'address_line_1',
        'address_line_2',
      ]
    }

    const payload = {}

    if (personal.site_id !== commonSiteId.FXS_XEM) {
      const userId = personal.user_id
      const siteId = personal.site_id
      const authorizedPerson = utility.getUserIdByToken(event)
      const payloadOperationHistory = []

      const statusItems = JSON.parse(personal.status_items)

      const _isEmpty = (value) => {
        return (value === undefined || value === null || value === '')
      }

      const contactItems = [
        'zip_postal_code',
        'state_province',
        'city',
        'address_line_1',
        'address_line_2',
      ]

      const nameItems = [
        'first_name_kanji',
        'last_name_kanji',
        'first_name_katakana',
        'last_name_katakana',
      ]

      for (const item of Object.keys(eventBody)) {
        if (!(eventBody['nationality_id'] !== country.JAPAN && (nameItems.includes(item))) &&
            item !== 'address_line_2' && _isEmpty(eventBody[item])
        ) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
        }

        if (personal[item] !== undefined && eventBody[item]?.toString() !== personal[item]?.toString()) {
          // prepare payload to update corporate with changed value
          payload[item] = eventBody[item]

          // process status items
          if (item === 'first_name_romaji' || item === 'last_name_romaji') {
            statusItems.name_romaji = statusItemsConstant.CONFIRMED_CANNOT_BE_CHANGED
          } else if (item === 'first_name_kanji' || item === 'last_name_kanji') {
            statusItems.name_kanji = statusItemsConstant.CONFIRMED_CANNOT_BE_CHANGED
          } else if (item === 'first_name_katakana' || item === 'last_name_katakana') {
            statusItems.name_katakana = statusItemsConstant.CONFIRMED_CANNOT_BE_CHANGED
          } else if (contactItems.includes(item)) {
            statusItems[item] = statusItemsConstant.CONFIRMED
          } else {
            statusItems[item] = statusItemsConstant.CONFIRMED_CANNOT_BE_CHANGED
          }

          // prepare payload to update operation history
          let categoryId
          let contentTypeId
          switch (eventBody.type_person_update) {
            case typeProfile.TRANSACTION_PERSON:
              personal = await usersPersonalRepository.getTransactionPersonInfo(null, personalId)
              categoryId = category.TRANSACTION_INFORMATION
              contentTypeId = _renderTransactionContentTypeId(item, personal, eventBody)
              break
            case typeProfile.REPRESENTATIVE_PERSON:
              personal = await usersPersonalRepository.getRepresentativePersonInfo(null, personalId)
              categoryId = category.REPRESENTATIVE_INFORMATION
              contentTypeId = _renderRepresentContentTypeId(item, personal, eventBody)
              break
            default:
              personal = await usersPersonalRepository.getPersonalInfo(null, personalId)
              categoryId = category.BASIC_INFORMATION_PERSON_OR_CORPORATE
              contentTypeId = _renderBasicContentTypeId(item, personal, eventBody)
              break
          }

          payloadOperationHistory.push( {
            site_id: siteId,
            category_id: categoryId,
            content_update: contentTypeId,
            before_update: _renderDataUpdate(item, personal[item], siteId, personal),
            after_update: _renderDataUpdate(item, eventBody[item], siteId, personal, eventBody),
          } )
        }
      }

      if (Object.values(payload).length) {
        let updated
        payload.status_items = JSON.stringify(statusItems)
        const isLikeTransactionPerson = eventBody.type_person_update === typeProfile.REPRESENTATIVE_PERSON && personal.like_transaction_person === 1
        if (payload.country_id && (eventBody.type_person_update !== typeProfile.REPRESENTATIVE_PERSON || isLikeTransactionPerson)) {
          if (personal.site_id === commonSiteId.FXT) {
            // GET LIST TRADING ACCOUNT
            const accountsActive = await tradingAccountRepository.getTradingAccountsActive({ user_basic_data_id: userId })
            if (!accountsActive.length) {
              updated = await usersPersonalRepository.updatePersonalAddress(
                personalId,
                isLikeTransactionPerson ? payload : _.omit(payload, 'country_id'),
                userId,
                payload.country_id,
              )
            }

            const groupBy = _.groupBy(accountsActive, 'mt_server_id')
            const servers = await serverInfoRepository.getAllMtServerInfo()
            const groupServer = renderGroupMtAccount(groupBy)
            const country = await countryRepository.getCountyById(payload.country_id)
            const payloadMT = await renderPayloadUpdateMT('country_id', {
              country:
                        country.english_notation.length > 15 ?
                          country.english_notation.slice(0, 15) :
                          country.english_notation,
            })

            const updatedMtInfoError = await usersBasicDataRepository.updateUserMtInfo(
              userId,
              { country_id: payload.country_id },
              groupServer,
              servers,
              payloadMT.mt_key,
              payloadMT.mt_data,
              null,
              event,
              {
                user_id: userId,
                site_id: siteId,
              },
              personalId,
              _.omit(payload, 'country_id'),
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
                  [errorMessageCodeConstant.UPDATE_PERSONAL.MT_SERVER_RESULTS_IS_NULL])
              } else {
                return await errorLogRepository.createResponseAndLog(event, null, null,
                  [errorMessageCodeConstant.UPDATE_PERSONAL.UPDATE_FAIL_USERS_BASIC_DATA.MT_SERVER])
              }
            }
          } else {
            updated = await usersPersonalRepository.updatePersonalAddress(
              personalId,
              isLikeTransactionPerson ? payload : _.omit(payload, 'country_id'),
              userId,
              payload.country_id,
            )
          }
        } else if ((payload.first_name_romaji || payload.last_name_romaji) && isLikeTransactionPerson) {
          updated = await usersPersonalRepository.updatePersonalInfo(personalId, payload)
          const updateUserBasicData = await usersBasicDataRepository.updateUserBasicData(userId, {
            first_name_romaji: payload.first_name_romaji,
            last_name_romaji: payload.last_name_romaji,
          })
          if (updateUserBasicData.isError) {
            return await errorLogRepository.createResponseAndLog(event, updateUserBasicData.message, null,
              [errorMessageCodeConstant.UPDATE_PERSONAL.UPDATE_FAIL_USERS_BASIC_DATA.SITE_FXS_XEM])
          }
        } else {
          updated = await usersPersonalRepository.updatePersonalInfo(personalId, payload)
        }
        if (!updated) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.UPDATE_PERSONAL.UPDATE_FAIL_PERSONAL_INFO])
        }
        // Insert operation history
        await createListOperationHistory(userId, payloadOperationHistory, event, authorizedPerson)
      }

      return utility.createResponse(true)
    }

    for (const item of arrayKeyUpdate) {
      if (item === 'gender' && !Object.values(gender).includes(Number(eventBody[item])) ||
          (item === 'nationality_id' && isNaN(eventBody[item])) ||
          (item === 'country_id' && isNaN(eventBody[item]))
      ) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
      }

      if (eventBody[item] !== personal[item]) {
        payload[item] = eventBody[item]
      }
    }

    if (Object.values(payload).length) {
      let updated
      if (eventBody.is_update_address && payload.country_id) {
        // update address
        const payloadWithoutCountry = _.omit(payload, 'country_id')
        if (Object.values(payloadWithoutCountry).length) {
          updated = await usersPersonalRepository.updatePersonalAddress(personalId, payloadWithoutCountry, personal.user_id, payload.country_id)
        } else {
          const updateUserBasicData = await usersBasicDataRepository.updateUserBasicData(personal.user_id, { country_id: payload.country_id })
          if (updateUserBasicData.isError) {
            return await errorLogRepository.createResponseAndLog(event, updateUserBasicData.message, null,
              [errorMessageCodeConstant.UPDATE_PERSONAL.UPDATE_FAIL_USERS_BASIC_DATA.OTHER_SITE_FXS_XEM])
          }
        }
      } else {
        // update personal
        updated = await usersPersonalRepository.updatePersonalInfo(personalId, payload)
      }
      // check update status
      if (!updated) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UPDATE_PERSONAL.UPDATE_FAIL_PERSONAL_INFO])
      }
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [
      error.isAxiosError ? errorMessageCodeConstant.UPDATE_PERSONAL.UNABLE_CONNECT_TO_MT_SERVER : errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const checkContentUpdate = (eventBody, personal, field, typePerson = null) => {
  const type = typePerson ? `_${typePerson.toUpperCase()}` : ''
  const returnValueContentJA = () => {
    switch (field) {
      case 'zip_postal_code':
        return contentUpdate[`CHANGE_ZIP_POSTAL_CODE_JA${type}`]
      case 'state_province':
        return contentUpdate[`CHANGE_PREFECTURE_JA${type}`]
      case 'city':
        return contentUpdate[`CHANGE_CITY_JA${type}`]
      case 'address_line_1':
        return contentUpdate[`CHANGE_ADDRESS_JA${type}`]
      case 'address_line_2':
        return contentUpdate[`CHANGE_BUILDING${type}`]
    }
  }
  const returnValueContentOther = () => {
    switch (field) {
      case 'zip_postal_code':
        return contentUpdate[`CHANGE_ZIP_POSTAL_CODE${type}`]
      case 'state_province':
        return contentUpdate[`CHANGE_STATE_PROVINCE${type}`]
      case 'city':
        return contentUpdate[`CHANGE_CITY${type}`]
      case 'address_line_1':
        return contentUpdate[`CHANGE_ADDRESS_LINE1${type}`]
      case 'address_line_2':
        return contentUpdate[`CHANGE_ADDRESS_LINE2${type}`]
    }
  }
  if (eventBody.country_id && Number(eventBody.country_id) === 113) {
    return returnValueContentJA()
  } else if (eventBody.country_id && Number(eventBody.country_id) !== 113) {
    return returnValueContentOther()
  } else if (Number(personal.country_id) === 113) {
    return returnValueContentJA()
  } else {
    return returnValueContentOther()
  }
}


const _renderBasicContentTypeId = (field, personal, eventBody) => {
  switch (field) {
    case 'first_name_romaji':
      return contentUpdate.CHANGE_FIRST_NAME_ROMAJI
    case 'last_name_romaji':
      return contentUpdate.CHANGE_LAST_NAME_ROMAJI
    case 'first_name_katakana':
      return contentUpdate.CHANGE_FIRST_NAME_KATAKANA
    case 'last_name_katakana':
      return contentUpdate.CHANGE_LAST_NAME_KATAKANA
    case 'first_name_kanji':
      return contentUpdate.CHANGE_FIRST_NAME_KANJI
    case 'last_name_kanji':
      return contentUpdate.CHANGE_LAST_NAME_KANJI
    case 'nationality_id':
      return contentUpdate.CHANGE_NATIONALITY
    case 'gender':
      return contentUpdate.CHANGE_GENDER
    case 'date_of_birth':
      return contentUpdate.CHANGE_US_TAX_OBLIGATIONS
    case 'us_taxpayer_number':
      return contentUpdate.CHANGE_US_TAXPAYER
    case 'zip_postal_code':
      return checkContentUpdate(eventBody, personal, field)
    case 'state_province':
      return checkContentUpdate(eventBody, personal, field)
    case 'city':
      return checkContentUpdate(eventBody, personal, field)
    case 'address_line_1':
      return checkContentUpdate(eventBody, personal, field)
    case 'address_line_2':
      return checkContentUpdate(eventBody, personal, field)
    case 'country_id':
      return contentUpdate.CHANGE_COUNTRY_RESIDENCE_PERSONAL
    case 'us_tax_obligations':
      return contentUpdate.CHANGE_US_TAX_OBLIGATIONS
    default:
      break
  }
}


const _renderDataUpdate = (fieldName, data, siteId, personal, eventBody = false) => {
  const _getFinanceValue = (type_finance) => {
    if (data !== null && data !== '') {
      return `${data}${splitContentUpdate}${type_finance}`
    } else {
      return '-'
    }
  }
  switch (fieldName) {
    case 'gender':
      data = Number(data)
      if (data === gender.MALE) {
        return 'trans.update_history.gender.male'
      } else if (data === gender.FEMALE) {
        return 'trans.update_history.gender.female'
      } else if (data === gender.OTHER) {
        return 'trans.update_history.gender.others'
      } else if (data === gender.NO_ANSWER) {
        return 'trans.update_history.gender.no_answer'
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
      if (personal.country_id === 113 && !eventBody) {
        return `${data}${splitContentUpdate}${typeData.PREFECTURES}`
      } else if (personal.country_id !== 113 && !eventBody) {
        return data
      } else if (eventBody.country_id && Number(eventBody.country_id) === 113) {
        return `${data}${splitContentUpdate}${typeData.PREFECTURES}`
      } else if (eventBody.country_id && Number(eventBody.country_id) !== 113) {
        return data
      } else if (personal.country_id === 113) {
        return `${data}${splitContentUpdate}${typeData.PREFECTURES}`
      } else {
        return data
      }

    case 'nationality_id':
      return `${data}${splitContentUpdate}${typeData.NATIONALITIES}`
    case 'country_id':
      return `${data}${splitContentUpdate}${typeData.COUNTRIES}`
    case 'industry_id':
      if (data !== null && data !== '') {
        return `${data}${splitContentUpdate}${typeData.INDUSTRIES}`
      } else {
        return '-'
      }
    case 'occupation_id':
      return _getFinanceValue(typeData.OCCUPATIONS)
    case 'funding_source_id':
      return _getFinanceValue(typeData.FUNDINGSOURCES)
    case 'annual_income':
    case 'net_worth':
    case 'planned_annual_investment':
      return personal.corporate_flag === flag.TRUE ?
        (siteId === commonSiteId.ICPAY ? _getFinanceValue(typeData.MONEY_RANGE_COMPANY_ICPAY) : _getFinanceValue(typeData.MONEY_RANGE_COMPANY_FXT) ) :
        _getFinanceValue(typeData.MONEY_RANGE_PERSON_FXT)
    case 'purpose_of_investment':
      if (siteId === commonSiteId.FXT) {
        return _getFinanceValue(typeData.INVESTMENT_PURPOSE_FXT)
      } else if (siteId === commonSiteId.ICPAY) {
        return _getFinanceValue(typeData.USING_PURPOSE_ICPAY)
      }
    default:
      return data !== null && data !== '' ? data : '-'
  }
}

const _renderRepresentContentTypeId = (field, personalInfo, eventBody) => {
  switch (field) {
    case 'nationality_id':
      return contentUpdate.CHANGE_NATIONALITY_REPRESENTATIVE
    case 'first_name_romaji':
      return contentUpdate.CHANGE_FIRST_NAME_ROMAJI_REPRESENTATIVE
    case 'last_name_romaji':
      return contentUpdate.CHANGE_LAST_NAME_ROMAJI_REPRESENTATIVE
    case 'first_name_kanji':
      return contentUpdate.CHANGE_FIRST_NAME_KANJI_REPRESENTATIVE
    case 'last_name_kanji':
      return contentUpdate.CHANGE_LAST_NAME_KANJI_REPRESENTATIVE
    case 'first_name_katakana':
      return contentUpdate.CHANGE_FIRST_NAME_KATAKANA_REPRESENTATIVE
    case 'last_name_katakana':
      return contentUpdate.CHANGE_LAST_NAME_KATAKANA_REPRESENTATIVE
    case 'gender':
      return contentUpdate.CHANGE_GENDER_REPRESENTATIVE
    case 'us_tax_obligations':
      return contentUpdate.CHANGE_US_TAX_OBLIGATIONS_REPRESENTATIVE
    case 'us_taxpayer_number':
      return contentUpdate.CHANGE_US_TAXPAYER_REPRESENTATIVE
    case 'country_id':
      return contentUpdate.CHANGE_COUNTRY_RESIDENCE_REPRESENTATIVE
    case 'zip_postal_code':
      return checkContentUpdate(eventBody, personalInfo, field, 'representative')
    case 'state_province':
      return checkContentUpdate(eventBody, personalInfo, field, 'representative')
    case 'city':
      return checkContentUpdate(eventBody, personalInfo, field, 'representative')
    case 'address_line_1':
      return checkContentUpdate(eventBody, personalInfo, field, 'representative')
    case 'address_line_2':
      return checkContentUpdate(eventBody, personalInfo, field, 'representative')
    case 'phone_number_country_id':
      return contentUpdate.CHANGE_CONTACT_PHONE_NUMBER_REPRESENTATIVE
    case 'contact_phone_number':
      return contentUpdate.CHANGE_CONTACT_PHONE_NUMBER_REPRESENTATIVE
    default:
      break
  }
}
const _renderTransactionContentTypeId = (field, personalInfo, eventBody) => {
  switch (field) {
    case 'nationality_id':
      return contentUpdate.CHANGE_NATIONALITY_TRANSACTION
    case 'first_name_romaji':
      return contentUpdate.CHANGE_FIRST_NAME_ROMAJI_TRANSACTION
    case 'last_name_romaji':
      return contentUpdate.CHANGE_LAST_NAME_ROMAJI_TRANSACTION
    case 'first_name_kanji':
      return contentUpdate.CHANGE_FIRST_NAME_KANJI_TRANSACTION
    case 'last_name_kanji':
      return contentUpdate.CHANGE_LAST_NAME_KANJI_TRANSACTION
    case 'first_name_katakana':
      return contentUpdate.CHANGE_FIRST_NAME_KATAKANA_TRANSACTION
    case 'last_name_katakana':
      return contentUpdate.CHANGE_LAST_NAME_KATAKANA_TRANSACTION
    case 'gender':
      return contentUpdate.CHANGE_GENDER_TRANSACTION
    case 'us_tax_obligations':
      return contentUpdate.CHANGE_US_TAX_OBLIGATIONS_TRANSACTION
    case 'us_taxpayer_number':
      return contentUpdate.CHANGE_US_TAXPAYER_TRANSACTION
    case 'country_id':
      return contentUpdate.CHANGE_COUNTRY_RESIDENCE_TRANSACTION
    case 'zip_postal_code':
      return checkContentUpdate(eventBody, personalInfo, field, 'transaction')
    case 'state_province':
      return checkContentUpdate(eventBody, personalInfo, field, 'transaction')
    case 'city':
      return checkContentUpdate(eventBody, personalInfo, field, 'transaction')
    case 'address_line_1':
      return checkContentUpdate(eventBody, personalInfo, field, 'transaction')
    case 'address_line_2':
      return checkContentUpdate(eventBody, personalInfo, field, 'transaction')
    default:
      break
  }
}

module.exports = {
  updatePersonalInfo,
  _renderDataUpdate,
}
