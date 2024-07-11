const db = require('db').helper
const { flag } = require('constant')
const { getUserAccountStatus } = require('./users_basic_data_repository')
const _ = require('lodash')

const getCorporateInfo = async (userId, id = null) => {
  const query = db('users_basic_data as users')
    .join('users_corporate as uc', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('users.id', 'uc.user_basic_data_id')
        .on('uc.beneficial_owner', flag.FALSE)
    })
    .join(getUserAccountStatus(), 'gsh.target_id', 'users.id')
    .join('users_portal_data as upd', 'upd.user_basic_data_id', 'users.id')
    .leftJoin('m_site', 'users.site_id', 'm_site.id')
    .leftJoin('m_countries as mc1', 'uc.country_id', 'mc1.id')
    .leftJoin('m_countries as mc2', 'uc.phone_number_country_id', 'mc2.id')
    .leftJoin('m_prefectures as mp', 'uc.state_province', 'mp.id')
    .leftJoin('users_finance as uf', 'uf.user_corporate_id', 'uc.id')
    .leftJoin('m_finance_info as mpi1', 'uc.industry_id', 'mpi1.id')
    .leftJoin('m_finance_info as mpi2', 'uf.annual_income', 'mpi2.id')
    .leftJoin('m_finance_info as mpi3', 'uf.net_worth', 'mpi3.id')
    .leftJoin('m_finance_info as mpi4', 'uf.planned_annual_investment', 'mpi4.id')
    .leftJoin('m_finance_info as mpi5', 'uf.purpose_of_investment', 'mpi5.id')

  if (id) {
    query.where('uc.id', id)
      .where('uc.delete_flag', flag.FALSE)
  } else {
    query.where('users.id', userId)
      .where('users.delete_flag', flag.FALSE)
  }
  query.select(
    'uc.id',
    'users.id as user_id',
    'users.site_id',
    'upd.step_setting',

    'uc.country_id',
    'mc1.file_name as country_file_name',
    'mc1.japanese_notation as country_ja',
    'mc1.english_notation as country_en',
    'mc1.korean_notation as country_kr',
    'mc1.chinese_notation as country_cn',
    'uc.date_of_establish',
    'uc.corporate_name_registered',
    'uc.corporate_name_english',
    'uc.corporate_name_katakana',

    'uc.zip_postal_code',
    'uc.state_province',
    'mp.ja_name as prefectures_ja',
    'mp.en_name as prefectures_en',
    'mp.cn_name as prefectures_cn',
    'mp.kr_name as prefectures_kr',
    'uc.city',
    'uc.address_line_1',
    'uc.address_line_2',

    'uc.phone_number_country_id',
    'mc2.file_name as phone_number_country_file_name',
    'mc2.japanese_notation as phone_number_ja',
    'mc2.english_notation as phone_number_en',
    'mc2.korean_notation as phone_number_kr',
    'mc2.chinese_notation as phone_number_cn',
    'mc2.country_number as phone_number_country',
    'uc.corporate_phone_number',

    'uf.id as user_finance_id',

    'uc.industry_id',
    'mpi1.ja_name as industries_ja',
    'mpi1.en_name as industries_en',
    'mpi1.cn_name as industries_cn',
    'mpi1.kr_name as industries_kr',
    'uc.business_content',
    'uc.website_url',

    'uf.us_tax_obligations',
    'uf.us_taxpayer_number',

    'uf.annual_income',
    'mpi2.ja_name as annual_income_ja',
    'mpi2.en_name as annual_income_en',
    'mpi2.cn_name as annual_income_cn',
    'mpi2.kr_name as annual_income_kr',

    'uf.net_worth',
    'mpi3.ja_name as net_worth_ja',
    'mpi3.en_name as net_worth_en',
    'mpi3.cn_name as net_worth_cn',
    'mpi3.kr_name as net_worth_kr',

    'uf.planned_annual_investment',
    'mpi4.ja_name as planned_annual_investment_ja',
    'mpi4.en_name as planned_annual_investment_en',
    'mpi4.cn_name as planned_annual_investment_cn',
    'mpi4.kr_name as planned_annual_investment_kr',

    'uf.purpose_of_investment',
    'mpi5.ja_name as purpose_of_investment_ja',
    'mpi5.en_name as purpose_of_investment_en',
    'mpi5.cn_name as purpose_of_investment_cn',
    'mpi5.kr_name as purpose_of_investment_kr',

    'uc.status_items',
    'gsh.status_code as account_status_code',
  )
  return await query.first()
}

