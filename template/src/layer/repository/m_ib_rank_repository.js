const { isEmpty } = require('lodash')

const { flag, sequenceAction, errorKeyServer } = require('constant')

/* eslint-disable require-jsdoc */
const db = require('db').helper

const checkIbRankExist = async (broker_id, id)=>{
  return await db('m_ib_rank')
    .select(
      'id',
      'enable_flag',
    )
    .where({
      broker_id,
      id,
      delete_flag: flag.FALSE,
    })
    .first()
}

const getlistIbRankByborkerId = async (broker_id, isShowOnlyEnable)=>{
  const query = db('m_ib_rank as mi')
    .select(
      'mi.id',
      'mi.ib_rank_name',
      'mi.ib_rank',
      'mi.broker_id',
      'mi.ib_rank_sequence',
      'm_broker.broker_sequence',
      'm_broker.broker_code',
      'mi.enable_flag',
    )
    .leftJoin('m_broker', 'mi.broker_id', 'm_broker.id')
    .where('mi.delete_flag', flag.FALSE )
    .whereIn('broker_id', broker_id)

  if (isShowOnlyEnable === 'true') {
    query.where('mi.enable_flag', flag.TRUE)
  }

  return await query.orderBy([
    { column: 'broker_sequence', order: 'asc' },
    { column: 'enable_flag', order: 'desc' },
    { column: 'ib_rank_sequence', order: 'asc' },
  ])
}

const getListIBRank = async (queryString, pagination) => {
  const query = db('m_ib_rank as ir')
    .select(
      'ir.id',
      'ir.enable_flag',
      'ir.broker_id',
      'b.broker_name',
      'ir.ib_rank_name',
      'ir.ib_rank',
      'ir.ib_rank_sequence',
      'ir.target_period_flag',
      'ir.target_period_num',
      'ir.ts_update',
      'ir.ts_regist',
    )
    .leftJoin('m_broker as b', 'b.id', 'ir.broker_id')
    .where({
      'ir.delete_flag': flag.FALSE,
    })
  // condition broker
  if (!isEmpty(queryString.broker)) {
    query.whereIn('ir.broker_id', queryString.broker)
  }

  // condition show valid only
  if (queryString.isShowOnlyEnable === 'true') {
    query.where('ir.enable_flag', flag.TRUE)
  }

  // handle sort condition
  let orderArr = []
  if (!queryString.sort) {
    orderArr = [{ column: 'broker_id', order: 'ASC' }, { column: 'ib_rank_sequence', order: 'ASC' }]
  } else {
    orderArr = [...pagination.sort, { column: 'broker_id', order: 'ASC' }, { column: 'ib_rank_sequence', order: 'ASC' }]
  }
  const data = await query.orderBy(orderArr).paginate(pagination)
  return data
}

const getIBRankById = async (id) => {
  return await db('m_ib_rank as ir')
    .select(
      'ir.id',
      'ir.broker_id',
      'ir.enable_flag',
      'ir.ib_rank_name',
      'ir.ib_rank_sequence',
      'ir.ib_rank',
    )
    .where({
      'ir.id': id,
      'ir.delete_flag': flag.FALSE,
    })
    .first()
}

const updateIBRank = async (id, payload) => {
  return await db('m_ib_rank')
    .update(payload)
    .where({
      id: id,
      delete_flag: flag.FALSE,
    })
}

const checkSequenceById = async () => {
  const query = await db('m_ib_rank')
    .max('ib_rank_sequence', { as: 'maxSequence' })
    .min('ib_rank_sequence', { as: 'minSequence' })
    .where({
      delete_flag: flag.FALSE,
    })
    .first()
  return query
}

const updateSequence = async (type, ibRankObj) => {
  try {
    await db.transaction(async (trx) => {
      // update target ib rank
      const recordCurrent = await trx('m_ib_rank')
        .where({
          id: ibRankObj.id,
          delete_flag: flag.FALSE,
        })
        .increment('ib_rank_sequence', type === sequenceAction.UP ? -1 : 1)

      if (!recordCurrent) {
        throw Object.assign(new Error('Update IB Rank Record Current error'), { isCustomError: true })
      }

      // get new data
      const newIbRank = await trx('m_ib_rank')
        .select('ib_rank_sequence')
        .where('id', ibRankObj.id)
        .first()

      // get record use to swap
      const ibRankInverted = await trx('m_ib_rank')
        .whereNot('id', ibRankObj.id)
        .where({
          broker_id: ibRankObj.broker_id,
          ib_rank_sequence: newIbRank.ib_rank_sequence,
          delete_flag: flag.FALSE,
        })
        .increment('ib_rank_sequence', type === sequenceAction.UP ? 1 : -1)

      if (!ibRankInverted) {
        throw Object.assign(new Error('Update IB Rank sequence error'), { isCustomError: true })
      }

      return true
    })
    return { isError: false }
  } catch (error) {
    console.log(error)
    if (error.isCustomError) {
      return { isError: true, error }
    }
    throw error
  }
}

const checkIBRankFieldExist = async (brokerId, ibRankName, ibRank) => {
  const query1 = await db('m_ib_rank as ir')
    .select(
      'ir.id',
      'ir.broker_id',
      'ir.ib_rank_name',
      'ir.ib_rank',
      'ir.ib_rank_sequence',
    )
    .where({
      'ir.broker_id': brokerId,
      'ir.ib_rank_name': ibRankName,
    })
    .first()

  const query2 = await db('m_ib_rank as ir')
    .select(
      'ir.id',
      'ir.broker_id',
      'ir.ib_rank_name',
      'ir.ib_rank',
      'ir.ib_rank_sequence',
    )
    .where({
      'ir.broker_id': brokerId,
      'ir.ib_rank': ibRank,
    })
    .first()

  const validateResult = []

  if (query1) {
    validateResult.push(errorKeyServer.EXIST.IB_RANK_NAME)
  }

  if (query2) {
    validateResult.push(errorKeyServer.EXIST.IB_RANK)
  }

  return validateResult
}

