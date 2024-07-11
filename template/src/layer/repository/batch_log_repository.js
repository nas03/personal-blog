const { helper: db, dbReader } = require('db')
const { updateAndGetBatchId } = require('./sequence_repository')

/* constant */
const { dateFormat, logTypes, resultTypes, resultIds, jobNames, resultMessages } = require('constant')

const moment = require('moment')

const TABLE_NAME = 'batch_log'

async function deleteBatchLog() {
  const trx = await db.transaction()
  try {
    const dateTime = moment().subtract(30, 'days').format(dateFormat.DATE_TIME)
    console.log('date time 30 days ago', dateTime)
    await trx(TABLE_NAME)
      .where('ts_regist', '<', dateTime)
      .del()

    await trx.commit()
    return true
  } catch (error) {
    await trx.rollback()
  }
}

const createNewBatchLogBegin = async (parentBatchLogId, batchType) => {
  try {
    const jobName = jobNames[batchType]

    const batchLogBeginObj = {
      id: parentBatchLogId,
      parent_batch_log_id: parentBatchLogId,
      batch_type: batchType,
      result_id: resultIds.START_RESULT_ID,
      result_message: resultMessages[resultIds.START_RESULT_ID](batchType, jobName),
      log_type: logTypes.START,
    }

    return await db(TABLE_NAME).insert(batchLogBeginObj)
  } catch (error) {
    console.log(error)
    return false
  }
}

const createNewBatchLogEnd = async (parentBatchLogId, batchType) => {
  try {
    const initialId = await updateAndGetBatchId()
    if (!initialId) {
      return false
    }

    const jobName = jobNames[batchType]

    const batchLogEndObj = {
      id: initialId,
      parent_batch_log_id: parentBatchLogId,
      batch_type: batchType,
      result_id: resultIds.END_RESULT_ID,
      result_message: resultMessages[resultIds.END_RESULT_ID](batchType, jobName),
      log_type: logTypes.END,
    }

    return await db(TABLE_NAME).insert(batchLogEndObj)
  } catch (error) {
    console.log(error)
    return false
  }
}

const createNewBatchLogProcessResult = async (parentBatchLogId, batchType, resultType, resultDetail, resultDetailId = null) => {
  try {
    const initialId = await updateAndGetBatchId()
    if (!initialId) {
      return false
    }

    const jobName = jobNames[batchType]
    const resultId = resultType === resultTypes.ERROR ? resultIds.FAIL_RESULT_ID : resultIds.SUCCESS_RESULT_ID

    const batchLogProcessResultObj = {
      id: initialId,
      parent_batch_log_id: parentBatchLogId,
      batch_type: batchType,
      result_id: resultId,
      result_type: resultType,
      result_message: resultMessages[resultId](batchType, jobName, resultDetail.result_count),
      result_detail: resultDetail,
      result_detail_id: resultDetailId || null,
      log_type: logTypes.PROCESS_RESULT,
    }

    return await db(TABLE_NAME).insert(batchLogProcessResultObj)
  } catch (error) {
    console.log(error)
    return false
  }
}

const getBatchLogProcessResult = async (batchType, limit) => {
  try {
    const result = await dbReader(TABLE_NAME)
      .select(
        'id',
        'batch_type',
        'result_type',
        'result_message',
        'result_detail',
        'result_detail_id',
      )
      .where({
        batch_type: batchType,
        log_type: logTypes.PROCESS_RESULT,
      })
      .orderBy('ts_regist', 'desc')
      .limit(limit)

    return result ? result : null
  } catch (error) {
    console.log(error)
    return false
  }
}

const getBatchLogsByParentId = async (parrentId) => {
  try {
    const result = await db(TABLE_NAME)
      .select(
        '*',
      )
      .where({
        parent_batch_log_id: parrentId,
      })
      .orderBy('id', 'asc')

    return result ? result : null
  } catch (error) {
    console.log(error)
    return false
  }
}

const getBatchLogAlertError = async (id) => {
  try {
    const countSuccessBatchLogQuery = '(SELECT COUNT(*) FROM batch_log as bl2 WHERE bl2.batch_type = ? AND bl2.log_type = ? AND bl2.result_type = ?)'
    const maxIdSuccessBatchLogQuery = '(SELECT MAX(id) FROM batch_log as bl3 WHERE bl3.batch_type = ? AND bl3.log_type = ? AND bl3.result_type = ?)'

    const result = await dbReader(`${TABLE_NAME} as bl`)
      .select('*')
      .where('bl.batch_type', id)
      .where('bl.log_type', logTypes.PROCESS_RESULT)
      .where('bl.result_type', resultTypes.ERROR)
      .where((builder) => {
        builder.where(dbReader.raw(countSuccessBatchLogQuery, [id, logTypes.PROCESS_RESULT, resultTypes.SUCCESS]), '=', 0)
          .orWhere('bl.id', '>', dbReader.raw(maxIdSuccessBatchLogQuery, [id, logTypes.PROCESS_RESULT, resultTypes.SUCCESS]))
      })
      .orderBy('bl.id')
      .limit(1)
    return result ? result : null
  } catch (error) {
    console.log(error)
    return false
  }
}

const getCountingBatchLogAlertError = async (batchType, id) => {
  try {
    const result = await dbReader(`${TABLE_NAME} as bl`)
      .count('id as count')
      .where('bl.batch_type', batchType)
      .where('bl.log_type', logTypes.PROCESS_RESULT)
      .where('bl.result_type', resultTypes.ERROR)
      .where('bl.id', '>=', id)

    return result ? result : null
  } catch (error) {
    console.log(error)
    return false
  }
}

module.exports = {
  deleteBatchLog,
  createNewBatchLogBegin,
  createNewBatchLogEnd,
  createNewBatchLogProcessResult,
  getBatchLogProcessResult,
  getBatchLogsByParentId,
  getBatchLogAlertError,
  getCountingBatchLogAlertError,
}
