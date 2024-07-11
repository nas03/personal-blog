const utility = require('utility')
const { dateFormat, modeAPI, uncheckALL, csvFileName, errorMessageCodeConstant } = require('constant')
const moment = require('moment')
const { errorLogRepository, usersBasicDataRepository } = require('repository')
const { json2csvAsync } = require('json-2-csv')
const { uploadCSV } = require('helper').upload

const getListUser = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}

    if ((queryString.tsFrom && !moment(queryString.tsFrom, dateFormat.DATE, true).isValid()) ||
      (queryString.tsTo && !moment(queryString.tsTo, dateFormat.DATE, true).isValid())) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // Get pagination
    const pagination = utility.getPagination(queryString)

    // Get staff display date time and handle timezone
    const staffId = utility.getUserIdByToken(event)
    const staffInfo = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': staffId })
    const { utc, display } = utility.getStrTimezoneAndDisplay(staffInfo.timezone, staffInfo.display_date_time)

    const arrInput = ['account_status', 'siteIds', 'customer_rank']
    arrInput.forEach((item) => {
      if (item === 'siteIds') {
        const querySites = queryString[item]
        // GET VALID SITES USING QUERY
        queryString[item] = utility.getValidSiteByAdmin(staffInfo.admin_with_site_id, querySites)
      } else if (queryString[item]) {
        queryString[item] = queryString[item].split(',').filter(Number)
      }
    })

    queryString.utc = utc || null
    queryString.display_date_time = display

    // Check pull down if uncheck all
    const arrUncheck = [
      Number(queryString.siteIds),
      Number(queryString.account_status),
      Number(queryString.customer_rank),
    ]

    // Handle mode export CSV
    if (queryString.mode === modeAPI.CSV_EXPORT) {
      let formattedUsers = []
      if (queryString.init !== 'true' && !arrUncheck.includes(uncheckALL)) {
        // Get data for export
        const listUser = await usersBasicDataRepository.getListUserAccount(pagination, queryString, true)

        // Format data
        formattedUsers = listUser.map((obj) => {
          return {
            ...obj,
            balance: '$0.00',
            credit: '-',
            commission: '$0.00',
            last_login_date: obj.last_login_date || '-',
            kyc_level: `${obj.kyc_level || 0}%`,
            p_rank: obj.partner_rank ? `Tier ${obj.partner_rank}` : '-',
            staff_name: obj.action_method ? null : obj.staff_name,
            [`status_label_name_${staffInfo.language_portal}`]: obj[`status_label_name_${staffInfo.language_portal}`] || '-',
          }
        })
      }

      // Handling csv parsing and uploading to S3
      const headers = [
        { field: 'id', title: 'ID' },
        { field: 'member_id', title: 'M-ID' },
        { field: 'site_name', title: 'Site' },
        { field: `account_status_name${staffInfo.language_portal ? `_${staffInfo.language_portal}` : ''}`, title: 'Status' },
        { field: `status_label_name${staffInfo.language_portal ? `_${staffInfo.language_portal}` : ''}`, title: 'Label' },
        { field: 'reg_category', title: 'CAT' },
        { field: 'merchant_flag', title: 'Merchant' },
        { field: 'en_notation', title: 'Area' },
        { field: 'customer_rank', title: 'C-Rank' },
        { field: 'test_flag', title: 'Test' },
        { field: 'attention_flag', title: 'AT-Flag' },
        { field: 'fullName', title: 'Name' },
        { field: 'email', title: 'Email' },
        { field: 'ts_regist_csv', title: 'Created' },
        { field: 'last_login_date_csv', title: 'Last login' },
        { field: 'kyc_level', title: 'e-level' },
        { field: 'balance', title: 'Balance' },
        { field: 'commission', title: 'Commission' },
        { field: 'ts_update_csv', title: 'Update' },
        { field: 'action_method_or_staff', title: 'Action method or Staff' },
      ]

      const csvData = await json2csvAsync(formattedUsers, {
        keys: headers,
        emptyFieldValue: '',
        excelBOM: true,
        expandArrayObjects: true,
      })

      const fileNameCSV = csvFileName.USER_ACCOUNTS

      const result = await uploadCSV(csvData, fileNameCSV)

      const response = {
        url_download: result.Location,
      }
      return utility.createResponse(true, response)
    }

    let response
    if (queryString.init === 'true' || arrUncheck.includes(uncheckALL)) {
      response = utility.paginatedItems([], pagination.currentPage, pagination.perPage)
    } else {
      // Get data from repository
      response = await usersBasicDataRepository.getListUserAccount(pagination, queryString)
    }
    return utility.createResponse(true, response)
  } catch (err) {
    console.log(err)
    return await errorLogRepository.createResponseAndLog(event, err, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getTimeCreateAndLoginUser = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}
    const result = await usersBasicDataRepository.getTimeCreateAndLoginUser(queryString.site_id)
    return utility.createResponse(true, result)
  } catch (err) {
    console.log(err)
    return await errorLogRepository.createResponseAndLog(event, err, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  getListUser,
  getTimeCreateAndLoginUser,
}
