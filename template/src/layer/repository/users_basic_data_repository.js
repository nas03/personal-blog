const { flag, statusCode, commonSiteId, dateFormat, userBasicClass, displayDateTime, customerRankConstant, classiFication,
  statusClassConstant, typeWallet, walletStatus, tokenAuthorityClass, accessTypeGeneralAccessList, listTypeGeneralAccessList,
  actionMethod, messageId, regCategory, errorMessageCodeConstant } = require('constant')

const db = require('db').helper

const utility = require('utility')
const moment = require('moment')
const { createResponseAndLog } = require('./error_log_repository')

const getUserLoginData = async (payload) =>{
  try {
    const userData = await db('users_basic_data as ubd')
      .innerJoin(getUserAccountStatus(), 'gsh.target_id', 'ubd.id')
      .leftJoin('users_portal_data as upd', 'ubd.id', 'upd.user_basic_data_id')
      .leftJoin('m_authorization', 'm_authorization.id', 'ubd.authorization_id')
      .leftJoin('m_countries', 'm_countries.id', 'ubd.phone_number_country_id')
      .leftJoin('m_timezones', 'm_timezones.id', 'upd.display_time_zone_id')
      .select(
        'ubd.id',
        'ubd.authorization_id',
        'ubd.hash_password',
        'ubd.email',
        'ubd.first_name_romaji',
        'ubd.last_name_romaji',
        db.raw('CONCAT(ubd.first_name_romaji, " ", ubd.last_name_romaji) as full_name'),
        'ubd.phone_number_country_id',
        'ubd.phone_number',
        'ubd.twofa_required_flag',
        'ubd.google_sso_required_flag',
        'gsh.status_code as account_status_code',
        'ubd.admin_with_site_id',
        'upd.pass_login_base_flag',
        'upd.twofa_flag',
        'upd.twofa_method_class',
        'upd.google_sso_flag',
        'upd.login_notify_flag',
        'upd.language_email',
        'upd.language_portal',
        'upd.display_date_time',
        'upd.display_time_zone_id as display_time_zone',
        'm_authorization.authorization_name',
        'm_countries.country_number',
        'm_timezones.timezone',
      )
      .where(payload)
      .where('ubd.delete_flag', flag.FALSE)
      .first()
    return userData
  } catch (error) {
    console.log(error)
    return false
  }
}

const getUserData = async (id) =>{
  const lastLoginHistory = await db('user_access_history')
    .where({
      user_basic_data_id: id,
      is_success: flag.TRUE,
      site_id: commonSiteId.P2TECH,
      delete_flag: flag.FALSE,
    })
    .orderBy('id', 'DESC')
    .first()
  const userData = await db('users_basic_data as ubd')
    .innerJoin(getUserAccountStatus(), 'gsh.target_id', 'ubd.id')
    .leftJoin('users_portal_data as upd', 'ubd.id', 'upd.user_basic_data_id')
    .leftJoin('m_authorization', 'm_authorization.id', 'ubd.authorization_id')
    .leftJoin('m_countries', 'm_countries.id', 'ubd.phone_number_country_id')
    .leftJoin('m_timezones', 'upd.display_time_zone_id', 'm_timezones.id')
    .select(
      'ubd.id',
      'ubd.authorization_id',
      'ubd.admin_with_site_id as siteIds',
      'ubd.email',
      'ubd.hash_password',
      'ubd.first_name_romaji',
      'ubd.last_name_romaji',
      db.raw('CONCAT(ubd.first_name_romaji, " ", ubd.last_name_romaji) as full_name'),
      'ubd.phone_number_country_id',
      'ubd.phone_number',
      'ubd.twofa_required_flag',
      'ubd.google_sso_required_flag',
      'gsh.status_code as account_status_code',
      'ubd.ts_regist',
      'upd.profile_picture_url',
      'upd.profile_picture_color',
      'upd.pass_login_base_flag',
      'upd.twofa_flag',
      'upd.twofa_method_class',
      'upd.google_sso_flag',
      'upd.login_notify_flag',
      'upd.language_email',
      'upd.language_portal',
      'upd.display_date_time',
      'upd.display_time_zone_id as display_time_zone',
      'm_authorization.authorization_name',
      'm_countries.country_number',
      'm_timezones.timezone',
    )
    .where({
      'ubd.id': id,
      'ubd.delete_flag': flag.FALSE,
    })
    .first()
  return { ...userData, last_login_date: lastLoginHistory.ts_regist }
}

const createAdmin = async (userPayload, tokenAuthPayload, historyPayload, payloadIPList) => {
  return await db.transaction(async (trx) => {
    // insert to users_basic_data from payload
    const insert = await trx('users_basic_data').insert(userPayload)

    // insert to token_authority
    await trx('token_authority').insert({
      target_id: insert[0],
      ...tokenAuthPayload,
    })

    // insert general_status_history
    await trx('general_status_history').insert({
      target_id: insert[0],
      ...historyPayload,
    })

    // insert general_access_list allow list
    if (payloadIPList.length) {
      const listPayloadIpInsert = payloadIPList.map((item) => {
        return {
          user_basic_data_id: insert[0],
          ...item,
        }
      })
      await trx('general_access_list').insert(listPayloadIpInsert)
    }

    return true
  })
}

const checkMailExitsInSystem = async (email) => {
  return await db('users_basic_data')
    .where({
      email,
      site_id: commonSiteId.P2TECH,
      delete_flag: flag.FALSE,
    })
    .first()
}

const getStaffUserData = async (payload) =>{
  const staffId = payload['users_basic_data.id'] || null
  const query = db('users_basic_data')
    .innerJoin(getUserAccountStatus(staffId), 'gsh.target_id', 'users_basic_data.id')
    .leftJoin('users_portal_data', 'users_portal_data.user_basic_data_id', 'users_basic_data.id')
    .leftJoin('m_authorization', 'm_authorization.id', 'users_basic_data.authorization_id')
    .leftJoin('m_timezones', 'm_timezones.id', 'users_portal_data.display_time_zone_id')
    .leftJoin('m_countries', 'm_countries.id', 'users_basic_data.phone_number_country_id')
    .select(
      'users_basic_data.id',
      'users_basic_data.hash_password',
      'users_basic_data.email',
      'users_basic_data.admin_flag',
      'users_basic_data.admin_with_site_id',
      'users_basic_data.first_name_romaji',
      'users_basic_data.last_name_romaji',
      db.raw('CONCAT(users_basic_data.first_name_romaji, " ", users_basic_data.last_name_romaji) as full_name'),
      'users_basic_data.phone_number_country_id',
      'users_basic_data.phone_number',
      'users_basic_data.twofa_required_flag',
      'users_basic_data.google_sso_required_flag',
      'gsh.status_code as account_status_code',
      db.raw(`
          CASE
            WHEN gsh.status_code = ${statusCode.REGISTERED} OR gsh.status_code = ${statusCode.ACTIVATED}
            THEN TRUE ELSE FALSE
          END AS resend_flag
        `),
      db.raw(`CASE WHEN gsh.status_code = ${statusCode.APPROVED} THEN TRUE ELSE FALSE END AS enable_flag`),
      'users_portal_data.profile_picture_url',
      'users_portal_data.profile_picture_color',
      'users_portal_data.profile_picture_name',
      'users_portal_data.twofa_flag',
      'users_portal_data.twofa_method_class',
      'users_portal_data.google_sso_flag',
      'users_portal_data.login_notify_flag',
      'users_portal_data.language_email',
      'users_portal_data.language_portal',
      'users_portal_data.display_date_time',
      'users_portal_data.display_time_zone_id as display_time_zone',
      'users_basic_data.authorization_id',
      'm_authorization.authorization_name',
      'm_timezones.timezone',
      'm_countries.country_number',
    )
    .where({
      ...payload,
      'users_basic_data.delete_flag': flag.FALSE,
      'users_basic_data.site_id': commonSiteId.P2TECH,
    })
    .first()
  return await query
}

