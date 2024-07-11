/* eslint-disable max-len */
const db = require('db').helper
const { flag, userBasicClass } = require('constant')
const { getUserAccountStatus } = require('./users_basic_data_repository')

const getPersonalInfo = async (userId, id = null) => {
  const query = db('users_basic_data as users')
    .leftJoin('users_personal as up', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('users.id', 'up.user_basic_data_id')
        .on('up.user_corporate_id', flag.FALSE)
        .on('up.transaction_person', flag.FALSE)
        .on('up.representative_person', flag.FALSE)
        .on('up.beneficial_owner', flag.FALSE)
    })

    .leftJoin('m_countries as mc1', 'up.nationality_id', 'mc1.id')
    .leftJoin('m_countries as mc2', 'users.country_id', 'mc2.id')

    .leftJoin('m_prefectures as mp', 'up.state_province', 'mp.id')

    .leftJoin('users_finance as uf', 'uf.user_personal_id', 'up.id')

    .leftJoin('m_finance_info as mpi1', 'uf.occupation_id', 'mpi1.id')
    .leftJoin('m_finance_info as mpi2', 'uf.funding_source_id', 'mpi2.id')
    .leftJoin('m_finance_info as mpi3', 'uf.industry_id', 'mpi3.id')
    .leftJoin('m_finance_info as mpi4', 'uf.annual_income', 'mpi4.id')
    .leftJoin('m_finance_info as mpi5', 'uf.net_worth', 'mpi5.id')
    .leftJoin('m_finance_info as mpi6', 'uf.planned_annual_investment', 'mpi6.id')
    .leftJoin('m_finance_info as mpi7', 'uf.purpose_of_investment', 'mpi7.id')
    .join(getUserAccountStatus(), 'gsh.target_id', 'users.id')
    .select(
      'users.id as user_id',
      'up.id as personal_id',
      'users.corporate_flag as reg_category',
      'users.country_id',
      'users.site_id',
      'users.first_name_romaji',
      'users.last_name_romaji',
      'users.user_name',

      'mc1.file_name as nationality_file_name',
      'mc1.japanese_notation as nationality_ja',
      'mc1.english_notation as nationality_en',
      'mc1.korean_notation as nationality_kr',
      'mc1.chinese_notation as nationality_cn',

      'up.nationality_id',
      'up.id as personal_id',
      'up.first_name_kanji',
      'up.last_name_kanji',
      'up.gender',
      'up.date_of_birth',
      'uf.us_tax_obligations',
      'uf.us_taxpayer_number',
      'up.first_name_katakana',
      'up.last_name_katakana',
      'up.zip_postal_code',
      'up.state_province',
      'up.city',
      'up.address_line_1',
      'up.address_line_2',
      'up.status_items',

      'mc2.file_name as country_file_name',
      'mc2.japanese_notation as country_ja',
      'mc2.english_notation as country_en',
      'mc2.korean_notation as country_kr',
      'mc2.chinese_notation as country_cn',

      'mp.ja_name as prefectures_ja',
      'mp.en_name as prefectures_en',
      'mp.cn_name as prefectures_cn',
      'mp.kr_name as prefectures_kr',

      'uf.id as user_finance_id',

      'uf.occupation_id',
      'mpi1.ja_name as occupations_ja',
      'mpi1.en_name as occupations_en',
      'mpi1.cn_name as occupations_cn',
      'mpi1.kr_name as occupations_kr',

      'uf.funding_source_id',
      'mpi2.ja_name as funding_sources_ja',
      'mpi2.en_name as funding_sources_en',
      'mpi2.cn_name as funding_sources_cn',
      'mpi2.kr_name as funding_sources_kr',

      'uf.industry_id',
      'mpi3.ja_name as industries_ja',
      'mpi3.en_name as industries_en',
      'mpi3.cn_name as industries_cn',
      'mpi3.kr_name as industries_kr',

      'uf.annual_income',
      'mpi4.ja_name as annual_income_ja',
      'mpi4.en_name as annual_income_en',
      'mpi4.cn_name as annual_income_cn',
      'mpi4.kr_name as annual_income_kr',

      'uf.net_worth',
      'mpi5.ja_name as net_worth_ja',
      'mpi5.en_name as net_worth_en',
      'mpi5.cn_name as net_worth_cn',
      'mpi5.kr_name as net_worth_kr',

      'uf.planned_annual_investment',
      'mpi6.ja_name as planned_annual_investment_ja',
      'mpi6.en_name as planned_annual_investment_en',
      'mpi6.cn_name as planned_annual_investment_cn',
      'mpi6.kr_name as planned_annual_investment_kr',

      'uf.purpose_of_investment',
      'mpi7.ja_name as purpose_of_investment_ja',
      'mpi7.en_name as purpose_of_investment_en',
      'mpi7.cn_name as purpose_of_investment_cn',
      'mpi7.kr_name as purpose_of_investment_kr',

      'gsh.status_code as account_status_code',
    )
    .where({
      'users.delete_flag': flag.FALSE,
      'users.admin_flag': userBasicClass.USER,
    })

  if (id) {
    query.where('up.id', id)
  } else {
    query.where('users.id', userId)
  }

  return await query.first()
}

