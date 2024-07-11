/* eslint-disable require-jsdoc */
const db = require('db').helper
const { flag, sequenceAction, errorKeyServer } = require('constant')
const _ = require('lodash')

const getAll = async (isShowOnlyEnable, isShowFullDeleted = false) => {
  const query = db('m_broker')
    .select(
      'id',
      'broker_code',
      'broker_name',
      'premium_broker',
      'ja_broker_name',
      'en_broker_name',
      'cn_broker_name',
      'kr_broker_name',
      'broker_sequence',
      'enable_flag',
    )

  if (isShowFullDeleted === false) {
    query.where('delete_flag', flag.FALSE)
  }

  if (isShowOnlyEnable === 'true' || isShowOnlyEnable === true) {
    query.where('enable_flag', flag.TRUE)
  }
  return await query.orderBy('broker_sequence', 'asc')
}


const checkBrokerExistById = async (id)=>{
  return await db('m_broker')
    .select(
      'id',
      'enable_flag',
      'broker_code',
    )
    .where({
      id,
      delete_flag: flag.FALSE,
    })
    .first()
}

const getBrokerList = async (queryString, pagination) =>{
  const query = db('m_broker')
    .select(
      'id',
      'broker_code',
      'broker_name',
      'premium_broker',
      'ja_broker_name',
      'en_broker_name',
      'cn_broker_name',
      'kr_broker_name',
      'broker_sequence',
      'enable_flag',
      'delete_flag',
      'ts_update',
      'ts_regist',
    )
    .where({
      'delete_flag': flag.FALSE,
    })

  if (!_.isEmpty(queryString.broker)) {
    query.whereIn('id', queryString.broker)
  }

  if (queryString.isShowOnlyEnable === 'true') {
    query.where('enable_flag', flag.TRUE)
  }

  const orderArr = [...pagination.sort, { column: 'broker_sequence', order: 'ASC' }]
  const result = await query.orderBy(orderArr).paginate(pagination)

  return result
}

const getBrokerById = async (broker_id) => {
  const result = await db('m_broker')
    .select(
      'id',
      'broker_code',
      'broker_name',
      'premium_broker',
      'ja_broker_name',
      'en_broker_name',
      'cn_broker_name',
      'kr_broker_name',
      'broker_sequence',
      'enable_flag',
      'delete_flag',
      'ts_update',
      'ts_regist',
    )
    .where({
      'id': broker_id,
      'delete_flag': flag.FALSE,
    })
    .first()

  return result
}

const getBrokerIncludeSoftDelete = async (broker_id) => {
  const result = await db('m_broker')
    .select(
      'id',
      'broker_code',
      'broker_name',
      'premium_broker',
      'ja_broker_name',
      'en_broker_name',
      'cn_broker_name',
      'kr_broker_name',
      'broker_sequence',
      'enable_flag',
      'delete_flag',
      'ts_update',
      'ts_regist',
    )
    .where({
      'id': broker_id,
    })
    .first()

  return result
}

const updateBroker = async (broker_id, payload ) =>{
  const result = await db.transaction(async (trx) => {
    const data = await trx('m_broker')
      .update(payload)
      .where({
        'id': broker_id,
        'delete_flag': flag.FALSE,
      })
    if (!data) {
      return { isError: true }
    }
    return { isError: false }
  })
  return result
}