const getListStaffs = async (queryString, pagination) => {
  // Handle sort
  let orderArr = [{ column: 'ubd.ts_regist', order: 'DESC' }]
  if (queryString.sort) {
    if (queryString.sort.includes('first_name_romaji')) {
      pagination.sort.push({ column: 'last_name_romaji', order: pagination.sort[0].order })
    }
    orderArr = [...pagination.sort, { column: 'id', order: 'DESC' }]
  }

  // Sub query to get user_access_history data rank sorted by user_basic_data_id
  const queryLoginDate = db('user_access_history')
    .select('user_basic_data_id')
    .max('ts_regist as ts_regist')
    .groupBy('user_basic_data_id')
    .where({
      delete_flag: flag.FALSE,
      site_id: commonSiteId.P2TECH,
      is_success: flag.TRUE,
    })
    .as('uah')

  // Get a list of staff and their authorizations
  const queryStaffs = db('users_basic_data as ubd')
    .innerJoin(getUserAccountStatus(), 'gsh.target_id', 'ubd.id')
    .leftJoin('m_authorization as ma', 'ubd.authorization_id', 'ma.id')
    .leftJoin('users_portal_data as upd', 'ubd.id', 'upd.user_basic_data_id')
    .leftJoin(queryLoginDate, function() {
      // eslint-disable-next-line no-invalid-this
      this.on('ubd.id', 'uah.user_basic_data_id')
    })
    .where('ubd.delete_flag', flag.FALSE)
    .where('ma.delete_flag', flag.FALSE)
    .where(function() {
      if (queryString.search) {
        const textSearch = utility.escapeSql(queryString.search)

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

        // eslint-disable-next-line no-invalid-this
        this.whereILike(db.raw('CONCAT(ubd.first_name_romaji, \' \' , ubd.last_name_romaji)'), `%${textSearch}%`)
          .orWhereILike('ubd.email', `%${textSearch}%`)
          .orWhereILike('ma.authorization_name', `%${textSearch}%`)
          .orWhereILike(db.raw(`DATE_FORMAT(CONVERT_TZ(uah.ts_regist, "+00:00","${utc}"),"${formatDisplay} %H:%i:%S")`), `%${textSearch}%`)
          .orWhereILike(
            db.raw(
              `DATE_FORMAT(CONVERT_TZ(COALESCE(GREATEST(ubd.ts_update, upd.ts_update), ubd.ts_update, upd.ts_update), "+00:00","${utc}"),
                "${formatDisplay} %H:%i:%S")`,
            ),
            `%${textSearch}%`,
          )
      }
    })

    .select(
      'ubd.id',
      'ubd.first_name_romaji',
      'ubd.last_name_romaji',
      'upd.profile_picture_url',
      'upd.profile_picture_color',
      'ubd.email',
      db.raw(`
          CASE
            WHEN gsh.status_code = ${statusCode.REGISTERED} OR gsh.status_code = ${statusCode.ACTIVATED} THEN TRUE
            ELSE FALSE
          END AS resend_flag
        `),
      db.raw(`CASE WHEN gsh.status_code = ${statusCode.APPROVED} THEN TRUE ELSE FALSE END AS enable_flag`),
      'ubd.admin_flag',
      'ubd.admin_with_site_id',
      db.raw('LENGTH(??) - LENGTH(REPLACE(??, ",", "")) + 1 as ??', ['ubd.admin_with_site_id', 'ubd.admin_with_site_id', 'site_amount']),
      'upd.google_sso_flag',
      'upd.twofa_flag',
      'uah.ts_regist as last_login_date',
      'ubd.ts_regist',
      db.raw('COALESCE(GREATEST(ubd.ts_update, upd.ts_update), ubd.ts_update, upd.ts_update) AS ts_update'),
      'ubd.authorization_id',
      'ma.authorization_name as authorization_name',
      'ma.ja_description as ja_authorization_name',
      'ma.en_description as en_authorization_name',
      'ma.cn_description as cn_authorization_name',
      'ma.kr_description as kr_authorization_name',
    )

  if (queryString.show_valid === '1') {
    queryStaffs.where('gsh.status_code', statusCode.APPROVED)
  }

  if (queryString.site_ids) {
    // SEARCH admin_with_site_id BY REGEX
    queryStaffs.where(db.raw('ubd.admin_with_site_id REGEXP ?', [`(^|,)${queryString.site_ids.replace(/,/g, '|')}($|,)`]))
  }

  if (queryString.users_role) {
    queryStaffs.whereIn('ubd.authorization_id', queryString.users_role.split(','))
  }

  return await queryStaffs.orderBy(orderArr).paginate(pagination)
}

async function updateUserBasicData(id, payload) {
  return await db('users_basic_data').update(payload).where('id', id)
}

