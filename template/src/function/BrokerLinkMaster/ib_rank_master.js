const { flag, sequenceAction, arrayIBRank, uncheckALL, errorMessageCodeConstant } = require('constant')
const utility = require('utility')
const { ibRankRepository, errorLogRepository, brokerRepository } = require('repository')

const getListIBRank = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}
    // param of checkbox
    if (queryString.broker) {
      queryString.broker = queryString.broker.split(',')
    }
    const pagination = utility.getPagination(queryString)

    // CHECK CASE SELECT BOX UNCHECK AL
    if (Number(queryString.broker) === uncheckALL) {
      const res = utility.paginatedItems([], pagination.currentPage, pagination.perPage)
      return utility.createResponse(true, res)
    }

    const maxMinSequence = await ibRankRepository.checkMaxMinSequenceEachBroker()
    const data = await ibRankRepository.getListIBRank(queryString, pagination)

    const dataFormat = data.data.map((item) => {
      for (const obj of maxMinSequence) {
        if (item.broker_id === obj.broker_id) {
          return {
            ...item,
            is_min_sequence: item.ib_rank_sequence === obj.minIBRankSequence ? flag.TRUE : flag.FALSE,
            is_max_sequence: item.ib_rank_sequence === obj.maxIBRankSequence ? flag.TRUE : flag.FALSE,
          }
        }
      }
    })


    return utility.createResponse(true, { data: dataFormat, pagination: data.pagination })
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const updateIBRankIndex = async (event) => {
  try {
    const { field_name, field_data } = JSON.parse(event.body)

    const { id } = event.pathParameters

    const ibRank = await ibRankRepository.getIBRankById(id)

    // check ib rank is exist
    if (!ibRank) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    switch (field_name) {
      case 'enable_flag':
        if (!Object.values(flag).includes(field_data) || field_data === ibRank.enable_flag) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        const isUpdate = await ibRankRepository.updateIBRank(id, { enable_flag: field_data })
        if (!isUpdate) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.UPDATE_IB_RANK_INDEX.UPDATE_FAIL.ENABLE_FLAG])
        }
        return utility.createResponse(true)
      case 'ib_rank_sequence':

        const maxMinSequence = await ibRankRepository.checkSequenceById()

        // validate input
        if (!Object.values(sequenceAction).includes(field_data) ||
          sequenceAction.UP === field_data && maxMinSequence.minSequence === ibRank.ib_rank_sequence ||
          sequenceAction.DOWN === field_data && maxMinSequence.maxSequence === ibRank.ib_rank_sequence
        ) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        const result = await ibRankRepository.updateSequence(field_data, ibRank)
        if (result.isError) {
          return await errorLogRepository.createResponseAndLog(event, result.error, null,
            [errorMessageCodeConstant.UPDATE_IB_RANK_INDEX.UPDATE_FAIL.SEQUENCE])
        }
        return utility.createResponse(true)
      default:
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const createIBRank = async (event) => {
  try {
    const { broker_id, ib_rank_name, ib_rank, target_flag, target_period } = JSON.parse(event.body) || {}

    if (!broker_id || !ib_rank_name || !ib_rank || (target_flag === flag.TRUE && !target_period)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    const hasBroker = await brokerRepository.getBrokerById(broker_id)
    if (!hasBroker) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.CREATE_IB_RANK.BROKER.NOT_EXIST])
    }
    if (hasBroker.enable_flag === flag.FALSE) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.CREATE_IB_RANK.BROKER.DISABLED])
    }

    if (!Object.values(arrayIBRank).includes(ib_rank) || !Object.values(flag).includes(target_flag)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // check ib rank is exist
    const checkExist = await ibRankRepository.checkIBRankFieldExist(broker_id, ib_rank_name, ib_rank)
    if (checkExist.length > 0 ) {
      const listErrorCode = checkExist.map((error) => errorMessageCodeConstant.CREATE_IB_RANK.IS_EXIST[error])
      return await errorLogRepository.createResponseAndLog(event, null, null, listErrorCode)
    }

    // check ib rank sequence
    let ib_rank_sequence
    const ibRankSequence = await ibRankRepository.maxIBRankSequence(broker_id)
    if (ibRankSequence) {
      ib_rank_sequence = ibRankSequence.maxSequence + 1
    } else {
      ib_rank_sequence = 1
    }

    // create ib rank
    const payload = {
      broker_id,
      ib_rank_name,
      ib_rank,
      ib_rank_sequence,
      target_period_flag: target_flag,
      target_period_num: target_period ? target_period : null,
    }
    await ibRankRepository.createIBRank(payload)

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const updateIbRank = async (event) => {
  try {
    const { broker_id, ib_rank_name, ib_rank, target_flag, target_period } = JSON.parse(event.body) || {}
    const { id } = event.pathParameters

    if (!broker_id || !ib_rank_name || !ib_rank || (target_flag === flag.TRUE && !target_period)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    if (!Object.values(arrayIBRank).includes(ib_rank) || !Object.values(flag).includes(target_flag)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    const hasBroker = await brokerRepository.getBrokerById(broker_id)
    if (!hasBroker) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UPDATE_IB_RANK.NOT_EXIST.BROKER])
    }

    // check ib rank is exist
    const checkExist = await ibRankRepository.checkIBRankExistForUpdate(id, broker_id, ib_rank_name, ib_rank)
    if (checkExist.length > 0) {
      const error = checkExist.map((error) => errorMessageCodeConstant.UPDATE_IB_RANK.IS_EXIST[error])
      return await errorLogRepository.createResponseAndLog(event, null, null, error)
    }

    // get current IB Rank
    const ibRank = await ibRankRepository.getIBRankById(id)
    if (!ibRank) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UPDATE_IB_RANK.NOT_EXIST.IB_RANK])
    }

    let ib_rank_sequence
    if (broker_id !== ibRank.broker_id) {
      // update current ib rank
      const maxSequenceOfNewBroker = await ibRankRepository.maxIBRankSequence(broker_id)
      if (maxSequenceOfNewBroker) {
        ib_rank_sequence = maxSequenceOfNewBroker.maxSequence + 1
      } else {
        ib_rank_sequence = 1
      }
    } else {
      ib_rank_sequence = null
    }

    const result = await ibRankRepository.updateIBRankAndSequence(
      id,
      broker_id,
      ib_rank,
      ib_rank_name,
      ib_rank_sequence,
      ibRank,
      target_flag,
      target_flag ? target_period : null,
    )

    if (!result) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UPDATE_IB_RANK.UPDATE_IB_RANK_FAIL])
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getIBRankExist = async (event) => {
  try {
    const queryString = event.queryStringParameters

    const ibRankExist = await ibRankRepository.getListIBRankExist(queryString.broker, queryString.ibRankId)

    const ibRank = ibRankExist.map((i) => {
      return i.ib_rank
    })

    const ibRankAvailable = arrayIBRank.filter((item) => !ibRank.includes(item))

    return utility.createResponse(true, ibRankAvailable)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  getListIBRank,
  updateIBRankIndex,
  createIBRank,
  updateIbRank,
  getIBRankExist,
}