const updateCorporateInfo = async (id, payload) => {
  return await db('users_corporate').update(payload)
    .where({ id: id, delete_flag: flag.FALSE })
}

async function getCorporateStep1ByUserId(user_id) {
  try {
    const res = await db('users_corporate')
      .select(
        'corporate_name_registered',
        'corporate_name_english',
        'corporate_name_katakana',
      )
      .where({
        user_basic_data_id: user_id,
        beneficial_owner: flag.FALSE,
        like_shareholder_corporate: flag.FALSE,
        delete_flag: flag.FALSE,
      })
      .first()
    return res ? res : null
  } catch (error) {
    console.log(error)
    return null
  }
}

async function getCorporates(payload) {
  return await db('users_corporate').where(payload).orderBy([{ column: 'users_corporate.id', order: 'ASC' }])
}

async function getCorporateByUserId(userId) {
  return await db('users_corporate as uc')
    .join('users_basic_data as users', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('users.id', 'uc.user_basic_data_id')
        .on('users.delete_flag', flag.FALSE)
    })
    .join(getUserAccountStatus(userId), 'gsh.target_id', 'users.id')
    .join('users_ubo', 'users_ubo.user_corporate_id', 'users_corporate.id')
    .where('users.id', userId)
    .where('uc.beneficial_owner', flag.FALSE)
    .where('uc.delete_flag', flag.FALSE)
    .select(
      'uc.id',
      'users_ubo.number_shareholders_corporate',
      'users_ubo.number_shareholders_person',
      'uc.user_basic_data_id as user_id',
      'gsh.status_code as account_status_code',
    )
    .first()
}

async function getNationalInstitutionInfo(userId) {
  const query = await db('users_basic_data as users')
    .join('users_portal_data as upd', 'users.id', 'upd.user_basic_data_id')
    .join(getUserAccountStatus(userId), 'gsh.target_id', 'users.id')
    .join('users_corporate as uc', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('users.id', 'uc.user_basic_data_id')
        .on('uc.beneficial_owner', flag.FALSE)
    })
    .join('users_ubo', 'users_ubo.user_corporate_id', 'uc.id')
    .where('users.id', userId)
    .where('users.delete_flag', flag.FALSE)
    .select(
      'uc.id as corporate_id',
      'uc.user_basic_data_id as user_id',
      'users.site_id',
      'upd.step_setting',
      'gsh.status_code as account_status_code',
      'users_ubo.is_national_institution',
      'users_ubo.number_shareholders_person',
      'users_ubo.number_shareholders_corporate',
    )
    .first()

  return query
}

