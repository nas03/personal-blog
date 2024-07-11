const { flag } = require('constant')

const db = require('db').helper

const getAllFlows = async () => {
  return db('m_kyc_flows')
    .where('delete_flag', flag.FALSE)
    .select('flow_name')
    .groupBy('flow_name')
    .orderBy('m_kyc_flows.id', 'asc')
}

const getKycFlows = async (payload) => {
  return await db('m_kyc_flows')
    .leftJoin('m_kyc_documents', 'm_kyc_flows.kyc_document_id', 'm_kyc_documents.id')
    .where(payload)
    .select(
      'm_kyc_flows.id',
      'm_kyc_flows.flow_name',
      'm_kyc_flows.kyc_document_id',
      'm_kyc_flows.step',
      'm_kyc_documents.authentication_type',
      'm_kyc_documents.document_type',
      'm_kyc_documents.document_symbol',
      'm_kyc_documents.ja_document_name',
      'm_kyc_documents.en_document_name',
      'm_kyc_documents.cn_document_name',
      'm_kyc_documents.kr_document_name',
    )
    .orderBy([
      { column: 'm_kyc_flows.id', order: 'asc' },
      { column: 'm_kyc_flows.step', order: 'asc' },
    ])
}

module.exports = {
  getAllFlows,
  getKycFlows,
}
