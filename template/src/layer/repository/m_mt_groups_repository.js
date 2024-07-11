const { flag, commonSiteId, displayDateTime, registrationType } = require('constant')

const db = require('db').helper
const utility = require('utility')

const checkExisted = async (payload, id) => {
  const isExisted = db('m_mt_groups')
    .where(payload)

  if (id) {
    isExisted.where('id', '<>', id)
  }

  const result = await isExisted
  return result.length ? true : false
}


const getListMTGroup = async (filter, pagination) => {
  try {
    const query = db('m_mt_groups as mtg')
      .leftJoin('m_site', 'm_site.id', 'mtg.site_id')
      .leftJoin('m_account_leverage', 'm_account_leverage.id', 'mtg.account_leverage_id')
      .leftJoin('m_account_type', 'm_account_leverage.account_type_id', 'm_account_type.id')
      .select(
        'mtg.id',
        'mtg.server',
        'm_site.id as site_id',
        'm_site.site_name',
        'mtg.platform',
        'm_account_leverage.account_leverage',
        'm_account_leverage.account_type_id',
        'm_account_type.account_type_name',
        'mtg.currency',
        'mtg.account_mode',
        'mtg.account_leverage_id',
        'mtg.a_book_group_name',
        'mtg.a_api_params',
        'mtg.b_book_group_name',
        'mtg.b_api_params',
        'mtg.enable_flag',
        'mtg.ts_regist',
        'mtg.ts_update',
        db.raw('CAST(SUBSTRING_INDEX(m_account_leverage.account_leverage, ":",-1) AS UNSIGNED) as account_leverage_order'),
      )
      .where('m_site.enable_flag', flag.TRUE)
    if (filter.search) {
      const search = utility.escapeSql(filter.search)

      // handle display datetime
      let formatDisplay
      switch (filter.display_date_time) {
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
      const utc = (filter.utc || '').replace(/[()UTC]/g, '') || '+00:00'

      query.where(function() {
        /* eslint-disable no-invalid-this */
        this.whereILike('mtg.id', `%${search}%`)
          .orWhereILike('m_site.site_name', `%${search}%`)
          .orWhereILike('mtg.server', `%${search}%`)
          .orWhereILike('mtg.platform', `%${search}%`)
          .orWhereILike('m_account_type.account_type_name', `%${search}%`)
          .orWhereILike('mtg.account_mode', `%${search}%`)
          .orWhereILike('mtg.currency', `%${search}%`)
          .orWhereILike('m_account_leverage.account_leverage', `%${search}%`)
          .orWhereILike('mtg.a_book_group_name', `%${search}%`)
          .orWhereILike('mtg.a_api_params', `%${search}%`)
          .orWhereILike('mtg.b_book_group_name', `%${search}%`)
          .orWhereILike('mtg.b_api_params', `%${search}%`)
          .orWhereILike(db.raw(`DATE_FORMAT(CONVERT_TZ(mtg.ts_update, "+00:00","${utc}"),"${formatDisplay} %H:%i:%S")`), `%${search}%`)
          .orWhereILike(db.raw(`DATE_FORMAT(CONVERT_TZ(mtg.ts_regist, "+00:00","${utc}"),"${formatDisplay} %H:%i:%S")`), `%${search}%`)
      })
    }

    if (Number(filter.show_valid) === flag.TRUE) {
      query.where('mtg.enable_flag', flag.TRUE)
    }

    return await query.orderBy([{ column: pagination.sort[0].column, order: pagination.sort[0].order },
      { column: 'id', order: 'DESC' }]).paginate(pagination)
  } catch (error) {
    console.log(error)
    return false
  }
}

const createMTGroup = async (payload) => {
  const create = await db('m_mt_groups')
    .insert(payload)

  return create
}

const updateMTGroup = async (payload, id) => {
  const update = await db('m_mt_groups')
    .update(payload)
    .where('id', id)
  return update
}

const getMTgroups = async (trading_account, server = null) => {
  const result = db('m_mt_groups')
    .select(
      'id',
      'site_id',
      'server',
      'platform',
      'currency',
      'account_mode',
      'a_book_group_name',
      'a_api_params',
      'b_book_group_name',
      'b_api_params',
    )
    .where({
      platform: trading_account.platform,
      account_mode: trading_account.account_mode,
      account_leverage_id: trading_account.account_leverage_id,
      currency: trading_account.currency,
      site_id: commonSiteId.FXT,
      registration_type: registrationType.DIRECT,
    })
    .where('enable_flag', flag.TRUE)
    .where('delete_flag', flag.FALSE)

  if (server) {
    result.where('server', server)
  }

  return await result
}

const getDetailMTGroup = async (id) => {
  try {
    const result = await db('m_mt_groups')
      .select(
        'id',
        'site_id',
        'server',
        'platform',
        'currency',
        'account_mode',
        'a_book_group_name',
        'a_api_params',
        'b_book_group_name',
        'b_api_params',
      )
      .where('id', id)
      .where('enable_flag', flag.TRUE)
      .where('delete_flag', flag.FALSE)
      .first()
    return await result
  } catch (error) {
    console.log(error)
    return null
  }
}

module.exports = {
  checkExisted,
  getListMTGroup,
  createMTGroup,
  updateMTGroup,
  getMTgroups,
  getDetailMTGroup,
}
