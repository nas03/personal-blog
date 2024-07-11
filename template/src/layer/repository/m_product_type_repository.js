/* constant */
const { flag } = require('constant')
const { isEmpty } = require('lodash')
const { sequenceAction } = require('../../src/layer/constant/constant')

/* DB */
const db = require('db').helper

const getAll = async (isShowOnlyEnable, isDistinct = null) => {
  const query = db('m_product_type')

  if (isDistinct) {
    query.distinct(
      'ja_product_type',
      'en_product_type',
      'cn_product_type',
      'kr_product_type',
    )
  } else {
    query.select(
      'id',
      'ja_product_type',
      'en_product_type',
      'cn_product_type',
      'kr_product_type',
      'product_sequence',
      'ja_division',
      'en_division',
      'cn_division',
      'kr_division',
      'division_sequence',
      'enable_flag',
    )
  }

  query.where('delete_flag', flag.FALSE)

  if (isShowOnlyEnable === 'true' || isShowOnlyEnable === true) {
    query.where('enable_flag', flag.TRUE)
  }
  return await query.orderBy([
    { column: 'product_sequence', order: 'asc' },
    { column: 'division_sequence', order: 'asc' },
  ])
}

const getListIdProductType = async (en_product_type) => {
  return await db('m_product_type')
    .select('id', 'enable_flag')
    .where({
      delete_flag: flag.FALSE,
      en_product_type,
    })
    .orderBy('id', 'asc')
}

const getProductTypeList = async (queryString, pagination) => {
  const query = db('m_product_type as pt')
    .select(
      'pt.id',
      'pt.enable_flag',
      'pt.delete_flag',
      'pt.en_product_type',
      'pt.ja_product_type',
      'pt.cn_product_type',
      'pt.kr_product_type',
      'pt.product_sequence',
      'pt.en_division',
      'pt.ja_division',
      'pt.cn_division',
      'pt.kr_division',
      'pt.division_sequence',
      'pt.ts_update',
      'pt.ts_regist',
    )
    .where('delete_flag', flag.FALSE)

  // condition product type
  if (!isEmpty(queryString.productTypeId)) {
    query.whereIn('id', queryString.productTypeId)
  }

  // condition show valid only
  if (queryString.isShowOnlyEnable === 'true') {
    query.where('enable_flag', flag.TRUE)
  }

  // handle sort condition
  let orderArr = []
  if (!queryString.sort) {
    orderArr = [{ column: 'product_sequence', order: 'ASC' }, { column: 'division_sequence', order: 'ASC' }]
  } else {
    orderArr = [...pagination.sort, { column: 'product_sequence', order: 'ASC' }, { column: 'division_sequence', order: 'ASC' }]
  }
  const data = await query.orderBy(orderArr).paginate(pagination)
  return data
}

const getProductTypeById = async (id) => {
  return await db('m_product_type')
    .select(
      'id',
      'product_sequence',
      'division_sequence',
      'enable_flag',
      'delete_flag',
      'en_product_type',
      'ja_product_type',
      'cn_product_type',
      'kr_product_type',
      'en_division',
    )
    .where({
      id: id,
      delete_flag: flag.FALSE,
    })
    .first()
}

const updateProductType = async (id, payload) => {
  return await db('m_product_type')
    .update(payload)
    .where({
      id: id,
      delete_flag: flag.FALSE,
    })
}

const checkSequenceByProduct = async (productSequence) => {
  const query = await db('m_product_type')
    .max('division_sequence', { as: 'maxDivisionSequence' })
    .min('division_sequence', { as: 'minDivisionSequence' })
    .where({
      product_sequence: productSequence,
      delete_flag: flag.FALSE,
    })
  return query
}

