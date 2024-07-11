const { flag, sequenceAction, uncheckALL, errorMessageCodeConstant } = require('constant')
const utility = require('utility')
const { productTypeRepository, errorLogRepository } = require('repository')

const getProductTypeList = async (event) => {
  try {
    const queryString = event.queryStringParameters || {}
    // param of checkbox
    if (queryString.productTypeId) {
      queryString.productTypeId = queryString.productTypeId.split(',')
    }

    const pagination = utility.getPagination(queryString)

    // CHECK CASE SELECT BOX UNCHECK ALL
    if (Number(queryString.productTypeId) === uncheckALL) {
      const res = utility.paginatedItems([], pagination.currentPage, pagination.perPage)
      return utility.createResponse(true, res)
    }

    const { maxMinProductSequence, maxMinDivisionSequence } = await productTypeRepository.maxMinSequence()
    const data = await productTypeRepository.getProductTypeList(queryString, pagination)
    const uniqObj = {}

    const dataFormat = data.data.map((item) => {
      const is_min_product_sequence = item.product_sequence === maxMinProductSequence.minProductSequence ? flag.TRUE : flag.FALSE
      const is_max_product_sequence = item.product_sequence === maxMinProductSequence.maxProductSequence ? flag.TRUE : flag.FALSE
      const objDivision = maxMinDivisionSequence.find((el) => item.en_product_type === el.en_product_type) || {}
      let show_change_product_sequence = flag.FALSE
      if (!uniqObj[item.en_product_type]) {
        show_change_product_sequence = flag.TRUE
        uniqObj[item.en_product_type] = flag.TRUE
      }
      return {
        ...item,
        is_min_product_sequence,
        is_max_product_sequence,
        is_min_division_sequence: item.division_sequence === objDivision.minDivisionSequence ? flag.TRUE : flag.FALSE,
        is_max_division_sequence: item.division_sequence === objDivision.maxDivisionSequence ? flag.TRUE : flag.FALSE,
        show_change_product_sequence,
      }
    })

    return utility.createResponse(true, { data: dataFormat, pagination: data.pagination })
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getPulldownProductType = async (event) => {
  try {
    const { type, isShowOnlyEnable } = event.queryStringParameters || {}
    switch (type) {
      case 'product_type':
        const productTypes = await productTypeRepository.getProductTypeForPulldown(isShowOnlyEnable)
        return utility.createResponse(true, { listProductType: productTypes })
      case 'division':
        const divisions = await productTypeRepository.getDivisionForPulldown(isShowOnlyEnable)
        return utility.createResponse(true, { listDivision: divisions })
      case 'all':
        const [listProductType, listDivision] = await Promise.all([
          productTypeRepository.getProductTypeForPulldown(isShowOnlyEnable),
          productTypeRepository.getDivisionForPulldown(isShowOnlyEnable),
        ])
        return utility.createResponse(true, { listProductType, listDivision })
      default:
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const updateProductTypeIndex = async (event) => {
  try {
    const { field_name, field_data } = JSON.parse(event.body)

    const { id } = event.pathParameters

    const productType = await productTypeRepository.getProductTypeById(id)

    // check ib rank is exist
    if (!productType) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_PRODUCT_TYPE_INDEX.PRODUCT_TYPE.NOT_EXIST])
    }

    switch (field_name) {
      case 'enable_flag':
        if (!Object.values(flag).includes(field_data)) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        const isUpdate = await productTypeRepository.updateProductType(id, { enable_flag: field_data })
        if (!isUpdate) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.UPDATE_PRODUCT_TYPE_INDEX.PRODUCT_TYPE.UPDATE_FAIL.ENABLE_FLAG])
        }
        return utility.createResponse(true)
      case 'division_sequence':

        const maxMinDivisionSequence = await productTypeRepository.checkSequenceByProduct(productType.product_sequence)
        // validate input
        if (!Object.values(sequenceAction).includes(field_data) ||
          sequenceAction.UP === field_data && maxMinDivisionSequence.minDivisionSequence === productType.division_sequence ||
          sequenceAction.DOWN === field_data && maxMinDivisionSequence.maxDivisionSequence === productType.division_sequence
        ) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        const result = await productTypeRepository.updateDivisionSequence(field_data, productType)
        if (result.isError) {
          return await errorLogRepository.createResponseAndLog(event, result.error, null,
            [errorMessageCodeConstant.UPDATE_PRODUCT_TYPE_INDEX.PRODUCT_TYPE.UPDATE_FAIL.DIVISION_SEQUENCE])
        }
        return utility.createResponse(true)
      case 'product_sequence':

        const maxMinProductSequence = await productTypeRepository.checkProductSequence()
        // validate input
        if (!Object.values(sequenceAction).includes(field_data) ||
        sequenceAction.UP === field_data && maxMinProductSequence.minProductSequence === productType.product_sequence ||
        sequenceAction.DOWN === field_data && maxMinProductSequence.maxProductSequence === productType.product_sequence
        ) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        const res = await productTypeRepository.updateProductSequence(field_data, productType)
        if (res.isError) {
          return await errorLogRepository.createResponseAndLog(event, res.error, null,
            [errorMessageCodeConstant.UPDATE_PRODUCT_TYPE_INDEX.PRODUCT_TYPE.UPDATE_FAIL.PRODUCT_SEQUENCE])
        }
        return utility.createResponse(true)
      default:
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const createProductType = async (event) => {
  try {
    const eventBody = JSON.parse(event.body)

    const { en_product_type, ja_product_type, cn_product_type, kr_product_type, en_division, ja_division, cn_division, kr_division } = eventBody
    if (!en_product_type ||
      !ja_product_type ||
      !cn_product_type ||
      !kr_product_type ||
      !en_division ||
      !ja_division ||
      !cn_division ||
      !kr_division) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // check division exist in product type
    const [isEn, isJa, isCn, isKr] = await Promise.all([
      productTypeRepository.checkDataExist({ en_product_type, en_division }),
      productTypeRepository.checkDataExist({ ja_product_type, ja_division }),
      productTypeRepository.checkDataExist({ cn_product_type, cn_division }),
      productTypeRepository.checkDataExist({ kr_product_type, kr_division }),
    ])

    if (isEn || isJa || isCn || isKr) {
      const errorCode = []
      if (isEn) errorCode.push(errorMessageCodeConstant.CREATE_PRODUCT_TYPE.IS_EXIT.EN)
      if (isJa) errorCode.push(errorMessageCodeConstant.CREATE_PRODUCT_TYPE.IS_EXIT.JA)
      if (isCn) errorCode.push(errorMessageCodeConstant.CREATE_PRODUCT_TYPE.IS_EXIT.CN)
      if (isKr) errorCode.push(errorMessageCodeConstant.CREATE_PRODUCT_TYPE.IS_EXIT.KR)
      return await errorLogRepository.createResponseAndLog(event, null, null, errorCode)
    }

    // check product type
    let product_sequence
    let division_sequence
    const productType = await productTypeRepository.checkProductType(en_product_type, ja_product_type, cn_product_type, kr_product_type)
    if (productType) {
      // product type is exist
      // product sequence equals current product sequence and division sequence increase 1
      product_sequence = productType.product_sequence
      const maxDivisionSequence = await productTypeRepository.maxDivisionSequenceInProductType(productType.product_sequence)
      division_sequence = maxDivisionSequence.maxDivisionSequence ? maxDivisionSequence.maxDivisionSequence + 1 : 1
    } else {
      // product type is not exist
      // product sequence increase 1 and division equals 1
      const maxProductSequence = await productTypeRepository.maxProductSequence()
      product_sequence = maxProductSequence.maxProductSequence ? maxProductSequence.maxProductSequence + 1 : 1
      division_sequence = 1
    }

    const payload = {
      en_product_type,
      ja_product_type,
      cn_product_type,
      kr_product_type,
      en_division,
      ja_division,
      cn_division,
      kr_division,
      product_sequence,
      division_sequence,
    }

    // create new product type
    await productTypeRepository.createProductType(payload)

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const updateProductType = async (event) => {
  try {
    const eventBody = JSON.parse(event.body)

    const { id } = event.pathParameters

    const { en_product_type, ja_product_type, cn_product_type, kr_product_type, en_division, ja_division, cn_division, kr_division } = eventBody

    if (!en_product_type ||
      !ja_product_type ||
      !cn_product_type ||
      !kr_product_type ||
      !en_division ||
      !ja_division ||
      !cn_division ||
      !kr_division ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // check division exist in product type
    const [isEn, isJa, isCn, isKr] = await Promise.all([
      productTypeRepository.checkDataExistForUpdate(id, { en_product_type, en_division }),
      productTypeRepository.checkDataExistForUpdate(id, { ja_product_type, ja_division }),
      productTypeRepository.checkDataExistForUpdate(id, { cn_product_type, cn_division }),
      productTypeRepository.checkDataExistForUpdate(id, { kr_product_type, kr_division }),
    ])

    if (isEn || isJa || isCn || isKr) {
      const errorCode = []
      if (isEn) errorCode.push(errorMessageCodeConstant.UPDATE_PRODUCT_TYPE.IS_EXIT.EN)
      if (isJa) errorCode.push(errorMessageCodeConstant.UPDATE_PRODUCT_TYPE.IS_EXIT.JA)
      if (isCn) errorCode.push(errorMessageCodeConstant.UPDATE_PRODUCT_TYPE.IS_EXIT.CN)
      if (isKr) errorCode.push(errorMessageCodeConstant.UPDATE_PRODUCT_TYPE.IS_EXIT.KR)
      return await errorLogRepository.createResponseAndLog(event, null, null, errorCode)
    }

    let product_sequence
    let division_sequence
    const currentProductType = await productTypeRepository.getProductTypeById(id)
    if (!currentProductType) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UPDATE_PRODUCT_TYPE.PRODUCT_TYPE_NOT_EXIT])
    }

    if (currentProductType.en_product_type === en_product_type &&
      currentProductType.ja_product_type === ja_product_type &&
      currentProductType.cn_product_type === cn_product_type &&
      currentProductType.kr_product_type === kr_product_type) {
      product_sequence = null
      division_sequence = null
    } else {
      const productType = await productTypeRepository.checkProductType(en_product_type, ja_product_type, cn_product_type, kr_product_type)
      if (productType) {
        // product type is exist
        // product sequence equals current product sequence and division sequence increase 1
        product_sequence = productType.product_sequence
        const maxDivisionSequence = await productTypeRepository.maxDivisionSequenceInProductType(productType.product_sequence)
        division_sequence = maxDivisionSequence.maxDivisionSequence ? maxDivisionSequence.maxDivisionSequence + 1 : 1
      } else {
        // product type is not exist
        // product sequence increase 1 and division equals 1
        const maxProductSequence = await productTypeRepository.maxProductSequence()
        if (currentProductType.product_sequence !== maxProductSequence.maxProductSequence) {
          product_sequence = maxProductSequence.maxProductSequence ? maxProductSequence.maxProductSequence + 1 : 1
        } else {
          product_sequence = maxProductSequence.maxProductSequence
        }
        division_sequence = 1
      }
    }

    const payloadUpdateProductType = {
      en_product_type,
      ja_product_type,
      cn_product_type,
      kr_product_type,
      en_division,
      ja_division,
      cn_division,
      kr_division,
    }

    // update product type
    const updateCurrentProductType = await productTypeRepository.updateProductTypeAndDivision(id, payloadUpdateProductType, product_sequence,
      division_sequence, currentProductType)
    if (!updateCurrentProductType) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UPDATE_PRODUCT_TYPE.PRODUCT_TYPE_UPDATE_FAIL])
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  getProductTypeList,
  updateProductTypeIndex,
  createProductType,
  updateProductType,
  getPulldownProductType,
}
