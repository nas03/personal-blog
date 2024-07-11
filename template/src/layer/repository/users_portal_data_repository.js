// db
const db = require('db').helper

const updateStaffProfile = async (userBasicDataId, payloadUserBasicData, payloadUserPortalData, payloadHistory = undefined) =>{
  const result = await db.transaction(async (trx) =>{
    if (payloadUserBasicData) {
      // UPDATE USERS_BASIC_DATA
      await trx('users_basic_data')
        .update(payloadUserBasicData)
        .where('id', userBasicDataId)
    }

    // CHECK EXIST USERS PORTAL DATA
    const userPortalData = await trx('users_portal_data')
      .where('user_basic_data_id', userBasicDataId)
      .select('id')
      .first()

    // IF EXIST USERS PORTAL DATA => UPDATE, ELSE => INSERT
    if (userPortalData) {
      await trx('users_portal_data')
        .update(payloadUserPortalData)
        .where('id', userPortalData.id)
    } else {
      await trx('users_portal_data')
        .insert({
          user_basic_data_id: userBasicDataId,
          ...payloadUserPortalData,
        })
    }

    // INSERT STATUS HISTORY
    if (payloadHistory) {
      await trx('general_status_history').insert(payloadHistory)
    }

    return true
  })

  return result
}


async function updateUserPortalData(id, payload) {
  return await db('users_portal_data').where('user_basic_data_id', id).update(payload)
}

// TODO: AFTER CODING MF 6.3.7, DELETE THIS FUNCTION. THEN REPLACE TO updateUserPortalData
async function updateUserSetting(id, payload) {
  return await db('users_portal_data').where('user_basic_data_id', id).update(payload)
}

module.exports = {
  updateStaffProfile,
  updateUserPortalData,
  updateUserSetting,
}