async function getShareholderCorporate(userId) {
  const query = db('users_basic_data as users')
    .leftJoin('users_corporate as uc', 'users.id', 'uc.user_basic_data_id')

    .leftJoin('m_countries as mc1', 'uc.country_id', 'mc1.id')
    .leftJoin('m_countries as mc2', 'uc.phone_number_country_id', 'mc2.id')

    .leftJoin('m_prefectures as mp', 'uc.state_province', 'mp.id')

    .leftJoin('m_finance_info as mpi', 'uc.industry_id', 'mpi.id')

    .select(
      'uc.id as corporate_id',
      'users.id as user_id',

      'uc.country_id',
      'mc1.file_name as country_file_name',
      'mc1.japanese_notation as country_ja',
      'mc1.english_notation as country_en',
      'mc1.korean_notation as country_kr',
      'mc1.chinese_notation as country_cn',

      'uc.corporate_name_registered',
      'uc.corporate_name_english',
      'uc.corporate_name_katakana',
      'uc.date_of_establish',

      'uc.zip_postal_code',
      'uc.state_province',
      'mp.ja_name as prefectures_ja',
      'mp.en_name as prefectures_en',
      'mp.cn_name as prefectures_cn',
      'mp.kr_name as prefectures_kr',
      'uc.city',
      'uc.address_line_1',
      'uc.address_line_2',

      'uc.phone_number_country_id',
      'mc2.file_name as phone_number_country_file_name',
      'mc2.japanese_notation as phone_number_ja',
      'mc2.english_notation as phone_number_en',
      'mc2.korean_notation as phone_number_kr',
      'mc2.chinese_notation as phone_number_cn',
      'mc2.country_number as phone_number_country',
      'uc.corporate_phone_number',

      'uc.industry_id',
      'mpi.ja_name as industries_ja',
      'mpi.en_name as industries_en',
      'mpi.cn_name as industries_cn',
      'mpi.kr_name as industries_kr',

      'uc.business_content',
      'uc.website_url',

      'uc.voting_ratio',
      'uc.voting_ratio_shareholder',
      'uc.status_items',
      'uc.like_shareholder_corporate',
    )
  query.where(function() {
    this.where({
      'users.id': userId,
      'users.delete_flag': flag.FALSE,
      'uc.beneficial_owner': flag.TRUE,
    })
      .orWhere({
        'users.id': userId,
        'users.delete_flag': flag.FALSE,
        'uc.beneficial_owner': flag.FALSE,
        'uc.like_shareholder_corporate': flag.TRUE,
      })
  })
  return await query
}

async function getLikeCorporateShareholder(obj) {
  return await db('users_corporate')
    .select(
      'id',
      'like_shareholder_corporate',
    )
    .where({
      ...obj,
      delete_flag: flag.FALSE,
    })
}

async function updateNationalInstitution(id, objData, obj, userId) {
  try {
    await db.transaction(async (trx) => {
      const payLoadUserUbo = _.omit(objData, ['like_shareholder_corporate', 'like_shareholder_person'])
      let isUpdate = await trx('users_ubo').update(payLoadUserUbo).where({
        user_corporate_id: id,
        delete_flag: flag.FALSE,
      })
      if (!isUpdate) {
        throw Object.assign(new Error('update users_ubo unsuccessful'), { isCustomError: true })
      }

      if (objData.hasOwnProperty('like_shareholder_corporate') && objData.hasOwnProperty('like_shareholder_person')) {
        isUpdate = await trx('users_corporate')
          .update({
            like_shareholder_corporate: objData.like_shareholder_corporate,
          }).where({
            id,
            delete_flag: flag.FALSE,
          })

        if (!isUpdate) {
          throw Object.assign(new Error('update users_corporate unsuccessful'), { isCustomError: true })
        }

        isUpdate = await trx('users_personal')
          .update({
            like_shareholder_person: objData.like_shareholder_person,
          }).where({
            user_corporate_id: id,
            beneficial_owner: flag.FALSE,
            delete_flag: flag.FALSE,
          })

        if (!isUpdate) {
          throw Object.assign(new Error('update users_personal unsuccessful'), { isCustomError: true })
        }
      }

      if (obj.is_national_institution === flag.TRUE) {
        await trx('users_personal')
          .leftJoin('users_basic_data as users', 'users.id', 'users_personal.user_basic_data_id')
          .where('users.id', userId)
          .where('users.delete_flag', flag.FALSE)
          .where('users_personal.transaction_person', flag.FALSE)
          .where('users_personal.representative_person', flag.FALSE)
          .where('users_personal.beneficial_owner', flag.TRUE)
          .del()

        await trx('users_corporate')
          .leftJoin('users_basic_data as users', 'users.id', 'users_corporate.user_basic_data_id')
          .where('users_corporate.beneficial_owner', flag.TRUE)
          .where('users.delete_flag', flag.FALSE)
          .where('users.id', userId)
          .del()

        await trx('users_personal')
          .leftJoin('users_basic_data as users', 'users.id', 'users_personal.user_basic_data_id')
          .leftJoin('users_corporate as uc', 'users.id', 'uc.user_basic_data_id')
          .where('users.id', userId)
          .where('users.delete_flag', flag.FALSE)
          .where('uc.beneficial_owner', flag.TRUE)
          .where('users_personal.transaction_person', flag.FALSE)
          .where('users_personal.representative_person', flag.TRUE)
          .where('users_personal.beneficial_owner', flag.FALSE)
          .del()
      }
    })

    return { isError: false }
  } catch (error) {
    if (error.isCustomError) {
      return { isError: true, error }
    }
    throw error
  }
}

