const { commonSiteId, flag, statusMasterFlag, errorMessageCodeConstant } = require('constant')
const utility = require('utility')
const { errorLogRepository, statusMasterRepository, siteRepository } = require('repository')

const getListStatusMaster = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}
    // paging, sort
    const pagination = utility.getPagination(queryString)

    // get list status
    const listStatusMaster = await statusMasterRepository.getListStatus(pagination, queryString)

    // get sites
    const listSiteMenu = await siteRepository.getListSiteMenuStatusMaster()

    // handle list status master
    listStatusMaster.data = listStatusMaster.data.map((status) => {
      const listSiteId = status.status_with_site_id.split(',')
      const listSiteIDNumber = listSiteId.map((item) => Number(item))
      const listSite = []
      listSiteMenu.forEach((item) => {
        if (listSiteIDNumber.includes(Number(item.id))) {
          listSite.push(item)
        }
      })
      if (listSiteId.includes('0')) {
        listSite.unshift({
          id: commonSiteId.P2TECH,
          site_name: 'P2T',
          enable_flag: flag.TRUE,
        })
      }
      return status = { ...status, status_with_site_id: listSite }
    })

    return utility.createResponse(true, listStatusMaster)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getDetailStatusMaster = async (event) => {
  try {
    const status_code = event.pathParameters.status_code

    // get detail status
    const listStatus = await statusMasterRepository.getDetailByStatusCode(status_code)

    // get sites
    const listSiteMenu = await siteRepository.getListSiteMenuStatusMaster()

    // handle data
    const statusMaster = {}
    statusMaster.status_master = listStatus.find((item) => item.status_label_number === flag.FALSE)
    if (!statusMaster.status_master) {
      return utility.createResponse(true, statusMaster)
    }
    statusMaster.status_master.menu_site = listSiteMenu
    statusMaster.status_master.menu_site.unshift({
      id: commonSiteId.P2TECH,
      site_name: 'P2T',
      enable_flag: flag.TRUE,
    })

    // handle list site checkbox
    const listSiteId = statusMaster.status_master.status_with_site_id.split(',')
    const listSiteIDNumber = listSiteId.map((item) => Number(item))
    const listSite = []
    listSiteMenu.forEach((item) => {
      if (listSiteIDNumber.includes(Number(item.id))) {
        listSite.push(item)
      }
    })

    statusMaster.status_label = []

    listStatus.forEach((item) => {
      if (Number(item.status_label_number) !== Number(flag.FALSE)) {
        item.menu_site = listSite
        statusMaster.status_label.push(item)
      }
    })

    return utility.createResponse(true, statusMaster)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const updateStatusMaster = async (event) => {
  try {
    const bodyData = JSON.parse(event.body)
    const id = event.pathParameters.id

    if (!bodyData.type_update || !bodyData.data_update) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // get status info
    const status = await statusMasterRepository.getStatusByID(id)
    if (!status) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // handle data update
    let dataUpdate = {}
    switch (bodyData.type_update) {
      case 'master':
        // validate input
        const fieldRequireMaster = utility.checkFieldRequired(bodyData.data_update, [
          'status_name',
          'status_with_site_id',
          'frame_color',
          'paint_color',
          'text_color',
          'en_name',
          'ja_name',
          'cn_name',
          'kr_name',
        ])
        if (!fieldRequireMaster) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
        }

        let isCheckMaster = true
        bodyData.data_update.status_with_site_id.split(',').forEach((el) => {
          if (Number(el.trim()) === NaN || !el.trim().length) {
            isCheckMaster = false
            return
          }
        })

        if (!isCheckMaster || Number(status.status_label_number ) !== Number(flag.FALSE)) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        const siteID = bodyData.data_update.status_with_site_id.split(',').sort()
        if (siteID.join(',') !== status.status_with_site_id.split(',').sort().join(',')) {
          // get status label
          const statusLabels = await statusMasterRepository.getStatusLabelByStatusCode(status.status_code)
          let isUpdateLabel
          // handle status with site id label
          statusLabels.forEach(async (el) => {
            const listSiteLabel = []
            el.status_with_site_id.split(',').forEach((site_id) => {
              if (siteID.includes(site_id)) {
                listSiteLabel.push(site_id)
              }
            })
            const new_status_with_site_id = listSiteLabel.join(',')
            if (el.status_with_site_id !== new_status_with_site_id) {
              el.status_with_site_id = new_status_with_site_id
              // update label
              isUpdateLabel = await statusMasterRepository.updateStatus(el.id, el)
              if (!isUpdateLabel) {
                return await errorLogRepository.createResponseAndLog(event, null, null,
                  [errorMessageCodeConstant.UPDATE_STATUS_MASTER.UPDATE_LABEL_FAIL])
              }
            }
          })
        }

        // check status name
        const isCheckNameMaster = await statusMasterRepository.checkStatusName(
          status,
          bodyData.data_update.status_name,
          statusMasterFlag.STATUS_MASTER,
        )
        if (isCheckNameMaster) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.UPDATE_STATUS_MASTER.FIELD_DUPLICATE.NAME_MASTER])
        }

        dataUpdate = {
          status_name: bodyData.data_update.status_name,
          status_with_site_id: bodyData.data_update.status_with_site_id.trim(),
          frame_color: bodyData.data_update.frame_color,
          paint_color: bodyData.data_update.paint_color,
          text_color: bodyData.data_update.text_color,
          en_name: bodyData.data_update.en_name,
          ja_name: bodyData.data_update.ja_name,
          cn_name: bodyData.data_update.cn_name,
          kr_name: bodyData.data_update.kr_name,
        }
        break
      case 'label':
        // validate input
        const fieldRequireLabel = utility.checkFieldRequired(bodyData.data_update, [
          'status_name',
          'status_with_site_id',
          'en_name',
          'ja_name',
          'cn_name',
          'kr_name',
        ])
        if (!fieldRequireLabel) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
        }

        let isCheckLabel = true
        bodyData.data_update.status_with_site_id.split(',').forEach((el) => {
          if (Number(el.trim()) === NaN || !el.trim().length) {
            isCheckLabel = false
            return
          }
        })

        if (!isCheckLabel || status.status_label_number === flag.FALSE) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        // check status name
        const isCheckNameLabel = await statusMasterRepository.checkStatusName(
          status,
          bodyData.data_update.status_name,
          statusMasterFlag.STATUS_LABEL,
        )
        if (isCheckNameLabel) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.UPDATE_STATUS_MASTER.FIELD_DUPLICATE.NAME_LABEL])
        }

        dataUpdate = {
          status_name: bodyData.data_update.status_name,
          status_with_site_id: bodyData.data_update.status_with_site_id.trim(),
          en_name: bodyData.data_update.en_name,
          ja_name: bodyData.data_update.ja_name,
          cn_name: bodyData.data_update.cn_name,
          kr_name: bodyData.data_update.kr_name,
        }
        break
      case 'toggle':
        // validate enable flag
        if (
          !Object.values(flag).includes(bodyData.data_update.enable_flag) ||
          Number(status.status_label_number) === flag.FALSE
        ) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }
        dataUpdate = {
          enable_flag: bodyData.data_update.enable_flag,
        }
        break
      default:
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }
    // update status
    const isUpdate = await statusMasterRepository.updateStatus(id, dataUpdate)
    if (!isUpdate) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_STATUS_MASTER.UPDATE_STATUS_FAIL])
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  getListStatusMaster,
  updateStatusMaster,
  getDetailStatusMaster,
}
