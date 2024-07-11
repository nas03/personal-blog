'use strict'

/* db */
const db = require('db').helper

/* constant */
const { flag, paymentType } = require('constant')

const getListAccountLocalBank = async (user_id) => {
  const result = await db('account_local_bank')
    .select(
      'id',
      'user_basic_data_id as user_id',
      'bank_name',
      'bank_code',
      'branch_name',
      'branch_code',
      'account_name',
      'account_number',
      'account_type',
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

const createLocalBankAccount = async (data) => {
  try {
    const result = await db.transaction(async (trx)=>{
      const isCreate = await trx('account_local_bank').insert(data)
      if (!isCreate) {
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

async function updateLocalBankAccount(user_id, bank_id, dataUpdate) {
  try {
    const res = await db.transaction(async (trx) => {
      const isUpdate = await trx('account_local_bank')
        .update({ delete_flag: flag.TRUE })
        .where({
          user_basic_data_id: user_id,
          id: bank_id,
          delete_flag: flag.FALSE,
        })

      // insert new account bank
      const isCreate = await trx('account_local_bank').insert(dataUpdate)

      if (!isUpdate || !isCreate) {
        return false
      }
      return true
    })
    return res
  } catch (error) {
    console.log(error)
    return false
  }
}


const getDetailAccountLocalBank = async (id, userId) => {
  try {
    const result = await db('account_local_bank')
      .select('*')
      .where({
        id: id,
        user_basic_data_id: userId,
        payment_type: paymentType.PAY_OUT,
        delete_flag: flag.FALSE,
      })
    return result ? result[0] : null
  } catch (error) {
    console.log(error)
    return null
  }
}

const getLocalBankDetail = async (id) => {
  try {
    const result = await db('account_local_bank')
      .select(
        'id',
        'user_basic_data_id as user_id',
        'deposit_request_id',
        'bank_name',
        'bank_code',
        'branch_name',
        'branch_code',
        'account_name',
        'account_type',
        'account_number',
        'allotted_at',
        'deposit_count',
      )
      .where({
        id: id,
      }).first()
    return result ? result : null
  } catch (error) {
    console.log(error)
    return null
  }
}

const checkAccountNumberExist = async (payload) => {
  const query = db('account_local_bank')
    .join('users_basic_data', 'users_basic_data.id', 'account_local_bank.user_basic_data_id')
    .where({
      'account_local_bank.account_number': payload.account_number,
      'account_local_bank.bank_code': payload.bank_code,
      'users_basic_data.id': payload.user_id,
      'users_basic_data.delete_flag': flag.FALSE,
      'account_local_bank.delete_flag': flag.FALSE,
    })

  if (payload.account_id) {
    query.where('account_local_bank.id', '<>', payload.account_id)
  }

  const res = await query
  console.log(res)
  return res.length ? true : false
}

module.exports = {
  createLocalBankAccount,
  updateLocalBankAccount,
  getListAccountLocalBank,
  getDetailAccountLocalBank,
  checkAccountNumberExist,
  getLocalBankDetail,
}
