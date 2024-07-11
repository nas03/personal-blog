/* eslint-disable require-jsdoc */
const db = require('db').helper
const flag = require('constant').flag
const utility = require('utility')
const { displayDateTime } = require('constant')

async function getSites() {
  const result = await db('m_site')
    .where('delete_flag', flag.FALSE)
    .where('enable_flag', flag.TRUE)
    .select(
      'site_name',
      'id as code',
      'site_url',
      'symbol_logo_path',
      'symbol_logo_name',
      'side_logo_path',
      'side_logo_name',
      'display_order',
      'enable_flag',
    )
    .orderBy('display_order', 'asc')
  return result
}

async function getAllSites() {
  const result = await db('m_site')
    .where('delete_flag', flag.FALSE)
    .select(
      'id',
      'id as code',
      'site_name',
      'media_name',
      'site_url',
      'symbol_logo_path',
      'symbol_logo_name',
      'side_logo_path',
      'side_logo_name',
      'display_order',
      'enable_flag',
    )
    .orderBy('display_order', 'asc')
  return result
}

const getListSite = async (pagination, queryString) => {
  const query = db('m_site as ms')
    .where('delete_flag', flag.FALSE)
    .select(
      'id',
      'site_name',
      'media_name',
      'service_type',
      'site_url',
      'symbol_logo_path',
      'symbol_logo_name',
      'side_logo_path',
      'side_logo_name',
      'display_order',
      'enable_flag',
      'ts_update',
      'ts_regist',
    )

  if (Number(queryString.show_valid) === flag.TRUE) {
    query.where('enable_flag', flag.TRUE)
  }

  if (queryString.search_key) {
    queryString.search_key = utility.escapeSql(queryString.search_key)

    // handle display datetime
    let formatDisplay
    switch (queryString.display_date_time) {
      case displayDateTime.MM_DD_YYYY:
        formatDisplay = '%m.%d.%Y'
        break
      case displayDateTime.DD_MM_YYYY:
        formatDisplay = '%d.%m.%Y'
        break
      default:
        formatDisplay = '%Y.%m.%d'
        break
    }

    // handle timezone
    const utc = (queryString.utc || '').replace(/[()UTC]/g, '') || '+00:00'

    // where clauses
    query.where(function() {
      /* eslint-disable no-invalid-this */
      this.whereILike('ms.site_name', `%${queryString.search_key}%`)
        .orWhereILike('ms.media_name', `%${queryString.search_key}%`)
        .orWhereILike(db.raw('REPLACE(service_type, \'-\', \' \')'), `%${queryString.search_key}%`)
        .orWhereILike('ms.site_url', `%${queryString.search_key}%`)
        .orWhereILike('ms.symbol_logo_name', `%${queryString.search_key}%`)
        .orWhereILike('ms.side_logo_name', `%${queryString.search_key}%`)
        .orWhereILike('ms.display_order', `%${queryString.search_key}%`)
        .orWhereILike(db.raw(`DATE_FORMAT(CONVERT_TZ(ts_update, "+00:00","${utc}"),"${formatDisplay} %H:%i")`), `%${queryString.search_key}%`)
        .orWhereILike(db.raw(`DATE_FORMAT(CONVERT_TZ(ts_regist, "+00:00","${utc}"),"${formatDisplay} %H:%i")`), `%${queryString.search_key}%`)
    })
  }

  let orderArr
  if (queryString.sort) {
    orderArr = [...pagination.sort]
  } else {
    orderArr = [{ column: 'ms.display_order', order: 'ASC' }]
  }

  const countRecord = db('m_site as ms')
    .where('delete_flag', flag.FALSE)
    .count('id as totals')
    .first()

  return await Promise.all([query.orderBy(orderArr).paginate(pagination), countRecord])
}

const getListSites = async ()=>{
  try {
    return await db('m_site')
      .select(
        'id as site_id',
        'site_name',
      )
      .where({
        'delete_flag': flag.FALSE,
      })
  } catch (error) {
    console.log(error)
    return false
  }
}

const createSiteMaster = async (form) => {
  const siteDisplayOrderMax = await db('m_site')
    .select(
      'display_order',
    )
    .where('delete_flag', flag.FALSE)
    .orderBy('display_order', 'desc')
    .first()

  const result = await db('m_site')
    .insert({ ...form, display_order: Number(siteDisplayOrderMax.display_order) + 1 })
  return result
}

