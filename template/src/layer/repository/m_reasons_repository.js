const { flag } = require('constant')

/* DB */
const db = require('db').helper

const getListReasonByReasonType = async (arrReasonType) => {
  const result = await db('m_reasons')
    .select(
      'id',
      'ja_short_reason',
      'en_short_reason',
      'cn_short_reason',
      'kr_short_reason',
      'reason_type',
    )
    .whereIn('reason_type', arrReasonType)
    .where('delete_flag', flag.FALSE)

  return result
}

async function checkReasonExist(id, reasonTypeId) {
  return await db('m_reasons')
    .select(
      'id',
      'ja_reason',
      'en_reason',
      'cn_reason',
      'kr_reason',
    )
    .where('id', id)
    .where('delete_flag', flag.FALSE)
    .where('reason_type', reasonTypeId)
    .first()
}

async function getReason(payload) {
  try {
    const deficiency_reason = await db('m_reasons')
      .where(payload)
      .select(
        'id',
        'ja_short_reason',
        'en_short_reason',
        'cn_short_reason',
        'kr_short_reason',
        'ja_reason',
        'en_reason',
        'cn_reason',
        'kr_reason',
      )
    return deficiency_reason
  } catch (error) {
    console.log(error)
    return false
  }
}


module.exports = {
  checkReasonExist,
  getListReasonByReasonType,
  getReason,
}
