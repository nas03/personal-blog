/* func */
const utility = require('utility')

/* db */
const { ekycRepository, errorLogRepository, usersBasicDataRepository, statusHistoryRepository } = require('repository')

/* constant */
const {
  dateFormat,
  uncheckALL,
  statusClassConstant,
  statusCode,
  actionMethod,
  timeExpires,
  errorMessageCodeConstant,
} = require('constant')

/* lib */
const moment = require('moment')

const getEkycTransaction = async (event) => {
  try {
    const { method, document_type, flow, status, site_id, authentication_type, access_from, access_to, update_from, update_to,
      keyword, action_method, ekyc_id, name, email, sort, size, page, display_name, display_unsubmitted_docs } = JSON.parse(event.body)

    // validate
    if ((access_from && !access_to) || (!access_from && access_to)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    if (access_from && !moment(access_from, dateFormat.DATE, true).isValid()) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    if (access_to && !moment(access_to, dateFormat.DATE, true).isValid()) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }
    if ((update_from && !update_to) || (!update_from && update_to)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    if (update_from && !moment(update_from, dateFormat.DATE, true).isValid()) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    if (update_to && !moment(update_to, dateFormat.DATE, true).isValid()) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // Get staff display date time
    const staffId = await utility.getUserIdByToken(event)
    const staffInfo = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': staffId })
    const pagination = utility.getPagination({ page, sort, size })

    // CHECK CASE SELECT BOX UNCHECK ALL
    if ([Number(method),
      Number(flow),
      Number(site_id),
      Number(status),
      Number(authentication_type),
      Number(document_type)].includes(uncheckALL)) {
      const res = utility.paginatedItems([], pagination.currentPage, pagination.perPage)
      return utility.createResponse(true, res)
    }


    const filter = {
      method: method ? method : null,
      document_type: document_type ? document_type : null,
      flow: flow ? flow : null,
      status: status ? status : null,
      // GET VALID SITES USING QUERY
      site_id: site_id?.length ?
        utility.getValidSiteByAdmin(staffInfo.admin_with_site_id, site_id) :
        site_id === null ?
          utility.getValidSiteByAdmin(staffInfo.admin_with_site_id, []) :
          [],
      authentication_type: authentication_type ? authentication_type : null,
      access_from: access_from ? access_from : null,
      access_to: access_to ? access_to : null,
      update_from: update_from ? update_from : null,
      update_to: update_to ? update_to : null,
      ekyc_id: ekyc_id ? ekyc_id : null,
      keyword: keyword ? keyword : null,
      name: name ? name : null,
      email: email ? email : null,
      utc: staffInfo.timezone || null,
      action_method: action_method ? action_method : null,
      display_name: display_name ? display_name : 'personal',
      display_unsubmitted_docs: display_unsubmitted_docs ?
        display_unsubmitted_docs === true :
        false,
    }
    console.log(filter.site_id)

    const ekycTransaction = await ekycRepository.getEkycTransaction(filter, pagination, false, !sort)

    let response = {}
    const result = ekycTransaction.data.map((item) => {
      if (item?.status_label_message) {
        response = {
          ...item,
          ja_reason: item.status_label_message,
          en_reason: item.status_label_message,
          cn_reason: item.status_label_message,
          kr_reason: item.status_label_message,
        }
        return response
      } else {
        response = {
          ...item,
          ja_reason: item?.ja_status_label_detail ? item.ja_status_label_detail
            .replace(/{{document_name}}/g, item?.ja_document_name)
            .replace(/{{photo_type}}/g, item?.photo_type) : null,
          en_reason: item?.en_status_label_detail ?
            item.en_status_label_detail
              .replace(/{{document_name}}/g, item?.en_document_name)
              .replace(/{{photo_type}}/g, item?.photo_type) : null,
          cn_reason: item?.cn_status_label_detail ?
            item.cn_status_label_detail
              .replace(/{{document_name}}/g, item?.cn_document_name)
              .replace(/{{photo_type}}/g, item?.photo_type) : null,
          kr_reason: item?.kr_status_label_detail ?
            item.kr_status_label_detail
              .replace(/{{document_name}}/g, item?.kr_document_name)
              .replace(/{{photo_type}}/g, item?.photo_type) : null,
        }
        return response
      }
    })

    return utility.createResponse(true, {
      data: result,
      pagination: ekycTransaction.pagination,
    })
  } catch (error) {
    console.error(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getTimeCreateEkyc = async (event) => {
  try {
    const result = await ekycRepository.getTimeCreateEkyc()
    return utility.createResponse(true, {
      ts_regist: result.ts_regist || moment().utc().format(dateFormat.DATE_TIME),
    })
  } catch (err) {
    console.log(err)
    return await errorLogRepository.createResponseAndLog(event, err, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const verifyKycDuplicateError = async (event) => {
  try {
    const staffId = utility.getUserIdByToken(event)
    const { ekyc_id, ekyc_id_face } = event.queryStringParameters || {}
    const kycIds = [ekyc_id, ekyc_id_face]
    const ekycId = parseInt(ekyc_id)
    const userInfo = await ekycRepository.getUserInfoByEkycId(ekycId)
    event.user_id = userInfo?.user_id || null
    // CHECK DUPLICATE ERROR
    const isDuplicateError = await checkDuplicateError(staffId, kycIds)
    if (!isDuplicateError) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.VERIFY_KYC_DUPLICATE_ERROR.KYC_PROCESS_DUPLICATE_ERROR])
    }

    return utility.createResponse(true)
  } catch (err) {
    console.log(err)
    return await errorLogRepository.createResponseAndLog(event, err, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const checkDuplicateError = async (staffId, kycTransactionIds) => {
  try {
    const kycIds = kycTransactionIds.filter((el) => el).map(Number)
    const kycId = kycIds[0]
    const latestKycStatusHistory = await statusHistoryRepository.commonQueryGetStatusHistory(statusClassConstant.DOCUMENT_STATUS, kycId)
    const { id, status_code, updated_by_user_id, ts_update } = latestKycStatusHistory
    const now = moment().utc()

    // ONLY CHECK WHEN STATUS IS PROCESSING
    if (status_code !== statusCode.PROCESSING) {
      return true
    }

    // SAME ADMIN => UPDATE RENEW TS_UPDATE OF GENERAL_STATUS_HISTORY
    if (updated_by_user_id === staffId) {
      console.log(`---${kycId}: RENEW TS_UPDATE---`)
      await statusHistoryRepository.updateStatusHistory(id, {
        updated_by_user_id: staffId,
        ts_update: now.format(dateFormat.DATE_TIME),
      })
      return true
    }

    // DIFFERENT ADMIN
    const momentNow = moment(moment().utc().format(dateFormat.DATE_TIME))
    const momentTsUpdate = moment(moment(ts_update).format(dateFormat.DATE_TIME))
    const isExpirySession = momentNow.diff(momentTsUpdate, 'minutes') > timeExpires.KYC_PROCESS_SESSION

    if (!isExpirySession) {
      console.log(`---${kycId}: OTHER ADMIN IS PROCESSING---`)
      return false
    }

    const payloadKycStatusHistory = kycIds.map((ekycId) =>{
      return {
        target_id: ekycId,
        status_code: statusCode.PROCESSING,
        status_label_number: 0,
        status_class_id: statusClassConstant.DOCUMENT_STATUS,
        action_method: actionMethod.OPERATOR_ACTION,
        updated_by_user_id: staffId,
      }
    })

    const insertRollback = await statusHistoryRepository.insertRollbackStatusHistory(payloadKycStatusHistory)
    if (!insertRollback) {
      console.log(`---${kycId}: INSERT DUPLICATE OR FAIL---`)
      return false
    }
    console.log(`---${kycId}: INSERT NEW ADMIN'S SESSION---`)

    return true
  } catch (error) {
    console.log(error)
    return false
  }
}

module.exports = {
  getEkycTransaction,
  getTimeCreateEkyc,
  verifyKycDuplicateError,
  checkDuplicateError,
}