const getListUserAccount = async (pagination, queryString, isExport) => {
  // Sub query to get user_access_history data rank sorted by user_basic_data_id
  const queryLoginDate = db('user_access_history')
    .select('user_basic_data_id')
    .max('ts_regist as ts_regist')
    .groupBy('user_basic_data_id')
    .where({
      delete_flag: flag.FALSE,
      is_success: flag.TRUE,
    })
    .whereNot('site_id', commonSiteId.P2TECH)
    .as('uah')

  const query = db('users_basic_data as users')
    .leftJoin('m_site', 'users.site_id', 'm_site.id')
    .leftJoin('m_countries', 'users.country_id', 'm_countries.id')
    .leftJoin('users_management_data', 'users_management_data.user_basic_data_id', 'users.id')
    .leftJoin('users_corporate as uc', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('users.id', 'uc.user_basic_data_id')
        .on('uc.beneficial_owner', flag.FALSE)
    })
    .leftJoin(queryLoginDate, 'users.id', 'uah.user_basic_data_id')
    .innerJoin(getUserAccountStatus(), 'gsh.target_id', 'users.id')
    .leftJoin('m_status as ms1', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('ms1.status_code', 'gsh.status_code')
        .on('ms1.status_label_number', 0)
        .on('ms1.delete_flag', flag.FALSE)
    })
    .leftJoin('users_basic_data as admin', 'gsh.updated_by_user_id', 'admin.id')
    .leftJoin('m_status as ms2', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('ms2.status_code', 'gsh.status_code')
        .on('ms2.status_label_number', '<>', 0)
        .on('ms2.status_label_number', 'gsh.status_label_number')
        .on('ms2.delete_flag', flag.FALSE)
    })
    .leftJoin('m_status as ms3', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('ms3.status_code', 'users_management_data.support_status_code')
        .on('ms3.status_label_number', 0)
        .on('ms3.delete_flag', flag.FALSE)
    })
    .select(
      'uc.corporate_name_english',
      'users.id',
      'users.site_id',
      'm_site.site_name',
      'm_site.symbol_logo_path',
      'm_site.symbol_logo_name',
      'm_site.side_logo_path',
      'm_site.side_logo_name',
      'users.member_id',
      'gsh.status_code as account_status',
      'ms1.status_name as account_status_name',
      'ms1.en_name as account_status_name_en',
      'ms1.ja_name as account_status_name_ja',
      'ms1.cn_name as account_status_name_cn',
      'ms1.kr_name as account_status_name_kr',
      'ms1.frame_color as account_status_frame_color',
      'ms1.paint_color as account_status_paint_color',
      'ms1.text_color as account_status_text_color',
      'ms2.status_label_number',
      'ms2.status_name as status_label_name',
      'ms2.en_name as status_label_name_en',
      'ms2.ja_name as status_label_name_ja',
      'ms2.cn_name as status_label_name_cn',
      'ms2.kr_name as status_label_name_kr',
      'ms2.en_status_label_detail as status_label_detail_en',
      'ms2.ja_status_label_detail as status_label_detail_ja',
      'ms2.cn_status_label_detail as status_label_detail_cn',
      'ms2.kr_status_label_detail as status_label_detail_kr',
      'users.corporate_flag as reg_category',
      'users_management_data.merchant_flag',
      db.raw(
        `CASE WHEN gsh.status_code = ${statusCode.PENDING} THEN TRUE ELSE FALSE END AS is_locked `,
      ),
      'users.country_id',
      'm_countries.country_name',
      'm_countries.japanese_notation as ja_notation',
      'm_countries.english_notation as en_notation',
      'm_countries.korean_notation as kr_notation',
      'm_countries.chinese_notation as cn_notation',
      'm_countries.file_name',
      'users_management_data.customer_rank',
      'users_management_data.partner_rank',
      'users.first_name_romaji',
      'users.last_name_romaji',
      'users.email',
      'users_management_data.test_flag',
      'users_management_data.attention_flag',
      'users_management_data.ekyc_level as kyc_level',
      db.raw('CONCAT(LEFT(admin.last_name_romaji,1),".",admin.first_name_romaji) as staff_name'),
      'users_management_data.support_by_admin_id as support_by_admin',
      'users_management_data.support_status_code',
      'ms3.status_name as support_status_name',
      'ms3.frame_color as support_frame_color',
      'ms3.paint_color as support_paint_color',
      'ms3.text_color as support_text_color',
      'ms3.en_name as support_status_en_name',
      'ms3.ja_name as support_status_ja_name',
      'ms3.cn_name as support_status_cn_name',
      'ms3.kr_name as support_status_kr_name',
      'users.ts_regist',
      'uah.ts_regist as last_login_date',
      'users.user_name',
      db.raw(
        `CASE 
            WHEN users.site_id = ${commonSiteId.MY_FOREX} 
              THEN CONCAT(users.first_name_romaji," ",users.last_name_romaji)
            WHEN (${queryString.nameType ? `"${queryString.nameType}"` : null} = "corporate" AND users.corporate_flag = 1) 
              THEN uc.corporate_name_english
            ELSE CONCAT(users.first_name_romaji," ",users.last_name_romaji)
          END AS fullName`,
      ),
      db.raw(`CASE 
          WHEN gsh.status_code = ${statusCode.REGISTERED} OR
            (gsh.status_code = ${statusCode.ACTIVATED} AND users.first_name_romaji IS NULL)
            THEN FALSE 
          ELSE TRUE
          END AS can_view_user_detail`,
      ),
      'gsh.ts_regist as ts_update',
      db.raw(`CASE
                WHEN gsh.action_method = ${actionMethod.SYSTEM_ACTION} THEN 'System Action'
                WHEN gsh.action_method = ${actionMethod.USER_ACTION} THEN 'User Action'
                WHEN gsh.action_method = ${actionMethod.OPERATOR_ACTION} THEN
                  COALESCE(CONCAT(LEFT(admin.last_name_romaji,1),".",admin.first_name_romaji), 'Operator Action', null)
                ELSE NULL END
                AS action_method_or_staff`),
    )
    .where({
      'users.delete_flag': flag.FALSE,
      'users.admin_flag': userBasicClass.USER,
      'm_site.enable_flag': flag.TRUE,
    })

  if (isExport) {
    const { utc, display_date_time } = queryString
    query.select(
      db.raw(
        `CASE WHEN gsh.status_code = ${statusCode.PENDING} THEN 'Locked!' ELSE null END AS is_locked `,
      ),
      db.raw(
        `CASE WHEN users.corporate_flag = ${flag.TRUE} THEN 'Corporate' ELSE 'Personal' END AS reg_category `,
      ),
      db.raw(
        `CASE WHEN users_management_data.merchant_flag = ${flag.TRUE} THEN 'Merchant' ELSE null END AS merchant_flag `,
      ),
      db.raw(
        `CASE WHEN users_management_data.customer_rank = ${customerRankConstant.FIRST} THEN '1st' ` +
          `WHEN users_management_data.customer_rank = ${customerRankConstant.SECOND} THEN '2nd' ` +
          `WHEN users_management_data.customer_rank = ${customerRankConstant.THIRD} THEN '3rd' ` +
          `WHEN users_management_data.customer_rank = ${customerRankConstant.FOURTH} THEN '4th' END AS customer_rank `,
      ),
      db.raw(
        `CASE WHEN users_management_data.test_flag = ${flag.TRUE} THEN 'Test' ELSE null END AS test_flag `,
      ),
      db.raw(
        `CASE WHEN users_management_data.attention_flag = ${flag.TRUE} THEN 'Attention' ELSE null END AS attention_flag `,
      ),
      db.raw(
        `DATE_FORMAT(CONVERT_TZ(users.ts_regist, "+00:00","${utc}"),"${display_date_time} %H:%i") as ts_regist_csv`,
      ),
      db.raw(
        `DATE_FORMAT(CONVERT_TZ(uah.ts_regist, "+00:00","${utc}"),"${display_date_time} %H:%i") as last_login_date_csv`,
      ),
      db.raw(
        `CASE WHEN users_management_data.support_status_code = ${statusCode.WORKING} THEN 'Working' ELSE null END AS support_by_admin`,
      ),
      db.raw(
        `CASE 
          WHEN users_management_data.support_status_code = ${statusCode.WORKING} 
          THEN CONCAT(LEFT(admin.last_name_romaji,1),".",admin.first_name_romaji)
          ELSE null END AS staff_name`,
      ),
      db.raw(
        `DATE_FORMAT(CONVERT_TZ(gsh.ts_regist, "+00:00","${utc}"),"${display_date_time} %H:%i") as ts_update_csv`,
      ),
    )
  }

  // Search ID
  if (queryString.id) {
    queryString.id = utility.escapeSql(queryString.id)
    query.whereILike('users.id', `%${queryString.id}%`)
  }

  // Search M-ID
  if (queryString.member_id) {
    queryString.member_id = utility.escapeSql(queryString.member_id)
    query.whereILike('users.member_id', `%${queryString.member_id}%`)
  }

  // Search Created AND Last login date by calendar
  if (queryString.tsFrom || queryString.tsTo) {
    const tsFrom = moment(queryString.tsFrom)
      .startOf('day')
      .subtract(queryString.utc, 'hours')
      .format(dateFormat.DATE_TIME_ZONE)

    const tsTo = moment(queryString.tsTo)
      .endOf('day')
      .subtract(queryString.utc, 'hours')
      .format(dateFormat.DATE_TIME_ZONE)

    if (queryString.timeType === 'created') {
      query.whereBetween('users.ts_regist', [tsFrom, tsTo])
    } else if (queryString.timeType === 'lastLogin') {
      query.whereBetween('uah.ts_regist', [tsFrom, tsTo])
    }
  }

  // Search site by array id
  if (queryString.siteIds) {
    query.whereIn('users.site_id', queryString.siteIds)
  }

  // Search account status
  if (queryString.account_status) {
    query.whereIn('gsh.status_code', queryString.account_status)
  }

  // Search name
  if (queryString.fullName) {
    const textSearch = utility.escapeSql(queryString.fullName)
    query.where(
      function() {
        this.where(db.raw(`CONCAT(users.first_name_romaji," ",users.last_name_romaji) like "%${textSearch}%"`))
        if (queryString.nameType === 'corporate') {
          this.orWhereILike('uc.corporate_name_english', `%${textSearch}%`)
        }
      },
    )
  }

  // Search email
  if (queryString.email) {
    if (queryString.searchEmail === 'abs') {
      query.where('users.email', queryString.email)
    } else {
      queryString.email = utility.escapeSql(queryString.email)
      query.whereILike('users.email', `%${queryString.email}%`)
    }
  }

  // Search C-rank by array id
  if (queryString.customer_rank) {
    query.whereIn('users_management_data.customer_rank', queryString.customer_rank)
  }

  // Checkbox Personal or Corporate
  if (queryString.reg_category) {
    query.where('users.corporate_flag', queryString.reg_category)
  }

  // Checkbox Merchant
  if (queryString.merchant_flag) {
    query.where('users_management_data.merchant_flag', queryString.merchant_flag)
  }

  // Checkbox Test
  if (queryString.test_flag) {
    query.where('users_management_data.test_flag', queryString.test_flag)
  }

  if (queryString.kyc_level) {
    query.where('users.ekyc_level', queryString.kyc_level)
  }

  const orderArr = [...pagination.sort, { column: 'id', order: 'DESC' }]

  if (isExport) {
    return await query.orderBy(orderArr)
  }

  return await query.orderBy(orderArr).paginate(pagination)
}

