const { dataStatus } = require('constant')

const db = require('db').helper
const flag = require('constant').flag

async function getTimeZones() {
  try {
    const result = await db('m_timezones')
      .where('delete_flag', flag.FALSE)
      .select(
        'id',
        'timezone',
        'ja_full_name',
        'ja_short_name',
        'en_full_name',
        'en_short_name',
        'cn_full_name',
        'cn_short_name',
        'kr_full_name',
        'kr_short_name',
        db.raw( 'CAST(SUBSTRING(timezone, 5, 3) AS SIGNED) as timezone_offset'),
      )
      .orderBy([
        { column: 'timezone_offset', order: 'asc' },
        { column: 'id', order: 'asc' },
      ])
    if (!result.length) {
      return { status: dataStatus.FAIL }
    }
    return {
      status: dataStatus.COMPLETE,
      data: result,
    }
  } catch (error) {
    console.log(error)
    return { status: dataStatus.FAIL }
  }
}

const checkExistTimeZone = async (payload) =>{
  try {
    const existed = await db('m_timezones')
      .where('delete_flag', flag.FALSE)
      .where('id', payload.id).first()

    return existed ? true : false
  } catch (error) {
    console.log(error)
    return false
  }
}

module.exports = {
  getTimeZones,
  checkExistTimeZone,
}