const updatePersonalInfo = async (id, payload) => {
  return await db('users_personal')
    .update(payload)
    .where({
      id: id,
      delete_flag: flag.FALSE,
    })
}

const updatePersonalAddress = async (id, payload, user_id, country_id) => {
  return await db.transaction(async (trx) => {
    await trx('users_basic_data').update({ country_id }).where('id', user_id)
    await trx('users_personal').update(payload).where({ id })
    return true
  })
}

const getTransactionPersonInfo = async (userId, id = null) => {
  const query = db('users_basic_data as users')
    .join('users_corporate as uc', 'users.id', 'uc.user_basic_data_id')
    .join('users_personal as up', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('users.id', 'up.user_basic_data_id')
        .on('up.user_corporate_id', 'uc.id')
    })
    .join('users_portal_data as upd', 'upd.user_basic_data_id', 'users.id')
    .leftJoin('m_countries as mc1', 'users.country_id', 'mc1.id')
    .leftJoin('m_countries as mc2', 'up.nationality_id', 'mc2.id')
    .leftJoin('m_prefectures as mp', 'up.state_province', 'mp.id')
    .leftJoin('users_finance as uf', 'uf.user_personal_id', 'up.id')
    .join(getUserAccountStatus(), 'gsh.target_id', 'users.id')
    .select(
      'up.id',
      'users.id as user_id',
      'users.site_id',
      'upd.step_setting',

      'up.nationality_id',
      'mc2.file_name as nationality_file_name',
      'mc2.japanese_notation as nationality_name_ja',
      'mc2.english_notation as nationality_name_en',
      'mc2.korean_notation as nationality_name_kr',
      'mc2.chinese_notation as nationality_name_cn',
      'up.date_of_birth',
      'up.first_name_kanji',
      'up.last_name_kanji',
      'up.first_name_katakana',
      'up.last_name_katakana',
      'up.gender',

      'users.country_id',
      'mc1.file_name as country_file_name',
      'mc1.japanese_notation as country_name_ja',
      'mc1.english_notation as country_name_en',
      'mc1.korean_notation as country_name_kr',
      'mc1.chinese_notation as country_name_cn',
      'up.zip_postal_code',
      'up.state_province',
      'up.city',
      'up.address_line_1',
      'up.address_line_2',
      'up.like_transaction_person',

      'uf.id as user_finance_id',
      'uf.us_tax_obligations',
      'uf.us_taxpayer_number',

      'up.status_items',

      'gsh.status_code as account_status_code',
    )
    .where({
      'users.delete_flag': flag.FALSE,
      'users.admin_flag': userBasicClass.USER,
    })

  if (id) {
    query.where('up.id', id)
  } else {
    query.where('users.id', userId)
  }

  query.where(function() {
    this.where({
      'up.transaction_person': flag.TRUE,
      'up.representative_person': flag.FALSE,
      'up.beneficial_owner': flag.FALSE,
    })
      .orWhere({
        'up.transaction_person': flag.FALSE,
        'up.representative_person': flag.TRUE,
        'up.beneficial_owner': flag.FALSE,
        'up.like_transaction_person': flag.TRUE,
      })
  })

  return await query.first()
}

