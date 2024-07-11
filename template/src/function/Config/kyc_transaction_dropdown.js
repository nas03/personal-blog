// CONSTANT
const { flag, statusClassConstant, errorMessageCodeConstant } = require('constant')

// FUNC
const utility = require('utility')
const { commonGetAdminData } = require('./sites')

// REPOSITORY
const { errorLogRepository, statusMasterRepository, kycDocumentRepository, kycFlowRepository } = require('repository')

module.exports.getKycTransactionDropdown = async (event) => {
  try {
    const adminId = utility.getUserIdByToken(event)

    // GET MASTER DATA FOR DROPDOWN KYC TRANSACTION
    const [siteByAdmin, kycDocuments, flows, kycStatus] = await Promise.all([
      commonGetAdminData(adminId),
      kycDocumentRepository.getAllKycDocument(),
      kycFlowRepository.getAllFlows(),
      statusMasterRepository.getListStatusByClass([statusClassConstant.DOCUMENT_STATUS.toString()]),
    ])

    const kycAuthTypes = kycDocuments?.map((el) => el.authentication_type) || []
    const kycDocumentTypes = kycDocuments?.map((el) => el.document_type) || []
    const kycCheckMethods = kycDocuments?.map((el) => ({ kyc_type: el.kyc_type, check_method: el.check_method })).filter((obj, index, self) =>
      index === self.findIndex((t) => t['check_method'] === obj['check_method'])) || []

    const response = {
      sites: siteByAdmin.admin_with_sites,
      kyc_auth_types: Array.from(new Set(kycAuthTypes)),
      kyc_document_types: Array.from(new Set(kycDocumentTypes)),
      kyc_flows: flows?.map((fl) => fl.flow_name) || [],
      kyc_status: kycStatus?.filter((status) => status.status_label_number === flag.FALSE && status.enable_flag === flag.TRUE) || [],
      kyc_methods: kycCheckMethods,
    }

    return utility.createResponse(true, response)
  } catch (error) {
    console.log(error.message)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}


