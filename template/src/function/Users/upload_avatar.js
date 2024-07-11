// library
const CryptoJS = require('crypto-js')
const moment = require('moment')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const { PutObjectCommand } = require('@aws-sdk/client-s3')

// constant
const { category, contentUpdate, statusCode, errorMessageCodeConstant } = require('constant')
const extAccept = ['png', 'jpg', 'gif', 'jpeg', 'heic', 'heif']

// helper
const upload = require('helper').upload

// function
const utility = require('utility')
const operationHistory = require('../History/operation_history.js')
const { errorLogRepository, usersBasicDataRepository, usersPortalDataRepository } = require('repository')

// db

const uploadFileAvatar = async (event) => {
  try {
    const { fileName, type } = JSON.parse(event.body)
    const typePerson = ['user', 'staff']
    if (!fileName || !type) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    const ext = fileName.split('.').pop()
    if (!extAccept.includes(ext.toLowerCase()) || !typePerson.includes(type)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    const file_key = moment().utc().format('YYYYMMDDHHmmss') + '_' + fileName
    const Key = type === 'user' ? 'files/profile_picture/' + file_key : 'files/images/' + file_key
    const s3 = await upload.connectS3()

    // Get signed URL from S3
    const s3Params = {
      Bucket: process.env.BUCKET,
      Key,
      ContentType: _renderContentType(ext),
    }
    const uploadURL = await getSignedUrl(s3, new PutObjectCommand( s3Params), {
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

const confirmUpload = async (event) => {
  try {
    const eventBody = JSON.parse(event.body)
    const { fileName, fileUrl, id } = eventBody
    const staff_id = utility.getUserIdByToken(event)
    const ipAddress = event.requestContext.identity.sourceIp
    const deviceBrowser = event.headers['User-Agent']

    if (!id || !fileName || !fileUrl) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // Decrypt url
    const decryptUrl = CryptoJS.AES.decrypt(fileUrl, process.env.SECRET_KEY_CRYPTOJS)
    const urlText = decryptUrl.toString(CryptoJS.enc.Utf8)
    if (!urlText) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }
    // get user info
    const userInfo = await usersBasicDataRepository.getDetailUserById(id)
    if (!userInfo || userInfo.account_status_code === statusCode.CLOSED) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.CONFIRM_UPLOAD.ACCOUNT_CLOSED])
    }

    // prepare payload for update user
    const payload = {
      profile_picture_url: urlText,
      profile_picture_name: fileName,
    }

    // update avatar user
    const dataUpdateUserAvatar = await usersPortalDataRepository.updateUserPortalData(id, payload)

    if (!dataUpdateUserAvatar) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.CONFIRM_UPLOAD.UPDATE_DB])
    }

    // create operation history
    await operationHistory.createOperationHistory(
      id,
      userInfo.site_id,
      category.BASIC_INFORMATION_PERSON_OR_CORPORATE,
      contentUpdate.CHANGE_PROFILE_PICTURE,
      userInfo.profile_picture_name ? userInfo.profile_picture_name : '-',
      fileName,
      ipAddress,
      deviceBrowser,
      staff_id,
    )
    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const deleteAvatar = async (event) => {
  try {
    const user_id = event.pathParameters.user_id
    const staff_id = utility.getUserIdByToken(event)
    const ipAddress = event.requestContext.identity.sourceIp
    const deviceBrowser = {
      userAgent: event.headers['User-Agent'],
      mobileDeviceName: event.headers.access_device_name,
    }

    if (!user_id) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // get user info
    const userInfo = await usersBasicDataRepository.getUserInfo(user_id)
    if (!userInfo || userInfo.account_status_code === statusCode.CLOSED) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.DELETE_AVATAR.ACCOUNT_CLOSED])
    }

    // update avatar
    const isUpdateAvatar = await usersPortalDataRepository.updateUserPortalData(user_id, {
      profile_picture_url: null,
      profile_picture_name: null,
    })

    if (!isUpdateAvatar) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.DELETE_AVATAR.UPDATE_DB])
    }

    // create operation history
    await operationHistory.createOperationHistory(
      user_id,
      userInfo.site_id,
      category.BASIC_INFORMATION_PERSON_OR_CORPORATE,
      contentUpdate.CHANGE_PROFILE_PICTURE,
      userInfo.profile_picture_name ? userInfo.profile_picture_name : '-',
      '-',
      ipAddress,
      deviceBrowser,
      staff_id,
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
  uploadFileAvatar,
  confirmUpload,
  deleteAvatar,
}

