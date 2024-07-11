const utility = require('utility')
/* constant */
const { errorMessageCodeConstant } = require('constant')
const { ekycDocumentsRepository, errorLogRepository } = require('repository')

const { listObject, copyObject } = require('helper').aws

const scheduleCopyIvsVideo = async (event) => {
  try {
    const ivsData = await ekycDocumentsRepository.getEkycIvsVideo()
    const copyFiles = []

    await Promise.all(ivsData.map(async (el) => {
      const {
        ekyc_document_id,
        file_url,
        is_video,
        is_preview,
        document_type,
        directory_path,
        user_personal_id,
      } = el
      const ivsFilePath = file_url.split('.amazonaws.com/')[1]
      const userFolderPath = `${directory_path}/${document_type}`
      const s3FileName = `${user_personal_id}_${document_type}`

      // List video files
      if (is_video) {
        const ivsFolderPath = ivsFilePath.split('media/')[0] + 'media/hls/480p30'
        const contents = await listObject(ivsFolderPath)
        contents.forEach(async (el) => {
          const sourceKey = el.Key
          let destinationKey = sourceKey.replace(ivsFolderPath, userFolderPath)
          if (sourceKey.includes('playlist')) {
            destinationKey = destinationKey.replace('playlist', s3FileName)
            copyFiles.push({
              id: ekyc_document_id,
              file_url: file_url,
              source: sourceKey,
              target: destinationKey,
              is_update: 1,
            })
          } else {
            copyFiles.push({
              id: ekyc_document_id,
              file_url: file_url,
              source: sourceKey,
              target: destinationKey,
              is_update: 0,
            })
          }
        })
      }

      // List thumbnails files
      if (is_preview) {
        const destinationKey = `${userFolderPath}/${s3FileName}_preview.jpg`
        copyFiles.push({
          id: ekyc_document_id,
          file_url: file_url,
          source: ivsFilePath,
          target: destinationKey,
          is_update: 1,
        })
      }
    }),
    )
    console.log(copyFiles)

    // Copy files and save new url into DB
    if (copyFiles.length) {
      await Promise.all(copyFiles.map(async (el) => {
        const { id, file_url, source, target, is_update } = el
        const copy = await copyObject(source, target)
        if (copy && is_update) {
          await ekycDocumentsRepository.updateEkycDocument(id, {
            file_url: file_url.replace(source, target),
          })
        }
      }),
      )
    }
    return utility.createResponse(true, copyFiles)
  } catch (error) {
    console.error(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  scheduleCopyIvsVideo,
}