const getRepresentativePersonInfo = async (userId, id = null) => {
  const query = db('users_basic_data as users')
    .join('users_corporate as uc', 'users.id', 'uc.user_basic_data_id')
    .join('users_personal as up', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('users.id', 'up.user_basic_data_id')
        .on('up.user_corporate_id', 'uc.id')
        .on('up.transaction_person', flag.FALSE)
        .on('up.representative_person', flag.TRUE)
        .on('up.beneficial_owner', flag.FALSE)
    })
    .join('users_portal_data as upd', 'upd.user_basic_data_id', 'users.id')
    .leftJoin('m_countries as mc1', 'up.nationality_id', 'mc1.id')
    .leftJoin('m_countries as mc2', 'up.phone_number_country_id', 'mc2.id')
    .leftJoin('m_countries as mc3', 'up.country_id', 'mc3.id')
    .leftJoin('m_prefectures as mp', 'up.state_province', 'mp.id')
    .leftJoin('users_finance as uf', 'uf.user_personal_id', 'up.id')
    .join(getUserAccountStatus(), 'gsh.target_id', 'users.id')
    .select(
      'up.id',
      'users.id as user_id',
      'users.site_id',
      'upd.step_setting',

      'up.nationality_id',
      'mc1.file_name as nationality_file_name',
      'mc1.japanese_notation as nationality_name_ja',
      'mc1.english_notation as nationality_name_en',
      'mc1.korean_notation as nationality_name_kr',
      'mc1.chinese_notation as nationality_name_cn',
      'up.first_name_romaji',
      'up.last_name_romaji',

      'up.phone_number_country_id',
      'mc2.file_name as phone_number_country_file_name',
      'mc2.japanese_notation as phone_number_ja',
      'mc2.english_notation as phone_number_en',
      'mc2.korean_notation as phone_number_kr',
      'mc2.chinese_notation as phone_number_cn',
      'mc2.country_number as phone_number_country',
      'up.contact_phone_number',

      'up.date_of_birth',
      'up.first_name_kanji',
      'up.last_name_kanji',
      'up.first_name_katakana',
      'up.last_name_katakana',
      'up.gender',
      'up.like_transaction_person',

      'up.country_id',
      'mc3.file_name as country_file_name',
      'mc3.japanese_notation as country_name_ja',
      'mc3.english_notation as country_name_en',
      'mc3.korean_notation as country_name_kr',
      'mc3.chinese_notation as country_name_cn',
      'up.zip_postal_code',
      'up.state_province',
      'mp.ja_name as prefectures_ja',
      'mp.en_name as prefectures_en',
      'mp.cn_name as prefectures_cn',
      'mp.kr_name as prefectures_kr',
      'up.city',
      'up.address_line_1',
      'up.address_line_2',

      'uf.id as user_finance_id',
      'uf.us_tax_obligations',
      'uf.us_taxpayer_number',

      'up.status_items',

      'gsh.status_code as account_status_code',
    )
    .where({
      'users.delete_flag': flag.FALSE,
      'users.admin_flag': userBasicClass.USER,
    })

  if (id) {
    query.where('up.id', id)
  } else {
    query.where('users.id', userId)
  }

  return await query.first()
}

const getNamePersonalByUserId = async (userId) => {
  const result = await db('users_personal')
    .select(
      'first_name_katakana',
      'last_name_katakana',
    )
    .where({
      delete_flag: flag.FALSE,
      user_basic_data_id: userId,
      user_corporate_id: flag.FALSE,
      transaction_person: flag.FALSE,
      representative_person: flag.FALSE,
      beneficial_owner: flag.FALSE,
    })
    .first()
  return result ? result : null
}

async function getPersonals(payload) {
  return await db('users_personal').where(payload).orderBy([{ column: 'id', order: 'ASC' }])
}

