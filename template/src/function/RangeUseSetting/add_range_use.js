const { rangeUseSettingRepository, countryRepository, rangeUseSettingHistoryRepository,
  errorLogRepository, usersBasicDataRepository } = require('repository')
/* constant */
const { contentUpdate, dateType, flag, ruleTemplate, baseCurrency,
  conditionValue, depositAmountType, enable, errorMessageCodeConstant } = require('constant')
const rangeUseSettingHistory = require('../History/range_use_setting_history')
const utility = require('utility')

const addRangeUseSetting = async (event) => {
  try {
    const eventBody = JSON.parse(event.body)
    const { rangeUseSetting, ruleContainer } = eventBody
    const lstContainerRule = []
    const authorizedPerson = utility.getUserIdByToken(event)
    const objRangeUseSetting = {
      site_id: rangeUseSetting.site_id,
      rule_template_id: rangeUseSetting.rule_template_id,
      rule_name: rangeUseSetting.rule_name,
      rule_description: rangeUseSetting.rule_description,
      priority: rangeUseSetting.priority,
      enable: rangeUseSetting.enable,
      staff_id: authorizedPerson,
      delete_flag: flag.FALSE,
    }

    // validate required
    let isValid = objRangeUseSetting.site_id && objRangeUseSetting.rule_name &&
      objRangeUseSetting.priority

    if (!isValid) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // validate priority
    const countRangeOfRule = await rangeUseSettingRepository.countRangeUseSetting(objRangeUseSetting.site_id)

    isValid = countRangeOfRule[0].count + 1 >= objRangeUseSetting.priority && objRangeUseSetting.priority >= 1
    if (!isValid) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.ADD_RANGE_USE.RECORD_HAS_DELETED])
    }

    // validate flag
    isValid = utility.flagValidate(objRangeUseSetting.enable) && Object.values(ruleTemplate).includes(objRangeUseSetting.rule_template_id)

    if (!isValid) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }
    const listRuleContainer = []
    const listRuleContainerExist = []

    let segmentCountry = ''
    let segmentUser = ''
    // get list ruleContainer
    for (let i = 0; i < ruleContainer.length; i++) {
      const itemContainerRule = {
        objContainerRule: {},
        lstPaymentMethod: [],
      }
      const lstPaymentMethod = []
      const itemRule = {
        range_use_setting_id: null,
        enable_rule_container: ruleContainer[i].enable_rule_container,
        rule_container_name: ruleContainer[i].rule_container_name,
        rank: ruleContainer[i].rank,
        enable_segment_country: null,
        segment_country: null,
        display_segment_country: null,
        enable_segment_user: ruleContainer[i].enable_segment_user,
        segment_user: ruleContainer[i].segment_user,
        display_segment_user: ruleContainer[i].display_segment_user,
        enable_attention_flag: null,
        message_unavailable_id: null,
        rank_segment_country: null,
        rank_segment_user: ruleContainer[i].rank_segment_user,
        rank_attention_flag: null,
        delete_flag: flag.FALSE,
      }

      if (!listRuleContainer.includes(itemRule.rule_container_name)) {
        listRuleContainer.push(itemRule.rule_container_name)
      } else {
        listRuleContainerExist.push(itemRule.rule_container_name)
      }

      // validate required
      isValid = itemRule.rank && itemRule.rule_container_name && itemRule.rank_segment_user

      if (!isValid) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
      }

      // validate flag
      isValid = utility.flagValidate(itemRule.enable_rule_container) && utility.flagValidate(itemRule.enable_segment_user)

      if (!isValid) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
      }

      let valuesArray = []

      // get item by rule template id
      switch (objRangeUseSetting.rule_template_id) {
        case ruleTemplate.SETTING_AVAILABILITY:
          itemRule.enable_segment_country = ruleContainer[i].enable_segment_country
          itemRule.display_segment_country = ruleContainer[i].display_segment_country
          itemRule.segment_country = ruleContainer[i].segment_country
          itemRule.rank_segment_country = ruleContainer[i].rank_segment_country
          itemRule.enable_attention_flag = ruleContainer[i].enable_attention_flag
          itemRule.message_unavailable_id = ruleContainer[i].message_unavailable_id
          itemRule.rank_attention_flag = ruleContainer[i].rank_attention_flag
          // validate country code
          if (itemRule.segment_country && itemRule.enable_rule_container && itemRule.enable_segment_country) {
            segmentCountry += itemRule.segment_country + ','
          }

          // validate required
          isValid = itemRule.message_unavailable_id && itemRule.rank_attention_flag && itemRule.rank_segment_country
          if (!isValid) {
            return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
          }
          valuesArray = [itemRule.rank_segment_user, itemRule.rank_segment_country, itemRule.rank_attention_flag]
          isValid = utility.flagValidate(itemRule.enable_segment_country) && validateRank(valuesArray) &&
          utility.flagValidate(itemRule.enable_attention_flag)

          if (!isValid) {
            return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
          }
          break
        case ruleTemplate.SETTING_PAYMENT_COMPANY:
          itemRule.enable_payment_terms = ruleContainer[i].enable_payment_terms
          itemRule.rank_payment_terms = ruleContainer[i].rank_payment_terms
          itemRule.payment_terms = null
          const listPaymentTerms = ruleContainer[i].payment_terms

          if (listPaymentTerms && listPaymentTerms.length > 0) {
            if (itemRule.enable_rule_container) {
              for (let j = 0; j < listPaymentTerms.length; j++) {
                const isValid = validatePaymentTerm(listPaymentTerms[j], j, listPaymentTerms.length, itemRule.enable_payment_terms)

                if (!isValid) {
                  return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
                }
              }
            }
            itemRule.payment_terms = JSON.stringify(ruleContainer[i].payment_terms)
          }
          isValid = itemRule.rank_payment_terms
          if (!isValid) {
            return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
          }

          valuesArray = [itemRule.rank_segment_user, itemRule.rank_payment_terms]
          isValid = utility.flagValidate(itemRule.enable_payment_terms) && validateRank(valuesArray)
          if (!isValid) {
            return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
          }
          break
        default:
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
      }

      // get list user validate exists
      if (itemRule.segment_user && itemRule.enable_rule_container && itemRule.enable_segment_user) {
        segmentUser += itemRule.segment_user + ','
      }

      const itemPaymentMethod = ruleContainer[i].lstPaymentMethod

      for (let j = 0; j < itemPaymentMethod.length; j++) {
        let item = {
          rule_container_id: null,
          payment_type: itemPaymentMethod[j].payment_type,
          enable_payment: itemPaymentMethod[j].enable_payment,
          payment_method_id: itemPaymentMethod[j].payment_method_id,
          payment_category_id: itemPaymentMethod[j].payment_category_id,
          payment_detail_id: itemPaymentMethod[j].payment_detail_id,
          display_order: j + 1,
          payment_company_account_id: itemPaymentMethod[j].payment_company_account_id,
          payment_service_account_id: itemPaymentMethod[j].payment_service_account_id,
          delete_flag: flag.FALSE,
        }
        item = setValuePaymentMethod(item)

        // validate method
        if (itemRule.enable_rule_container) {
          isValid = isValidPaymentMethodRequired(item)
        }

        if (!isValid) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
        }
        lstPaymentMethod.push(item)
      }

      itemContainerRule.objContainerRule = itemRule
      itemContainerRule.lstPaymentMethod = lstPaymentMethod
      lstContainerRule.push(itemContainerRule)
    }

    // validate segment_user
    const listUserNotExists = await getSegmentUserNotExists(segmentUser)

    if (ruleTemplate.SETTING_AVAILABILITY === objRangeUseSetting.rule_template_id) {
      // validate country code error
      const listCountryNotExists = await getCountryCodeError(segmentCountry)

      if (listCountryNotExists.length > 0 && listUserNotExists.length > 0) {
        return await errorLogRepository.createResponseAndLog(event, null, { listCountryNotExists, listUserNotExists },
          [errorMessageCodeConstant.ADD_RANGE_USE.NOT_EXIST.SEGMENT_COUNTRY_CODE, errorMessageCodeConstant.ADD_RANGE_USE.NOT_EXIST.SEGMENT_USER])
      }
      if (listCountryNotExists.length > 0) {
        return await errorLogRepository.createResponseAndLog(event, null, listCountryNotExists,
          [errorMessageCodeConstant.ADD_RANGE_USE.NOT_EXIST.SEGMENT_COUNTRY_CODE])
      }
    }

    if (listUserNotExists.length > 0) {
      return await errorLogRepository.createResponseAndLog(event, null, listUserNotExists,
        [errorMessageCodeConstant.ADD_RANGE_USE.NOT_EXIST.SEGMENT_USER])
    }

    // check rule container name exists
    const containerName = await rangeUseSettingRepository.checkContainerNameExist(0, listRuleContainer, rangeUseSetting.site_id)

    containerName.forEach((item) => {
      if (!listRuleContainerExist.includes(item.rule_container_name)) {
        listRuleContainerExist.push(item.rule_container_name)
      }
    })

    if (listRuleContainerExist.length > 0) {
      return await errorLogRepository.createResponseAndLog(event, null, listRuleContainerExist,
        [errorMessageCodeConstant.ADD_RANGE_USE.EXIST_CONTAINER_NAME])
    }

    const response = await rangeUseSettingRepository.addRangeUseSetting(objRangeUseSetting, lstContainerRule)

    if (response.isError) {
      return await errorLogRepository.createResponseAndLog(event, response.error, null,
        [errorMessageCodeConstant.ADD_RANGE_USE.UPDATE_FAILED.UPDATE_DB])
    }

    // save history
    createHistoryAfterAdd(objRangeUseSetting, response.data)

    const result = {
      rangeUseSettingId: response.data.rangeUseSettingId,
      ruleContainerId: response.data.ruleContainerId,
    }

    return utility.createResponse(true, result)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