const getDetailUserById = async (userId) => {
  try {
    return await db('users_basic_data')
      .leftJoin('users_management_data', 'users_management_data.user_basic_data_id', 'users_basic_data.id')
      .leftJoin('users_portal_data', 'users_portal_data.user_basic_data_id', 'users_basic_data.id')
      .leftJoin('m_countries', 'm_countries.id', 'users_basic_data.country_id')
      .leftJoin('m_countries as mc2', 'mc2.id', 'users_basic_data.phone_number_country_id')
      .leftJoin('m_site', 'm_site.id', 'users_basic_data.site_id')
      .leftJoin('users_personal', function() {
        /* eslint-disable no-invalid-this */
        this
          .on('users_basic_data.id', 'users_personal.user_basic_data_id')
          .on('users_personal.user_corporate_id', flag.FALSE)
          .on('users_personal.transaction_person', flag.FALSE)
          .on('users_personal.representative_person', flag.FALSE)
          .on('users_personal.beneficial_owner', flag.FALSE)
      })
      .leftJoin('fxs_xem_add_data', 'fxs_xem_add_data.user_basic_data_id', 'users_basic_data.id')
      .leftJoin(getUserAccountStatus(userId), 'gsh.target_id', 'users_basic_data.id')
      .leftJoin('m_status as ms', function() {
        /* eslint-disable no-invalid-this */
        this
          .on('ms.status_code', 'gsh.status_code')
          .on('ms.status_label_number', '<>', 0)
          .on('ms.status_label_number', 'gsh.status_label_number')
          .on('ms.delete_flag', flag.FALSE)
      })
      .leftJoin('m_status as ms1', function() {
        /* eslint-disable no-invalid-this */
        this
          .on('ms1.status_code', 'gsh.status_code')
          .on('ms1.status_label_number', 0)
          .on('ms1.delete_flag', flag.FALSE)
      })
      .leftJoin('m_status as ms2', function() {
        /* eslint-disable no-invalid-this */
        this
          .on('ms2.status_code', 'users_management_data.support_status_code')
          .on('ms2.status_label_number', 0)
          .on('ms2.delete_flag', flag.FALSE)
      })
      .select(
        'users_basic_data.id as user_id',
        'users_basic_data.member_id',
        'users_basic_data.first_name_romaji',
        'users_basic_data.last_name_romaji',
        'users_basic_data.email',
        'users_basic_data.site_id',
        'users_basic_data.corporate_flag as reg_category',
        'users_management_data.merchant_flag',
        db.raw(
          `CASE WHEN gsh.status_code = ${statusCode.PENDING} THEN TRUE ELSE FALSE END AS is_locked `,
        ),
        'users_management_data.ekyc_level',
        'users_management_data.customer_rank',
        'users_management_data.partner_rank',
        'gsh.status_code as account_status',
        'ms1.status_name as account_status_name',
        'ms1.en_name as account_status_name_en',
        'ms1.ja_name as account_status_name_ja',
        'ms1.cn_name as account_status_name_cn',
        'ms1.kr_name as account_status_name_kr',
        'gsh.status_label_number',
        'ms.status_name as status_label_name',
        'ms.en_name as status_label_name_en',
        'ms.ja_name as status_label_name_ja',
        'ms.cn_name as status_label_name_cn',
        'ms.kr_name as status_label_name_kr',
        'ms.en_status_label_detail as status_label_detail_en',
        'ms.ja_status_label_detail as status_label_detail_ja',
        'ms.cn_status_label_detail as status_label_detail_cn',
        'ms.kr_status_label_detail as status_label_detail_kr',
        'users_management_data.test_flag',
        'users_management_data.support_by_admin_id as support_by_admin',
        'users_management_data.support_status_code',
        'ms2.status_name as support_status_name',
        'ms2.frame_color as support_frame_color',
        'ms2.paint_color as support_paint_color',
        'ms2.text_color as support_text_color',
        'ms2.en_name as support_status_en_name',
        'ms2.ja_name as support_status_ja_name',
        'ms2.cn_name as support_status_cn_name',
        'ms2.kr_name as support_status_kr_name',
        'users_management_data.attention_flag',
        'users_portal_data.profile_picture_url',
        'users_basic_data.ts_regist',
        'users_basic_data.country_id',
        'users_basic_data.user_name',
        'm_countries.country_code',
        'm_countries.file_name as country_file_name',
        'm_countries.japanese_notation as country_name_ja',
        'm_countries.english_notation as country_name_en',
        'm_countries.korean_notation as country_name_kr',
        'm_countries.chinese_notation as country_name_cn',
        'users_basic_data.phone_number_country_id',
        'users_basic_data.phone_number',
        'mc2.file_name as phone_number_country_file_name',
        'mc2.japanese_notation as phone_number_ja',
        'mc2.english_notation as phone_number_en',
        'mc2.korean_notation as phone_number_kr',
        'mc2.chinese_notation as phone_number_cn',
        'mc2.country_number as phone_number_country',
        'm_site.media_name',
        'm_site.symbol_logo_path',
        'm_site.symbol_logo_name',
        'm_site.side_logo_path',
        'm_site.side_logo_name',
        'm_site.site_name',
        'users_personal.status_items',
        'fxs_xem_add_data.addition_account_flag',
        db.raw(`CASE 
          WHEN gsh.status_code = ${statusCode.REGISTERED} OR
            (gsh.status_code = ${statusCode.ACTIVATED} AND users_basic_data.first_name_romaji IS NULL)
            THEN FALSE 
          ELSE TRUE
          END AS can_view_user_detail`,
        ),
      )
      .where({
        'users_basic_data.id': userId,
        'users_basic_data.delete_flag': flag.FALSE,
        'users_basic_data.admin_flag': userBasicClass.USER,
      })
      .whereNot('users_basic_data.site_id', commonSiteId.P2TECH)
      .first()
  } catch (error) {
    console.log(error)
    return false
  }
}

