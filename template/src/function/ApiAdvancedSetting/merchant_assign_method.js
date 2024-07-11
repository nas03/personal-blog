/* library */
const moment = require('moment')

/* constant */
const { flag, dateFormat, errorMessageCodeConstant } = require('constant')

/* DB */
const { merchantAssignMethodRepository, merchantSettingRepository, errorLogRepository, usersBasicDataRepository } = require('repository')

/* func */
const utility = require('utility')
const { regex } = require('helper')

const updateMerchantAssignMethod = async (event) => {
  try {
    const staffId = utility.getUserIdByToken(event)
    let { bankApiId, inChronologicalOrder, dependDepositAmount, applyLatestTransaction, tsApply } = JSON.parse(event.body) || {}
    if (!bankApiId || (!inChronologicalOrder && !dependDepositAmount) || (!applyLatestTransaction && !tsApply)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // get current settings
    const currentSetting = await merchantAssignMethodRepository.getMerchantAssignMethod(bankApiId)
    if (
      !currentSetting ||
      !Object.values(flag).includes(inChronologicalOrder) ||
      !Object.values(flag).includes(applyLatestTransaction) ||
      (!applyLatestTransaction && !regex.datetimeIsValid(tsApply)) ||
      (!inChronologicalOrder && !dependDepositAmount.match(/^(\(\d+\s?<=\s?\d+\)\s?\"\d{5}\"\s?\,\s?)*(\(\d+\s?<=\s?\d+\)\s?\"\d{5}\")+$/))
    ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // Get staff timezone
    const staffInfo = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': staffId })
    const utcHour = (staffInfo.timezone || '').replace(/[()UTC]/g, '') || '+00:00'

    if (!applyLatestTransaction && moment().utc().isAfter(moment(tsApply).subtract(utcHour, 'hours'))) {
      return await errorLogRepository.createResponseAndLog(event,
        null,
        null,
        [errorMessageCodeConstant.UPDATE_MERCHANT_ASSIGN_METHOD.TS_APPLY_IS_LESS_THAN_PRESENT],
      )
    }

    const displayTimeZone = staffInfo.display_time_zone

    // CONVERT tsApply TO UTC
    tsApply = moment(tsApply).subtract(utcHour, 'hours').format(dateFormat.DATE_TIME)

    let dependDepositAmountJson = null
    if (!inChronologicalOrder) {
      const data = dependDepositAmount.split(',')
        .map((item) => {
          const [min, max, merchantId] = item.match(/[0-9]+/g)

          return {
            min: parseInt(min),
            max: parseInt(max),
            merchantId,
          }
        })

      const listMerchantIdError = []
      for (let i = 0; i < data.length; i++) {
        if (data[i].min > data[i].max) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        const isExist = await merchantSettingRepository.checkMerchantIdExist(data[i].merchantId, currentSetting.api_advanced_setting_id)
        if (!isExist) {
          listMerchantIdError.push(data[i].merchantId)
        }

        for (let j = i + 1; j < data.length; j++) {
          if (
            data[i].min >= data[j].min && data[i].min <= data[j].max ||
            data[i].max >= data[j].min && data[i].max <= data[j].max
          ) {
            return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
          }
        }
      }

      if (listMerchantIdError.length) {
        return await errorLogRepository.createResponseAndLog(
          event,
          null,
          null,
          [errorMessageCodeConstant.UPDATE_MERCHANT_ASSIGN_METHOD.MERCHANT_ID_DOES_NOT_EXIST],
        )
      }

      dependDepositAmountJson = JSON.stringify({
        text: dependDepositAmount,
        data: data,
      })
    }

    // When there is a previous setting, update merchant assign method
    let payload = {
      staff_id: staffId,
    }
    // apply now
    if (applyLatestTransaction) {
      payload = {
        ...payload,
        in_chronological_order: inChronologicalOrder,
        in_chronological_order_new: null,
        depend_deposit_amount: inChronologicalOrder ?
          (currentSetting.apply_latest_transaction ? currentSetting.depend_deposit_amount : currentSetting.depend_deposit_amount_new) :
          dependDepositAmountJson,
        depend_deposit_amount_new: null,
        apply_latest_transaction: applyLatestTransaction,
        ts_apply: moment().utc().format(dateFormat.DATE_TIME),
      }
      // apply later
    } else {
      // When old settings are applied immediately
      if (currentSetting.apply_latest_transaction) {
        payload = {
          ...payload,
          in_chronological_order_new: inChronologicalOrder,
          depend_deposit_amount_new: inChronologicalOrder ? currentSetting.depend_deposit_amount : dependDepositAmountJson,
          apply_latest_transaction: applyLatestTransaction,
          ts_apply: tsApply,
          display_time_zone: displayTimeZone,
        }
        // When old settings are applied later
      } else {
        // Once the setting has been applied
        if (moment().utc().format(dateFormat.DATE_TIME) >= moment(currentSetting.tsApply).format(dateFormat.DATE_TIME)) {
          payload = {
            ...payload,
            in_chronological_order: currentSetting.in_chronological_order_new,
            in_chronological_order_new: inChronologicalOrder,
            depend_deposit_amount: currentSetting.depend_deposit_amount_new,
            depend_deposit_amount_new: inChronologicalOrder ? currentSetting.depend_deposit_amount_new : dependDepositAmountJson,
            apply_latest_transaction: applyLatestTransaction,
            ts_apply: tsApply,
            display_time_zone: displayTimeZone,
          }
          // When the setting has not been applied
        } else {
          payload = {
            ...payload,
            in_chronological_order_new: inChronologicalOrder,
            depend_deposit_amount_new: inChronologicalOrder ? currentSetting.depend_deposit_amount_new : dependDepositAmountJson,
            apply_latest_transaction: applyLatestTransaction,
            ts_apply: tsApply,
            display_time_zone: displayTimeZone,
          }
        }
      }
    }

    await merchantAssignMethodRepository.updateMerchantAssignMethod(currentSetting.id, payload)

    return utility.createResponse(true)
  } catch (err) {
    return await errorLogRepository.createResponseAndLog(event, err, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  updateMerchantAssignMethod,
}
