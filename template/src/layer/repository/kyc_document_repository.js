const { flag } = require('constant')

const db = require('db').helper


const getAllKycDocument = async () =>{
  return await db('m_kyc_documents')
    .where('delete_flag', flag.FALSE)
    .orderBy('m_kyc_documents.id', 'asc')
}

const getKycDocuments = async (payload) =>{
  return await db('m_kyc_documents')
    .where({
      ...payload,
      delete_flag: flag.FALSE,
    })
}

module.exports = {
  getAllKycDocument,
  getKycDocuments,
}
