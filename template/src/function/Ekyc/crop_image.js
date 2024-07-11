/* FUNCTION */
const { flag, errorMessageCodeConstant } = require('constant')
const utility = require('utility')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const { PutObjectCommand } = require('@aws-sdk/client-s3')

// REPOSITORY
const { errorLogRepository, ekycDocumentsRepository, ekycRepository } = require('repository')

// HELPER
const upload = require('helper').upload

/* library */
const CryptoJS = require('crypto-js')
const { checkDuplicateError } = require('./ekyc_transaction')

const uploadKycDocument = async (event) =>{
  try {
    const { kyc_ids, ekyc_document_id, width, height, top, left, scale, aspect_ratio } = JSON.parse(event.body)
    const staff_id = utility.getUserIdByToken(event)

    const fieldsBlank =
      !kyc_ids.length ||
      !ekyc_document_id ||
      (!width && width !== 0) ||
      (!height && height !== 0) ||
      (!top && top !== 0) ||
      (!left && left !== 0) ||
      (!scale && scale !== 0) ||
      (!aspect_ratio && aspect_ratio !== 0)

    if (fieldsBlank) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }
    const userInfo = await ekycRepository.getUserInfoByEkycId(kyc_ids[0])
    event.user_id = userInfo?.user_id

    // CHECK DUPLICATE ERROR
    const isDuplicateError = await checkDuplicateError(staff_id, kyc_ids)
    if (!isDuplicateError) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPLOAD_KYC_DOCUMENT.KYC_PROCESS_DUPLICATE_ERROR])
    }

    // GET ARCHIVED DOCUMENT INFO
    const archivedDocuments = await ekycDocumentsRepository.getArchivedDocumentForUpload(ekyc_document_id)

    const { directory_path, file_name, document_type, kyc_transaction_id, kyc_photo_angle_id, photo_process } = archivedDocuments

    // CHECK IS EXISTED IMAGE CROPPING
    const isExisted = await ekycDocumentsRepository.existedImageCropping(kyc_transaction_id, file_name, kyc_photo_angle_id, photo_process)

    if (isExisted) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // DIRECTORY
    const croppingImagePosition = `with_${width}_height_${height}_left_${left}_top_${top}_scale_${scale}_aspect_ratio_${aspect_ratio}`
    const nameFile = `${file_name?.split('.')[0]}_trimming_${croppingImagePosition}` || ''
    const extFile = file_name?.split('.')[1] || ''
    const key = `${directory_path}/${document_type.replace(/\s/g, '_')}/${nameFile}.${extFile?.toLowerCase()}`

    const s3 = await upload.connectS3()
    // GET SIGNED URL FROM S3
    const s3Params = {
      Bucket: process.env.BUCKET,
      Key: key,
      ContentType: _renderContentType(extFile.toLowerCase()),
    }

    const uploadUrl = await getSignedUrl(s3, new PutObjectCommand(s3Params), { expiresIn: 3600 })

    const response = {
      upload_url: uploadUrl,
      kyc_transaction_id: kyc_transaction_id,
      file_name: `${nameFile}.${extFile?.toLowerCase()}`,
      key: key,
      kyc_photo_angle_id: kyc_photo_angle_id,
      photo_process: photo_process,
    }

    return utility.createResponse(true, response)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const confirmUploadKycDoc = async (event) =>{
  try {
    const {
      kyc_ids,
      kyc_transaction_id,
      file_name,
      file_url,
      kyc_photo_angle_id,
      photo_process,
    } = JSON.parse(event.body)

    const staff_id = utility.getUserIdByToken(event)

    const userInfo = await ekycRepository.getUserInfoByEkycId(kyc_ids[0])
    event.user_id = userInfo?.user_id || null

    const isDuplicateError = await checkDuplicateError(staff_id, kyc_ids)
    if (!isDuplicateError) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.CONFIRM_UPLOAD_KYC_DOC.KYC_PROCESS_DUPLICATE_ERROR])
    }

    const fieldsBlank =
      !kyc_ids.length ||
      !kyc_transaction_id ||
      !file_name ||
      !file_url ||
      !kyc_photo_angle_id ||
      !photo_process

    if (fieldsBlank) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // CHECK IS EXISTED IMAGE CROPPING
    const isExisted = await ekycDocumentsRepository.existedImageCropping(kyc_transaction_id, file_name, kyc_photo_angle_id, photo_process)

    if (isExisted) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    const decryptUrl = CryptoJS.AES.decrypt(file_url, process.env.SECRET_KEY_CRYPTOJS)
    const urlText = decryptUrl.toString(CryptoJS.enc.Utf8)

    const payloadInsertDocument = {
      kyc_transaction_id: kyc_transaction_id,
      file_name: file_name,
      file_url: urlText,
      kyc_photo_angle_id: kyc_photo_angle_id,
      photo_process: photo_process,
      original_flag: flag.FALSE,
    }

    await ekycDocumentsRepository.createEkycDocument(payloadInsertDocument)

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const _renderContentType = (ext) => {
  switch (ext) {
    case 'png':
      return 'image/png'
    default:
      return 'image/jpeg'
  }
}

module.exports = {
  uploadKycDocument,
  confirmUploadKycDoc,
}
