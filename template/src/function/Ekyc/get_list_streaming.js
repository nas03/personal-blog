/* constant */
const { timeExpires, errorMessageCodeConstant } = require('constant')

/* function */
const utility = require('utility')
const { connectS3 } = require('helper').upload

/* db */
const { streamingChannelRepository, ekycDocumentsRepository, errorLogRepository } = require('repository')

/* library */
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const { GetObjectCommand } = require('@aws-sdk/client-s3')

const getListStreaming = async (event) => {
  try {
    const param = event.queryStringParameters || {}
    const sort = !param.sort || param.sort === 'channel' ? 'channel' : 'newest'
    const listStream = await streamingChannelRepository.getListStreaming(sort)

    // Get list document detail by list
    const ekycIds = listStream.map((el) => el.ekyc_id)
    const ekycDocuments = await ekycDocumentsRepository.getEkycDocumentsByEkycIds(ekycIds)
    const response = listStream.map((stream) => {
      const data = {}

      data.first_name_romaji = stream.first_name_romaji
      data.last_name_romaji = stream.last_name_romaji
      data.country_id = stream.country_id
      data.file_name = stream.file_name
      data.japanese_notation = stream.japanese_notation
      data.english_notation = stream.english_notation
      data.korean_notation = stream.korean_notation
      data.chinese_notation = stream.chinese_notation

      data.channel_id = stream.channel_id
      data.url_playback = stream.streaming_id ? stream.url_playback : null
      data.site_id = stream.site_id
      data.user_id = stream.user_id
      data.personal_id = stream.personal_id
      data.status = stream.status
      data.url_playback_active = stream.url_playback_active
      data.document_live_streaming = stream.document_live_streaming
      data.access_ip = stream.access_ip
      data.start_livestream = stream.ts_live_stream
      data.document = ekycDocuments.filter((el) => el.ekyc_id === stream.ekyc_id && !el.is_video && !el.is_preview && el.original_flag)

      return data
    })

    return utility.createResponse(true, response)
  } catch (error) {
    console.log(error.message)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const signedUrlEkyc = async (event) => {
  try {
    const { url } = JSON.parse(event.body)
    const key = url.split('.amazonaws.com/')[1]

    const s3 = await connectS3()
    const signedUrl = await getSignedUrl(s3, new GetObjectCommand({
      Key: key,
      Bucket: process.env.BUCKET,
      ResponseCacheControl: 'no-store',
    }), {
      expiresIn: Number(timeExpires.SIGNED_URL) || 3600,
    })

    return utility.createResponse(true, signedUrl)
  } catch (error) {
    console.log(error.message)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  getListStreaming,
  signedUrlEkyc,
}
