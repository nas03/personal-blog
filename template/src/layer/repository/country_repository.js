/* eslint-disable require-jsdoc */
const db = require('db').helper
const { flag } = require('constant')

async function getAll() {
  const result = await db('m_countries')
    .where('delete_flag', flag.FALSE)
    .select(
      'id as code',
      'country_name as displayName',
      'japanese_notation as jaNotation',
      'japanese_display_order as jaDisplayOrder',
      'english_notation as enNotation',
      'english_display_order as enDisplayOrder',
      'korean_notation as krNotation',
      'korean_display_order as krDisplayOrder',
      'chinese_notation as cnNotation',
      'chinese_display_order as cnDisplayOrder',
      'country_code as countryCode',
      'file_name as displayImage',
      'country_number as phoneCode',
    )

  return result
}

const getCountyById = async (country_id) => {
  const result = await db('m_countries')
    .where({
      id: country_id,
      delete_flag: flag.FALSE,
    })
    .select(
      'id ',
      'english_notation',
      'country_name',
    )

  return result ? result[0] : null
}

const getCountryNumberById = async (id) =>{
  const result = await db('m_countries')
    .select('country_number')
    .where('id', id)

  return result ? result[0] : null
}

async function getCountryFinancialInstitution() {
  return db('m_countries')
    .where('delete_flag', flag.FALSE)
    .where('financial_institution_flag', flag.TRUE)
    .select(
      'id',
      'japanese_notation as ja_name',
      'japanese_display_order as ja_display_order',
      'english_notation as en_name',
      'english_display_order as en_display_order',
      'korean_notation as kr_name',
      'korean_display_order as kr_display_order',
      'chinese_notation as cn_name',
      'chinese_display_order as cn_display_order',
      'country_code',
      'country_number',
      'file_name',
    )
}

module.exports = {
  getAll,
  getCountyById,
  getCountryNumberById,
  getCountryFinancialInstitution,
}