const getEkycPersonal = async (personal_id) => {
  try {
    const result = db('users_personal')
      .innerJoin('users_basic_data', 'users_personal.user_basic_data_id', 'users_basic_data.id')
      .select(
        db.raw(`
          CASE 
            WHEN (
              users_basic_data.corporate_flag = 0 
              OR (
                users_basic_data.corporate_flag = 1 
                AND users_personal.transaction_person = 1
                AND users_personal.representative_person = 0 
                AND users_personal.beneficial_owner = 0
              )
            ) 
            THEN users_basic_data.first_name_romaji
            ELSE users_personal.first_name_romaji 
          END  as first_name_romaji`,
        ),
        db.raw(`
          CASE 
            WHEN (
              users_basic_data.corporate_flag = 0 
              OR (
                users_basic_data.corporate_flag = 1 
                AND users_personal.transaction_person = 1
                AND users_personal.representative_person = 0 
                AND users_personal.beneficial_owner = 0
              )
            ) 
            THEN users_basic_data.last_name_romaji
            ELSE users_personal.last_name_romaji 
          END as last_name_romaji`,
        ),
        db.raw(`
          CASE 
            WHEN (
              users_basic_data.corporate_flag = 0 
              OR (
                users_basic_data.corporate_flag = 1 
                AND users_personal.transaction_person = 1
                AND users_personal.representative_person = 0 
                AND users_personal.beneficial_owner = 0
              )
            ) 
            THEN users_basic_data.country_id
            ELSE users_personal.country_id 
          END as country_id`,
        ),
        'users_personal.first_name_kanji',
        'users_personal.last_name_kanji',
        'users_personal.zip_postal_code',
        'users_personal.state_province',
        'users_personal.city',
        'users_personal.address_line_1',
        'users_personal.address_line_2',
        'users_personal.nationality_id',
        'users_personal.date_of_birth',
        'users_basic_data.id as user_id',
      )
      .where('users_personal.id', personal_id)
      .first()
    return result
  } catch (error) {
    console.log(error)
    return false
  }
}

async function getShareholderPersonForValidate(userId) {
  return await db('users_basic_data as users')
    .leftJoin('users_personal as up', 'users.id', 'up.user_basic_data_id')
    .where('users.id', userId)
    .where('users.delete_flag', flag.FALSE)
    .where('up.user_corporate_id', 0)
    .where('up.transaction_person', flag.FALSE)
    .where('up.representative_person', flag.FALSE)
    .where('up.beneficial_owner', flag.TRUE)
    .select(
      'up.id as personal_id',
      'up.user_basic_data_id as user_id',
    )
}

async function getBeneficialOwnerInfo(userId) {
  const query = db('users_basic_data as users')
    .leftJoin('users_personal as up', 'users.id', 'up.user_basic_data_id')

    .leftJoin('m_countries as mc1', 'up.nationality_id', 'mc1.id')
    .leftJoin('m_countries as mc2', 'up.country_id', 'mc2.id')
    .leftJoin('m_countries as mc3', 'up.phone_number_country_id', 'mc3.id')
    .leftJoin('m_countries as mc4', 'users.country_id', 'mc4.id')

    .leftJoin('m_prefectures as mp', 'up.state_province', 'mp.id')

    .select(
      'up.id as personal_id',
      'up.user_basic_data_id as user_id',
      'up.user_corporate_id as corporate_id',

      'up.nationality_id',
      'mc1.file_name as nationality_file_name',
      'mc1.japanese_notation as nationality_ja',
      'mc1.english_notation as nationality_en',
      'mc1.korean_notation as nationality_kr',
      'mc1.chinese_notation as nationality_cn',

      db.raw('IF(up.like_shareholder_person=1 AND up.transaction_person=1, users.first_name_romaji, up.first_name_romaji) as first_name_romaji'),
      db.raw('IF(up.like_shareholder_person=1 AND up.transaction_person=1, users.last_name_romaji, up.last_name_romaji) as last_name_romaji'),
      'up.first_name_kanji',
      'up.last_name_kanji',
      'up.first_name_katakana',
      'up.last_name_katakana',
      'up.gender',
      'up.date_of_birth',

      db.raw('IF(up.like_shareholder_person=1 AND up.transaction_person=1, users.country_id, up.country_id) as country_id'),
      db.raw('IF(up.like_shareholder_person=1 AND up.transaction_person=1, mc4.file_name, mc2.file_name) as country_file_name'),
      db.raw('IF(up.like_shareholder_person=1 AND up.transaction_person=1, mc4.japanese_notation, mc2.japanese_notation) as country_ja'),
      db.raw('IF(up.like_shareholder_person=1 AND up.transaction_person=1, mc4.english_notation, mc2.english_notation) as country_en'),
      db.raw('IF(up.like_shareholder_person=1 AND up.transaction_person=1, mc4.korean_notation, mc2.korean_notation) as country_kr'),
      db.raw('IF(up.like_shareholder_person=1 AND up.transaction_person=1, mc4.chinese_notation, mc2.chinese_notation) as country_cn'),

      'up.zip_postal_code',
      'up.state_province',
      'mp.ja_name as prefectures_ja',
      'mp.en_name as prefectures_en',
      'mp.cn_name as prefectures_cn',
      'mp.kr_name as prefectures_kr',
      'up.city',
      'up.address_line_1',
      'up.address_line_2',

      'up.phone_number_country_id',
      'mc3.file_name as phone_number_country_file_name',
      'mc3.japanese_notation as phone_number_ja',
      'mc3.english_notation as phone_number_en',
      'mc3.korean_notation as phone_number_kr',
      'mc3.chinese_notation as phone_number_cn',
      'mc3.country_number as phone_number_country',
      'up.contact_phone_number',

      'up.voting_ratio',
      'up.voting_ratio_shareholder',
      'up.status_items',
      'up.like_shareholder_person',
      'up.like_transaction_person',
    )
  query.where(function() {
    this.where({
      'users.id': userId,
      'users.delete_flag': flag.FALSE,
      'up.user_corporate_id': 0,
      'up.transaction_person': flag.FALSE,
      'up.representative_person': flag.FALSE,
      'up.beneficial_owner': flag.TRUE,
    })
      .orWhere({
        'users.id': userId,
        'users.delete_flag': flag.FALSE,
        'up.transaction_person': flag.FALSE,
        'up.representative_person': flag.TRUE,
        'up.beneficial_owner': flag.FALSE,
        'up.like_shareholder_person': flag.TRUE,
      })
      .orWhere({
        'users.id': userId,
        'users.delete_flag': flag.FALSE,
        'up.transaction_person': flag.TRUE,
        'up.representative_person': flag.FALSE,
        'up.beneficial_owner': flag.FALSE,
        'up.like_shareholder_person': flag.TRUE,
      })
  })

  return await query
}

