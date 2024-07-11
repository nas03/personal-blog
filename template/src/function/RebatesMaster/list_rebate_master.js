'use strict'

// library
const utility = require('utility')
const { errorLogRepository, rebatesMasterRepository, usersBasicDataRepository,
} = require('repository')
const { errorMessageCodeConstant, uncheckALL } = require('constant')

const getListRebateMaster = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}
    const pagination = utility.getPagination(queryString)
    const arrInput = ['brokerId', 'platform', 'accountTypeId', 'productTypeId', 'ibRankId']
    let isUnCheckALL = false

    if (!queryString.sort) {
      pagination.sort = [
        {
          column: 'r.ts_regist',
          order: 'DESC',
        },
      ]
    }

    arrInput.forEach((item) => {
      // CHECK CASE SELECT BOX UNCHECK ALL
      if (Number(queryString[item]) === uncheckALL) isUnCheckALL = true

      if (queryString[item]) {
        queryString[item] = queryString[item].split(',')
      }
    })

    if (isUnCheckALL) {
      const res = utility.paginatedItems([], pagination.currentPage, pagination.perPage)
      return utility.createResponse(true, res)
    }

    // Get staff display date time and handle timezone
    const staffId = await utility.getUserIdByToken(event)
    const staffInfo = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': staffId })
    queryString.utc = staffInfo.timezone || null
    queryString.display_date_time = staffInfo.display_date_time

    // Get list from m_rebates
    const result = await rebatesMasterRepository.getListRebatesMaster(queryString, pagination)

    if (result.data.data && result.data.data.length > 0 ) {
      for (let i = 0; i < result.data.data.length; i++) {
        for (let j = 0; j < result.ibRank.length; j ++) {
          if (result.data.data[i].broker_id === result.ibRank[j].broker_id) {
            result.data.data[i].total_ib_rank = result.ibRank[j].total_ib_rank
            break
          }
        }
      }
    }

    return utility.createResponse(true, result.data)
  } catch (error) {
    console.error(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}


module.exports = {
  getListRebateMaster,
}