const getStaffById = async (user_basic_data_id) => {
  const commonConditions = {
    user_basic_data_id,
    delete_flag: flag.FALSE,
    site_id: commonSiteId.P2TECH,
    is_success: flag.TRUE,
  }

  const queryLastUserAccess = db('user_access_history')
    .where(commonConditions)
    .orderBy('ts_regist', 'desc')
    .limit(1)
    .as('uah_last')

  const queryRegisteredUserAccess = db('user_access_history')
    .where(commonConditions)
    .orderBy('ts_regist', 'asc')
    .limit(1)
    .as('uah_regist')

  const commonGenaralAccess = {
    user_basic_data_id,
    delete_flag: flag.FALSE,
    site_id: commonSiteId.P2TECH,
    active_flag: flag.TRUE,
    access_type: accessTypeGeneralAccessList.IP,
    list_type: listTypeGeneralAccessList.ALL_SCREEN,
  }
  const queryAllowList = db('general_access_list')
    .where({
      ...commonGenaralAccess,
      list_classification: classiFication.ALLOW_LIST,
    })
    .limit(1)
    .as('gal_allow')

  const queryDenyList = db('general_access_list')
    .where({
      ...commonGenaralAccess,
      list_classification: classiFication.DENY_LIST,
    })
    .limit(1)
    .as('gal_deny')

  return await db('users_basic_data')
    .innerJoin(getUserAccountStatus(user_basic_data_id), 'gsh.target_id', 'users_basic_data.id')
    .leftJoin('users_portal_data', 'users_portal_data.user_basic_data_id', 'users_basic_data.id')
    .leftJoin(queryLastUserAccess, 'users_basic_data.id', 'uah_last.user_basic_data_id')
    .leftJoin(queryRegisteredUserAccess, 'users_basic_data.id', 'uah_last.user_basic_data_id')
    .leftJoin(queryAllowList, 'users_basic_data.id', 'gal_allow.user_basic_data_id')
    .leftJoin(queryDenyList, 'users_basic_data.id', 'gal_deny.user_basic_data_id')
    .select(
      'users_basic_data.first_name_romaji',
      'users_basic_data.last_name_romaji',
      'users_basic_data.email',
      'users_portal_data.profile_picture_url',
      'users_portal_data.profile_picture_color',
      'users_portal_data.profile_picture_name',
      'users_basic_data.authorization_id',
      'users_basic_data.admin_flag',
      'users_basic_data.admin_with_site_id',
      'uah_last.ts_regist as last_login_date',
      'uah_last.access_ip as last_access_ip',
      'uah_last.access_country as last_access_country',
      'uah_last.access_device_brower as last_access_device_brower',
      'uah_last.access_device_type as last_access_device_type',
      'uah_last.suspicious_level as last_suspicious_level',
      'uah_regist.ts_regist as registered_date',
      'uah_regist.access_ip as registered_access_ip',
      'uah_regist.access_country as registered_access_country',
      'uah_regist.access_device_brower as registered_access_device_brower',
      'uah_regist.access_device_type as registered_access_device_type',
      'uah_regist.suspicious_level as registered_suspicious_level',
      'users_basic_data.twofa_required_flag',
      'users_basic_data.google_sso_required_flag',
      'gal_allow.target as allow_list',
      'gal_deny.target as deny_list',
      db.raw(`CASE WHEN gsh.status_code = ${statusCode.APPROVED} THEN TRUE ELSE FALSE END AS enable_flag`),
    )
    .where({
      'users_basic_data.id': user_basic_data_id,
      'users_basic_data.delete_flag': flag.FALSE,
      'users_basic_data.site_id': commonSiteId.P2TECH,
    })
    .first()
}

const updateAdminProfileData = async (
  userBasicDataId, payloadUserBasicData, payloadUserPortalData,
  payloadHistory = undefined, payloadAccessControl = null) =>{
  return await db.transaction(async (trx) =>{
    // UPDATE USERS_BASIC_DATA
    if (payloadUserBasicData && Object.keys(payloadUserBasicData).length) {
      await trx('users_basic_data').update(payloadUserBasicData).where('id', userBasicDataId)
    }

    // UPDATE USERS_PORTAL_DATA
    if (payloadUserPortalData && Object.keys(payloadUserPortalData).length) {
      await trx('users_portal_data').update(payloadUserPortalData).where('user_basic_data_id', userBasicDataId)
    }

    // UPDATE STATUS HISTORY
    if (payloadHistory) {
      await trx('general_status_history').insert(payloadHistory)
    }

    if (payloadAccessControl && payloadAccessControl.length) {
      await trx('general_access_list').insert(payloadAccessControl)
        .onConflict('id')
        .merge(['target', 'active_flag', 'delete_flag'])
    }
    return true
  })
}

const getTimeCreateAndLoginUser = async () => {
  return await db('users_basic_data')
    .leftJoin('user_access_history', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('user_access_history.user_basic_data_id', 'users_basic_data.id')
        .on('user_access_history.delete_flag', flag.FALSE)
        .on('user_access_history.is_success', flag.TRUE)
    })
    .min('users_basic_data.ts_regist as ts_regist')
    .min('user_access_history.ts_regist as last_login_date')
    .where({
      'users_basic_data.delete_flag': flag.FALSE,
      'users_basic_data.admin_flag': userBasicClass.USER,
    })
}

const getUserAccountStatus = (target_id = null) => {
  if (target_id) {
    return db('general_status_history')
      .where({
        status_class_id: statusClassConstant.ACCOUNT_STATUS,
        delete_flag: flag.FALSE,
        target_id,
      })
      .orderBy('ts_regist', 'desc')
      .orderBy('id', 'desc')
      .limit(1)
      .as('gsh')
  } else {
    const queryLastHistoriesIds = db('general_status_history')
      .max('id as history_id')
      .groupBy('target_id')
      .where({
        status_class_id: statusClassConstant.ACCOUNT_STATUS,
        delete_flag: flag.FALSE,
      })
      .as('last_history_ids')

    return db('general_status_history')
      .join(queryLastHistoriesIds, function() {
        this.on('general_status_history.id', 'last_history_ids.history_id')
      })
      .as('gsh')
  }
}

const getUserSettingById = async (id) => {
  const userSetting = await db('users_basic_data')
    .leftJoin('users_portal_data', 'users_basic_data.id', 'users_portal_data.user_basic_data_id')
    .leftJoin('m_site', 'users_basic_data.site_id', 'm_site.id')
    .leftJoin(getUserAccountStatus(id), 'gsh.target_id', 'users_basic_data.id')
    .select(
      'users_basic_data.email',
      'users_basic_data.site_id',
      'm_site.media_name',
      'm_site.symbol_logo_path',
      'm_site.symbol_logo_name',
      'm_site.side_logo_path',
      'm_site.side_logo_name',
      'm_site.site_name',
      'gsh.status_code as account_status_code',
      'users_basic_data.phone_number_country_id',
      'users_basic_data.phone_number',
      'users_basic_data.first_name_romaji',
      'users_basic_data.last_name_romaji',
      'users_portal_data.unusual_login_notify_class',
      'users_portal_data.twofa_method_class',
      'users_portal_data.language_portal',
      'users_portal_data.language_email',
      'users_portal_data.display_date_time',
      'users_portal_data.display_time_zone_id',
      'users_portal_data.google_sns_id',
      'users_portal_data.x_sns_id',
      'users_portal_data.default_currency_display',
      'users_portal_data.receiver_name',
    )
    .where('users_basic_data.id', id)
    .where('users_basic_data.delete_flag', flag.FALSE)
    .first()

  if (userSetting) {
    let list_wallet = undefined
    const mailSettings = await db('m_distribution_service as mds')
      .leftJoin('send_mail_setting as sms', function() {
        this.on('mds.id', '=', 'sms.distribution_service_id')
          .andOn('sms.user_basic_data_id', '=', Number(id))
      })
      .select(
        'mds.id as distribution_service_id',
        'mds.ja_title',
        'mds.en_title',
        'mds.cn_title',
        'mds.kr_title',
        'mds.ja_description',
        'mds.en_description',
        'mds.cn_description',
        'mds.kr_description',
        'mds.distribution_start',
        'mds.distribution_end',
        'mds.content_update_id',
        db.raw(`ifnull(sms.enabled, ${flag.FALSE}) as enabled`),
      )
      .orderBy('distribution_service_id', 'asc')
      .where('mds.site_id', userSetting['site_id'])

    if (userSetting.site_id === commonSiteId.FXT) {
      list_wallet = await db('wallets').select(
        'id',
        'type_wallet',
        'currency',
        'total_assets',
        'wallet_status',
      )
        .where('user_basic_data_id', id)
        .where('delete_flag', flag.FALSE)
        .where('wallet_status', walletStatus.ACTIVATED)
        .whereIn('type_wallet', [typeWallet.USD_WALLET, typeWallet.JPY_WALLET, typeWallet.EUR_WALLET])
        .orderBy([{ column: 'ts_regist', order: 'ASC' }])
    }

    return {
      ...userSetting,
      mail_settings: mailSettings,
      list_wallet: list_wallet,
    }
  }

  return null
}

