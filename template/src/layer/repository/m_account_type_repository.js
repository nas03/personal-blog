/* eslint-disable require-jsdoc */
const db = require('db').helper
const { isEmpty } = require('lodash')
const { flag, sequenceAction, brokerID, currencyAccountType, errorKeyServer } = require('constant')

const getAll = async (isShowOnlyEnable) => {
  const query = db('m_account_type')
    .select(
      'id',
      'broker_id',
      'account_type_code',
      'account_type_name',
      'account_type_sequence',
      'platform_mt4',
      'platform_mt5',
      'enable_flag',
    )
    .where('delete_flag', flag.FALSE)
  if (isShowOnlyEnable === 'true' || isShowOnlyEnable === true) {
    query.where('enable_flag', flag.TRUE)
  }
  return await query.orderBy('account_type_sequence', 'asc')
}

const checkAccountTypeExist = async (broker_id, id) => {
  return await db('m_account_type')
    .select(
      'id',
      'enable_flag',
      'account_type_code',
    )
    .where({
      broker_id,
      id,
      delete_flag: flag.FALSE,
    })
    .first()
}

const getAccountTypeByBrokerId = async (broker_id, isShowOnlyEnable) => {
  const query = db('m_account_type as ma')
    .select(
      'ma.id',
      'ma.broker_id',
      'ma.account_type_code',
      'ma.account_type_name',
      'ma.account_type_sequence',
      'ma.platform_mt4',
      'ma.platform_mt5',
      'ma.enable_flag',
      'm_broker.broker_sequence',
      'm_broker.broker_code',
    )
    .leftJoin('m_broker', 'ma.broker_id', 'm_broker.id')
    .where('ma.delete_flag', flag.FALSE)
    .whereIn('ma.broker_id', broker_id)

  if (isShowOnlyEnable === 'true') {
    query.where('ma.enable_flag', flag.TRUE)
  }

  return await query.orderBy([
    { column: 'broker_sequence', order: 'asc' },
    { column: 'account_type_sequence', order: 'asc' },
  ])
}


const getAccountTypeList = async (queryString, pagination) => {
  const query = db('m_account_type as at')
    .select(
      'at.id as id',
      'at.broker_id',
      'at.account_type_code',
      'at.account_type_name',
      'at.account_type_sequence',
      'at.platform_mt4',
      'at.platform_mt5',
      db.raw(
        `CONCAT(
          (CASE WHEN at.base_currency_usd = 1 THEN '${currencyAccountType.USD} ' ELSE '' END),
          (CASE WHEN at.base_currency_jpy = 1 THEN '${currencyAccountType.JPY} ' ELSE '' END),
          (CASE WHEN at.base_currency_eur = 1 THEN '${currencyAccountType.EUR} ' ELSE '' END),
          (CASE WHEN at.base_currency_sgd = 1 THEN '${currencyAccountType.SGD} ' ELSE '' END),
          (CASE WHEN at.base_currency_aud = 1 THEN '${currencyAccountType.AUD} ' ELSE '' END),
          (CASE WHEN at.base_currency_nzd = 1 THEN '${currencyAccountType.NZD} ' ELSE '' END),
          (CASE WHEN at.base_currency_gbp = 1 THEN '${currencyAccountType.GBP} ' ELSE '' END),
          (CASE WHEN at.base_currency_zar = 1 THEN '${currencyAccountType.ZAR} ' ELSE '' END),
          (CASE WHEN at.base_currency_huf = 1 THEN '${currencyAccountType.HUF} ' ELSE '' END),
          (CASE WHEN at.base_currency_chf = 1 THEN '${currencyAccountType.CHF}' ELSE '' END)
        ) AS base_currency`,
      ),
      'at.rebates_currency',
      'at.enable_flag',
      'at.ts_update',
      'at.ts_regist',
      'b.broker_name',
      'b.ja_broker_name',
      'b.cn_broker_name',
      'b.kr_broker_name',
      'b.en_broker_name',
    )
    .join('m_broker as b', 'b.id', 'at.broker_id')
    .where({
      'at.delete_flag': flag.FALSE,
      'b.delete_flag': flag.FALSE,
    })

  // condition product type
  if (!isEmpty(queryString.brokerId)) {
    query.whereIn('at.broker_id', queryString.brokerId)
  }
  if (queryString.enable_flag === 'true') {
    query.where({
      'at.enable_flag': flag.TRUE,
    })
  }

  // handle sort condition
  let orderArr = []
  if (!queryString.sort) {
    orderArr = [{ column: 'broker_id', order: 'ASC' }, { column: 'account_type_sequence', order: 'ASC' }]
  } else {
    orderArr = [...pagination.sort, { column: 'broker_id', order: 'ASC' }, { column: 'account_type_sequence', order: 'ASC' }]
  }
  const data = await query.orderBy(orderArr).paginate(pagination)
  return data
}

