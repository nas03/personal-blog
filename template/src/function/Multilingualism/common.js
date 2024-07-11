/* constant */
const { multilingualismType } = require('constant')

/* library */
const { getObject, copyObject, putObject } = require('helper').aws

const saveFileS3 = async (basePath, newPath, json) => {
  try {
    await copyObject(basePath, newPath)

    // Put new JSON
    await putObject(basePath, JSON.stringify(json), 'application/json')
    return true
  } catch (error) {
    console.log(error)
    return false
  }
}

const readJson = async (path) => {
  try {
    const res = await getObject(path)
    const fileContent = await streamToString(res.Body)
    const json = JSON.parse(fileContent)
    return { status: true, data: json }
  } catch (error) {
    console.log(error)
    return { status: false, data: error.message }
  }
}

const streamToString = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = []
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  })

const flattenObj = (obj, prefix = '') => {
  return Object.keys(obj).reduce((acc, key) => {
    const prefixedKey = prefix ? `${prefix}.${key}` : key
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      Object.assign(acc, flattenObj(obj[key], prefixedKey))
    } else {
      acc[prefixedKey] = obj[key]
    }
    return acc
  }, {})
}

const mergeObj = (en, ja, cn, kr) =>
  Object.keys(en).map((key) => ({
    key,
    en: en[key],
    ja: ja[key],
    cn: cn[key],
    kr: kr[key],
  }))

const renderKeyBucketAWS = (site, application, category, version) => {
  let key = ''
  if (
    category === multilingualismType.item_on_screen ||
    category === multilingualismType.validate
  ) {
    key = `${site}/${application}`
  } else if (
    category === multilingualismType.email ||
    category === multilingualismType.csv_pdf
  ) {
    key = `${site}/email_csv_pdf`
  } else if (category === multilingualismType.master_data) {
    key = 'master_data'
  }
  return `files/multilingualism/${key}/${version}/`
}

module.exports = {
  saveFileS3,
  readJson,
  flattenObj,
  mergeObj,
  renderKeyBucketAWS,
}
