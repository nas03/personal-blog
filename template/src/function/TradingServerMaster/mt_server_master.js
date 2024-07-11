const utility = require('utility')
const { errorLogRepository, serverInfoRepository, siteRepository, accountTypeRepository } = require('repository')
const { accountMode, server, enable,
  platform, ENVParamName, firstMTServerName, LastFQDNName, accountTypeID, flag, errorMessageCodeConstant } = require('constant')

const _ = require('lodash')

const getListMTServer = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}
    // paging, sort
    const pagination = utility.getPagination(queryString)

    const listMTServer = await serverInfoRepository.getListServerInfo(pagination, queryString)

    return utility.createResponse(true, listMTServer)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null,
      [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const createMTServer = async (event) => {
  try {
    const bodyData = JSON.parse(event.body)

    // check field blank
    const checkFieldBlank = utility.checkFieldRequired(bodyData,
      [
        'server',
        'site_id',
        'account_mode',
        'account_type_id',
        'platform',
        'server_name',
        'fqdn_name',
        'server_key',
      ],
    )

    if (!checkFieldBlank) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // check field valid
    if (
      (!(Object.values(server)).includes(bodyData.server)) ||
      (process.env.NODE_ENV === server.Dev && bodyData.server !== server.Dev) ||
      (!(Object.values(accountMode)).includes(bodyData.account_mode)) ||
      (!(Object.values(platform)).includes(bodyData.platform)) ||
      (!(Object.values(accountTypeID)).includes(bodyData.account_type_id))
    ) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // get site and account type
    const [accountType, siteMaster] = await Promise.all([
      accountTypeRepository.getAccountTypeDetailById(bodyData.account_type_id),
      siteRepository.getSiteMaster({ id: bodyData.site_id }),
    ])

    if (!accountType || accountType.enable_flag === flag.FALSE || accountType[`platform_${bodyData.platform}`] === 0 || !siteMaster) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // handle data insert
    const dataInsert = bodyData
    dataInsert.env_param_name = bodyData.server === server.Dev ? ENVParamName.Dev : ENVParamName.Prod
    dataInsert.server_name = bodyData.server === server.Dev ?
      `${firstMTServerName.Dev}${bodyData.server_name}` : `${firstMTServerName.Prod}${bodyData.server_name}`
    dataInsert.fqdn_name = bodyData.server === server.Dev ?
      `${bodyData.fqdn_name}${LastFQDNName.Dev}` : `${bodyData.fqdn_name}${LastFQDNName.Prod}`

    // check field exist
    const validInput = await serverInfoRepository.checkExitField(
      dataInsert.server_name,
      dataInsert.fqdn_name,
      dataInsert.server_key,
    )

    if (validInput.length) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.CREATE_MT_SERVER.MT_GROUP_DUPLICATED])
    }

    // create MT Server Master
    const isCreaMTServer = await serverInfoRepository.createMTServer(dataInsert)
    if (!isCreaMTServer) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.CREATE_MT_SERVER.UPDATE_FAIL])
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null,
      [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const updateMTServer = async (event) => {
  try {
    const mt_server_id = event.pathParameters.id
    const bodyData = JSON.parse(event.body)

    // change enable flag
    if (Object.keys(bodyData).includes('enable_flag')) {
      if (!(Object.values(enable)).includes(bodyData.enable_flag)) {
        return await errorLogRepository.createResponseAndLog(event, null, null,
          [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
      }

      // update DB
      const isUpdateMTServer = await serverInfoRepository.updateMTServer(mt_server_id, { enable_flag: bodyData.enable_flag })
      if (!isUpdateMTServer) {
        return await errorLogRepository.createResponseAndLog(event, null, null,
          [errorMessageCodeConstant.UPDATE_MT_SERVER.UPDATE_ENABLE_FLAG_FAIL])
      }

      return utility.createResponse(true)
    }

    // get mt server info, site and account type
    const [mt_server, accountType, siteMaster] = await Promise.all([
      serverInfoRepository.getMTServerById(mt_server_id),
      accountTypeRepository.getAccountTypeDetailById(bodyData.account_type_id),
      siteRepository.getSiteMaster({ id: bodyData.site_id }),
    ])

    if (!mt_server) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_MT_SERVER.MT_SERVER_NOT_FOUND_UPDATE_FAIL])
    }

    // handle data update
    const dataUpdate = bodyData
    dataUpdate.env_param_name = bodyData.server === server.Dev ? ENVParamName.Dev : ENVParamName.Prod
    dataUpdate.server_name = bodyData.server === server.Dev ?
      `${firstMTServerName.Dev}${bodyData.server_name}` : `${firstMTServerName.Prod}${bodyData.server_name}`
    dataUpdate.fqdn_name = bodyData.server === server.Dev ?
      `${bodyData.fqdn_name}${LastFQDNName.Dev}` : `${bodyData.fqdn_name}${LastFQDNName.Prod}`

    const fieldUpdate = _.pickBy(dataUpdate, (value, key) => mt_server[key] !== value)
    if (Object.keys(fieldUpdate).length === 0) {
      return utility.createResponse(true)
    }

    // check field valid
    if (
      (Object.keys(fieldUpdate).includes('server') && (!(Object.values(server)).includes(bodyData.server))) ||
      (Object.keys(fieldUpdate).includes('server') && (process.env.NODE_ENV === server.Dev && bodyData.server !== server.Dev)) ||
      (Object.keys(fieldUpdate).includes('account_mode') && (!(Object.values(accountMode)).includes(bodyData.account_mode))) ||
      (Object.keys(fieldUpdate).includes('platform') && (!(Object.values(platform)).includes(bodyData.platform))) ||
      (Object.keys(fieldUpdate).includes('account_type_id') && (!(Object.values(accountTypeID)).includes(bodyData.account_type_id))) ||
      !accountType || accountType.enable_flag === flag.FALSE || accountType[`platform_${bodyData.platform}`] === 0 || !siteMaster
    ) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // check field exist
    const validInput = await serverInfoRepository.checkExitField(
      dataUpdate.server_name,
      dataUpdate.fqdn_name,
      dataUpdate.server_key,
      mt_server_id,
    )

    if (validInput.length) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_MT_SERVER.MT_GROUP_DUPLICATED])
    }


    const isUpdateMTServer = await serverInfoRepository.updateMTServer(mt_server_id, dataUpdate)
    if (!isUpdateMTServer) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_MT_SERVER.UPDATE_FAIL])
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null,
      [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  getListMTServer,
  createMTServer,
  updateMTServer,
}
