/* library */
const pasrse = require('aws-multipart-parser')

/* constant */
const { flag, kycProcessAngle, errorMessageCodeConstant, code } = require('constant')

/* db */
const { ekycDocumentsRepository, streamingChannelRepository, errorLogRepository, kycPhotoAngleRepository } = require('repository')

/* func */
const utility = require('utility')
const { uploadFileToS3 } = require('helper').upload

const createDocument = async (event) => {
  try {
    console.log('---START_CREATE_DOCUMENT---')
    const eventBody = pasrse.parse(event, true)
    const { file, kycDocumentId, document_type, access_token, photo_process, is_preview } = eventBody
    console.log(eventBody)
    // Check Required
    if (!file || !document_type || !access_token) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    const verify = utility.verifyToken(access_token)
    if (!verify.status) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.CREATE_DOCUMENT.TOKEN_INVALID], null, code.AUTHORIZATION)
    }
    const { user_id, personal_id } = verify.data
    event.user_id = user_id
    // Check size img
    if (Buffer.byteLength(file.content) / 1024 / 1024 > 5) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }
    const customDocumentType = document_type?.replace(/\s/g, '_')

    // Get streaming info
    const streamingInfo = await streamingChannelRepository.getStreamingInfo({
      'streaming.user_basic_data_id': user_id,
      'streaming.user_personal_id': personal_id,
      'streaming.status': flag.TRUE,
      'streaming.url_playback_active': flag.TRUE,
      'streaming.document_live_streaming': kycDocumentId,
    })
    console.log(streamingInfo)

    // Upload file to S3
    const fileName = is_preview ?
      `${personal_id}_${customDocumentType}_preview.png` :
      `${personal_id}_${customDocumentType}_${photo_process}.png`
    const dir = `${streamingInfo.directory_path}/${customDocumentType}/${fileName}`

    console.log('---START_UPLOAD_S3---')
    const uploadS3 = await uploadFileToS3(file, dir)
    console.log('---END_UPLOAD_S3---')

    const kycPhotoAngleKey = photo_process ? _renderPhotoAngleKey(document_type, photo_process) : null
    const mPhotoAngle = await kycPhotoAngleRepository.getKycPhotoAngleByKey({ key: kycPhotoAngleKey })

    const payload = {
      kyc_transaction_id: streamingInfo.kyc_transaction_id,
      file_name: fileName,
      file_url: uploadS3.Location,
      photo_process: photo_process ? photo_process : null,
      kyc_photo_angle_id: mPhotoAngle.id,
      is_preview: is_preview ? 1 : 0,
      original_flag: 1,
    }

    // create document
    await ekycDocumentsRepository.createEkycDocument(payload)
    console.log('---END_CREATE_DOCUMENT---')

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const _renderPhotoAngleKey = (documentType, photoStep) => {
  const photoAngle = kycProcessAngle[documentType]
  return photoAngle ? photoAngle[Number(photoStep) - 1] || '' : ''
}

module.exports = {
  createDocument,
}
