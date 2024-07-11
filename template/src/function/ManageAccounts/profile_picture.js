/* library */
const CryptoJS = require('crypto-js')
const moment = require('moment')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const { PutObjectCommand } = require('@aws-sdk/client-s3')

/* func */
const utility = require('utility')
const { upload } = require('helper')

/* db */
const { errorLogRepository, usersBasicDataRepository, usersPortalDataRepository, tokenAuthorityRepository } = require('repository')

/* constant */
const { commonSiteId, tokenAuthorityClass, statusCode, errorMessageCodeConstant } = require('constant')
const extAccept = ['png', 'jpg', 'gif', 'jpeg', 'heic', 'heif']

const uploadImage = async (event) => {
  try {
    const { fileName } = JSON.parse(event.body)
    const ext = fileName.split('.').pop()

    if (!extAccept.includes(ext.toLowerCase())) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    const file_key = moment().utc().format('YYYYMMDDHHmmss') + '_' + fileName
    const Key = 'files/images/' + file_key
    const s3 = await upload.connectS3()

    // Get signed URL from S3
    const s3Params = {
      Bucket: process.env.BUCKET,
      Key,
      ContentType: _renderContentType(ext),
    }

    const uploadURL = await getSignedUrl(s3, new PutObjectCommand(s3Params), {
      expiresIn: 3600,
    })

    return utility.createResponse(true, {
      url: uploadURL,
      key: Key,
    })
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const confirmUploadImage = async (event) => {
  try {
    const userId = utility.getUserIdByToken(event)
    const { fileUrl } = JSON.parse(event.body)

    if (!fileUrl) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // DECRYPT URL
    const decryptUrl = CryptoJS.AES.decrypt(fileUrl, process.env.SECRET_KEY_CRYPTOJS)
    const urlText = decryptUrl.toString(CryptoJS.enc.Utf8)

    // UPDATE DB
    const result = await usersPortalDataRepository.updateUserPortalData(
      userId,
      { profile_picture_url: urlText },
    )
    if (!result) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.CONFIRM_UPLOAD_IMAGE.UPDATE_FAIL.UPDATE_DB])
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const deleteImage = async (event) => {
  try {
    const userId = utility.getUserIdByToken(event)
    // UPDATE DB
    const result = await usersPortalDataRepository.updateUserPortalData(
      userId,
      { profile_picture_url: null },
    )
    if (!result) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.DELETE_IMAGE.UPDATE_FAIL.UPDATE_DB])
    }
    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const uploadImageByActivationKey = async (event) => {
  try {
    // VALIDATE REQUIRED
    const { activationKey } = event.pathParameters
    if (!activationKey) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // VERIFY ACTIVATION KEY
    const verify = await tokenAuthorityRepository.verifyTokenAuthority({
      site_id: commonSiteId.P2TECH,
      action_class: tokenAuthorityClass.CREATE_ACCOUNT,
      activation_key: activationKey,
    })
    if (!verify) {
      return await errorLogRepository.createResponseAndLog(
        event,
        null,
        null,
        [errorMessageCodeConstant.UPLOAD_IMAGE_BY_ACTIVATION_KEY.EXPIRED_LINK_INVITE.VERIFY_FAIL])
    }

    // GET STAFF INFO
    const staffData = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': verify.target_id })

    if (!staffData || staffData.account_status_code !== statusCode.ACTIVATED) {
      return await errorLogRepository.createResponseAndLog(
        event,
        null,
        null,
        [errorMessageCodeConstant.UPLOAD_IMAGE_BY_ACTIVATION_KEY.EXPIRED_LINK_INVITE.ACCOUNT_STATUS])
    }

    // GET S3 PRE-SIGN URL
    return await uploadImage(event)
  } catch (error) {
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const confirmUploadImageByActivationKey = async (event) => {
  try {
    const { activationKey } = event.pathParameters
    const { fileUrl } = JSON.parse(event.body)
    // VALIDATE REQUIRED
    if (!activationKey || !fileUrl) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    const decryptUrl = CryptoJS.AES.decrypt(fileUrl, process.env.SECRET_KEY_CRYPTOJS)
    const urlText = decryptUrl.toString(CryptoJS.enc.Utf8)

    // VERIFY ACTIVATION KEY
    const verify = await tokenAuthorityRepository.verifyTokenAuthority({
      site_id: commonSiteId.P2TECH,
      action_class: tokenAuthorityClass.CREATE_ACCOUNT,
      activation_key: activationKey,
    })
    if (!verify) {
      return await errorLogRepository.createResponseAndLog(
        event,
        null,
        null,
        [errorMessageCodeConstant.CONFIRM_UP_LOAD_IMAGE_BY_ACTIVATION_KEY.EXPIRED_LINK_INVITE.VERIFY_FAIL])
    }

    // GET STAFF INFO
    const staffData = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': verify.target_id })

    if (!staffData || staffData.account_status_code !== statusCode.ACTIVATED) {
      return await errorLogRepository.createResponseAndLog(
        event,
        null,
        null,
        [errorMessageCodeConstant.CONFIRM_UP_LOAD_IMAGE_BY_ACTIVATION_KEY.EXPIRED_LINK_INVITE.ACCOUNT_STATUS])
    }

    // UPDATE DB
    await usersPortalDataRepository.updateStaffProfile(
      staffData.id,
      null,
      { profile_picture_url: urlText },
    )

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const deleteImageByActivationKey = async (event) => {
  try {
    const { activationKey } = event.pathParameters
    // VALIDATE REQUIRED
    if (!activationKey) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // VERIFY ACTIVATION KEY
    const verify = await tokenAuthorityRepository.verifyTokenAuthority({
      site_id: commonSiteId.P2TECH,
      action_class: tokenAuthorityClass.CREATE_ACCOUNT,
      activation_key: activationKey,
    })

    if (!verify) {
      return await errorLogRepository.createResponseAndLog(
        event,
        null,
        null,
        [errorMessageCodeConstant.DELETE_IMAGE_BY_ACTIVATION_KEY.EXPIRED_LINK_INVITE.VERIFY_FAIL])
    }

    // GET STAFF INFO
    const staffData = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': verify.target_id })
    if (!staffData || staffData.account_status_code !== statusCode.ACTIVATED) {
      return await errorLogRepository.createResponseAndLog(
        event,
        null,
        null,
        [errorMessageCodeConstant.DELETE_IMAGE_BY_ACTIVATION_KEY.EXPIRED_LINK_INVITE.ACCOUNT_STATUS])
    }

    // UPDATE DB
    await usersPortalDataRepository.updateStaffProfile(
      staffData.id,
      null,
      { profile_picture_url: null },
    )

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
  uploadImage,
  confirmUploadImage,
  deleteImage,
  uploadImageByActivationKey,
  confirmUploadImageByActivationKey,
  deleteImageByActivationKey,
}
