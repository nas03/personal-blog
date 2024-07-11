const { rateType } = require('constant')
const _ = require('lodash')
const moment = require('moment')

/* DB */
const { helper: db, dbReader } = require('db')

const getListLatestRate = async () => {
  try {
    const result = await db('m_rate')
      .select(
        'id',
        'base',
        'symbol',
        'rate',
        'type',
      )
      .where('type', rateType.LATEST)

    return result.length ? result : null
  } catch (error) {
    console.log(error)
    return null
  }
}

async function getRateByType(type) {
  return db('m_rate')
    .select(
      'm_rate.id',
      'm_rate.base',
      'm_rate.symbol',
      'm_rate.rate',
      'm_rate.difference',
      'm_rate.ts_update',
    )
    .where(
      'm_rate.type', type,
    )
}

async function createRates(ids, objs) {
  const trx = await db.transaction()
  try {
    // update type to previous
    if (ids.length) {
      const updateType = await trx('m_rate')
        .whereIn('id', ids)
        .update('type', rateType.PREVIOUS)
      if (!updateType) {
        await trx.rollback()
        return false
      }
    }

    // create rates latest
    const newRates = []
    objs.map((obj) => {
      const clone = _.clone(obj, true)
      clone['type'] = rateType.LATEST
      newRates.push(clone)
    })
    const result = await trx('m_rate').insert(newRates)
    if (!result) {
      await trx.rollback()
      return false
    }

    await trx.commit()
    return true
  } catch (error) {
    await trx.rollback()
    console.log(error)
    return false
  }
}

const getRateByRebateHistory = async (conditions) => {
  const queries = conditions.map((condition) =>
    dbReader('m_rate')
      .select(
        'rate',
        'base',
        'symbol',
        dbReader.raw('CAST(tick_time AS DATE) as date_only'),
      )
      .where('base', condition.base)
      .where('symbol', condition.symbol)
      .where(dbReader.raw(`CAST(tick_time AS DATE) = '${moment(condition.close_time).format('YYYY-MM-DD')}'`))
      .orderBy([{ column: 'tick_time', order: 'ASC' }])
      .limit(1),
  )

  return await db.raw(`${queries.join(' UNION ALL ')}`)
}

module.exports = {
  getListLatestRate,
  getRateByType,
  createRates,
  getRateByRebateHistory,
}