const maxIBRankSequence = async (brokerId) => {
  const query = await db('m_ib_rank')
    .max('ib_rank_sequence', { as: 'maxSequence' })
    .where({
      broker_id: brokerId,
    })
    .first()
  return query
}

const createIBRank = async (payload) => {
  return await db('m_ib_rank')
    .insert(payload)
}

const checkIBRankExistForUpdate = async (id, brokerId, ibRankName, ibRank) => {
  const query1 = await db('m_ib_rank as ir')
    .select(
      'ir.id',
      'ir.broker_id',
      'ir.ib_rank_name',
      'ir.ib_rank',
      'ir.ib_rank_sequence',
    )
    .where({
      'ir.broker_id': brokerId,
      'ir.ib_rank_name': ibRankName,
    })
    .whereNot('id', id)
    .first()

  const query2 = await db('m_ib_rank as ir')
    .select(
      'ir.id',
      'ir.broker_id',
      'ir.ib_rank_name',
      'ir.ib_rank',
      'ir.ib_rank_sequence',
    )
    .where({
      'ir.broker_id': brokerId,
      'ir.ib_rank': ibRank,
    })
    .whereNot('id', id)
    .first()

  const validateResult = []

  if (query1) {
    validateResult.push(errorKeyServer.EXIST.IB_RANK_NAME)
  }

  if (query2) {
    validateResult.push(errorKeyServer.EXIST.IB_RANK)
  }

  return validateResult
}

const updateIBRankAndSequence = async (id, brokerId, ibRank, ibRankName, ibRankSequence, objIBRank, target_flag, target_period) => {
  const result = await db.transaction(async (trx) => {
    const payload = {
      broker_id: brokerId,
      ib_rank_name: ibRankName,
      ib_rank: ibRank,
      target_period_flag: target_flag,
      target_period_num: target_period,
    }

    if (ibRankSequence) {
      payload.ib_rank_sequence = ibRankSequence
      await trx('m_ib_rank')
        .where('broker_id', objIBRank.broker_id)
        .andWhere('ib_rank_sequence', '>', objIBRank.ib_rank_sequence)
        .decrement('ib_rank_sequence', 1)
    }

    const update = await trx('m_ib_rank')
      .update(payload)
      .where('id', id)
    if (!update) {
      return false
    }
    return true
  })
  return result
}

const getAllForJobCashback = async (isShowOnlyEnable, isShowFullDeleted = false) => {
  const query = db('m_ib_rank')
    .select(
      'id',
      'broker_id',
      'ib_rank_name',
      'ib_rank_sequence',
      'ib_rank',
    )
    .orderBy([{ column: 'ib_rank', order: 'DESC' }])

  if (isShowFullDeleted === false) {
    query.where('delete_flag', flag.FALSE)
  }

  if (isShowOnlyEnable) {
    query.where('enable_flag', flag.TRUE)
  }
  return await query
}

const checkMaxMinSequenceEachBroker = async () => {
  const query = await db('m_ib_rank')
    .select('broker_id')
    .max('ib_rank_sequence', { as: 'maxIBRankSequence' })
    .min('ib_rank_sequence', { as: 'minIBRankSequence' })
    .where('delete_flag', flag.FALSE)
    .groupBy('broker_id')
  return query
}

const getListIBRankExist = async (brokerId, ibRankId) => {
  const query = db('m_ib_rank')
    .select('ib_rank')
    .where({
      'broker_id': brokerId,
      'delete_flag': flag.FALSE,
    })

  if (ibRankId) {
    query.whereNot('id', ibRankId)
  }

  return await query
}

const getIbRankforDropdownRebateHistory = async (broker_id, isShowOnlyEnable)=>{
  const query = db('m_ib_rank as mi')
    .select(
      'mi.id',
      'mi.ib_rank_name',
      'mi.ib_rank',
      'mi.broker_id',
      'mi.ib_rank_sequence',
      'm_broker.broker_sequence',
      'm_broker.broker_code',
      'mi.enable_flag',
    )
    .leftJoin('m_broker', 'mi.broker_id', 'm_broker.id')
    .where('mi.delete_flag', flag.FALSE )

  if (broker_id) {
    query.whereIn('mi.broker_id', broker_id.split(',').filter(Number))
  }

  if (isShowOnlyEnable === 'true') {
    query.where('mi.enable_flag', flag.TRUE)
  }

  return await query.orderBy([
    { column: 'broker_sequence', order: 'asc' },
    { column: 'ib_rank_sequence', order: 'asc' },
  ])
}

module.exports = {
  checkIbRankExist,
  getlistIbRankByborkerId,
  getListIBRank,
  getIBRankById,
  updateIBRank,
  checkSequenceById,
  updateSequence,
  checkIBRankFieldExist,
  maxIBRankSequence,
  createIBRank,
  checkIBRankExistForUpdate,
  updateIBRankAndSequence,
  getAllForJobCashback,
  checkMaxMinSequenceEachBroker,
  getListIBRankExist,
  getIbRankforDropdownRebateHistory,
}
