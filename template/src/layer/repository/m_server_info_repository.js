const { tradingAccountType, flag, commonSiteId } = require('constant')

const utility = require('utility')

/* DB */
const db = require('db').helper

const getServerInfo = async () => {
  const result = await db('m_mt_servers')
    .select(
      'id',
      'server_name',
      'account_mode as trading_account_kind',
      'platform',
      'account_type_id',
    )
    .where('account_mode', tradingAccountType.REAL)

  return result.length ? result : null
}

const getServerById = async (id) => {
  try {
    const result = await db('m_mt_servers')
      .select(
        'id',
        'server',
        'server_name',
        'account_mode as trading_account_kind',
        'platform',
        'server_key',
        'env_param_name',
        'fqdn_name',
        'account_type_id',
      )
      .where('id', id)
      .first()

    return result
  } catch (error) {
    console.log(error)
    return null
  }
}

const getAllMtServerInfo = async (isOrderDefault, isEnable) => {
  const query = db('m_mt_servers')
    .select(
      'id',
      'server_name',
      'server_key',
      'platform',
      'env_param_name',
    )

  if (isEnable) {
    query.where('enable_flag', flag.TRUE)
  }

  if (isOrderDefault) {
    query.orderBy( [{ column: 'id', order: 'DESC' }])
  }

  const result = await query

  return result.length ? result : null
}

const getListServerInfo = async (pagination, queryString) => {
  try {
    const query = db('m_mt_servers as mts')
      .leftJoin('m_account_type as mat', function() {
      /* eslint-disable no-invalid-this */
        this
          .on('mat.id', 'mts.account_type_id')
          .on('mat.delete_flag', flag.FALSE)
      })
      .leftJoin('m_site as ms', function() {
        /* eslint-disable no-invalid-this */
        this
          .on('ms.id', 'mts.site_id')
          .on('ms.delete_flag', flag.FALSE)
      })
      .select(
        'mts.id',
        'mts.server',
        'mts.site_id',
        'ms.site_name',
        'mts.server_name',
        'mts.account_mode',
        'mts.platform',
        'mts.fqdn_name',
        'mts.account_type_id',
        'mat.account_type_name',
        'mts.server_key',
        'mts.env_param_name',
        'mts.enable_flag',
        'mts.ts_update',
        'mts.ts_regist',
      )
      .where('mts.site_id', commonSiteId.FXT)
      .where('mts.delete_flag', flag.FALSE)
      .where('ms.enable_flag', flag.TRUE)

    if (Number(queryString.show_valid) === flag.TRUE) {
      query.where('mts.enable_flag', flag.TRUE)
    }

    if (queryString.search_key) {
      queryString.search_key = utility.escapeSql(queryString.search_key)
      query.where(function() {
        /* eslint-disable no-invalid-this */
        this.whereILike('mts.server', `%${queryString.search_key}%`)
          .orWhereILike('mts.account_mode', `%${queryString.search_key}%`)
          .orWhereILike('mat.account_type_name', `%${queryString.search_key}%`)
          .orWhereILike('ms.site_name', `%${queryString.search_key}%`)
          .orWhereILike('mts.platform', `%${queryString.search_key}%`)
          .orWhereILike('mts.server_name', `%${queryString.search_key}%`)
          .orWhereILike('mts.server_key', `%${queryString.search_key}%`)
          .orWhereILike('mts.env_param_name', `%${queryString.search_key}%`)
          .orWhereILike('mts.fqdn_name', `%${queryString.search_key}%`)
          .orWhereILike('mts.id', `%${queryString.search_key}%`)
          .orWhereILike(db.raw('DATE_FORMAT(mts.ts_update,"%Y.%m.%d %H:%i:%s")'), `%${queryString.search_key}%`)
          .orWhereILike(db.raw('DATE_FORMAT(mts.ts_regist,"%Y.%m.%d %H:%i:%s")'), `%${queryString.search_key}%`)
      } )
    }

    let orderArr
    if (queryString.sort) {
      orderArr = [...pagination.sort, { column: 'mts.id', order: 'DESC' }]
    } else {
      orderArr = [{ column: 'mts.id', order: 'DESC' }]
    }

    return await query.orderBy(orderArr).paginate(pagination)
  } catch (error) {
    console.log(error)
    return null
  }
}

const checkExitField = async (server_name = null, fqdn_name = null, server_key = null, id = null) => {
  try {
    const query = db('m_mt_servers')
      .select(
        'id',
        'server_name',
        'server_key',
        'fqdn_name',
      )
      .where('server_name', server_name)
      .where('fqdn_name', fqdn_name)
      .where('server_key', server_key)

    if (id) {
      query.where('id', '<>', id)
    }

    return await query
  } catch (error) {
    console.log(error)
    return null
  }
}

const createMTServer = async (form) => {
  const result = await db('m_mt_servers')
    .insert(form)
  return result
}

const updateMTServer = async (id, dataUpdate) => {
  const result = await db.transaction(async (trx) => {
    const isUpdate = await trx('m_mt_servers')
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

const getMTServerById = async (id) => {
  try {
    const result = await db('m_mt_servers')
      .select(
        'id',
        'server_name',
        'platform',
        'server_key',
        'fqdn_name',
        'account_mode',
        'platform',
        'account_type_id',
        'site_id',
        'server',
        'env_param_name',
      )
      .where('id', id)
      .where('delete_flag', flag.FALSE)
      .first()

    return result
  } catch (error) {
    console.log(error)
    return null
  }
}

const getMTServers = async (obj) => {
  try {
    const result = await db('m_mt_servers')
      .select(
        'id',
        'server_name',
        'platform',
        'server_key',
        'fqdn_name',
        'account_mode',
        'platform',
        'account_type_id',
        'site_id',
        'server',
        'env_param_name',
      )
      .where(obj)
      .where('delete_flag', flag.FALSE)
      .where('enable_flag', flag.TRUE)
      .where('site_id', commonSiteId.FXT)

    return result
  } catch (error) {
    console.log(error)
    return null
  }
}

module.exports = {
  getServerInfo,
  getServerById,
  getAllMtServerInfo,
  getListServerInfo,
  checkExitField,
  createMTServer,
  updateMTServer,
  getMTServerById,
  getMTServers,
}
