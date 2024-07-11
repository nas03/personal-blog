/* func */
const utility = require('utility')
const { uploadCSV } = require('helper').upload
/* db */
const { ekycRepository, errorLogRepository, usersBasicDataRepository } = require('repository')

/* constant */
const { ekycAuthenticationType, dateFormat, errorMessageCodeConstant } = require('constant')

/* lib */
const moment = require('moment')
const { json2csvAsync } = require('json-2-csv')

const exportCSV = async (event) => {
  try {
    const params = JSON.parse(event.body) || {}
    const { method, document_type, flow, status, site_id, authentication_type, lang, access_from, access_to, ekyc_id, name, update_from, update_to,
      email, display_name, sort, action_method, keyword, display_unsubmitted_docs } = params

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

    // Get staff display date time
    const staffId = await utility.getUserIdByToken(event)
    const staffInfo = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': staffId })

    const filter = {
      method: method ? method : null,
      document_type: document_type ? document_type : null,
      flow: flow ? flow : null,
      status: status ? status : null,
      site_id: site_id ? utility.getValidSiteByAdmin(staffInfo.admin_with_site_id, site_id) :
        utility.getValidSiteByAdmin(staffInfo.admin_with_site_id, []),
      authentication_type: authentication_type ? authentication_type : null,
      access_from: access_from ? access_from : null,
      access_to: access_to ? access_to : null,
      update_from: update_from ? update_from : null,
      update_to: update_to ? update_to : null,
      ekyc_id: ekyc_id ? ekyc_id : null,
      keyword: keyword ? keyword : null,
      lang: lang ? lang : 'en',
      name: name ? name : null,
      email: email ? email : null,
      utc: staffInfo.timezone || null,
      action_method: action_method ? action_method : null,
      display_name: display_name ? display_name : 'personal',
      display_unsubmitted_docs: display_unsubmitted_docs ? display_unsubmitted_docs === true : false,
    }

    const pagination = utility.getPagination({ sort })

    const ekycTransaction = await ekycRepository.getEkycTransaction(filter, pagination, true, !sort)

    const _renderDateTime = (data_time) => {
      return data_time ? utility.getDateTimeFormatted(data_time, staffInfo.display_date_time, filter.utc) : '-'
    }

    // Format timezone and display datetime
    const formatEkycTransaction = ekycTransaction.map((item) => {
      return {
        ...item,
        auth_type: item?.auth_type === ekycAuthenticationType.Identification_Auth ? 'ID Auth' : item?.auth_type,
        document_type_face: item?.document_type_face === '3-way auth' ? '3-way Auth' : item?.document_type_face,
        label: item[`short_reason_${filter.lang.toLowerCase()}`],
        status_name: item[`status_name_${filter.lang.toLowerCase()}`],
        access_data: item.access_data === '-' ? '-' : _renderDateTime(item.access_data),
        access_data_face: item.access_data_face === '-' ? '-' : _renderDateTime(item.access_data_face),
        response_date: item.response_date === '-' ? '-' : _renderDateTime(item.response_date),
      }
    })

    // Handling csv parsing and uploading to S3
    const headers = [
      { field: 'site_name', title: 'Site' },
      { field: 'check_method', title: 'Check method' },
      { field: 'flow', title: 'Check flow' },
      { field: 'status_name', title: 'Doc. status' },
      { field: 'label', title: 'Label' },
      { field: 'access_data', title: 'Access data' },
      { field: 'ekyc_id', title: 'KYC ID' },
      { field: 'auth_type', title: 'Auth. type' },
      { field: 'document_type', title: 'Document type' },
      { field: 'access_data_face', title: 'Access data' },
      { field: 'ekyc_id_face', title: 'KYC ID' },
      { field: 'auth_type_face', title: 'Auth. type' },
      { field: 'document_type_face', title: 'Document type' },
      { field: 'name', title: 'Name' },
      { field: 'email', title: 'Email' },
      { field: 'response_date', title: 'Update' },
      { field: 'action_method_or_staff', title: 'Action method or Staff' },
    ]

    const csvData = await json2csvAsync(formatEkycTransaction, { keys: headers, emptyFieldValue: '', expandArrayObjects: true })
    const result = await uploadCSV(csvData, 'KYC_transaction_')
    const response = {
      url_download: result.Location,
    }
    return utility.createResponse(true, response)
  } catch (error) {
    console.error(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}


module.exports = {
  exportCSV,
}