// save history
const createHistoryAfterAdd = async (objRangeUseSetting, response) => {
  const itemCreate = rangeUseSettingHistory.initObjHistory(
    objRangeUseSetting.staff_id,
    response.rangeUseSettingId,
    contentUpdate.CREATE_RULE,
    '-',
    '-',
    0,
  )
  const listItemUpdate = response.listItemUpdate
  const listHistory = await listItemUpdate.map((el, index) =>
    rangeUseSettingHistory.initObjHistory(
      objRangeUseSetting.staff_id,
      el.id,
      contentUpdate.UPDATE_PRIORITY,
      el.priority,
      el.priority + 1,
      index + 1,
    ))

  listHistory.push(itemCreate)
  await rangeUseSettingHistoryRepository.createHistory(listHistory)
}

// validate required payment method
const isValidPaymentMethodRequired = (item) => {
  const idSelectAll = 0
  const isMethodSelectAll = item.payment_method_id === idSelectAll
  const isCategorySelectAll = item.payment_category_id === idSelectAll
  const isDetailSelectAll = item.payment_detail_id === idSelectAll
  const isCompanyAccSelectAll = item.payment_company_account_id === idSelectAll
  const isServiceAccSelectAll = item.payment_service_account_id === idSelectAll

  if (isMethodSelectAll || !item.enable_payment) {
    return true
  }
  if (isCategorySelectAll) {
    return !!item.payment_method_id
  }
  if (isDetailSelectAll) {
    return item.payment_method_id && item.payment_category_id
  }
  if (isCompanyAccSelectAll) {
    return item.payment_method_id && item.payment_category_id && item.payment_detail_id
  }
  if (isServiceAccSelectAll) {
    return item.payment_method_id && item.payment_category_id && item.payment_detail_id &&
      item.payment_company_account_id
  }

  const isValid = item.payment_method_id && item.payment_category_id && item.payment_detail_id &&
  item.payment_company_account_id && item.payment_service_account_id

  return isValid
}
// validate country code
const getCountryCodeError = async (segmentCountry) => {
  // get list country database
  const listCountryCodeError = []
  if (!segmentCountry) return listCountryCodeError
  const lstSegmentCountry = segmentCountry.split(',')
  const listCountry = await countryRepository.getAll()
  let listCountryCode = []

  if (listCountry) {
    listCountryCode = listCountry.map((el) => el.countryCode.toLowerCase())
  }

  for (let k = 0; k < lstSegmentCountry.length; k++) {
    const countryCode = lstSegmentCountry[k].trim().toLowerCase()

    if (!countryCode) {
      continue
    }
    const isValidCountry = listCountryCode.includes(countryCode)

    if (!isValidCountry && !listCountryCodeError.includes(lstSegmentCountry[k].trim())) {
      listCountryCodeError.push(lstSegmentCountry[k].trim())
    }
  }

  return listCountryCodeError
}

