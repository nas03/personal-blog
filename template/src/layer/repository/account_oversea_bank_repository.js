'use strict'

/* db */
const db = require('db').helper

/* constant */
const { flag, paymentType } = require('constant')


const getListOverseasBank = async (user_id) => {
  const result = await db('account_oversea_bank')
    .select(
      'id',
      'user_basic_data_id as user_id',
      'bank_country',
      'currency',
      'bank_name',
      'bank_code',
      'bank_address_line',
      'bank_address_line2',
      'bank_state',
      'bank_city',
      'bank_zip_postal_code',
      'branch_name_flag',
      'branch_name',
      'branch_code',
      'swift_code',
      'account_number',
      'iban_number',
      'beneficiary_name',
      'beneficiary_adress',
      'clearing_code',
      'remitter_name',
      'intermediary_bank',
      'intermediary_swift_code',
      'ts_regist',
    )
    .where({
      user_basic_data_id: user_id,
      payment_type: paymentType.PAY_OUT,
      delete_flag: flag.FALSE,
    })
    .orderBy('ts_regist', 'desc')
  return result ? result : null
}


const getDetailOverseaBank = async (id) => {
  try {
    const result = await db('account_oversea_bank as aob')
      .join('m_countries', 'm_countries.id', 'aob.bank_country')
      .select(
        'aob.id',
        'aob.user_basic_data_id as user_id',
        'aob.bank_country',
        'aob.currency',
        'aob.bank_name',
        'aob.bank_code',
        'aob.bank_address_line',
        'aob.bank_address_line2',
        'aob.bank_state',
        'aob.bank_city',
        'aob.bank_zip_postal_code',
        'aob.branch_name',
        'aob.branch_code',
        'aob.swift_code',
        'aob.account_number',
        'aob.iban_number',
        'aob.beneficiary_name',
        'aob.beneficiary_adress',
        'aob.clearing_code',
        'aob.remitter_name',
        'aob.intermediary_bank',
        'aob.intermediary_swift_code',
        'm_countries.country_name',
        'm_countries.japanese_notation as country_ja_name',
        'm_countries.english_notation as country_en_name',
        'm_countries.korean_notation as country_kr_name',
        'm_countries.chinese_notation as country_cn_name',
      )
      .where('aob.id', id)
      .first()
    return result ? result : null
  } catch (error) {
    console.log(error)
    return null
  }
}

const createAccountOverseaBank = async (obj) => {
  try {
    return await db.transaction(async () => {
      return await db('account_oversea_bank').insert(obj)
    })
  } catch (error) {
    console.error(error)
    return false
  }
}

const checkExistAccountOverseaBank = async (id, userId ) => {
  const result = await db('account_oversea_bank')
    .select('*')
    .where({
      id: id,
      user_basic_data_id: userId,
      payment_type: paymentType.PAY_OUT,
      delete_flag: flag.FALSE,
    })
  return result ? result[0] : null
}


const updateAccount = async (account_id, user_id, payload) => {
  const result = await db.transaction(async (trx) => {
    const resultUpdate = await trx('account_oversea_bank')
      .update({ delete_flag: flag.TRUE })
      .where({
        id: account_id,
        user_basic_data_id: user_id,
        delete_flag: flag.FALSE,
      })
    // insert new account bank
    const isCreate = await trx('account_oversea_bank').insert(payload)
    if (!resultUpdate || !isCreate) {
      return false
    }
    return true
  })
  return result
}

const checkDuplicateAccountOverseaBank = async (dataCheck) => {
  const query = db('account_oversea_bank as aob')
    .join('users_basic_data', 'users_basic_data.id', 'aob.user_basic_data_id')
    .where({
      'users_basic_data.id': dataCheck.user_id,
      'users_basic_data.delete_flag': flag.FALSE,
      'aob.delete_flag': flag.FALSE,
      'payment_type': paymentType.PAY_OUT,
    }).first()

  if (dataCheck.account_number && dataCheck.bank_name) {
    query.where({
      'aob.account_number': dataCheck.account_number,
      'aob.bank_name': dataCheck.bank_name,
    })
  } else if (dataCheck.iban_number) {
    query.where({
      'aob.iban_number': dataCheck.iban_number,
    })
  }

  if (dataCheck.account_id) {
    query.where('aob.id', '<>', dataCheck.account_id)
  }

  const res = await query
  return res ? true : false
}

module.exports = {
  createAccountOverseaBank,
  getListOverseasBank,
  getDetailOverseaBank,
  checkExistAccountOverseaBank,
  updateAccount,
  checkDuplicateAccountOverseaBank,
}