const isDuplicateField = async (obj) => {
  const statuses = [
    statusCode.ACTIVATED,
    statusCode.APPROVED,
    statusCode.PROCESSING,
    statusCode.PENDING,
    statusCode.REQUIRED,
  ]

  if (obj.user_name) {
    statuses.push(statusCode.CLOSED)
  }

  return await db('users_basic_data')
    .select(
      'users_basic_data.id',
      'users_basic_data.email',
      'users_basic_data.phone_number',
      'users_basic_data.phone_number_country_id',
    )
    .join(getUserAccountStatus(), 'gsh.target_id', 'users_basic_data.id')
    .leftJoin('token_authority', 'users_basic_data.id', 'token_authority.target_id')
    .where({
      'users_basic_data.site_id': obj.site_id,
      'users_basic_data.delete_flag': flag.FALSE,
    })
    .where( (builder) => {
      if (obj.email) {
        builder.where('users_basic_data.email', obj.email)
      } else if (obj.user_name) {
        builder.where('users_basic_data.user_name', obj.user_name)
      } else if (obj.phone_number) {
        builder.where('users_basic_data.phone_number', obj.phone_number)
        builder.where('users_basic_data.phone_number_country_id', obj.phone_number_country_id)
      }
    })
    .where(function() {
      this.whereIn('gsh.status_code', statuses)
        .orWhere(function() {
          this.andWhere('gsh.status_code', statusCode.REGISTERED)
            .andWhere('token_authority.activation_key_expire_datetime', '>', moment().utc().format(dateFormat.DATE_TIME))
            .andWhere({
              'token_authority.action_class': tokenAuthorityClass.CREATE_ACCOUNT,
              'token_authority.delete_flag': flag.FALSE,
            })
        })
    })
    .first()
}

// eslint-disable-next-line max-len
const updateUserMtInfo = async (userId, obj, groupMtAccount, server_data, apiKey, fieldMtUpdate, dataOther = null,
  event = null, userErrorLog = null, personalId, payloadUserPersonal = undefined) => {
  const trx = await db.transaction()
  try {
    // update user info
    const userUpdate = await trx('users_basic_data')
      .update(obj)
      .where({
        id: userId,
        delete_flag: flag.FALSE,
      })
    if (!userUpdate) {
      await trx.rollback()
      return { isError: true }
    }

    if (payloadUserPersonal) {
      await trx('users_personal').update(payloadUserPersonal).where({ id: personalId })
    }

    // update MT info
    for (let i = 0; i < groupMtAccount.length; i++) {
      // eslint-disable-next-line eqeqeq
      const server = server_data.find((sev) => sev.id == groupMtAccount[i].mt_server_id)
      const url = utility.getMTURL(server.env_param_name, server.platform, apiKey.api_name)
      const dataTrading = {
        ServerKey: server.server_key,
        ApiKey: apiKey.api_key,
        MTAccount: groupMtAccount[i].mt_account_no,
        ...fieldMtUpdate,
      }
      const isUpdateMTServer = await utility.requestRetry(
        'POST',
        url,
        dataTrading,
      )
      if (isUpdateMTServer.ReturnCode !== '0') {
        await trx.rollback()
        return { isError: true, data: dataTrading, url }
      }
    }

    await trx.commit()
    return { isError: false }
  } catch (error) {
    await trx.rollback()
    error.user_id = userErrorLog?.user_id
    throw error
  }
}

async function updateUserById(userId, payload) {
  return db('users_basic_data').update(payload)
    .where({
      id: userId,
      delete_flag: flag.FALSE,
    })
}

const getUsernameSimilar = async (username, siteId) => {
  return await db('users_basic_data')
    .select('user_name')
    .where('delete_flag', flag.FALSE)
    .where('site_id', siteId)
    .whereILike('user_name', `${username}%`)
}

const getUserDataForSendMail = async (user_basic_data_id) => {
  return await db('users_basic_data as ubd')
    .leftJoin('users_portal_data as upd', 'upd.user_basic_data_id', 'ubd.id')
    .where({
      'ubd.id': user_basic_data_id,
      'ubd.delete_flag': flag.FALSE,
    })
    .select(
      'ubd.id',
      'ubd.site_id',
      'ubd.email',
      'ubd.first_name_romaji',
      'ubd.last_name_romaji',
      'upd.language_email',
      'upd.language_portal',
    )
    .first()
}

async function checkUserExist(userId) {
  return await db('users_basic_data')
    .join('users_management_data as umd', 'users_basic_data.id', 'umd.user_basic_data_id')
    .select(
      'users_basic_data.id',
      'umd.customer_partner_code',
      'users_basic_data.email',
    )
    .where('users_basic_data.id', userId)
    .where('users_basic_data.delete_flag', flag.FALSE)
    .first()
}

async function getUserInfo(userId) {
  return await db('users_basic_data as users')
    .leftJoin('users_management_data as umd', 'users.id', 'umd.user_basic_data_id')
    .leftJoin('users_portal_data as upd', 'users.id', 'upd.user_basic_data_id')
    .leftJoin(getUserAccountStatus(userId), 'gsh.target_id', 'users.id')
    .select(
      'users.id',
      'users.member_id',
      'users.first_name_romaji',
      'users.last_name_romaji',
      'users.email',
      'users.site_id',
      'users.country_id',
      'users.corporate_flag as reg_category',
      'umd.merchant_flag',
      db.raw(
        `CASE WHEN gsh.status_code = ${statusCode.PENDING} THEN TRUE ELSE FALSE END AS is_locked `,
      ),
      'umd.ekyc_level',
      'upd.profile_picture_url',
      'upd.profile_picture_name',
      'upd.language_portal',
      'upd.language_email',
      'umd.attention_flag',
      'users.phone_number',
      'users.user_name',
      'upd.step_setting',
      'upd.delete_flag',
      'umd.test_flag',
      'gsh.status_code as account_status_code',
      'gsh.status_label_number as status_label_number',
    )
    .where({
      'users.id': userId,
      'users.delete_flag': flag.FALSE,
    })
    .first()
}

async function getBaseUserInfo(userId) {
  return await db('users_basic_data as users')
    .leftJoin('users_management_data as umd', function() {
      this.on('umd.user_basic_data_id', 'users.id')
    })
    .leftJoin('users_portal_data', 'users_portal_data.user_basic_data_id', 'users.id')
    .leftJoin('m_countries', 'm_countries.id', 'users.country_id')
    .select(
      'users.id',
      'users.member_id',
      'users.first_name_romaji',
      'users.last_name_romaji',
      'users.phone_number',
      'users.email',
      'users.site_id',
      'users.corporate_flag as reg_category',
      'umd.customer_partner_code',
      'm_countries.country_name',
      'm_countries.english_notation',
      'users_portal_data.language_email',
      'users_portal_data.language_portal',
    )
    .where({
      'users.id': userId,
      'users.delete_flag': flag.FALSE,
    })
    .first()
}