// validate segment_user
const getSegmentUserNotExists = async (segmentUser) => {
  const listUserExists = []
  const listUserNotExists = []

  if (!segmentUser || segmentUser.length === 0) {
    return listUserNotExists
  }

  segmentUser = segmentUser.toString().split(',')

  // get arr member id search and check length
  const lstSegmentUser = []

  for (let u = 0; u < segmentUser.length; u++) {
    segmentUser[u] = segmentUser[u].trim()

    if (segmentUser[u] && segmentUser[u].length !== 6 && !listUserNotExists.includes(segmentUser[u])) {
      listUserNotExists.push(segmentUser[u])
    } else if (segmentUser[u] && segmentUser[u].length === 6) {
      lstSegmentUser.push(segmentUser[u])
    }
  }
  // get list user by member id
  let listUser = []

  if (lstSegmentUser && lstSegmentUser.length > 0) {
    listUser = await usersBasicDataRepository.getListUserByMemberId(lstSegmentUser)
  }

  listUser.forEach((item) => {
    listUserExists.push(item.member_id)
  })

  // check member id
  lstSegmentUser.forEach((memberId) => {
    if (!listUserExists.includes(memberId) && !listUserNotExists.includes(memberId)) {
      listUserNotExists.push(memberId)
    }
  })

  return listUserNotExists
}
// validate rank of container
const validateRank = (valuesArray) => {
  const listRank = valuesArray.map((i, index) => index + 1)
  const valuesSet = new Set(valuesArray)

  if (!valuesArray.every((element) => listRank.includes(element)) || valuesSet.size !== valuesArray.length) {
    return false
  }
  return true
}

