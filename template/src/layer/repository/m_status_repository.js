/* eslint-disable require-jsdoc */
const db = require('db').helper
const { flag, statusMasterFlag } = require('constant')

const getListStatus = async (pagination, queryString) => {
  const query = db('m_status')
    .select(
      'id',
      'status_code',
      'status_name',
      'status_label_number',
      'status_with_site_id',
      'frame_color',
      'paint_color',
      'text_color',
      'en_name',
      'ja_name',
      'cn_name',
      'kr_name',
      'status_with_class_id',
      'enable_flag',
      'ts_update',
      'ts_regist',
      db.raw('CASE WHEN LENGTH(status_with_site_id) = 0 THEN 0 ' +
      "ELSE LENGTH(status_with_site_id) - LENGTH(REPLACE(status_with_site_id, ',', '')) + 1 END AS count_site "),
    )
    .where('delete_flag', flag.FALSE)

  if (Number(queryString.show_valid) === flag.TRUE) {
    query.where('enable_flag', flag.TRUE)
  }

  let orderArr
  if (queryString.sort) {
    if (queryString.sort.includes('status_code')) {
      orderArr = [
        ...pagination.sort,
        { column: 'status_label_number', order: pagination.sort[0].order },
      ]
    } else {
      orderArr = [...pagination.sort, { column: 'status_code', order: 'ASC' }, { column: 'status_label_number', order: 'ASC' }]
    }
  } else {
    orderArr = [
      { column: 'status_code', order: 'ASC' },
      { column: 'status_label_number', order: 'ASC' },
    ]
  }

  return await query.orderBy(orderArr).paginate(pagination)
}

const getStatusMaster = async (obj) => {
  const result = await db('m_status')
    .select(
      'id',
      'status_code',
      'status_name',
      'status_with_site_id',
      'frame_color',
      'paint_color',
      'text_color',
      'en_name',
      'ja_name',
      'cn_name',
      'kr_name',
      'en_status_label_detail',
      'ja_status_label_detail',
      'cn_status_label_detail',
      'kr_status_label_detail',
      'status_with_class_id',
    )
    .where({
      delete_flag: flag.FALSE,
      ...obj,
    })
    .orderBy('status_code', 'asc')

  return result
}

const getDetailByStatusCode = async (status_code) => {
  const query = db('m_status')
    .select(
      'id',
      'status_code',
      'status_name',
      'status_label_number',
      'status_with_site_id',
      'frame_color',
      'paint_color',
      'text_color',
      'en_name',
      'ja_name',
      'cn_name',
      'kr_name',
      'status_with_class_id',
      'enable_flag',
      'ts_update',
      'ts_regist',
    )
    .where('delete_flag', flag.FALSE)
    .where('status_code', status_code)
  return await query
}

const getStatusLabelByStatusCode = async (status_code) => {
  const query = db('m_status')
    .select(
      'id',
      'status_code',
      'status_name',
      'status_label_number',
      'status_with_site_id',
      'enable_flag',
    )
    .where('delete_flag', flag.FALSE)
    .where('status_code', status_code)
    .where('status_label_number', '<>', flag.FALSE )
  return await query
}

const updateStatus = async (id, dataUpdate) => {
  const result = await db.transaction(async (trx) => {
    const isUpdate = await trx('m_status')
      .where({
        id: id,
        delete_flag: flag.FALSE,
      })
      .update(dataUpdate)
    if (isUpdate) {
      return true
    } else {
      return false
    }
  })
  return result
}

const getStatusByID = async (id) => {
  const status = await db('m_status')
    .select(
      'id',
      'status_code',
      'status_name',
      'status_label_number',
      'status_with_site_id',
    )
    .where('id', id)
    .where('delete_flag', flag.FALSE)
    .first()
  return status
}

const checkStatusName = async (status, status_name_update, type) => {
  if (status.status_name === status_name_update) {
    return false
  }
  const query = db('m_status')
    .where('delete_flag', flag.FALSE)
  if (Number(type) === statusMasterFlag.STATUS_MASTER) {
    query.where({
      status_name: status_name_update,
      status_label_number: flag.FALSE,
    })
      .whereNot('status_code', status.status_code )
  } else if (Number(type) === statusMasterFlag.STATUS_LABEL) {
    query.where({
      status_name: status_name_update,
      status_code: status.status_code,
    })
      .where('status_label_number', '<>', flag.FALSE )
      .whereNot({
        status_label_number: status.status_label_number,
      })
      .where('status_label_number', '<>', flag.FALSE)
  }
  return (await query.first()) ? true : false
}

const getListStatusByClass = async (statusClass) => {
  try {
    return await db('m_status')
      .select(
        'id',
        'status_code',
        'status_name',
        'status_label_number',
        'en_name',
        'ja_name',
        'cn_name',
        'kr_name',
        'frame_color',
        'paint_color',
        'text_color',
        'status_with_class_id',
        'enable_flag',
        'status_with_site_id',
        'en_status_label_detail',
        'ja_status_label_detail',
        'cn_status_label_detail',
        'kr_status_label_detail',
      )
      .where({
        delete_flag: flag.FALSE,
      })
      .where(db.raw('status_with_class_id REGEXP ?', [`(^|,)${statusClass.join('|')}($|,)`]))
      .orderBy('status_code', 'asc')
  } catch (error) {
    console.log(error)
    return null
  }
}

const checkExistStatusLabel = async (status_code, status_label_number) => {
  const query = await db('m_status')
    .where('delete_flag', flag.FALSE)
    .where('status_code', status_code)
    .where('status_label_number', status_label_number )
    .where('enable_flag', flag.TRUE )
    .first()
  return query ? true : false
}

module.exports = {
  getListStatus,
  getStatusMaster,
  getDetailByStatusCode,
  updateStatus,
  checkStatusName,
  getStatusByID,
  getStatusLabelByStatusCode,
  getListStatusByClass,
  checkExistStatusLabel,
}
