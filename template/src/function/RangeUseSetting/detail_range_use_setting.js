const rangeUseSettingRepository = require('repository').rangeUseSettingRepository
const { errorMessageCodeConstant } = require('constant')
const { errorLogRepository } = require('repository')
const utility = require('utility')

const getDetailRangeUseSetting = async (event) => {
  // Validate DB
  try {
    const rangeUseSetting = await rangeUseSettingRepository.detailRangeUseSetting(event.pathParameters.id)
    if (rangeUseSetting.length === 0) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // convert list to object
    // get object rule at index = 0
    const jsonResult = { ...rangeUseSetting.reduce((accumulator, current) => {
      if (!accumulator.some((x) => x.id === current.id)) {
        accumulator.push({ id: current.id,
          site_id: current.site_id,
          site_name: current.site_name,
          media_name: current.media_name,
          symbol_logo_path: current.symbol_logo_path,
          symbol_logo_name: current.symbol_logo_name,
          side_logo_path: current.side_logo_path,
          side_logo_name: current.side_logo_name,
          rule_template_id: current.rule_template_id,
          rule_name: current.rule_name,
          rule_description: current.rule_description,
          priority: current.priority })
      }
      return accumulator
    }, [])[0], rules: [] }

    // get rule_container_list
    const rulesList = rangeUseSetting.reduce((accumulator, current) => {
      if (!accumulator.some((x) => x.rule_container_id === current.rule_container_id) && current.rule_container_id !== null) {
        accumulator.push({ rule_container_id: current.rule_container_id,
          enable_rule_container: current.enable_rule_container,
          rule_container_name: current.rule_container_name,
          rank: current.rank,
          display_segment_country: current.display_segment_country,
          segment_country: current.segment_country,
          enable_segment_country: current.enable_segment_country,
          display_segment_user: current.display_segment_user,
          enable_segment_user: current.enable_segment_user,
          segment_user: current.segment_user,
          enable_payment_terms: current.enable_payment_terms,
          payment_terms: current.payment_terms ? JSON.parse(current.payment_terms) : [],
          rank_payment_terms: current.rank_payment_terms,
          enable_attention_flag: current.enable_attention_flag,
          message_unavailable_id: current.message_unavailable_id,
          rank_attention_flag: current.rank_attention_flag,
          rank_segment_country: current.rank_segment_country,
          rank_segment_user: current.rank_segment_user })
      }
      return accumulator
    }, [])

    // get payment_list by rule_container_id
    const paymentList = rangeUseSetting.reduce((accumulator, current) => {
      if (!accumulator.some((x) => x.payment_id === current.payment_id)) {
        accumulator.push({
          payment_type: current.payment_type,
          rule_container_id: current.rule_container_id,
          payment_id: current.payment_id, enable_payment: current.enable_payment,
          payment_method_setting_id: current.payment_method_setting_id,
          payment_category_id: current.payment_category_id,
          payment_detail_id: current.payment_detail_id,
          payment_company_account_id: current.payment_company_account_id,
          payment_service_account_id: current.payment_service_account_id,
          display_order: current.display_order })
      }
      return accumulator
    }, [])

    // push payment_list to rule_container
    rulesList.map((item) => {
      jsonResult.rules.push({ ...item, payments: paymentList.filter((i) => i.rule_container_id === item.rule_container_id && i.payment_id !== null) })
    })

    return utility.createResponse(true, jsonResult)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  getDetailRangeUseSetting,
}

