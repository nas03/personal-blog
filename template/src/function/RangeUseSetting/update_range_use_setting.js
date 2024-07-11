const rangeUseSettingRepository = require('repository').rangeUseSettingRepository
const {
  errorMessageCodeConstant,
  contentUpdate, ruleTemplate,
} = require('constant')
const utility = require('utility')
const rangeUseSettingHistory = require('../History/range_use_setting_history')
const rangeUseSettingHistoryRepository = require('repository').rangeUseSettingHistoryRepository
const addRangeUseSetting = require('./add_range_use')
const { errorLogRepository } = require('repository')

const updateRuleSetting = async (event) => {
  try {
    const id = event.pathParameters.range_use_id
    // validate rangeUseSetting
    const rangeSettingDB = await rangeUseSettingRepository.getRangeUseSetting(id)
    if (!rangeSettingDB) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    const eventBody = JSON.parse(event.body) || {}
    const authorizedPerson = utility.getUserIdByToken(event)
    const rangeSettingUpdate = {
      rule_name: eventBody.rule_name.trim(),
      rule_description: eventBody.rule_description.trim(),
      priority: eventBody.priority,
      staff_id: authorizedPerson,
    }
    const ruleTemplateId = eventBody.rule_template_id

    // validate input
    let isValid = rangeSettingUpdate.rule_name && rangeSettingUpdate.rule_description && rangeSettingUpdate.priority
    if (!isValid) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // validate priority
    const countRangeOfRule = await rangeUseSettingRepository.countRangeUseSetting(rangeSettingDB.site_id)
    if (rangeSettingUpdate.priority > countRangeOfRule[0].count || rangeSettingUpdate.priority < 1) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UPDATE_RULE_SETTING.RECORD_HAS_DELETED])
    }

    if (rangeSettingUpdate.rule_name.length > 30 || rangeSettingUpdate.rule_description.length > 100) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }
    const ruleContainers = eventBody.rules

    // insert rule Container
    const lstContainerRule = []
    let lstSegmentCountry = ''
    let lstSegmentUser = ''
    const listRuleContainer = []
    const listRuleContainerExist = []
    for (let c = 0; c < ruleContainers.length; c++) {
      const ruleContainer = ruleContainers[c]
      const itemContainerRule = {
        objContainerRule: {},
        lstPaymentMethod: [],
      }
      const itemRule = {
        range_use_setting_id: null,
        enable_rule_container: ruleContainer.enable_rule_container,
        rule_container_name: ruleContainer.rule_container_name.trim(),
        rank: c + 1,
        enable_segment_country: null,
        segment_country: null,
        display_segment_country: null,
        display_segment_user: ruleContainer.display_segment_user,
        enable_segment_user: ruleContainer.enable_segment_user,
        segment_user: ruleContainer.segment_user,
        enable_attention_flag: null,
        message_unavailable_id: null,
        rank_segment_country: null,
        rank_segment_user: ruleContainer.rank_segment_user,
        rank_attention_flag: null,
      }
      // list container name input/ container name duplicate
      if (!listRuleContainer.includes(itemRule.rule_container_name)) {
        listRuleContainer.push(itemRule.rule_container_name)
      } else {
        listRuleContainerExist.push(itemRule.rule_container_name)
      }
      // validate field not blank
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

      switch (ruleTemplateId) {
        case ruleTemplate.SETTING_AVAILABILITY:
          itemRule.display_segment_country = ruleContainer.display_segment_country
          itemRule.segment_country = ruleContainer.segment_country
          itemRule.enable_segment_country = ruleContainer.enable_segment_country
          itemRule.enable_attention_flag = ruleContainer.enable_attention_flag
          itemRule.message_unavailable_id = ruleContainer.message_unavailable_id
          itemRule.rank_segment_country = ruleContainer.rank_segment_country
          itemRule.rank_attention_flag = ruleContainer.rank_attention_flag

          // validate required segment_country
          if (itemRule.segment_country && itemRule.enable_rule_container && itemRule.enable_segment_country) {
            lstSegmentCountry += itemRule.segment_country + ','
          }

          // validate required
          isValid = itemRule.message_unavailable_id && itemRule.rank_attention_flag && itemRule.rank_segment_country
          if (!isValid) {
            return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
          }
          valuesArray = [itemRule.rank_segment_user, itemRule.rank_segment_country, itemRule.rank_attention_flag]
          isValid = utility.flagValidate(itemRule.enable_segment_country) && addRangeUseSetting.validateRank(valuesArray) &&
           utility.flagValidate(itemRule.enable_attention_flag)

          if (!isValid) {
            return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
          }
          break
        case ruleTemplate.SETTING_PAYMENT_COMPANY:
          itemRule.enable_payment_terms = ruleContainer.enable_payment_terms
          itemRule.rank_payment_terms = ruleContainer.rank_payment_terms
          itemRule.payment_terms = null
          const listPaymentTerms = ruleContainer.payment_terms

          if (listPaymentTerms && listPaymentTerms.length > 0) {
            if (itemRule.enable_rule_container) {
              for (let j = 0; j < listPaymentTerms.length; j++) {
                const isValid = addRangeUseSetting.validatePaymentTerm(listPaymentTerms[j], j, listPaymentTerms.length, itemRule.enable_payment_terms)

                if (!isValid) {
                  return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
                }
              }
            }
            itemRule.payment_terms = JSON.stringify(ruleContainer.payment_terms)
          }
          isValid = itemRule.rank_payment_terms
          if (!isValid) {
            return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
          }

          valuesArray = [itemRule.rank_segment_user, itemRule.rank_payment_terms]
          isValid = utility.flagValidate(itemRule.enable_payment_terms) && addRangeUseSetting.validateRank(valuesArray)

          if (!isValid) {
            return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
          }
          break
        default:
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
      }

      // get segment user
      if (itemRule.segment_user && itemRule.enable_rule_container && itemRule.enable_segment_user) {
        lstSegmentUser += itemRule.segment_user + ','
      }
      itemContainerRule.objContainerRule = itemRule

      // validate paymentSetting
      const paymentUpdate = []
      const lstPayment = ruleContainer.payments
      for (let p = 0; p < lstPayment.length; p++) {
        const paymentSettingNew = {
          rule_container_id: null,
          payment_type: lstPayment[p].payment_type,
          enable_payment: lstPayment[p].enable_payment,
          payment_method_id: lstPayment[p].payment_method_setting_id,
          payment_category_id: lstPayment[p].payment_category_id,
          payment_detail_id: lstPayment[p].payment_detail_id,
          payment_company_account_id: lstPayment[p].payment_company_account_id,
          payment_service_account_id: lstPayment[p].payment_service_account_id,
          display_order: p + 1,
        }

        // validate payment method
        if (itemRule.enable_rule_container) {
          isValid = addRangeUseSetting.isValidPaymentMethodRequired(paymentSettingNew)
        }

        if (!isValid) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
        }
        paymentUpdate.push(paymentSettingNew)
      }
      itemContainerRule.lstPaymentMethod = paymentUpdate
      lstContainerRule.push(itemContainerRule)
    }

    // validate container name exits
    const containerExits = await rangeUseSettingRepository.checkContainerName(id, listRuleContainer, rangeSettingDB.site_id)

    containerExits.forEach((container) => {
      if (!listRuleContainerExist.includes(container.rule_container_name)) {
        listRuleContainerExist.push(container.rule_container_name)
      }
    })

    if (listRuleContainerExist.length > 0) {
      return await errorLogRepository.createResponseAndLog(event, null,
        listRuleContainerExist, [errorMessageCodeConstant.UPDATE_RULE_SETTING.EXIST_CONTAINER_NAME])
    }

    // validate segment country
    const listCountryNotExists = await addRangeUseSetting.getCountryCodeError(lstSegmentCountry)
    // validate segment user
    const listUserNotExists = await addRangeUseSetting.getSegmentUserNotExists(lstSegmentUser)

    if (listCountryNotExists.length > 0 && listUserNotExists.length > 0) {
      return await errorLogRepository.createResponseAndLog(
        event,
        null,
        { listCountryNotExists, listUserNotExists },
        [
          errorMessageCodeConstant.UPDATE_RULE_SETTING.SEGMENT_COUNTRY_CODE_NOT_EXIST,
          errorMessageCodeConstant.UPDATE_RULE_SETTING.SEGMENT_USER_NOT_EXIST,
        ])
    }
    if (listCountryNotExists.length > 0) {
      return await errorLogRepository.createResponseAndLog(
        event,
        null,
        { listCountryNotExists, listUserNotExists },
        [errorMessageCodeConstant.UPDATE_RULE_SETTING.SEGMENT_COUNTRY_CODE_NOT_EXIST])
    }
    if (listUserNotExists.length > 0) {
      return await errorLogRepository.createResponseAndLog(
        event,
        null,
        { listCountryNotExists, listUserNotExists },
        [errorMessageCodeConstant.UPDATE_RULE_SETTING.SEGMENT_USER_NOT_EXIST])
    }
    // update to DB
    const response = await rangeUseSettingRepository.updateRangeUseSettingById(id,
      rangeSettingUpdate, rangeSettingDB, lstContainerRule)

    // save to history range use setting
    const listDiff = []
    for (const att in rangeSettingUpdate) {
      if (rangeSettingUpdate[att] !== rangeSettingDB[att] && att !== 'staff_id') {
        listDiff.push(att)
      }
    }
    let historyId = 0
    const listSave = listDiff.map((el) =>
      rangeUseSettingHistory.initObjHistory(
        rangeSettingUpdate.staff_id,
        id,
        contentUpdate[el.toUpperCase()],
        rangeSettingDB[el],
        rangeSettingUpdate[el],
        historyId++,
      ))
    const payload = []
    // save history priority
    if (response.priorityUpdate.length > 0) {
      response.priorityUpdate.map((el) => payload.push(
        rangeUseSettingHistory.initObjHistory(
          rangeSettingUpdate.staff_id,
          el.id,
          contentUpdate.UPDATE_PRIORITY,
          el.priority,
          el.priorityUpdate,
          historyId++,
        )))
    }
    if (listSave.length > 0 || payload.length > 0) {
      await rangeUseSettingHistoryRepository.createHistory([...listSave, ...payload])
    }
    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const checkContainerName = async (event) => {
  try {
    const itemRule = JSON.parse(event.body) || {}

    // validate input
    if (!itemRule.site_id || !itemRule.rule_container_name) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // check exist container name
    const isContainerName = await rangeUseSettingRepository.checkContainerNameExist(!itemRule.id ? 0 : itemRule.id
      , [itemRule.rule_container_name], itemRule.site_id)
    if (isContainerName.length > 0) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.CHECK_CONTAINER_NAME.CONTAINER_NAME_EXIST], {
          container_name: itemRule.rule_container_name,
        },
      )
    }
    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const updateRuleContrainerName = async (event) => {
  try {
    const eventBody = JSON.parse(event.body)
    const id = eventBody.id
    const ruleContainerName = eventBody.rule_container_name
    const rangeUseSettingId = eventBody.range_use_setting_id
    const rangeSettingDB = await rangeUseSettingRepository.getRangeUseSetting(rangeUseSettingId)


    if (!rangeSettingDB) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    const containerExits = await rangeUseSettingRepository.checkContainerNameExist(id, [ruleContainerName], rangeSettingDB.site_id)


    if (containerExits.length > 0) {
      return await errorLogRepository.createResponseAndLog(event, null, ruleContainerName,
        [errorMessageCodeConstant.UPDATE_RULE_CONTAINER_NAME.CONTAINER_NAME_EXIST], { container_name: ruleContainerName })
    }

    // update to DB
    const result = await rangeUseSettingRepository.updateRuleContainerById(id, ruleContainerName)


    if (!result) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_RULE_CONTAINER_NAME.UPDATE_RULE_CONTAINER_FAIL])
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  updateRuleSetting,
  checkContainerName,
  updateRuleContrainerName,
}