async function checkMemberIdExist(memberId) {
  return await db('users_basic_data')
    .select('id')
    .where('member_id', memberId)
    .where('site_id', commonSiteId.FXT)
    .where('delete_flag', flag.FALSE)
    .first()
}

const getUserLocation = async (user_id, personal_id) => {
  const userInfo = await db('users_basic_data')
    .leftJoin('users_personal', 'users_basic_data.id', 'users_personal.user_basic_data_id')
    .join(getUserAccountStatus(user_id), 'gsh.target_id', 'users_basic_data.id')
    .where('users_basic_data.id', user_id)
    .where('users_personal.id', personal_id)
    .where('users_basic_data.delete_flag', flag.FALSE)
    .select(
      'users_basic_data.corporate_flag',
      'gsh.status_code as account_status_code',
      'users_basic_data.country_id as user_country_id',
      'users_personal.country_id as personal_country_id',
      'users_personal.nationality_id',
      'users_personal.transaction_person',
      'users_personal.representative_person',
      'users_personal.beneficial_owner',
    )
    .first()
  return userInfo
}

const getUserBasicData = async (payload) =>{
  return await db('users_basic_data')
    .where({
      ...payload,
      'delete_flag': flag.FALSE,
    })
    .first()
}

const updateAccountStatus = async (personals, corporates, payload) => {
  const result = await db.transaction(async (trx) => {
    // UPDATE USER INFOR
    const payloadUserPortal = {}

    if (payload.new_account_status === statusCode.APPROVED) {
      payloadUserPortal.update_profile_flag = 0
    }

    let updateUserPortal
    if (Object.keys(payloadUserPortal).length !== 0) {
      updateUserPortal = trx('users_portal_data')
        .update(payloadUserPortal)
        .where('user_basic_data_id', payload.user_id)
    }

    // SAVE STATUS HISTORY WHEN CHANGE ACCOUNT STATUS
    const insertStatusHistory = trx('general_status_history')
      .insert({
        target_id: payload.user_id,
        status_code: payload.new_account_status,
        status_class_id: statusClassConstant.ACCOUNT_STATUS,
        action_method: actionMethod.OPERATOR_ACTION,
        updated_by_user_id: payload.staff_id,
      })

    await Promise.all([updateUserPortal, insertStatusHistory])

    // INSERT USER MESSAGE
    if (payload.new_account_status === statusCode.APPROVED) {
      if (payload.site_id === commonSiteId.MY_FOREX) {
        const existed = await trx('user_message')
          .where({ user_basic_data_id: payload.user_id, message_id: messageId.MY_FOREX.REGIST_APPROVED }).first()

        if (!existed) {
          await trx('user_message').insert({ user_basic_data_id: payload.user_id, message_id: messageId.MY_FOREX.REGIST_APPROVED })
        }
      }
      await trx('user_message').update({ delete_flag: flag.FALSE }).where({ 'user_basic_data_id': payload.user_id })
    }


    // UPDATE PERSONAL INFOR
    await Promise.all(
      personals.map(async (personal) => {
        await trx('users_personal')
          .update({ status_items: personal.status_items })
          .where({ id: personal.id })
        return true
      }),
    )

    // UPDATE CORPORATE INFOR
    if (corporates) {
      await Promise.all(
        corporates.map(async (corporate) => {
          await trx('users_corporate')
            .update({ status_items: corporate.status_items })
            .where({ id: corporate.id })
          return true
        }),
      )
    }

    return true
  })
  return result
}

const updateAccountStatusClosed = async (payload, event) => {
  return await db.transaction(async (trx) => {
    // UPDATE USER INFOR
    const updateUser = trx('users_management_data')
      .update({ ekyc_level: 0 })
      .where('user_basic_data_id', payload.user_id)

    // INSERT STATUS HISTORY
    const insertStatusHistory = trx('general_status_history')
      .insert({
        target_id: payload.user_id,
        status_code: payload.newStatus,
        status_class_id: statusClassConstant.ACCOUNT_STATUS,
        action_method: actionMethod.OPERATOR_ACTION,
        comment_by_admin: payload.comment,
        updated_by_user_id: payload.staff_id,
        status_label_number: payload.status_label_number,
      })

    await Promise.all([
      updateUser,
      insertStatusHistory,
    ])

    // DELETE PAYMENT TRANSACTION
    await trx('payment_transaction')
      .update({
        delete_flag: flag.TRUE,
      })
      .where('user_basic_data_id', payload.user_id)
      .where('delete_flag', flag.FALSE)

    // GET TRADING ACCOUNT AND USER INFOR BY USER ID
    if (payload.site_id === commonSiteId.FXT) {
      const getPortfolios = getPortfoliosToDelete(payload.user_id)
      const userInfoByUser = getUserInfo(payload.user_id)

      // DELETE TRADING ACCOUNT IN DATABASE
      await trx('trading_accounts')
        .update({
          delete_flag: flag.TRUE,
        })
        .where('user_basic_data_id', payload.user_id)
        .where('delete_flag', flag.FALSE)

      const [tradingAccountPortfolio, userInfo] = await Promise.all([
        getPortfolios,
        userInfoByUser,
      ])
      // DELETE ALL PORTFOLIO
      try {
        const token = utility.setTokenForRedirectSite(userInfo)
        const headers = { 'Authorization': `Bearer ${token}` }
        await Promise.all(tradingAccountPortfolio.map(async (element) => {
          await utility.requestPortfolioMyforex(
            'DELETE',
            `${process.env.URL_PORTFOLIO_MYFOREX}/${element.portfolio_id}`,
            headers,
          )
        }))
      } catch (error) {
        console.log(error)
        error.user_id = userInfo.id
        await createResponseAndLog(event, error, null,
          [errorMessageCodeConstant.CHANGE_ACCOUNT_STATUS.DELETE_FAIL.PORTFOLIO_SITE_FXT])
      }
    } else if (payload.site_id === commonSiteId.MY_FOREX) {
      const getPortfolios = getListPortfolioByUserId(payload.user_id)
      const userInfoByUser = await getUserInfo(payload.user_id)
      const [portfolioList, userInfo] = await Promise.all([
        getPortfolios,
        userInfoByUser,
      ])

      // DELETE PORTFOLIO IN DATABASE
      await trx('portfolios')
        .update({
          delete_flag: flag.TRUE,
        })
        .where('user_basic_data_id', payload.user_id)
        .where('delete_flag', flag.FALSE)

      // DELETE ALL PORTFOLIO
      try {
        const token = utility.setTokenForRedirectSite(userInfo)
        const headers = { 'Authorization': `Bearer ${token}` }

        await Promise.all(portfolioList.map(async (element) => {
          await utility.requestPortfolioMyforex(
            'DELETE',
            `${process.env.URL_PORTFOLIO_MYFOREX}/${element.portfolio_id}`,
            headers,
          )
        }))
      } catch (error) {
        console.log(error)
        error.user_id = userInfo.id
        await createResponseAndLog(event, error, null,
          [errorMessageCodeConstant.CHANGE_ACCOUNT_STATUS.DELETE_FAIL.PORTFOLIO_SITE_MY_FOREX])
      }
    }

    return true
  })
}

const getPortfoliosToDelete = async (user_id) => {
  const result = await db('trading_accounts as ta')
    .leftJoin('m_mt_servers as msv', 'msv.id', 'ta.mt_server_id')
    .select(
      'ta.id',
      'ta.mt_account_no',
      'ta.portfolio_id',
      'msv.platform',
      'msv.server_key',
      'msv.env_param_name',
    )
    .where('ta.user_basic_data_id', user_id)
    .where('ta.delete_flag', flag.FALSE)
    .whereNotNull('ta.portfolio_id')
  return result ? result : null
}