const updateDivisionSequence = async (type, productTypeObj) => {
  try {
    await db.transaction(async (trx) => {
      // update target record
      const recordCurrent = await trx('m_product_type')
        .where('id', productTypeObj.id)
        .increment('division_sequence', type === sequenceAction.UP ? -1 : 1)

      if (!recordCurrent) {
        throw Object.assign(new Error('Update target record failed'), { isCustomError: true })
      }

      // get new data
      const newProductType = await trx('m_product_type')
        .select('division_sequence')
        .where('id', productTypeObj.id)
        .first()

      // get record use to swap
      const productTypeInverted = await trx('m_product_type')
        .whereNot('id', productTypeObj.id)
        .where({
          product_sequence: productTypeObj.product_sequence,
          division_sequence: newProductType.division_sequence,
        })
        .increment('division_sequence', type === sequenceAction.UP ? 1 : -1)

      if (!productTypeInverted) {
        throw Object.assign(new Error('Update record use to swap failed'), { isCustomError: true })
      }
      return true
    })
    return { isError: false }
  } catch (error) {
    console.log(error)
    if (error.isCustomError) {
      return { isError: true, error }
    }
    throw error
  }
}

const checkProductSequence = async () => {
  const query = await db('m_product_type')
    .max('product_sequence', { as: 'maxProductSequence' })
    .min('product_sequence', { as: 'minProductSequence' })
    .where({
      delete_flag: flag.FALSE,
    })
    .first()
  return query
}

const updateProductSequence = async (type, productTypeObj) => {
  try {
    const result = await db.transaction(async (trx) => {
      // update current record
      const currentRecord = await trx('m_product_type')
        .where({
          en_product_type: productTypeObj.en_product_type,
          ja_product_type: productTypeObj.ja_product_type,
          cn_product_type: productTypeObj.cn_product_type,
          kr_product_type: productTypeObj.kr_product_type,
        })
        .increment('product_sequence', type === sequenceAction.UP ? -1 : 1)
      if (!currentRecord) {
        throw Object.assign(new Error('Update product_sequence failed'), { isCustomError: true })
      }

      // get product after updated
      const newProductType = await trx('m_product_type')
        .select('product_sequence')
        .where('id', productTypeObj.id)
        .first()

      // update record use to swap
      const recordInverted = await trx('m_product_type')
        .whereNot(function() {
          // eslint-disable-next-line no-invalid-this
          this.where({
            en_product_type: productTypeObj.en_product_type,
            ja_product_type: productTypeObj.ja_product_type,
            cn_product_type: productTypeObj.cn_product_type,
            kr_product_type: productTypeObj.kr_product_type,
          })
        })
        .where({
          product_sequence: newProductType.product_sequence,
        })
        .increment('product_sequence', type === sequenceAction.UP ? 1 : -1)
      if (!recordInverted) {
        throw Object.assign(new Error('Update product_sequence failed'), { isCustomError: true })
      }

      return { isError: false }
    })
    return result
  } catch (error) {
    console.log(error)
    if (error.isCustomError) {
      return { isError: true, error }
    }
    throw error
  }
}

const checkDataExist = async (payload) => {
  const data = await db('m_product_type')
    .select(
      'id',
      'en_product_type',
      'ja_product_type',
      'cn_product_type',
      'kr_product_type',
      'en_division',
      'ja_division',
      'cn_division',
      'kr_division',
    )
    .where(payload)
    .where('delete_flag', flag.FALSE)
    .first()
  return data
}

const checkProductType = async (enProductType, jaProductType, cnProductType, krProductType) => {
  const data = await db('m_product_type')
    .select(
      'en_product_type',
      'ja_product_type',
      'cn_product_type',
      'kr_product_type',
      'en_division',
      'ja_division',
      'cn_division',
      'kr_division',
      'product_sequence',
    )
    .where({
      en_product_type: enProductType,
      ja_product_type: jaProductType,
      cn_product_type: cnProductType,
      kr_product_type: krProductType,
      delete_flag: flag.FALSE,
    })
    .first()
  return data
}

const maxProductSequence = async () => {
  const data = await db('m_product_type')
    .max('product_sequence', { as: 'maxProductSequence' })
    .where({
      delete_flag: flag.FALSE,
    })
    .first()
  return data
}

const maxDivisionSequenceInProductType = async (productSequence) => {
  const data = await db('m_product_type')
    .max('division_sequence', { as: 'maxDivisionSequence' })
    .where({
      product_sequence: productSequence,
      delete_flag: flag.FALSE,
    })
    .first()
  return data
}

const createProductType = async (payload) => {
  return await db('m_product_type')
    .insert(payload)
}

