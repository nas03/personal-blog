//  constant
const { flag, statusTarget, errorMessageCodeConstant } = require('constant')

// function
const utility = require('utility')

// repository
const { errorLogRepository, statusClassRepository, statusMasterRepository } = require('repository')

const getListStatusClassification = async (event) => {
  try {
    const listStatusClass = await statusClassRepository.getListStatusClass()
    return utility.createResponse(true, listStatusClass)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getListStatusDefinition = async (event) => {
  try {
    const status_class_id = event.queryStringParameters?.status_class_id || null
    const show_valid_only = event.queryStringParameters?.show_valid_only || null
    if (!status_class_id || !show_valid_only) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }
    const listStatusMaster = await statusMasterRepository.getStatusMaster({
      status_label_number: flag.FALSE,
      enable_flag: flag.TRUE,
    })

    let listStatusMap = listStatusMaster.map((el) => {
      const detailStatus = el
      if (el.status_with_class_id.split(',').includes(status_class_id)) {
        detailStatus.is_select = flag.TRUE
      } else {
        detailStatus.is_select = flag.FALSE
      }

      if (statusTarget.OBJECT.includes(el.status_code)) {
        detailStatus.is_object = flag.TRUE
      } else {
        detailStatus.is_object = flag.FALSE
      }

      if (statusTarget.ACTION.includes(el.status_code)) {
        detailStatus.is_action = flag.TRUE
      } else {
        detailStatus.is_action = flag.FALSE
      }

      return detailStatus
    })

    if (Number(show_valid_only)) {
      listStatusMap = listStatusMap.filter((el) => el.status_with_class_id.split(',').includes(status_class_id))
    }

    const result = []
    let statusGroup = []
    for (let i = 0; i <= listStatusMap.length; i++) {
      // eslint-disable-next-line max-len
      if (listStatusMap[i]?.paint_color === listStatusMap[i - 1]?.paint_color && listStatusMap[i]?.frame_color === listStatusMap[i - 1]?.frame_color) {
        statusGroup.push(listStatusMap[i])
      } else {
        if (statusGroup.length) {
          result.push(statusGroup)
          statusGroup = []
        }
        statusGroup.push(listStatusMap[i])
      }
    }

    return utility.createResponse(true, result)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  getListStatusClassification,
  getListStatusDefinition,
}
