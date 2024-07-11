/* library */
const utility = require('utility')

/* DB */
const { errorLogRepository, siteRepository, usersBasicDataRepository } = require('repository')

/* constant */
const { basePathLogo, flag, serviceType, errorMessageCodeConstant } = require('constant')

const aws = require('helper').aws

const _ = require('lodash')

const getListSiteMaster = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}
    // paging, sort
    const pagination = utility.getPagination(queryString)

    // Get staff display date time and handle timezone
    const staffId = await utility.getUserIdByToken(event)
    const staffInfo = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': staffId })
    queryString.utc = staffInfo.timezone || null
    queryString.display_date_time = staffInfo.display_date_time || null

    // Get list from m_site
    const listSite = await siteRepository.getListSite(pagination, queryString)

    return utility.createResponse(true, { ...listSite[0], ...listSite[1] })
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const checkInputSiteMaster = async (event) => {
  try {
    const bodyData = JSON.parse(event.body)

    if (_.isEmpty(bodyData)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // check exist field in db
    const checkExist = await siteRepository.checkSiteMaster(bodyData)
    if (checkExist) {
      let errorCode
      switch (Object.keys(bodyData)[0]) {
        case 'site_name':
          errorCode = errorMessageCodeConstant.CHECK_INPUT_SITE_MASTER.DUPLICATE.SITE_NAME
          break
        case 'media_name':
          errorCode = errorMessageCodeConstant.CHECK_INPUT_SITE_MASTER.DUPLICATE.MEDIA_NAME
          break
        case 'site_url':
          errorCode = errorMessageCodeConstant.CHECK_INPUT_SITE_MASTER.DUPLICATE.SITE_URL
          break
        case 'symbol_logo_name':
          errorCode = errorMessageCodeConstant.CHECK_INPUT_SITE_MASTER.DUPLICATE.SYMBOL_LOGO_NAME
          break
        case 'side_logo_name':
          errorCode = errorMessageCodeConstant.CHECK_INPUT_SITE_MASTER.DUPLICATE.SIDE_LOGO_NAME
          break
      }
      return await errorLogRepository.createResponseAndLog(
        event, null,
        { field_duplicate: Object.keys(bodyData) },
        [errorCode],
      )
    }

    // check logo path s3
    if ( bodyData['side_logo_name'] || bodyData['symbol_logo_name']) {
      let checkPath
      let errorCode
      if (bodyData['symbol_logo_name']) {
        checkPath = await checkLogoPath(bodyData['symbol_logo_name'])
        errorCode = errorMessageCodeConstant.CHECK_INPUT_SITE_MASTER.FIELD_INCORERECT.SYMBOL_LOGO_NAME
      } else {
        checkPath = await checkLogoPath(bodyData['side_logo_name'])
        errorCode = errorMessageCodeConstant.CHECK_INPUT_SITE_MASTER.FIELD_INCORERECT.SIDE_LOGO_NAME
      }
      if (!checkPath) {
        return await errorLogRepository.createResponseAndLog(
          event, null,
          { field_incorrect: Object.keys(bodyData) },
          [errorCode],
        )
      } else {
        const fileName = Object.values(bodyData)[0]
        return utility.createResponse(true, { url_logo: renderUrlLogo(fileName) })
      }
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const createSiteMaster = async (event) => {
  try {
    const bodyData = JSON.parse(event.body)

    // validate
    if (
      !bodyData.site_name ||
      !bodyData.media_name ||
      !bodyData.site_url ||
      !bodyData.symbol_logo_name ||
      !bodyData.side_logo_name ||
      !bodyData.service_type
    ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    if (!Object.values(serviceType).includes(bodyData.service_type)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // the service_type field not check for duplicates in the db
    const validateExistedFields = { ...bodyData }
    delete validateExistedFields.service_type

    const validateInput = await validateInputDataSite(validateExistedFields)

    if (validateInput.checkExistDB.length || validateInput.pathNotExist.length) {
      return await errorLogRepository.createResponseAndLog(event, null,
        { field_duplicate: validateInput.checkExistDB, field_incorrect: validateInput.pathNotExist },
        [errorMessageCodeConstant.CREATE_SITE_MASTER.FIELD_INCORERECT])
    }

    const dataSite = {
      ...bodyData,
      symbol_logo_path: renderUrlLogo(bodyData.symbol_logo_name),
      side_logo_path: renderUrlLogo(bodyData.side_logo_name),
    }

    // create site
    const isCreateSite = await siteRepository.createSiteMaster(dataSite)
    if (!isCreateSite) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.CREATE_SITE_MASTER.UPDATE_FAILED_DB])
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const updateSiteMaster = async (event) => {
  try {
    const bodyData = JSON.parse(event.body)
    const site_id = event.pathParameters.id

    // validate
    if (
      !bodyData.site_name ||
      !bodyData.media_name ||
      !bodyData.site_url ||
      !bodyData.symbol_logo_name ||
      !bodyData.side_logo_name ||
      !bodyData.service_type) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    if (!Object.values(serviceType).includes(bodyData.service_type)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // the service_type field not check for duplicates in the db
    const validateExistedFields = { ...bodyData }
    delete validateExistedFields.service_type

    const validateInput = await validateInputDataSite(validateExistedFields, site_id)

    if (validateInput.checkExistDB.length || validateInput.pathNotExist.length) {
      return await errorLogRepository.createResponseAndLog(event, null,
        { field_duplicate: validateInput.checkExistDB, field_incorrect: validateInput.pathNotExist },
        [errorMessageCodeConstant.UPDATE_SITE_MASTER.FIELD_INCORERECT])
    }
    const dataUpdate = {
      ...bodyData,
      side_logo_path: renderUrlLogo(bodyData.side_logo_name),
      symbol_logo_path: renderUrlLogo(bodyData.symbol_logo_name),
    }

    // update site master
    const isUpdateSite = await siteRepository.updateSiteMaster(site_id, dataUpdate)
    if (!isUpdateSite) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UPDATE_SITE_MASTER.UPDATE_FAILED_DB])
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const updateSiteMasterIndex = async (event) => {
  try {
    const bodyData = JSON.parse(event.body)
    const site_id = event.pathParameters.id

    // validate input
    if (!Object.keys(bodyData).includes('display_order') && !Object.keys(bodyData).includes('enable_flag') ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    if (
      (bodyData.display_order && ((Number(bodyData.display_order) !== 1 && Number(bodyData.display_order) !== -1))) ||
      (Object.keys(bodyData).includes('enable_flag') && !Object.values(flag).includes(bodyData.enable_flag))
    ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // get site master
    const siteMaster = await siteRepository.getSiteById(site_id)
    if (!siteMaster) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_SITE_MASTER_INDEX.UPDATE_FAILED.NOT_FOUND])
    }

    // update display order
    if (bodyData.display_order) {
      const update = await siteRepository.updateDisplayOrder(site_id, siteMaster.display_order, bodyData.display_order)
      if (update.isError) {
        return await errorLogRepository.createResponseAndLog(event, null, update.error,
          [errorMessageCodeConstant.UPDATE_SITE_MASTER_INDEX.UPDATE_FAILED.DISPLAY_ODER])
      }
    }

    // update enable flag
    if (Object.keys(bodyData).includes('enable_flag')) {
      const update = await siteRepository.updateSiteMaster(site_id, { enable_flag: Number(bodyData.enable_flag) })
      if (!update) {
        return await errorLogRepository.createResponseAndLog(event, null, null,
          [errorMessageCodeConstant.UPDATE_SITE_MASTER_INDEX.UPDATE_FAILED.ENABLE_FLAG])
      }
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const checkInValid = (itemCheck, item_name, listData) => {
  const result = listData.find((item) => {
    return item[item_name].toLowerCase() === itemCheck.toLowerCase()
  })
  if (result) {
    return true
  }
  return false
}

const checkExistSite = async (dataCheck, id = null) => {
  // check exist field in db
  const checkExist = await siteRepository.checkExistSiteField(
    dataCheck.site_name,
    dataCheck.media_name,
    dataCheck.site_url,
    dataCheck.symbol_logo_name,
    dataCheck.side_logo_name,
    id,
  )
  const listInValid = []
  if ( checkExist.length ) {
    for (const key in dataCheck) {
      if (checkInValid(dataCheck[key], key, checkExist)) {
        listInValid.push(key)
      }
    }
  }
  return listInValid
}

const checkLogoPath = async (logo_name) => {
  // check file svg
  const fileExtension = logo_name.slice(-3)
  if (fileExtension !== 'svg') {
    return false
  }

  // check logo path s3
  const checkSymbolLogoExistS3 = await aws.detailObject(`${basePathLogo}${logo_name}`)
  if (checkSymbolLogoExistS3.status === true) {
    return true
  }
  return false
}

const validateInputDataSite = async (bodyData, id = null) => {
  const checkExistDB = await checkExistSite(bodyData, id)
  const pathNotExist = []

  if (!checkExistDB.includes('side_logo_name') && bodyData.side_logo_name) {
    const checkSiteLogoExistS3 = await checkLogoPath(bodyData.side_logo_name)
    if (!checkSiteLogoExistS3) {
      pathNotExist.push('side_logo_name')
    }
  }

  if (!checkExistDB.includes('symbol_logo_name') && bodyData.symbol_logo_name) {
    const checkSymbolLogoExistS3 = await checkLogoPath(bodyData.symbol_logo_name)
    if (!checkSymbolLogoExistS3) {
      pathNotExist.push('symbol_logo_name')
    }
  }
  return { checkExistDB, pathNotExist }
}

const renderUrlLogo = (url_logo) => {
  return `https://${process.env.BUCKET}.s3.${process.env.REGION}.amazonaws.com/${basePathLogo}${url_logo}`
}

module.exports = {
  getListSiteMaster,
  createSiteMaster,
  checkInputSiteMaster,
  updateSiteMaster,
  updateSiteMasterIndex,
}
