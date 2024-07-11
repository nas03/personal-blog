const db = require('db').helper

const { flag, ekycAuthenticationType } = require('constant')

const createEkycDocument = async (data) => {
  return await db.transaction(async (trx) => {
    // create document
    const insert = await trx('archived_documents').insert(data)
    return !!insert
  })
}

const getEkycDocumentsByEkycIds = async (kycTransactionIds) => {
  try {
    return await db('archived_documents as ad')
      .innerJoin('kyc_transaction as kt', 'kt.id', 'ad.kyc_transaction_id')
      .whereIn('ad.kyc_transaction_id', kycTransactionIds)
      .select(
        'ad.id as ekyc_document_id',
        'ad.kyc_transaction_id as ekyc_id',
        'ad.file_name',
        'ad.file_url',
        'ad.photo_process',
        'ad.is_video',
        'ad.is_preview',
        'ad.original_flag',
      )
      .where('ad.original_flag', flag.TRUE)
      .orderBy([
        { column: 'ad.photo_process', order: 'ASC' },
      ])
  } catch (error) {
    console.log(error)
    return false
  }
}

const getEkycDocuments = async (payload) => {
  return await db('archived_documents as ad')
    .innerJoin('kyc_transaction as kt', 'kt.id', 'ad.kyc_transaction_id')
    .leftJoin('m_kyc_photo_angle as mkpa', 'mkpa.id', 'ad.kyc_photo_angle_id')
    .where(payload)
    .select(
      'ad.id as ekyc_document_id',
      'ad.file_name',
      'ad.file_url',
      'ad.photo_process',
      'mkpa.ja_display_name as photo_process_name_ja',
      'mkpa.en_display_name as photo_process_name_en',
      'mkpa.cn_display_name as photo_process_name_cn',
      'mkpa.kr_display_name as photo_process_name_kr',
      'ad.is_video',
      'ad.is_preview',
      'ad.original_flag',
    )
    .orderBy([
      { column: 'ad.photo_process', order: 'ASC' },
    ])
}

const getEkycIvsVideo = async () => {
  return await db('archived_documents as ad')
    .leftJoin('kyc_transaction', 'kyc_transaction.id', 'ad.kyc_transaction_id')
    .leftJoin('m_kyc_documents', 'm_kyc_documents.id', 'kyc_transaction.user_selected_document_id')
    .whereILike('file_url', '%amazonaws.com/ivs/%')
    .where('kyc_transaction.completed_flag', flag.TRUE)
    .where('ad.original_flag', flag.TRUE)
    .select(
      'ad.id as ekyc_document_id',
      'ad.file_name',
      'ad.file_url',
      'ad.is_video',
      'ad.is_preview',
      'kyc_transaction.user_personal_id',
      'm_kyc_documents.document_type',
      'kyc_transaction.directory_path',
    )
}

const updateEkycDocument = async (id, data) => {
  return await db.transaction(async (trx) => {
    const update = await trx('archived_documents').update(data).where({ id: id })
    return !!update
  })
}

const getArchivedDocumentsByKyc = (kycTransactionIds, payload) => {
  const query = db('kyc_transaction')
    .leftJoin('ekyc_evaluation as ee', 'ee.kyc_transaction_id', 'kyc_transaction.id')
    .leftJoin('m_kyc_documents as admin_selected_document', 'ee.admin_selected_document_id', 'admin_selected_document.id')
    .leftJoin('m_kyc_documents as user_selected_document', 'kyc_transaction.user_selected_document_id', 'user_selected_document.id')
    .leftJoin('archived_documents', 'archived_documents.kyc_transaction_id', 'kyc_transaction.id')
    .leftJoin('m_kyc_photo_angle', 'm_kyc_photo_angle.id', 'archived_documents.kyc_photo_angle_id')

    .select(
      'archived_documents.id as ekyc_document_id',
      'kyc_transaction.id as kyc_transaction_id',
      'user_selected_document.authentication_type',
      'user_selected_document.photo_type',
      'user_selected_document.ja_document_name',
      'user_selected_document.en_document_name',
      'user_selected_document.cn_document_name',
      'user_selected_document.kr_document_name',
      'archived_documents.file_name',
      'archived_documents.file_url',

      'archived_documents.photo_process',
      'm_kyc_photo_angle.key',
      'm_kyc_photo_angle.ja_display_name as photo_process_name_ja',
      'm_kyc_photo_angle.en_display_name as photo_process_name_en',
      'm_kyc_photo_angle.cn_display_name as photo_process_name_cn',
      'm_kyc_photo_angle.kr_display_name as photo_process_name_kr',

      'archived_documents.original_flag',
      'archived_documents.is_video',
      'archived_documents.is_preview',

      // SELECT DEFAULT RADIO
      db.raw(`CASE 
      WHEN ee.admin_selected_document_id = -1 THEN '8:5'
      WHEN user_selected_document.authentication_type = '${ekycAuthenticationType.Face_Auth}' THEN '1:1'
      ELSE admin_selected_document.default_ratio END as default_ratio`),
    )

  if (kycTransactionIds) {
    query.whereIn('kyc_transaction.id', kycTransactionIds)
  }

  if (payload) {
    query.where(payload)
  }

  return query.orderBy('photo_process', 'asc')
}

const getArchivedDocumentForUpload = (archivedDocumentId) =>{
  return db('archived_documents')
    .leftJoin('kyc_transaction', 'archived_documents.kyc_transaction_id', 'kyc_transaction.id')
    .leftJoin('m_kyc_documents as mkd', 'kyc_transaction.user_selected_document_id', 'mkd.id')
    .leftJoin('users_basic_data', 'users_basic_data.id', 'kyc_transaction.user_basic_data_id')
    .leftJoin('m_site', 'm_site.id', 'users_basic_data.site_id')
    .select(
      'archived_documents.id as ekyc_document_id',
      'archived_documents.file_name',
      'users_basic_data.site_id',
      'm_site.site_name',
      'kyc_transaction.user_basic_data_id as user_id',
      'kyc_transaction.user_personal_id as personal_id',
      'kyc_transaction.directory_path',
      'mkd.document_type',
      'archived_documents.kyc_transaction_id',
      'archived_documents.kyc_photo_angle_id',
      'archived_documents.photo_process',
    )
    .where('archived_documents.original_flag', flag.TRUE)
    .where('archived_documents.id', archivedDocumentId).first()
}

const deleteCroppedDocument = async (kycId, archivedDocumentId, payloadEkycEvaluation ) => {
  try {
    const result = await db.transaction(async (trx) => {
      await trx('ekyc_evaluation').update(payloadEkycEvaluation).where('kyc_transaction_id', kycId)
      await trx('archived_documents').where( 'id', archivedDocumentId ).del()
      return true
    })
    return result
  } catch (error) {
    console.log(error)
    return false
  }
}

const existedImageCropping = async (kyc_transaction_id, file_name, kyc_photo_angle_id, photo_process) =>{
  return await db('archived_documents')
    .where({
      'kyc_transaction_id': kyc_transaction_id,
      'original_flag': flag.FALSE,
    })
    .where((builder) =>{
      builder.orWhere('file_name', file_name )
        .orWhere('kyc_photo_angle_id', kyc_photo_angle_id )
        .orWhere('photo_process', photo_process )
    }).first()
}

module.exports = {
  createEkycDocument,
  getEkycDocumentsByEkycIds,
  getEkycDocuments,
  getEkycIvsVideo,
  updateEkycDocument,
  getArchivedDocumentsByKyc,
  getArchivedDocumentForUpload,
  deleteCroppedDocument,
  existedImageCropping,
}
