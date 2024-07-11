'use strict'

// library
const utility = require('utility')
const { errorLogRepository, rebateDetailsMasterRepository,
} = require('repository')
const { errorMessageCodeConstant } = require('constant')

const getRebateDetailById = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}

    let sortArr = [
      { column: 'ts_regist', order: 'DESC' },
      { column: 'id', order: 'DESC' },
    ]

    if (event.queryStringParameters && event.queryStringParameters.sort) {
      const sort = event.queryStringParameters.sort
      sortArr = [
        {
          column: sort.split(',')[0],
          order: sort.split(',').length > 1 ? sort.split(',')[1] : 'DESC',
        },
        {
          column: 'id',
          order: 'DESC',
        },
      ]
    }

    let rebate_id = event.pathParameters.rebate_id

    rebate_id = Number(rebate_id)

    queryString.id = rebate_id

    const result = await rebateDetailsMasterRepository.getRebateDetailById(queryString, sortArr)

    return utility.createResponse(true, result)
  } catch (error) {
    console.error(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  getRebateDetailById,
}