async function getShareholderCorporateForValidate(userId) {
  return await db('users_basic_data as users')
    .leftJoin('users_corporate as uc', 'users.id', 'uc.user_basic_data_id')
    .where('users.id', userId)
    .where('users.delete_flag', flag.FALSE)
    .where('uc.beneficial_owner', flag.TRUE)
    .select(
      'uc.id as corporate_id',
      'users.id as user_id',
    )
}

async function getCorporateCheckUpdate(id) {
  return await db('users_basic_data as users')
    .join('users_corporate as uc', function() {
      /* eslint-disable no-invalid-this */
      this.on(function() {
        this
          .on('users.id', 'uc.user_basic_data_id')
          .on('uc.beneficial_owner', flag.TRUE)
      })
        .orOn(function() {
          this
            .on('users.id', 'uc.user_basic_data_id')
            .on('uc.like_shareholder_corporate', flag.TRUE)
            .on('uc.beneficial_owner', flag.FALSE)
        })
    })

    .join(getUserAccountStatus(), 'gsh.target_id', 'users.id')
    .where('uc.id', id)
    .where('users.delete_flag', flag.FALSE)
    .select(
      'uc.id as corporate_id',
      'uc.user_basic_data_id as user_id',
      'users.site_id',
      'gsh.status_code as account_status_code',
      'uc.country_id',
      'uc.corporate_name_registered',
      'uc.corporate_name_english',
      'uc.corporate_name_katakana',
      'uc.industry_id',
      'uc.business_content',
      'uc.voting_ratio',
      'uc.voting_ratio_shareholder',
      'uc.zip_postal_code',
      'uc.state_province',
      'uc.city',
      'uc.address_line_1',
      'uc.address_line_2',
      'uc.phone_number_country_id',
      'uc.corporate_phone_number',
      'uc.website_url',
      'uc.status_items',
    )
    .first()
}

async function insertCorporateInfo(payloadCorporate, payloadPersonal) {
  return await db.transaction(async (trx) => {
    const corporate = await trx('users_corporate')
      .insert(payloadCorporate)

    payloadPersonal.corporate_id = corporate[0]

    await trx('users_personal')
      .insert(payloadPersonal)

    return true
  })
}

async function getCorporateById(id, beneficial_owner = null) {
  const where = {}

  if (beneficial_owner !== null) {
    where.beneficial_owner = beneficial_owner
  }

  return await db('users_corporate as uc')
    .join('users_basic_data as users', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('users.id', 'uc.user_basic_data_id')
        .on('users.delete_flag', flag.FALSE)
    })
    .join(getUserAccountStatus(), 'gsh.target_id', 'users.id')
    .where(where)
    .where('uc.id', id)
    .where('uc.delete_flag', flag.FALSE)
    .select(
      'uc.id',
      'uc.number_shareholders_corporate',
      'uc.number_shareholders_person',
      'uc.user_basic_data_id as user_id',
      'users.site_id',
      'gsh.status_code as account_status_code',
    )
    .first()
}

module.exports = {
  getCorporateInfo,
  updateCorporateInfo,
  getCorporateStep1ByUserId,
  getCorporates,
  getCorporateByUserId,
  getNationalInstitutionInfo,
  getShareholderCorporate,
  getLikeCorporateShareholder,
  updateNationalInstitution,
  getShareholderCorporateForValidate,
  getCorporateCheckUpdate,
  insertCorporateInfo,
  getCorporateById,
}