async function getRepresentShareholderPerson(userId) {
  const query = db('users_basic_data as users')
    .leftJoin('users_corporate as uc', 'users.id', 'uc.user_basic_data_id')
    .leftJoin('users_personal as up', 'uc.id', 'up.user_corporate_id')
    .leftJoin('m_countries as mc1', 'up.nationality_id', 'mc1.id')
    .leftJoin('m_countries as mc2', 'up.country_id', 'mc2.id')
    .leftJoin('m_countries as mc3', 'up.phone_number_country_id', 'mc3.id')

    .leftJoin('m_prefectures as mp', 'up.state_province', 'mp.id')
    .where('users.id', userId)
    .where('users.delete_flag', flag.FALSE)
    .select(
      'up.id as personal_id',
      'up.user_basic_data_id as user_id',
      'up.user_corporate_id as corporate_id',

      'up.nationality_id',
      'mc1.file_name as nationality_file_name',
      'mc1.japanese_notation as nationality_ja',
      'mc1.english_notation as nationality_en',
      'mc1.korean_notation as nationality_kr',
      'mc1.chinese_notation as nationality_cn',

      'up.first_name_romaji',
      'up.last_name_romaji',
      'up.first_name_kanji',
      'up.last_name_kanji',
      'up.first_name_katakana',
      'up.last_name_katakana',
      'up.gender',
      'up.date_of_birth',

      'up.country_id',
      'mc2.file_name as country_file_name',
      'mc2.japanese_notation as country_ja',
      'mc2.english_notation as country_en',
      'mc2.korean_notation as country_kr',
      'mc2.chinese_notation as country_cn',

      'up.zip_postal_code',
      'up.state_province',
      'mp.ja_name as prefectures_ja',
      'mp.en_name as prefectures_en',
      'mp.cn_name as prefectures_cn',
      'mp.kr_name as prefectures_kr',
      'up.city',
      'up.address_line_1',
      'up.address_line_2',

      'up.phone_number_country_id',
      'mc3.file_name as phone_number_country_file_name',
      'mc3.japanese_notation as phone_number_ja',
      'mc3.english_notation as phone_number_en',
      'mc3.korean_notation as phone_number_kr',
      'mc3.chinese_notation as phone_number_cn',
      'mc3.country_number as phone_number_country',
      'up.contact_phone_number',

      'up.status_items',
      'up.like_transaction_person',
    )
  query.where(function() {
    this.where({
      'users.id': userId,
      'users.delete_flag': flag.FALSE,
      'uc.beneficial_owner': flag.TRUE,
      'up.transaction_person': flag.FALSE,
      'up.representative_person': flag.TRUE,
      'up.beneficial_owner': flag.FALSE,
    })
      .orWhere({
        'users.id': userId,
        'users.delete_flag': flag.FALSE,
        'up.transaction_person': flag.FALSE,
        'up.representative_person': flag.TRUE,
        'up.beneficial_owner': flag.FALSE,
        'uc.beneficial_owner': flag.FALSE,
      })
  })
  return await query
}