const checkExistSiteField = async (site_name = null, media_name = null, site_url = null, symbol_logo = null, side_logo = null, id = null) => {
  const query = db('m_site as ms')
    .select(
      'site_name',
      'media_name',
      'site_url',
      'symbol_logo_name',
      'side_logo_name',
    )
    .where('delete_flag', flag.FALSE)

  if (id) {
    query.where('id', '<>', id)
  }

  query.where(function() {
    /* eslint-disable no-invalid-this */
    this.whereRaw('BINARY site_name = ?', site_name)
      .orWhereRaw('BINARY media_name = ?', media_name)
      .orWhereRaw('BINARY site_url = ?', site_url)
      .orWhereRaw('BINARY symbol_logo_name = ?', symbol_logo)
      .orWhereRaw('BINARY side_logo_name = ?', side_logo)
  })
  return await query
}

const updateSiteMaster = async (site_id, objUpdate) => {
  const result = await db.transaction(async (trx) => {
    const isUpdate = await trx('m_site')
      .where({
        id: site_id,
        delete_flag: flag.FALSE,
      })
      .update(objUpdate)
    if (isUpdate) {
      return true
    } else {
      return false
    }
  })
  return result
}

const getSiteById = async (site_id) => {
  const result = await db('m_site')
    .select(
      'id',
      'site_name',
      'display_order',
      'enable_flag',
    )
    .where('delete_flag', flag.FALSE)
    .where('id', site_id)
    .first()
  return result
}

const updateDisplayOrder = async (site_id, display_order_site, data) => {
  try {
    const siteByDisplay = await db('m_site')
      .select(
        'id',
        'display_order',
      )
      .where('delete_flag', flag.FALSE)
      .where('display_order', Number(display_order_site) + Number(data))
      .first()
    if (!siteByDisplay) {
      throw Object.assign(new Error('update m_site failed'), { isCustomError: true })
    }
    await db.transaction(async (trx) => {
      const isUpdateSite1 = await trx('m_site')
        .where({
          id: site_id,
          delete_flag: flag.FALSE,
        })
        .increment('display_order', Number(data))
      if (!isUpdateSite1) {
        throw Object.assign(new Error('update m_site 1 failed'), { isCustomError: true })
      }
      const isUpdateSite2 = await trx('m_site')
        .where({
          id: siteByDisplay.id,
          delete_flag: flag.FALSE,
        })
        .increment('display_order', -Number(data))
      if (!isUpdateSite2) {
        throw Object.assign(new Error('update m_site 2 failed'), { isCustomError: true })
      }
      return true
    })
    return { isError: false }
  } catch (error) {
    console.log(error)
    if (error.isCustomError) {
      return { isError: true, error: error }
    }
    throw error
  }
}

const checkSiteMaster = async (obj) => {
  const query = db('m_site as ms')
    .select('id')
    .whereRaw(`BINARY ${Object.keys(obj)[0]} = ?`, Object.values(obj)[0])
    .where('delete_flag', flag.FALSE)
    .first()
  return await query
}

const getSiteMaster = async (obj) => {
  const result = await db('m_site')
    .select(
      'id',
      'site_name',
      'display_order',
      'enable_flag',
    )
    .where('delete_flag', flag.FALSE)
    .where(obj)
    .first()
  return result
}

const getAll = async (isShowOnlyEnable, isShowFullDeleted = false) => {
  const query = db('m_site as ms')
    .select(
      'id',
      'site_name',
      'media_name',
      'site_url',
      'symbol_logo_path',
      'symbol_logo_name',
      'side_logo_path',
      'side_logo_name',
      'display_order',
      'enable_flag',
      'ts_update',
      'ts_regist',
    )

  if (isShowFullDeleted === false) {
    query.where('delete_flag', flag.FALSE)
  }

  if (isShowOnlyEnable === 'true' || isShowOnlyEnable === true) {
    query.where('enable_flag', flag.TRUE)
  }

  return await query.orderBy('display_order', 'asc')
}

const getListSiteMenuStatusMaster = async () => {
  const query = db('m_site as ms')
    .select(
      'id',
      'media_name as site_name',
      'enable_flag',
    )
    .where('delete_flag', flag.FALSE)
    .orderBy('display_order', 'asc')

  return await query
}

module.exports.getSites = getSites
module.exports.getAllSites = getAllSites
module.exports.getAll = getAll
module.exports.getListSite = getListSite
module.exports.getListSites = getListSites
module.exports.createSiteMaster = createSiteMaster
module.exports.checkExistSiteField = checkExistSiteField
module.exports.checkSiteMaster = checkSiteMaster
module.exports.updateSiteMaster = updateSiteMaster
module.exports.getSiteById = getSiteById
module.exports.updateDisplayOrder = updateDisplayOrder
module.exports.getListSiteMenuStatusMaster = getListSiteMenuStatusMaster
module.exports.getSiteMaster = getSiteMaster