const updateProductTypeAndDivision = async (id, payloadUpdateProductType, productSequence, divisionSequence, objProductType) => {
  try {
    const result = await db.transaction(async (trx) => {
      const currentProductSequence = objProductType.product_sequence
      const payload = {
        en_product_type: payloadUpdateProductType.en_product_type,
        ja_product_type: payloadUpdateProductType.ja_product_type,
        cn_product_type: payloadUpdateProductType.cn_product_type,
        kr_product_type: payloadUpdateProductType.kr_product_type,
        en_division: payloadUpdateProductType.en_division,
        ja_division: payloadUpdateProductType.ja_division,
        cn_division: payloadUpdateProductType.cn_division,
        kr_division: payloadUpdateProductType.kr_division,
      }
      if (productSequence && divisionSequence) {
        payload.product_sequence = productSequence
        payload.division_sequence = divisionSequence
        await trx('m_product_type')
          .where({
            en_product_type: objProductType.en_product_type,
            ja_product_type: objProductType.ja_product_type,
            cn_product_type: objProductType.cn_product_type,
            kr_product_type: objProductType.kr_product_type,
          })
          .andWhere('division_sequence', '>', objProductType.division_sequence)
          .decrement('division_sequence', 1)
      }

      const productHasOnlyRecord = await trx('m_product_type')
        .count('product_sequence', { as: 'countProductSequence' })
        .where('product_sequence', currentProductSequence)
        .first()

      await trx('m_product_type')
        .update(payload)
        .where('id', id)

      if (productHasOnlyRecord && productHasOnlyRecord.countProductSequence === 1) {
        await trx('m_product_type')
          .where('product_sequence', '>', currentProductSequence)
          .decrement('product_sequence', 1)
      }

      return true
    })
    return result
  } catch (error) {
    console.log(error)
    return false
  }
}

const checkDataExistForUpdate = async (id, payload) => {
  const data = await db('m_product_type')
    .select(
      'id',
      'en_product_type',
      'ja_product_type',
      'cn_product_type',
      'kr_product_type',
      'en_division',
      'ja_division',
      'cn_division',
      'kr_division',
    )
    .where(payload)
    .where('delete_flag', flag.FALSE)
    .whereNot('id', id)
    .first()
  return data
}

const maxMinSequence = async () => {
  const maxMinProductSequence = await db('m_product_type')
    .max('product_sequence', { as: 'maxProductSequence' })
    .min('product_sequence', { as: 'minProductSequence' })
    .where('delete_flag', flag.FALSE)
    .first()

  const maxMinDivisionSequence = await db('m_product_type')
    .select(
      'en_product_type',
    )
    .max('division_sequence', { as: 'maxDivisionSequence' })
    .min('division_sequence', { as: 'minDivisionSequence' })
    .where('delete_flag', flag.FALSE)
    .groupBy('en_product_type')

  return { maxMinProductSequence, maxMinDivisionSequence }
}

const getProductTypeForPulldown = async (isShowOnlyEnable) => {
  const query = db('m_product_type')
    .distinct(
      'en_product_type',
      'ja_product_type',
      'cn_product_type',
      'kr_product_type',
    )
    .where({
      delete_flag: flag.FALSE,
    })

  if (isShowOnlyEnable === 'true') {
    query.where('enable_flag', flag.TRUE)
  }
  return await query
}

const getDivisionForPulldown = async (isShowOnlyEnable) => {
  const query = db('m_product_type')
    .distinct(
      'en_division',
      'ja_division',
      'cn_division',
      'kr_division',
    )
    .where({
      delete_flag: flag.FALSE,
    })

  if (isShowOnlyEnable === 'true') {
    query.where('enable_flag', flag.TRUE)
  }
  return await query
}

module.exports = {
  getAll,
  getProductTypeList,
  getProductTypeById,
  updateProductType,
  checkSequenceByProduct,
  updateDivisionSequence,
  checkProductSequence,
  updateProductSequence,
  checkProductType,
  maxProductSequence,
  maxDivisionSequenceInProductType,
  createProductType,
  updateProductTypeAndDivision,
  checkDataExist,
  checkDataExistForUpdate,
  maxMinSequence,
  getProductTypeForPulldown,
  getDivisionForPulldown,
  getListIdProductType,
}