const getAccountById = async (id) => {
  return await db('m_account_type as at')
    .select(
      'at.id as id',
      'at.broker_id',
      'at.account_type_code',
      'at.account_type_name',
      'at.account_type_sequence',
    )
    .where({
      id,
      delete_flag: flag.FALSE,
    })
    .first()
}

const updateEnableFlag = async (id, payload) => {
  const result = await db.transaction(async (trx) => {
    const accountTypeUpdate = await trx('m_account_type')
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

const checkSequenceByBrokerId = async (broker_id) => {
  const query = await db('m_account_type')
    .max('account_type_sequence', { as: 'maxSequence' })
    .min('account_type_sequence', { as: 'minSequence' })
    .where({
      delete_flag: flag.FALSE,
      broker_id: broker_id,
    })
    .first()
  return query
}

const updateSequence = async (type, accountTypeObj) => {
  try {
    await db.transaction(async (trx) => {
      // update current record
      const recordCurrent = await trx('m_account_type')
        .where({
          id: accountTypeObj.id,
          delete_flag: flag.FALSE,
        })
        .increment('account_type_sequence', type === sequenceAction.UP ? -1 : 1)
      if (!recordCurrent) {
        throw Object.assign(new Error('Update account type current failed'), { isCustomError: true })
      }

      // get new data
      const newAccountType = await trx('m_account_type')
        .select('account_type_sequence')
        .where('id', accountTypeObj.id)
        .first()

      // update record need swap
      const accountTypeInverted = await trx('m_account_type')
        .whereNot('id', accountTypeObj.id)
        .where({
          account_type_sequence: newAccountType.account_type_sequence,
          delete_flag: flag.FALSE,
          broker_id: accountTypeObj.broker_id,
        })
        .increment('account_type_sequence', type === sequenceAction.UP ? 1 : -1)

      if (!accountTypeInverted) {
        throw Object.assign(new Error('Update account type new failed'), { isCustomError: true })
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

const existFieldData = async (account_type_name, account_type_code, broker_id) => {
  const existAccountTypeName = await db('m_account_type')
    .select(
      'id',
    )
    .where({
      delete_flag: flag.FALSE,
      account_type_name: account_type_name,
      broker_id: broker_id,
    }).first()
  const exitAccountTypeCode = await db('m_account_type')
    .select(
      'id',
    )
    .where({
      delete_flag: flag.FALSE,
      account_type_code: account_type_code,
      broker_id: broker_id,
    }).first()
  // check if exist account type name and account type code
  if (existAccountTypeName && exitAccountTypeCode) {
    return {
      isError: true,
      codeError: errorKeyServer.EXIST.ACCOUNT_TYPE_NAME_AND_ACCOUNT_TYPE_CODE,
    }
  }
  // check if exist account type name
  if (existAccountTypeName) {
    return {
      isError: true,
      codeError: errorKeyServer.EXIST.ACCOUNT_TYPE_NAME,
    }
  }
  // check if exist account type code
  if (exitAccountTypeCode) {
    return {
      isError: true,
      codeError: errorKeyServer.EXIST.ACCOUNT_TYPE_CODE,
    }
  }
  return {
    isError: false,
    codeError: null,
  }
}

const createNewAccountType = async (payload) => {
  return await db('m_account_type').insert(payload)
}

const checkAccountType = async (broker_id, account_type_id) => {
  const accountTypeId = await db('m_account_type')
    .select(
      'id',
      'enable_flag',
    )
    .where({
      delete_flag: flag.FALSE,
      id: account_type_id,
      broker_id: broker_id,
    }).first()
  return accountTypeId
}

const getAccountTypeDetailById = async (account_type_id) => {
  const data = db('m_account_type as at')
    .select(
      'at.id as id',
      'at.broker_id',
      'at.account_type_code',
      'at.account_type_name',
      'at.account_type_sequence',
      'at.platform_mt4',
      'at.platform_mt5',
      'at.base_currency_usd',
      'at.base_currency_jpy',
      'at.base_currency_eur',
      'at.base_currency_sgd',
      'at.base_currency_aud',
      'at.base_currency_nzd',
      'at.base_currency_gbp',
      'at.base_currency_zar',
      'at.base_currency_huf',
      'at.base_currency_chf',
      'at.rebates_currency',
      'at.enable_flag',
      'at.delete_flag',
      'at.ts_update',
      'at.ts_regist',
    )
    .where({
      'id': account_type_id,
      'delete_flag': false,
    })
    .first()
  return data
}

const maxSequenceByBrokerId = async (broker_id) => {
  const query = await db('m_account_type')
    .max('account_type_sequence', { as: 'account_type_sequence' })
    .where({
      delete_flag: flag.FALSE,
      broker_id: broker_id,
    })
    .first()
  return query
}

const checkAccountTypeSequence = async (brokerId, accountTypeSequence) => {
  const query = db('m_account_type')
    .select(
      'id',
      'account_type_sequence',
    )
    .where('broker_id', brokerId)
    .andWhere('account_type_sequence', '>', accountTypeSequence)
  return query
}

const existFieldDataForUpdate = async (account_type_name, account_type_code, broker_id, id) => {
  const existAccountTypeName = await db('m_account_type')
    .select('id')
    .where({
      delete_flag: flag.FALSE,
      account_type_name: account_type_name,
      broker_id: broker_id,
    })
    .whereNot('id', id)
    .first()
  const exitAccountTypeCode = await db('m_account_type')
    .select('id')
    .where({
      delete_flag: flag.FALSE,
      account_type_code: account_type_code,
      broker_id: broker_id,
    })
    .whereNot('id', id)
    .first()
  // check if exist account type name and account type code
  if (existAccountTypeName && exitAccountTypeCode) {
    return {
      isError: true,
      codeError: errorKeyServer.EXIST.ACCOUNT_TYPE_NAME_AND_ACCOUNT_TYPE_CODE,
    }
  }
  // check if exist account type name
  if (existAccountTypeName) {
    return {
      isError: true,
      codeError: errorKeyServer.EXIST.ACCOUNT_TYPE_NAME,
    }
  }
  // check if exist account type code
  if (exitAccountTypeCode) {
    return {
      isError: true,
      codeError: errorKeyServer.EXIST.ACCOUNT_TYPE_CODE,
    }
  }
  return {
    isError: false,
    codeError: null,
  }
}

const updateAccountTypeSequence = async (id, payload, account_type_sequence, objAccountType) => {
  const result = await db.transaction(async (trx) => {
    if (account_type_sequence) {
      payload.account_type_sequence = account_type_sequence
      await trx('m_account_type')
        .where('broker_id', objAccountType.broker_id)
        .andWhere('account_type_sequence', '>', objAccountType.account_type_sequence)
        .decrement('account_type_sequence', 1)
    }
    await trx('m_account_type')
      .update(payload)
      .where({
        'id': id,
      })
    return true
  })
  return result
}

const checkMaxMinSequenceByBrokerId = async () => {
  const query = await db('m_account_type')
    .select('broker_id')
    .max('account_type_sequence', { as: 'maxSequence' })
    .min('account_type_sequence', { as: 'minSequence' })
    .where('delete_flag', flag.FALSE)
    .groupBy('broker_id')
  return query
}

const getAccountType = async () => {
  try {
    const accountType = await db('m_broker')
      .leftJoin('m_account_type as mat', 'mat.broker_id', 'm_broker.id')
      .select(
        'mat.id',
        'mat.account_type_name',
        'mat.base_currency_usd',
        'mat.base_currency_jpy',
        'mat.base_currency_eur',
        'mat.base_currency_sgd',
        'mat.base_currency_aud',
        'mat.base_currency_gbp',
        'mat.base_currency_nzd',
        'mat.base_currency_zar',
        'mat.base_currency_huf',
        'mat.base_currency_chf',
        'mat.platform_mt4',
        'mat.platform_mt5',
      )
      .where({
        'mat.broker_id': brokerID.FXON,
        'm_broker.enable_flag': flag.TRUE,
        'mat.enable_flag': flag.TRUE,
      }).orderBy('mat.account_type_sequence', 'asc')
    return accountType
  } catch (error) {
    console.log(error)
    return false
  }
}

const getAccountTypeById = async (id) => {
  return await db('m_account_type as at')
    .leftJoin('m_broker', 'at.broker_id', 'm_broker.id')
    .select(
      'at.id as id',
      'at.broker_id',
      'at.account_type_name',
      'at.account_type_code',
      'at.platform_mt4',
      'at.platform_mt5',
    )
    .where({
      'm_broker.id': brokerID.FXON,
      'm_broker.enable_flag': flag.TRUE,
      'at.enable_flag': flag.TRUE,
      'at.id': id,
      'at.delete_flag': flag.FALSE,
      'm_broker.delete_flag': flag.FALSE,
    })
    .first()
}

const getAccountTypeForDropdownRebateHistory = async (broker_id, isShowOnlyEnable) => {
  const query = db('m_account_type as ma')
    .select(
      'ma.id',
      'ma.broker_id',
      'ma.account_type_code',
      'ma.account_type_name',
      'ma.account_type_sequence',
      'ma.platform_mt4',
      'ma.platform_mt5',
      'ma.enable_flag',
      'm_broker.broker_sequence',
      'm_broker.broker_code',
    )
    .leftJoin('m_broker', 'ma.broker_id', 'm_broker.id')
    .where('ma.delete_flag', flag.FALSE)

  if (broker_id) {
    query.whereIn('ma.broker_id', broker_id.split(',').filter(Number))
  }

  if (isShowOnlyEnable === 'true') {
    query.where('ma.enable_flag', flag.TRUE)
  }

  return await query.orderBy([
    { column: 'broker_sequence', order: 'asc' },
    { column: 'account_type_sequence', order: 'asc' },
  ])
}

const getAccountTypeForTradingAccount = async () => {
  try {
    const accountType = await db('m_account_type as mat')
      .select(
        'mat.id',
        'mat.account_type_name',
        'mat.base_currency_usd',
        'mat.base_currency_jpy',
        'mat.base_currency_eur',
        'mat.base_currency_sgd',
        'mat.base_currency_aud',
        'mat.base_currency_gbp',
        'mat.base_currency_nzd',
        'mat.platform_mt4',
        'mat.platform_mt5',
      )
      .where({
        'mat.broker_id': brokerID.FXON,
      }).orderBy('mat.account_type_sequence', 'asc')
    return accountType
  } catch (error) {
    console.log(error)
    return false
  }
}

const getAccountTypeByBrokerIds = async (brokerIds)=>{
  try {
    return await db('m_account_type')
      .select(
        'id',
        'broker_id',
        'account_type_name',
        'rebates_currency',
        'account_type_code',
        'account_type_sequence',
      )
      .where({
        'delete_flag': flag.FALSE,
      })
      .whereIn('broker_id', brokerIds)
      .orderBy('account_type_sequence', 'asc')
  } catch (error) {
    console.error(error)
    return false
  }
}

const getAccountTypesByBrokerId = async (brokerId) => {
  return await db('m_account_type as mat')
    .select(
      'mat.id',
      'mat.broker_id',
      'mat.account_type_code',
      'mat.account_type_name',
      'mat.account_type_sequence',
      'mat.platform_mt4',
      'mat.platform_mt5',
      'mat.base_currency_usd',
      'mat.base_currency_jpy',
      'mat.base_currency_eur',
      'mat.base_currency_sgd',
      'mat.base_currency_aud',
      'mat.base_currency_nzd',
      'mat.base_currency_gbp',
      'mat.base_currency_zar',
      'mat.base_currency_huf',
      'mat.base_currency_chf',
    )
    .where({
      'mat.enable_flag': flag.TRUE,
      'mat.delete_flag': flag.FALSE,
      'mat.broker_id': brokerId,
    })
    .orderBy('mat.account_type_sequence')
}

module.exports = {
  getAll,
  checkAccountTypeExist,
  getAccountTypeByBrokerId,
  getAccountTypeList,
  getAccountById,
  updateEnableFlag,
  checkSequenceByBrokerId,
  updateSequence,
  existFieldData,
  createNewAccountType,
  checkAccountType,
  getAccountTypeDetailById,
  maxSequenceByBrokerId,
  checkAccountTypeSequence,
  existFieldDataForUpdate,
  updateAccountTypeSequence,
  checkMaxMinSequenceByBrokerId,
  getAccountType,
  getAccountTypeById,
  getAccountTypeForDropdownRebateHistory,
  getAccountTypeForTradingAccount,
  getAccountTypeByBrokerIds,
  getAccountTypesByBrokerId,
}
