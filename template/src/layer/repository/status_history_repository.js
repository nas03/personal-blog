/* db */
const db = require('db').helper

/* constant */
const { flag, userBasicClass, statusClassConstant, timeExpires, message } = require('constant')

/* library */
const sleep = require('util').promisify(setTimeout)

const getStatusHistory = async (payload) =>{
  return await db('general_status_history')
    .leftJoin('users_basic_data as admin', function() {
      // eslint-disable-next-line no-invalid-this
      this.on('admin.id', '=', 'general_status_history.updated_by_user_id')
        .on('admin.admin_flag', '=', flag.TRUE)
    })
    .select(
      'general_status_history.status_code',
      'general_status_history.status_class_id',
      'general_status_history.comment_by_admin',
      'general_status_history.updated_by_user_id',
      'general_status_history.ts_regist as ts_update_status',
      db.raw('CONCAT(LEFT(admin.last_name_romaji,1),".",admin.first_name_romaji) as admin_name'),
    )
    .where({
      ...payload,
      'general_status_history.delete_flag': flag.FALSE,
    })
    .orderBy('general_status_history.ts_regist', 'desc')
}

const insertStatusHistory = async (payload) =>{
  return await db('general_status_history').insert(payload)
}

const getAccountStatusHistoriesByUserId = async (user_basic_data_id) => {
  return await db('general_status_history as sh')
    .leftJoin('users_basic_data as admin', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('admin.id', 'sh.updated_by_user_id')
        .on('admin.admin_flag', userBasicClass.ADMIN)
        .on('admin.delete_flag', flag.FALSE)
    })
    .leftJoin('m_status as ms1', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('ms1.status_code', 'sh.status_code')
        .on('ms1.status_label_number', 0)
        .on('ms1.delete_flag', flag.FALSE)
    })
    .leftJoin('m_status as ms2', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('ms2.status_code', 'sh.status_code')
        .on('ms2.status_label_number', '<>', 0)
        .on('ms2.status_label_number', 'sh.status_label_number')
        .on('ms2.delete_flag', flag.FALSE)
    })
    .select(
      'sh.id',
      'sh.status_code',
      'ms1.status_name',
      'ms1.frame_color as status_frame_color',
      'ms1.paint_color as status_paint_color',
      'ms1.text_color as status_text_color',
      'ms1.en_name as status_en_name',
      'ms1.ja_name as status_ja_name',
      'ms1.cn_name as status_cn_name',
      'ms1.kr_name as status_kr_name',
      'ms2.status_name as label_name',
      'ms2.frame_color as label_frame_color',
      'ms2.paint_color as label_paint_color',
      'ms2.text_color as label_text_color',
      'ms2.en_name as label_en_name',
      'ms2.ja_name as label_ja_name',
      'ms2.cn_name as label_cn_name',
      'ms2.kr_name as label_kr_name',
      'sh.action_method',
      'sh.updated_by_user_id',
      'admin.first_name_romaji',
      'admin.last_name_romaji',
      'sh.ts_regist',
    )
    .where({
      'sh.target_id': user_basic_data_id,
      'sh.delete_flag': flag.FALSE,
      'sh.status_class_id': statusClassConstant.ACCOUNT_STATUS,
    })
    .orderBy('sh.ts_regist', 'desc')
    .orderBy('sh.id', 'desc')
}

const getLatestStatus = (payload) =>{
  const queryLastHistoriesIds = db('general_status_history')
    .max('id as history_id')
    .groupBy('target_id')
    .where({
      ...payload,
      delete_flag: flag.FALSE,
    })
    .as('last_history_ids')

  const queryStatusHistory = db('general_status_history')
    .join(queryLastHistoriesIds, 'general_status_history.id', 'last_history_ids.history_id')
    .as('status_history')
  return queryStatusHistory
}

const commonQueryGetStatusHistory = (statusClass, targetId = undefined) => {
  if (targetId) {
    return db('general_status_history')
      .where({
        target_id: targetId,
        status_class_id: statusClass,
        delete_flag: flag.FALSE,
      })
      .orderBy('id', 'desc')
      .first()
      .as('gsh')
  } else {
    const queryLastHistoriesIds = db('general_status_history')
      .max('id as history_id')
      .groupBy('target_id')
      .where({
        status_class_id: statusClass,
        delete_flag: flag.FALSE,
      })
      .as('last_history_ids')

    return db('general_status_history')
      .join(queryLastHistoriesIds, function() {
        /* eslint-disable no-invalid-this */
        this.on('general_status_history.id', 'last_history_ids.history_id')
      })
      .as('gsh')
  }
}

const commonQueryGetSecondLatestStatusHistory = (statusClass, targetId = undefined) => {
  if (targetId) {
    return db('general_status_history')
      .where({
        target_id: targetId,
        status_class_id: statusClass,
        delete_flag: flag.FALSE,
      })
      .orderBy('id', 'desc')
      .offset(1)
      .first()
      .as('prev_gsh')
  } else {
    const querySecondLastStatusHistoriesIds = db('general_status_history')
      .select('target_id')
      .max('id as penultimate_history_id')
      .whereNotIn('id', function() {
        this.max('id').from('general_status_history')
          .groupBy('target_id')
      })
      .groupBy('target_id')
      .as('penultimate_history_ids')

    return db('general_status_history')
      .select('general_status_history.*')
      .innerJoin(querySecondLastStatusHistoriesIds, 'general_status_history.id', 'penultimate_history_ids.penultimate_history_id')
      .as('prev_gsh')
  }
}

const updateStatusHistory = async (id, dataUpdate) => {
  return await db('general_status_history')
    .where({ id: id })
    .update(dataUpdate)
}

const insertRollbackStatusHistory = async (payload) =>{
  try {
    const result = await db.transaction(async (trx) =>{
      // INSERT STATUS HISTORY
      await trx('general_status_history').insert(payload)

      // SLEEP RANDOM 0s - 3s
      await sleep(Math.floor(Math.random() * 1001))

      // Remove updated_by_user_id from check obj
      const newPayload = payload.map(({ updated_by_user_id, ...rest }) => rest)

      // GET STATUS HISTORY AGAIN
      const statusHistories = await trx('general_status_history')
        .where(newPayload[0])
        .where('ts_update', '>', db.raw(`NOW() - INTERVAL ${timeExpires.KYC_PROCESS_SESSION} MINUTE`))
      if (statusHistories.length >= 2) {
        await trx.rollback()
        return false
      }
      return true
    })

    return result
  } catch (error) {
    console.log(error)
    return false
  }
}

const commonInsertRollbackStatusHistory = async (table, payload, sessionExpired) => {
  console.log('INSERT HISTORY', payload)
  await table('general_status_history').insert(payload)

  // Remove updated_by_user_id from check obj
  const newPayload = payload.map(({ updated_by_user_id, ...rest }) => rest)

  // GET STATUS HISTORY AGAIN
  const statusHistories = await table('general_status_history')
    .where(newPayload[0])
    .where('ts_update', '>', db.raw(`NOW() - INTERVAL ${sessionExpired} MINUTE`))

  if (statusHistories.length >= 2) {
    console.log('DUPLICATE ERROR')
    return { status: false, message: message.kyc_process_duplicate_error }
  }
  return { status: true }
}

module.exports = {
  getStatusHistory,
  insertStatusHistory,
  getAccountStatusHistoriesByUserId,
  getLatestStatus,
  commonQueryGetStatusHistory,
  commonQueryGetSecondLatestStatusHistory,
  updateStatusHistory,
  insertRollbackStatusHistory,
  commonInsertRollbackStatusHistory,
}
