const SITE_NAME = process.env.SITE_NAME_FXON
const getObject = require('helper/aws').getObject

const getMultilingualism = async (env, typeLang = 'ja') => {
  const localPath = `constant/locales/${typeLang}.json`
  const serverPath = `files/multilingualism/p2tech/email_csv_pdf/release/${typeLang}.json`
  const localSource = require(localPath)

  let multilingualism = localSource
  if (env !== 'local') {
    multilingualism = await readJson(serverPath)
    if (multilingualism.status === false) {
      multilingualism = localSource
    } else {
      multilingualism = multilingualism.data
    }
  }
  return replaceVariable(multilingualism)
}

const replaceVariable = (obj) => {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      if (obj[key].includes('${siteNameFxon}')) {
        obj[key] = obj[key].replace(/\${siteNameFxon}/g, SITE_NAME)
      }
      if (obj[key].includes('${WF_DOMAIN_FXON}')) {
        obj[key] = obj[key].replace(/\${WF_DOMAIN_FXON}/g, process.env.WF_DOMAIN_FXON)
      }
    } else if (typeof obj[key] === 'object') {
      replaceVariable(obj[key])
    }
  }
  return obj
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

module.exports = {
  getMultilingualism,
}