async function getLikePerson(obj) {
  return await db('users_personal')
    .select(
      'id',
      'like_shareholder_person',
      'transaction_person',
      'representative_person',
    )
    .where({
      ...obj,
      delete_flag: flag.FALSE,
    })
    .first()
}

async function getPersonalCheckUpdate(id) {
  return await db('users_basic_data as users')
    .join('users_personal as up', function() {
      /* eslint-disable no-invalid-this */
      this.on(function() {
        this
          .on('users.id', 'up.user_basic_data_id')
          .on('up.user_corporate_id', flag.FALSE)
          .on('up.transaction_person', flag.FALSE)
          .on('up.representative_person', flag.FALSE)
          .on('up.beneficial_owner', flag.TRUE)
      })
        .orOn(function() {
          this
            .on('users.id', 'up.user_basic_data_id')
            .on('up.transaction_person', flag.FALSE)
            .on('up.representative_person', flag.TRUE)
            .on('up.beneficial_owner', flag.FALSE)
            .on('up.like_shareholder_person', flag.TRUE)
        })
        .orOn(function() {
          this
            .on('users.id', 'up.user_basic_data_id')
            .on('up.transaction_person', flag.TRUE)
            .on('up.representative_person', flag.FALSE)
            .on('up.beneficial_owner', flag.FALSE)
            .on('up.like_shareholder_person', flag.TRUE)
        })
    })
    .join(getUserAccountStatus(), 'gsh.target_id', 'users.id')

    .where('up.id', id)
    .where('users.delete_flag', flag.FALSE)
    .select(
      'up.id as personal_id',
      'up.user_basic_data_id as user_id',
      'users.site_id',
      'gsh.status_code as account_status_code',
      'up.nationality_id',
      'up.country_id',
      'up.first_name_romaji',
      'up.last_name_romaji',
      'up.first_name_kanji',
      'up.last_name_kanji',
      'up.first_name_katakana',
      'up.last_name_katakana',
      'up.gender',
      'up.voting_ratio',
      'up.voting_ratio_shareholder',
      'up.zip_postal_code',
      'up.state_province',
      'up.city',
      'up.address_line_1',
      'up.address_line_2',
      'up.phone_number_country_id',
      'up.contact_phone_number',
      'up.status_items',
    )
    .first()
}

async function getRepresentPersonCheckUpdate(id) {
  return await db('users_basic_data as users')
    .join('users_personal as up', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('users.id', 'up.user_basic_data_id')
        .on('up.transaction_person', flag.FALSE)
        .on('up.representative_person', flag.TRUE)
        .on('up.beneficial_owner', flag.FALSE)
    })
    .join(getUserAccountStatus(), 'gsh.target_id', 'users.id')
    .where('up.id', id)
    .where('users.delete_flag', flag.FALSE)
    .select(
      'up.id as personal_id',
      'up.user_basic_data_id as user_id',
      'users.site_id',
      'gsh.status_code as account_status_code',
      'up.nationality_id',
      'up.country_id',
      'up.first_name_romaji',
      'up.last_name_romaji',
      'up.first_name_kanji',
      'up.last_name_kanji',
      'up.first_name_katakana',
      'up.last_name_katakana',
      'up.gender',
      'up.voting_ratio',
      'up.voting_ratio_shareholder',
      'up.zip_postal_code',
      'up.state_province',
      'up.city',
      'up.address_line_1',
      'up.address_line_2',
      'up.phone_number_country_id',
      'up.contact_phone_number',
      'up.status_items',
    )
    .first()
}

