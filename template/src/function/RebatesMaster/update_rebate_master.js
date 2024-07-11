/* constant */
const { dateFormat, flag, errorMessageCodeConstant, errorKeyServer } = require('constant')

/* DB */
const { errorLogRepository } = require('repository')

const { rebatesMasterRepository } = require('repository')

const moment = require('moment')
const _ = require('lodash')

/* utility */
const utility = require('utility')


const { validateCashbackRebate } = require('./create_rebate_master')

const updateRebateMaster = async (event) => {
  try {
    const eventBody = JSON.parse(event.body) || {}
    let { ts_start, ts_end, enable_flag, rebate_detail, broker_code, account_type_code, platform, is_show_popup,
      broker_id, account_type_id, en_product_type, ib_rank_id } = eventBody
    const { rebate_id } = event.pathParameters
    const payloadRebate = {}

    if (!is_show_popup) {
      // validate field
      if ((ts_start && !moment(ts_start, dateFormat.DATE_TIME, true).isValid()) ||
    (ts_end && !moment(ts_end, dateFormat.DATE_TIME, true).isValid()) ||
    (enable_flag && ![flag.FALSE, flag.TRUE].includes(enable_flag))
      ) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
      }

      if (ts_start && ts_end) {
        if (!moment(ts_start, dateFormat.DATE_TIME).isBefore(moment(ts_end, dateFormat.DATE_TIME))) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UPDATE_REBATE_MASTER.TIMESTAMP_INVALID])
        }

        const checkRebateExist = await rebatesMasterRepository.checkRebateExistByRebateId(
          broker_id,
          ib_rank_id,
          account_type_id,
          en_product_type,
          ts_start,
          ts_end,
          rebate_id,
          platform,
        )

        if (checkRebateExist.length ) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UPDATE_REBATE_MASTER.TIMESTAMP_INVALID])
        }
      }

      // list key to update m_rebates DB
      const arrKeyRebate = ['ts_start', 'ts_end', 'description', 'enable_flag']

      Object.keys(eventBody).forEach((key) => {
        if (arrKeyRebate.includes(key)) {
          payloadRebate[key] = eventBody[key]
        }
      })

      // list map obj to update m_rebate_details
      if (_.isArray(rebate_detail) ) {
        let valid = rebate_detail.map( async (item)=>{
          return await validateCashbackRebate(event, platform, broker_code, account_type_code, item)
        })

        valid = await Promise.all(valid)

        for (const el of valid) {
          if (el === errorKeyServer.NOT_VALID.LOT_REBATE) {
            return await errorLogRepository.createResponseAndLog(event, null, null,
              [errorMessageCodeConstant.UPDATE_REBATE_MASTER.NOT_VALID.LOT_REBATE])
          }

          if (el === errorKeyServer.GET_FAIL.RATE_BY_BASE_AND_SYMBOL) {
            return await errorLogRepository.createResponseAndLog(event, null, null,
              [errorMessageCodeConstant.UPDATE_REBATE_MASTER.UPDATE_FAIL.REBATE_MASTER])
          }
        }

        rebate_detail = rebate_detail.map((obj)=>{
          return {
            id: obj.id,
            enable_flag: obj.enable_flag,
            lot_rebate: obj.lot_rebate,
            cb_rebate: obj.cb_rebate,
            lot_rebate_currency: obj.lot_rebate_currency,
            cb_rebate_currency: obj.cb_rebate_currency,
          }
        })
      }
    }

    const isUpdated = await rebatesMasterRepository.updateRebateMaster(rebate_id, payloadRebate, rebate_detail, is_show_popup)

    if (isUpdated.isError) {
      return await errorLogRepository.createResponseAndLog(event, isUpdated.error, null,
        [errorMessageCodeConstant.UPDATE_REBATE_MASTER .UPDATE_FAIL.REBATE_MASTER])
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  updateRebateMaster,
}
