/* eslint-disable require-jsdoc */
const db = require('db').helper
const { flag, sequenceAction, constantKey, brokerID } = require('constant')
const { isEmpty } = require('lodash')

const existData = async (account_type_id, account_leverage)=>{
  const existAccountLeverage = await db('m_account_leverage')
    .select(
      'id',
    )
    .where({
      delete_flag: flag.FALSE,
      account_type_id: account_type_id,
      account_leverage: account_leverage,
    })
    .first()

  // check if exist account type name
  if (existAccountLeverage) {
    return true
  }
  return false
}

const getAccountLeverageList = async (queryString, pagination) => {
  const query = db('m_account_leverage as al')
    .select(
      'al.id as id',
      'al.account_type_id',
      'al.account_leverage',
      'al.account_leverage_sequence',
      db.raw(
        `CASE
          WHEN account_leverage != '${constantKey.LEVERAGE_UNLIMITED}'
          THEN CAST(SUBSTRING_INDEX(account_leverage, ':', -1) AS UNSIGNED)
          ELSE 2147483647
        END AS account_leverage_order`,
      ),
      'al.enable_flag',
      'al.ts_update',
      'al.ts_regist',
      'at.broker_id',
      'at.account_type_code',
      'at.account_type_name',
      'b.broker_name',
      'b.ja_broker_name',
      'b.cn_broker_name',
      'b.kr_broker_name',
      'b.en_broker_name',
    )
    .join('m_account_type as at', 'at.id', 'al.account_type_id')
    .join('m_broker as b', 'b.id', 'at.broker_id')
    .where({
      'at.delete_flag': flag.FALSE,
      'b.delete_flag': flag.FALSE,
      'al.delete_flag': flag.FALSE,
    })
  if (!isEmpty(queryString.brokerId)) {
    query.whereIn('at.broker_id', queryString.brokerId)
  }
  if (!isEmpty(queryString.accountTypeId)) {
    query.whereIn('at.id', queryString.accountTypeId)
  }

  if (queryString.enable_flag === 'true') {
    query.where({
      'al.enable_flag': flag.TRUE,
    })
  }
  // handle sort condition
  let orderArr = []
  if (!queryString.sort) {
    orderArr = [
      { column: 'broker_id', order: 'ASC' },
      { column: 'account_type_name', order: 'ASC' },
      { column: 'account_leverage_sequence', order: 'ASC' },
    ]
  } else {
    orderArr = [...pagination.sort,
      { column: 'account_type_name', order: 'ASC' },
      { column: 'broker_name', order: 'ASC' },
      { column: 'account_leverage_sequence', order: 'ASC' },
    ]
  }

  return await query.orderBy(orderArr).paginate(pagination)
}

const getAccountLeverageById = async (id) => {
  return await db('m_account_leverage as al')
    .select(
      'al.id as id',
      'al.account_type_id',
      'al.account_leverage',
      'al.account_leverage_sequence',
      'al.enable_flag',
      'al.ts_update',
      'al.ts_regist',
    )
    .where({
      id: id,
      delete_flag: flag.FALSE,
    })
    .first()
}

const updateAccountLeverage = async (id, payload) => {
  const result = await db.transaction(async (trx) => {
    const accountTypeUpdate = await trx('m_account_leverage')
      .update(payload)
      .where({
        id: id,
        delete_flag: flag.FALSE,
      })
    if (!accountTypeUpdate) {
      return false
    }
    return true
  })
  return result
}

const checkSequenceByAccountTypeId = async (account_type_id) => {
  const query = await db('m_account_leverage')
    .max('account_leverage_sequence', { as: 'maxAccountLeverageSequence' })
    .min('account_leverage_sequence', { as: 'minAccountLeverageSequence' })
    .where({
      delete_flag: flag.FALSE,
      account_type_id: account_type_id,
    })
    .first()
  return query
}

const createNewAccountLeverage = async (payload) =>{
  return await db('m_account_leverage').insert(payload)
}

