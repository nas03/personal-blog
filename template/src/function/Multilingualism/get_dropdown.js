/* function */
const { readJson, renderKeyBucketAWS } = require('./common')
const utility = require('utility')

/* constant */
const { multilingualismType, commonSiteId, authorizationName, errorMessageCodeConstant } = require('constant')

/* repository */
const { languageParamRepository, errorLogRepository } = require('repository')

/* function */
const { commonGetAdminData } = require('../Config/sites')

const getDropdownMultilingualism = async (event) =>{
  try {
    const { site, application, category } = event.queryStringParameters
    if (
      (!category) ||
      (!category && !site && !application) ||
      (category === multilingualismType.item_on_screen && (!site || !application)) ||
      ((category === multilingualismType.email || category === multilingualismType.csv_pdf) && !site) ||
      category === multilingualismType.master_data ||
      category === multilingualismType.validate
    ) {
      return utility.createResponse(true, [])
    }

    let pages = []
    const releaseFolder = renderKeyBucketAWS(site, application, category, 'release')
    console.log(releaseFolder)
    const jsonS3 = await readJson(`${releaseFolder}en.json`)

    if (category === multilingualismType.item_on_screen) {
      if (jsonS3.data.validate) delete jsonS3.data.validate
      pages = Object.keys(jsonS3.data)
    } else if (
      category === multilingualismType.email ||
      category === multilingualismType.csv_pdf
    ) {
      if (jsonS3.data[category]) {
        pages = Object.keys(jsonS3.data[category])
        pages = pages.map((el) => `${category}.${el}`)
      }
    }
    pages = pages.sort()

    let payload
    if (category === multilingualismType.email || category === multilingualismType.csv_pdf) {
      payload = {
        site: site,
        category: category,
      }
    } else if (category === multilingualismType.item_on_screen) {
      payload = {
        site: site,
        category: category,
        tool: application === 'web' ? 'portal' : 'application',
      }
    }
    const languageParam = await languageParamRepository.getLanguageParams(payload)
    const response = pages.map((page) => {
      const find = languageParam.find((e)=>e.language_param_key === page)
      return {
        language_param_key: page,
        display_text: find && find.display_text ? find.display_text : page,
      }
    })

    return utility.createResponse(true, response)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getDropdownSitesMultilingualism = async (event) =>{
  try {
    const adminId = utility.getUserIdByToken(event)
    const adminData = await commonGetAdminData(adminId)
    const availableSites = [commonSiteId.MY_FOREX, commonSiteId.ICPAY, commonSiteId.FXT]
    const multilingualismSites = adminData.admin_with_sites.filter((el) => availableSites.includes(el.code))
      .map((site) => {
        return {
          ...site,
          site_key: renderSiteKey(site.code),
        }
      })

    if (adminData.authorization_id === authorizationName.SYSTEM_ADMINISTRATOR) {
      const p2tSite = {
        site_name: 'P2T',
        site_key: 'p2tech',
        code: 0,
        display_order: 98,
      }
      const ekycSite = {
        site_name: 'EKYC',
        site_key: 'ekyc',
        code: 99,
        display_order: 99,
      }
      multilingualismSites.push(p2tSite)
      multilingualismSites.push(ekycSite)
    }

    return utility.createResponse(true, { sites: multilingualismSites })
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const renderSiteKey = (siteId) => {
  switch (siteId) {
    case commonSiteId.MY_FOREX:
      return 'myforex'
    case commonSiteId.ICPAY:
      return 'icpay'
    case commonSiteId.FXT:
      return 'fxon'
    default:
      return ''
  }
}

module.exports = {
  getDropdownMultilingualism,
  getDropdownSitesMultilingualism,
}
