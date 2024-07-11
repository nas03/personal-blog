/* db */
const db = require('db').helper

const getEkycDocumentAnalysis = async (payload) => {
  try {
    const ekycDocuments = await db('ekyc_document_analysis')
      .where('kyc_transaction_id', payload.ekyc_id)
      .select(
        'id',
        'file_uri',
        'type',
        'ocr_result',
        'similarity',
      )
    return ekycDocuments
  } catch (error) {
    console.log(error)
    return false
  }
}

const createEkycDocumentAnalysis = async (ekycId, payloadEkyc, payloadEkycDocumentAnalysis) =>{
  const result = await db.transaction(async (trx) =>{
    await trx('kyc_transaction')
      .update(payloadEkyc)
      .where('id', ekycId)

    // Remove previous ekyc_document_analysis
    await trx('ekyc_document_analysis')
      .where({ kyc_transaction_id: ekycId })
      .del()

    // add new ekyc_document_analysis
    if (payloadEkycDocumentAnalysis.length > 0 ) {
      await trx('ekyc_document_analysis').insert(payloadEkycDocumentAnalysis)
    }
    return true
  })
  return result
}

module.exports = {
  getEkycDocumentAnalysis,
  createEkycDocumentAnalysis,
}