const updateSequence = async (type, accountLeverageObj) => {
  try {
    await db.transaction(async (trx)=>{
      // update current record
      const recordCurrent = await trx('m_account_leverage')
        .where({
          id: accountLeverageObj.id,
          delete_flag: flag.FALSE,
        })
        .increment('account_leverage_sequence', type === sequenceAction.UP ? -1 : 1)
      if (!recordCurrent) {
        throw Object.assign(new Error('Update account leverage type current failed'), { isCustomError: true })
      }

      // get new data
      const accountLeverage = await trx('m_account_leverage')
        .select('account_leverage_sequence')
        .where('id', accountLeverageObj.id)
        .first()

      // update record need swap
      const accountTypeInverted = await trx('m_account_leverage')
        .whereNot('id', accountLeverageObj.id)
        .where({
          account_leverage_sequence: accountLeverage.account_leverage_sequence,
          delete_flag: flag.FALSE,
          account_type_id: accountLeverageObj.account_type_id,
        })
        .increment('account_leverage_sequence', type === sequenceAction.UP ? 1 : -1)

      if (!accountTypeInverted) {
        throw Object.assign(new Error('Update account leverage type new failed'), { isCustomError: true })
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

const checkMaxMinSequenceByAccountTypeId = async () =>{
  const query = await db('m_account_leverage')
    .select('account_type_id')
    .max('account_leverage_sequence', { as: 'maxSequence' })
    .min('account_leverage_sequence', { as: 'minSequence' })
    .where('delete_flag', flag.FALSE)
    .groupBy('account_type_id')
  return query
}

const getAccountLeverageDetailById = async (account_leverage_id) => {
  const data = db('m_account_leverage as al')
    .select(
      'al.id as id',
      'al.account_type_id',
      'al.account_leverage',
      'al.account_leverage_sequence',
      'al.enable_flag',
      'al.ts_update',
      'al.ts_regist',
      'at.broker_id',
      'at.account_type_code',
      'at.account_type_name',
      'b.broker_name',
      'b.ja_broker_name',
      'b.cn_broker_name',
      'b.kr_broker_name',
      'b.en_broker_name',
    )
    .join('m_account_type as at', 'at.id', 'al.account_type_id')
    .join('m_broker as b', 'b.id', 'at.broker_id')
    .where({
      'al.id': account_leverage_id,
      'at.delete_flag': flag.FALSE,
      'b.delete_flag': flag.FALSE,
      'al.delete_flag': flag.FALSE,
    })
    .first()
  return data
}
const existFieldDataForUpdate = async (account_type_id, account_leverage, id) =>{
  const query = await db('m_account_leverage')
    .select(
      'id',
      'account_type_id',
      'account_leverage',
      'account_leverage_sequence',
    )
    .where({
      delete_flag: flag.FALSE,
      account_type_id: account_type_id,
      account_leverage: account_leverage,
    })
    .whereNot('id', id)
    .first()
  return query
}

const maxSequenceByAccountTypeId = async (account_type_id) => {
  const query = await db('m_account_leverage')
    .max('account_leverage_sequence', { as: 'account_leverage_sequence' })
    .where({
      delete_flag: flag.FALSE,
      account_type_id: account_type_id,
    })
    .first()
  return query
}

const updateInputAccountLeverage = async (id, payload, account_type_id, account_type_sequence, objAccountLeverage ) =>{
  const result = await db.transaction(async (trx) => {
    if (account_type_sequence) {
      payload.account_type_id = account_type_id
      await trx('m_account_leverage')
        .where('account_type_id', objAccountLeverage.account_type_id)
        .andWhere('account_leverage_sequence', '>', objAccountLeverage.account_leverage_sequence)
        .decrement('account_leverage_sequence', 1)
    }
    await trx('m_account_leverage')
      .update(payload)
      .where({
        'id': id,
      })
    return true
  })
  return result
}

const getLeverageByAccountType = async (account_type_ids) =>{
  const accountLeverage = await db('m_account_leverage as acl')
    .select(
      'acl.id',
      'acl.account_type_id',
      'acl.account_leverage',
      'account_leverage_sequence',
    )
    .whereIn('account_type_id', account_type_ids)
    .where('enable_flag', flag.TRUE)
    .orderBy('account_leverage_sequence', 'asc')
  return accountLeverage
}

const getAccountLeverageIn = async (accountTypeIds) => {
  return await db('m_account_leverage as mal')
    .select(
      'mal.id',
      'mal.account_type_id',
      'mal.account_leverage',
    )
    .where({
      'mal.enable_flag': flag.TRUE,
      'mal.delete_flag': flag.FALSE,
    })
    .whereIn('account_type_id', accountTypeIds)
    .orderBy([
      { column: 'mal.account_type_id' },
      { column: 'mal.account_leverage_sequence' },
    ])
}

const getLeverageByAccountTypeDropdown = async (account_type_ids) =>{
  const query = db('m_account_leverage as acl')
    .leftJoin('m_account_type', 'm_account_type.id', 'acl.account_type_id')
    .distinct(
      'acl.account_leverage',
    )
    .where('m_account_type.broker_id', brokerID.FXON)
    .where('acl.enable_flag', flag.TRUE)
  if (account_type_ids) {
    query.where('acl.enable_flag', flag.TRUE)
      .whereIn('acl.account_type_id', account_type_ids.split(',').filter(Number))
  }

  return await query.orderBy('acl.account_leverage_sequence', 'asc')
}

module.exports = {
  existData,
  checkSequenceByAccountTypeId,
  createNewAccountLeverage,
  getAccountLeverageList,
  getAccountLeverageById,
  updateAccountLeverage,
  checkSequenceByAccountTypeId,
  updateSequence,
  checkMaxMinSequenceByAccountTypeId,
  getAccountLeverageDetailById,
  existFieldDataForUpdate,
  maxSequenceByAccountTypeId,
  updateInputAccountLeverage,
  getLeverageByAccountType,
  getAccountLeverageIn,
  getLeverageByAccountTypeDropdown,
}
