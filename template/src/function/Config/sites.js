// constant
const { errorMessageCodeConstant } = require('constant')

// repository
const { errorLogRepository, usersBasicDataRepository, siteRepository } = require('repository')

// function
const utility = require('utility')

const getAllSites = async (event) => {
  try {
    const listSite = await siteRepository.getSites()
    return utility.createResponse(true, listSite)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getSitesByAdmin = async (event) => {
  try {
    const adminId = utility.getUserIdByToken(event)
    const adminData = await commonGetAdminData(adminId)

    return utility.createResponse(true, adminData.admin_with_sites)
  } catch (error) {
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const commonGetAdminData = async (adminId) => {
  const [adminData, sites] = await Promise.all([
    usersBasicDataRepository.getUserBasicData({ id: adminId }),
    siteRepository.getSites(),
  ])

  const adminWithSiteIds = adminData.admin_with_site_id.split(',').map(Number)
  const adminSites = sites.filter((el) => adminWithSiteIds.includes(el.code)) || []

  return {
    ...adminData,
    admin_with_sites: adminSites,
  }
}

module.exports = {
  getAllSites,
  getSitesByAdmin,
  commonGetAdminData,
}