const getListPortfolioByUserId = async (userId) => {
  const dataPortfolios = await db('portfolios')
    .select(
      'id',
      'user_basic_data_id',
      'portfolio_id',
    )
    .where({
      delete_flag: flag.FALSE,
      user_basic_data_id: userId,
    })

  return dataPortfolios
}

const getListUserPayment = async (condition, pagination) => {
  const orderArr = [...pagination.sort, { column: 'id', order: 'DESC' }]
  const query = db('users_basic_data as u')
    .select(
      'u.id',
      'u.ts_regist',
      'u.site_id',
      's.media_name',
      's.site_name',
      's.symbol_logo_path',
      's.symbol_logo_name',
      's.side_logo_path',
      's.side_logo_name',
      'u.member_id',
      'u.corporate_flag as reg_category',
      'u.email',
      db.raw(
        `CASE 
            WHEN u.corporate_flag = ${regCategory.PERSONAL} THEN 
              CONCAT(p.last_name_katakana," ",p.first_name_katakana)
            ELSE
              c.corporate_name_katakana
          END as katakana_name`,
      ),
      db.raw(
        `CASE 
            WHEN u.corporate_flag = ${regCategory.PERSONAL} THEN 
              CONCAT(p.first_name_romaji," ",p.last_name_romaji) 
            ELSE
              c.corporate_name_english 
          END as english_name`,
      ),
    )
    .join(getUserAccountStatus(), 'gsh.target_id', 'u.id')
    .leftJoin('users_corporate as c', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('u.id', 'c.user_basic_data_id')
        .on('c.beneficial_owner', flag.FALSE)
        .on('u.delete_flag', flag.FALSE)
        .on('c.delete_flag', flag.FALSE)
    })
    .leftJoin('users_personal as p', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('u.id', 'p.user_basic_data_id')
        .on('p.user_corporate_id', 0)
        .on('p.transaction_person', flag.FALSE)
        .on('p.representative_person', flag.FALSE)
        .on('p.beneficial_owner', flag.FALSE)
        .on('p.delete_flag', flag.FALSE)
    })
    .leftJoin('m_site as s', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('s.id', 'u.site_id')
        .on('s.delete_flag', flag.FALSE)
    })
    .where('u.delete_flag', flag.FALSE)
    .whereNot('gsh.status_code', statusCode.CLOSED)

  if (condition.site_id) {
    query.whereIn('u.site_id', condition.site_id)
  }
  if (condition.member_id) {
    condition.member_id = utility.escapeSql(condition.member_id)
    query.whereILike('u.member_id', `%${condition.member_id}%`)
  }

  if (condition.corporate_name) {
    condition.corporate_name = utility.escapeSql(condition.corporate_name)
    query.andWhere((builder) => {
      builder.whereILike(db.raw(
        `CASE 
              WHEN u.corporate_flag = ${regCategory.PERSONAL} THEN 
                CONCAT(p.first_name_romaji," ",p.last_name_romaji) 
              ELSE
                c.corporate_name_english 
            END`,
      ), `%${condition.corporate_name}%`)
        .orWhereILike(db.raw(
          `CASE 
              WHEN u.corporate_flag = ${regCategory.PERSONAL} THEN 
                CONCAT(p.last_name_katakana," ",p.first_name_katakana)
              ELSE
                c.corporate_name_katakana
            END`,
        ), `%${condition.corporate_name}%`)
    })
  }

  if (condition.email) {
    condition.email = utility.escapeSql(condition.email)
    query.whereILike('u.email', `%${condition.email}%`)
  }
  if (condition.id) {
    condition.id = utility.escapeSql(condition.id)
    query.whereILike('u.id', `%${condition.id}%`)
  }

  const utc = (condition.utc || '0').replace('(', '').replace('UTC', '').replace(')', '')

  if (condition.tsFrom && condition.tsTo) {
    const tsFrom = moment(condition.tsFrom).startOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
    const tsTo = moment(condition.tsTo).endOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()

    query.whereBetween('u.ts_regist', [tsFrom, tsTo])
  } else if (condition.tsFrom) {
    const tsFrom = moment(condition.tsFrom).startOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()

    query.where('u.ts_regist', '>=', tsFrom)
  } else if (condition.tsTo) {
    const tsTo = moment(condition.tsTo).endOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()

    query.where('u.ts_regist', '<=', tsTo)
  }
  if (condition.is_completed_ekyc && condition.is_completed_ekyc.toString().toLowerCase() === 'true') {
    query.where('gsh.status_code', statusCode.APPROVED)
  }
  const result = await query.orderBy(orderArr).paginate(pagination)

  return result
}

const getUserInfoByMemberId = async (member_id) => {
  const user = await db('users_basic_data as users')
    .leftJoin('users_portal_data as upd', 'users.id', 'upd.user_basic_data_id')
    .leftJoin('users_management_data', 'users_management_data.user_basic_data_id', 'users.id')
    .leftJoin(getUserAccountStatus(), 'gsh.target_id', 'users.id')
    .select(
      'users.id',
      'users.member_id',
      'users.first_name_romaji',
      'users.last_name_romaji',
      'users.site_id',
      'users.corporate_flag as reg_category',
      'users.email',
      'users.phone_number',
      'users.user_name',
      'users_management_data.attention_flag',
      'gsh.status_code as account_status_code',
      'upd.language_portal',
      'upd.language_email',
    )
    .where({
      'users.member_id': member_id,
      'users.delete_flag': flag.FALSE,
    })
    .first()
  return user
}

const getListUserByMemberId = async (arrMemberId) => {
  const res = await db('users_basic_data')
    .select('member_id')
    .where('delete_flag', flag.FALSE)
    .whereIn('member_id', arrMemberId)

  return res
}

const getUserInfoSendMail = async (userId) => {
  const result = await db('users_basic_data as users')
    .leftJoin('users_portal_data as upd', 'users.id', 'upd.user_basic_data_id')
    .leftJoin('users_management_data', 'users_management_data.user_basic_data_id', 'users.id')
    .leftJoin(getUserAccountStatus(), 'gsh.target_id', 'users.id')
    .select(
      'users.id',
      'users.member_id',
      'users.first_name_romaji',
      'users.last_name_romaji',
      'users.site_id',
      'users.corporate_flag as reg_category',
      'users.email',
      'users.phone_number',
      'users.user_name',
      'users_management_data.attention_flag',
      'upd.language_portal',
      'upd.language_email',
      'gsh.status_code as account_status_code',
    )
    .where({
      'users.id': userId,
      'users.delete_flag': flag.FALSE,
    })
    .first()
  return result
}

module.exports = {
  getUserLoginData,
  getUserData,
  createAdmin,
  checkMailExitsInSystem,
  getStaffUserData,
  getListStaffs,
  updateUserBasicData,
  getListUserAccount,
  getDetailUserById,
  getStaffById,
  updateAdminProfileData,
  getTimeCreateAndLoginUser,
  getUserSettingById,
  updateUserMtInfo,
  updateUserById,
  isDuplicateField,
  getUsernameSimilar,
  getUserAccountStatus,
  getUserDataForSendMail,
  checkUserExist,
  getUserInfo,
  getBaseUserInfo,
  checkMemberIdExist,
  getUserLocation,
  updateAccountStatus,
  updateAccountStatusClosed,
  getListUserPayment,
  getUserInfoByMemberId,
  getListUserByMemberId,
  getUserInfoSendMail,
  getUserBasicData,
}