const validatePaymentTerm = (item, index, length, enablePaymentTerm) => {
  if (!item.enable || !enablePaymentTerm) {
    return true
  }
  const enableTerm = item.enable
  const amount = item.amount
  const amountTo = item.amount_to
  const date = item.date_type
  const currency = item.currency
  const amountType = item.amount_type
  const condition = item.condition
  const isValid = Object.values(enable).includes(enableTerm) &&
  (Object.values(baseCurrency).includes(currency) && currency !== baseCurrency.BTC) &&
  (index !== length - 1 && Object.values(conditionValue).includes(condition) ||
  (index === length - 1 && condition === null)) &&
  Object.values(dateType).includes(date) &&
  Object.values(depositAmountType).includes(amountType) &&
  utility.checkFalsyExceptZero(amount) && (utility.checkFalsyExceptZero(amountTo) || amountType !== depositAmountType.TO)

  return isValid
}

// validate required payment method
const setValuePaymentMethod = (item) => {
  const idSelectAll = 0
  const isMethodSelectAll = item.payment_method_id === idSelectAll
  const isCategorySelectAll = item.payment_category_id === idSelectAll
  const isDetailSelectAll = item.payment_detail_id === idSelectAll
  const isCompanyAccSelectAll = item.payment_company_account_id === idSelectAll

  if (isMethodSelectAll) {
    item.payment_category_id = null
    item.payment_detail_id = null
    item.payment_company_account_id = null
    item.payment_service_account_id = null

    return item
  }
  if (isCategorySelectAll) {
    item.payment_detail_id = null
    item.payment_company_account_id = null
    item.payment_service_account_id = null

    return item
  }
  if (isDetailSelectAll) {
    item.payment_company_account_id = null
    item.payment_service_account_id = null

    return item
  }
  if (isCompanyAccSelectAll) {
    item.payment_service_account_id = null

    return item
  }

  return item
}

module.exports = {
  addRangeUseSetting,
  isValidPaymentMethodRequired,
  getCountryCodeError,
  getSegmentUserNotExists,
  validateRank,
  validatePaymentTerm,
}

