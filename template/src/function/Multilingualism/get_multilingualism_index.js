/* function */
const {
  readJson,
  flattenObj,
  mergeObj,
  renderKeyBucketAWS,
} = require('./common')
const utility = require('utility')
const { putObject, detailObject } = require('helper').aws

/* constant */
const {
  errorMessageCodeConstant,
  multilingualismType,
  language,
  uncheckALL,
} = require('constant')

/* db */
const { masterDataRepository, errorLogRepository } = require('repository')

const getMultilingualismIndex = async (event) =>{
  try {
    const { site, application, category, screen, keyword, page, size } = event.queryStringParameters
    // Validate required
    const pagination = utility.getPagination({ page, size })

    if (
      !category ||
      ((category === multilingualismType.item_on_screen || category === multilingualismType.validate) && (!site || !application)) ||
      ((category === multilingualismType.email || category === multilingualismType.csv_pdf) && !site) ||
      ((category === multilingualismType.item_on_screen || category === multilingualismType.email || category === multilingualismType.csv_pdf) &&
        Number(screen) === uncheckALL)
    ) {
      const multilingualism = utility.paginatedItems([], pagination.currentPage, pagination.perPage)
      return utility.createResponse(true, {
        apply: false,
        multilingualism: multilingualism,
      })
    }

    const res = await getMultilingualism(site, application, category, screen, keyword)

    // PAGINATION
    if (page && size) {
      res.multilingualism = utility.paginatedItems(res.multilingualism, pagination.currentPage, pagination.perPage)
    } else {
      res.multilingualism = { data: res.multilingualism }
    }

    return utility.createResponse(true, res)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getMultilingualism = async (site, application, category, screen, keyword) => {
  let multilingualism
  // CHECK TEMP exist. If not exist, create default TEMP
  const tempName = 'temp.json'
  const tempPath = renderKeyBucketAWS(site, application, category, 'temp') + tempName
  const detailTemp = await detailObject(tempPath)
  if (detailTemp.status === false && detailTemp.data.name === 'NotFound') {
    await putObject(tempPath, JSON.stringify([]), 'application/json')
  }

  // READ TEMP
  const tempJson = await readJson(tempPath)
  if (tempJson.status === false) {
    return false
  }
  const editing = tempJson.data.length ? true : false

  if (category === multilingualismType.master_data) {
    // GET master data in DB
    const masterData = await masterDataRepository.getMultilingualMasterData()
    const dbMasterData = masterData.flatMap((nestedArray) => nestedArray)
    dbMasterData.forEach((el) => {
      if (el.ja === null || el.ja === '') delete el.ja
      if (el.en === null || el.en === '') delete el.en
      if (el.cn === null || el.cn === '') delete el.cn
      if (el.kr === null || el.kr === '') delete el.kr
      if (el.ja_description === null || el.ja_description === '') delete el.ja_description
      if (el.en_description === null || el.en_description === '') delete el.en_description
      if (el.cn_description === null || el.cn_description === '') delete el.cn_description
      if (el.kr_description === null || el.kr_description === '') delete el.kr_description
    })
    multilingualism = syncMasterData(dbMasterData, tempJson.data)
  } else {
    const releaseFolder = renderKeyBucketAWS(site, application, category, 'release')
    // SYNC TEMP and RELEASE
    const enObj = await syncData(`${releaseFolder}en.json`, tempJson.data, language.EN)
    const jaObj = await syncData(`${releaseFolder}ja.json`, tempJson.data, language.JA)
    const cnObj = await syncData(`${releaseFolder}cn.json`, tempJson.data, language.CN)
    const krObj = await syncData(`${releaseFolder}kr.json`, tempJson.data, language.KR)

    // GET data by dropdown
    multilingualism = getDataByDropdown(enObj, jaObj, cnObj, krObj, category, screen)
    if (multilingualism === false) return false
  }

  // SEARCH keyword
  if (keyword !== undefined) {
    multilingualism = multilingualism.filter(
      (el) =>
        (el.key && el.key.toLowerCase().includes(keyword.toLowerCase())) ||
          (el.en && el.en.toLowerCase().includes(keyword.toLowerCase())) ||
          (el.ja && el.ja.toLowerCase().includes(keyword.toLowerCase())) ||
          (el.cn && el.cn.toLowerCase().includes(keyword.toLowerCase())) ||
          (el.kr && el.kr.toLowerCase().includes(keyword.toLowerCase())) ||
          (el.en_description && el.en_description.toLowerCase().includes(keyword.toLowerCase())) ||
          (el.ja_description && el.ja_description.toLowerCase().includes(keyword.toLowerCase())) ||
          (el.cn_description && el.cn_description.toLowerCase().includes(keyword.toLowerCase())) ||
          (el.kr_description && el.kr_description.toLowerCase().includes(keyword.toLowerCase())),
    )
  }
  return {
    apply: editing,
    multilingualism: multilingualism,
  }
}

const syncMasterData = (releaseData, tempData ) => {
  try {
    tempData.forEach((temp) => {
      const { key, value, lang } = temp
      const release = releaseData.find((el) => el.key === key)
      if (release) {
        release[lang] = value
      }
    })
    return releaseData
  } catch (error) {
    console.log(error)
    return false
  }
}

const syncData = async (path, data, lang) => {
  try {
    // GET RELEASE folder
    const json = await readJson(path)
    if (json.status === false) {
      throw new Error(json.data)
    }

    // SYNC RELEASE and TEMP
    const tempData = data.filter((el) => el.lang === lang)
    if (tempData.length) {
      tempData.forEach((el) => {
        const keys = el.key.split('.')
        let obj = json.data
        for (let i = 0; i < keys.length - 1; i++) {
          obj = obj[keys[i]]
        }
        if (obj[keys[keys.length - 1]]) {
          obj[keys[keys.length - 1]] = el.value
        }
      })
    }
    return json.data
  } catch (error) {
    console.log(error)
    throw error
  }
}

const getDataByDropdown = (enJSON, jaJSON, cnJSON, krJSON, category, screen = undefined) => {
  try {
    let enObj = {}
    let jaObj = {}
    let cnObj = {}
    let krObj = {}

    enObj = filterObj(enJSON, category, screen)
    jaObj = filterObj(jaJSON, category, screen)
    cnObj = filterObj(cnJSON, category, screen)
    krObj = filterObj(krJSON, category, screen)

    // Flatten Object: Convert json to single-depth-object
    const flattenEnObj = flattenObj(enObj)
    const flattenJaObj = flattenObj(jaObj)
    const flattenCnObj = flattenObj(cnObj)
    const flattenKrObj = flattenObj(krObj)
    return mergeObj(flattenEnObj, flattenJaObj, flattenCnObj, flattenKrObj)
  } catch (error) {
    console.log(error)
    return false
  }
}

const filterObj = (obj, category, screen = undefined) => {
  const result = {}
  if (category === multilingualismType.item_on_screen) {
    // Remove obj validate
    if (obj.validate) delete obj.validate
    const parseScreen = screen ? JSON.parse(screen) : undefined
    if (parseScreen === undefined) return obj
    if (!parseScreen.length) return {}

    parseScreen.forEach((el) => {
      if (obj[el]) {
        result[el] = obj[el]
      }
    })
  } else if (category === multilingualismType.validate) {
    if (obj.validate) result.validate = obj.validate
  } else if (
    category === multilingualismType.email ||
    category === multilingualismType.csv_pdf
  ) {
    if (!obj[category]) return {}
    const parseScreen = screen ? JSON.parse(screen) : undefined
    if (parseScreen === undefined) {
      return { [category]: obj[category] }
    }
    if (!parseScreen.length) return {}

    parseScreen.forEach((el) => {
      const subKey = el.split('.')[1]
      if (obj[category][subKey]) {
        if (!result[category]) {
          result[category] = {}
        }
        result[category][subKey] = obj[category][subKey]
      }
    })
  }
  return result
}

module.exports = {
  getMultilingualismIndex,
  syncData,
  syncMasterData,
  getMultilingualism,
}