async function insertPersonalInfo(objData) {
  const result = await db.transaction(async (trx) => {
    const personal = await trx('users_personal')
      .insert(objData)

    return personal
  })
  return result
}

async function getRelatePerson(userId) {
  return db('users_personal')
    .select('id')
    .where((builder) =>
      builder
        .orWhere({
          'transaction_person': flag.FALSE,
          'representative_person': flag.TRUE,
          'beneficial_owner': flag.FALSE,
          'like_transaction_person': flag.FALSE,
          'delete_flag': flag.FALSE,
          'user_basic_data_id': userId,
        })
        .orWhere({
          'transaction_person': flag.FALSE,
          'representative_person': flag.FALSE,
          'beneficial_owner': flag.TRUE,
          'like_transaction_person': flag.FALSE,
          'delete_flag': flag.FALSE,
          'user_basic_data_id': userId,
        }),
    )
}

const getPersonInfoByUserId = (userId) => {
  return db('users_basic_data')
    .leftJoin('users_personal', 'users_personal.user_basic_data_id', 'users_basic_data.id')
    .leftJoin('users_portal_data', 'users_portal_data.user_basic_data_id', 'users_basic_data.id')
    .leftJoin('m_countries as user_countries', 'users_basic_data.country_id', 'user_countries.id')
    .leftJoin('m_countries as personal_countries', 'users_personal.country_id', 'personal_countries.id')
    .select(
      'users_personal.id',
      'users_personal.user_basic_data_id',
      'users_personal.user_corporate_id',
      'users_personal.representative_person',
      'users_personal.beneficial_owner',
      'users_personal.transaction_person',
      'users_personal.like_transaction_person',
      'users_personal.like_shareholder_person',
      'users_portal_data.profile_picture_url',
      'users_portal_data.profile_picture_name',
      'users_portal_data.profile_picture_color',
      db.raw(
        `CASE WHEN users_personal.first_name_romaji  IS NULL and users_personal.last_name_romaji IS NULL
            THEN CONCAT(users_basic_data.first_name_romaji," ",users_basic_data.last_name_romaji)
            ELSE CONCAT(users_personal.first_name_romaji," ",users_personal.last_name_romaji) 
            END as name_romaji`),
      // COUNTRY NAME
      db.raw(`CASE WHEN personal_countries.country_name IS NULL THEN user_countries.country_name
      ELSE personal_countries.country_name END as country_name`),
      db.raw(`CASE WHEN personal_countries.japanese_notation IS NULL THEN user_countries.japanese_notation
      ELSE personal_countries.japanese_notation END as japanese_notation`),
      db.raw(`CASE WHEN personal_countries.english_notation IS NULL THEN user_countries.english_notation
      ELSE personal_countries.english_notation END as english_notation`),
      db.raw(`CASE WHEN personal_countries.korean_notation IS NULL THEN user_countries.korean_notation
      ELSE personal_countries.korean_notation END as korean_notation`),
      db.raw(`CASE WHEN personal_countries.chinese_notation IS NULL THEN user_countries.chinese_notation
      ELSE personal_countries.chinese_notation END as chinese_notation`),
      db.raw(`CASE WHEN personal_countries.file_name IS NULL THEN user_countries.file_name
      ELSE personal_countries.file_name END as file_name`),
    )
    .where({
      'users_personal.user_basic_data_id': userId,
      'users_personal.delete_flag': flag.FALSE,
      'users_basic_data.delete_flag': flag.FALSE,
    })
    .orderBy([{ column: 'users_personal.transaction_person', order: 'DESC' }, { column: 'users_personal.id', order: 'ASC' }])
}

module.exports = {
  getPersonalInfo,
  updatePersonalInfo,
  updatePersonalAddress,
  getTransactionPersonInfo,
  getRepresentativePersonInfo,
  getNamePersonalByUserId,
  getPersonals,
  getEkycPersonal,
  getShareholderPersonForValidate,
  getBeneficialOwnerInfo,
  getRepresentShareholderPerson,
  getLikePerson,
  getPersonalCheckUpdate,
  getRepresentPersonCheckUpdate,
  insertPersonalInfo,
  getRelatePerson,
  getPersonInfoByUserId,
}
