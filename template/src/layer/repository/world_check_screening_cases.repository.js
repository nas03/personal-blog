const db = require('db').helper

const getExistingWorldCheck = async (name_romaji, dob) => {
  return await db('world_check_screening_cases')
    .where('search_name', name_romaji)
    .andWhere('date_of_birth', dob)
    .first()
}

const createNewWorldCheck = async (name, dob, case_system_id) => {
  return await db('world_check_screening_cases')
    .insert({
      search_name: name,
      date_of_birth: dob,
      case_system_id,
    })
}

module.exports = {
  getExistingWorldCheck,
  createNewWorldCheck,
}