const updateBrokerSequence = async (broker_id, current_sequence, type)=> {
  try {
    const result = await db.transaction(async (trx)=>{
      // update current record
      const updateCurrentRecord = await trx('m_broker')
        .where({
          id: broker_id,
          delete_flag: flag.FALSE,
        })
        .increment('broker_sequence', type === sequenceAction.UP ? -1 : 1)

      if (!updateCurrentRecord) {
        throw Object.assign(new Error('Update Current Record failed'), { isCustomError: true })
      }

      // get new broker data
      const newBroker = await trx('m_broker')
        .select('broker_sequence')
        .where('id', broker_id)
        .first()

      // update record need swap
      const swapBroker = await trx('m_broker')
        .whereNot('id', broker_id)
        .where({
          broker_sequence: newBroker.broker_sequence,
          delete_flag: flag.FALSE,
        })
        .increment('broker_sequence', type === sequenceAction.UP ? 1 : -1)

      if (!swapBroker) {
        throw Object.assign(new Error('Update record need swap failed'), { isCustomError: true })
      }
      return { isError: false }
    })

    return result
  } catch (error) {
    console.log(error)
    if (error.isCustomError) {
      return { isError: true, error }
    }
    throw error
  }
}

const checkBrokerSequence = async () => {
  const data = await db('m_broker')
    .max('broker_sequence', { as: 'max_broker_sequence' })
    .min('broker_sequence', { as: 'min_broker_sequence' })
    .where('delete_flag', flag.FALSE)
    .first()

  return data
}
const existFieldData = async (broker_name, broker_code) => {
  const existBrokerName = await db('m_broker')
    .select(
      'id',
    )
    .where({
      delete_flag: flag.FALSE,
      broker_name: broker_name,
    }).first()
  const exitBrokerCode = await db('m_broker')
    .select(
      'id',
    )
    .where({
      delete_flag: flag.FALSE,
      broker_code: broker_code,
    }).first()

  // check if exist broker name and short name
  if (existBrokerName && exitBrokerCode) {
    return {
      status: true,
      codeError: errorKeyServer.EXIST.BROKER_NAME_AND_SHORT_NAME,
    }
  }
  // check if exist broker name
  if (existBrokerName) {
    return {
      status: true,
      codeError: errorKeyServer.EXIST.BROKER_NAME,
    }
  }
  // check if exist broker short name
  if (exitBrokerCode) {
    return {
      status: true,
      codeError: errorKeyServer.EXIST.BROKER_SHORT_NAME,
    }
  }
  return {
    status: false,
    codeError: null,
  }
}

const createNewBroker = async (payload) => {
  try {
    const result = await db.transaction(async (trx)=>{
      const isCreate = await trx('m_broker').insert(payload)

      if (!isCreate) {
        throw new Error('Create broker failed')
      }
      return true
    })

    return result
  } catch (error) {
    console.log(error)
    return false
  }
}

const checkBrokerId = async (brokerId) => {
  const data = await db('m_broker')
    .select(
      'id',
      'broker_code',
      'broker_name',
    )
    .where({
      id: brokerId,
      enable_flag: flag.TRUE,
      delete_flag: flag.FALSE,
    })
    .first()
  return data
}

const checkDataExistForUpdate = async (broker_id, field_name, field_data) => {
  const isExist = await db('m_broker')
    .select('id')
    .whereNot('id', broker_id)
    .where({
      [field_name]: field_data,
      delete_flag: flag.FALSE,
    })
    .first()

  if (isExist) {
    return true
  }

  return false
}

const getBrokersForStatistics = async (brokerIds) => {
  const query = db('m_broker')
    .select(
      'id',
      'broker_code',
      'broker_name',
      'premium_broker',
      'ja_broker_name',
      'en_broker_name',
      'cn_broker_name',
      'kr_broker_name',
      'broker_sequence',
      'enable_flag',
    )

  if (brokerIds) {
    query.whereIn('id', brokerIds)
  }

  query.where({
    delete_flag: flag.FALSE,
    enable_flag: flag.TRUE,
  })

  return await query.orderBy('broker_sequence', 'asc')
}

module.exports = {
  getAll,
  checkBrokerExistById,
  getBrokerList,
  getBrokerById,
  getBrokerIncludeSoftDelete,
  updateBroker,
  updateBrokerSequence,
  checkBrokerId,
  checkBrokerSequence,
  createNewBroker,
  existFieldData,
  checkDataExistForUpdate,
  getBrokersForStatistics,
}
