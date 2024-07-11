const { flag } = require('constant')

const db = require('db').helper

const getKycPhotoAngleByKey = async (payload) => {
  return db('m_kyc_photo_angle')
    .where('delete_flag', flag.FALSE)
    .where(payload).first()
}

module.exports = {
  getKycPhotoAngleByKey,
}
