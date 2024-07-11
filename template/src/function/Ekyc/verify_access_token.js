const { createResponse, verifyToken } = require('utility')
const { errorMessageCodeConstant, country, ekycAuthenticationType, ekycFlow, statusCode } = require('constant')
const { ekycRepository, errorLogRepository, usersBasicDataRepository, kycFlowRepository } = require('repository')

const verifyAccessToken = async (event) => {
  try {
    const res = {
      isValidToken: true,
      isInvalidUrl: false,
      flowData: null,
      site: null,
      isContinue: false,
    }
    const { accessToken } = JSON.parse(event.body)

    const verify = verifyToken(accessToken)
    if (!verify.status) {
      res.isValidToken = false
      return createResponse(true, res)
    }

    const { user_id, personal_id, site_id } = verify.data
    console.log(verify.data)

    const userInfo = await usersBasicDataRepository.getUserLocation(user_id, personal_id)

    const listEkyc = await ekycRepository.getListEkyc({
      'kyc_transaction.user_basic_data_id': user_id,
      'kyc_transaction.user_personal_id': personal_id,
    })
    if (listEkyc === false) {
      throw new Error('Get list EKYC failed')
    }

    const lastCompletedEkyc = listEkyc.filter((el)=> el.is_lastest_completed)

    const lastTimeEkyc = await ekycRepository.getLastTimeEkyc({
      'kyc_transaction.user_basic_data_id': user_id,
      'kyc_transaction.user_personal_id': personal_id,
    })
    if (lastTimeEkyc === false) {
      throw new Error('Get last time EKYC failed')
    }

    const { ekyc, isMyNumberFlowC } = lastTimeEkyc

    const isCompleteKyc = await ekycRepository.checkCompleteKycByStatus(user_id, personal_id, [statusCode.APPROVED])

    // --------------------- CHECK VALID URL ---------------------//
    if (
      isCompleteKyc ||
      lastCompletedEkyc.find((el) => el.status === statusCode.PROCESSING) ||
      userInfo.account_status_code === statusCode.CLOSED
    ) {
      res.isInvalidUrl = true
      return createResponse(true, res)
    }

    // --------------------- FLOW EKYC ---------------------//
    const locationInfo = {
      country_id: userInfo.personal_country_id,
      nationality_id: userInfo.nationality_id,
    }

    if (
      userInfo.corporate_flag === 0 ||
      (userInfo.corporate_flag === 1 &&
        userInfo.transaction_person === 1 &&
        userInfo.representative_person === 0 &&
        userInfo.beneficial_owner === 0)
    ) {
      locationInfo.country_id = userInfo.user_country_id
    }

    const flowData = await kycFlowRepository.getKycFlows({
      site_id: site_id,
      ja_country_flag: locationInfo.country_id === country.JAPAN ? 1 : 0,
      ja_nationality_flag: locationInfo.nationality_id === country.JAPAN ? 1 : 0,
    })

    res.site = site_id
    res.flowData = renderFlowData(flowData)
    const flowName = res.flowData?.name

    // --------------------- IS NEXT STEP EKYC ---------------------//
    if (flowName === ekycFlow.FLOW_D || flowName === ekycFlow.FLOW_E) {
      res.isContinue = false
      return createResponse(true, res)
    }

    if (!ekyc) {
      res.isContinue = false
    } else {
      const isStep2Completed =
        ekyc.authentication_type === ekycAuthenticationType.Face_Auth &&
        ekyc.completed_flag

      const isStep3NotCompleted =
        [ekycAuthenticationType.PoA_Auth, ekycAuthenticationType.MNC_Auth].includes(ekyc.authentication_type) &&
        !ekyc.completed_flag

      if (!isMyNumberFlowC && (isStep2Completed || isStep3NotCompleted)) {
        res.isContinue = true
      }
    }
    return createResponse(true, res)
  } catch (error) {
    console.log(error.message)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const renderFlowData = (flowData) => {
  const flow = {
    id: null,
    name: null,
    step: {},
  }
  flowData.map((el) => {
    if (!flow.id) {
      flow.id = el.id
      flow.name = el.flow_name
    }

    if (!flow.step[`step_${el.step}`]) {
      flow.step[`step_${el.step}`] = [{
        kyc_flow_id: el.id,
        kyc_document_id: el.kyc_document_id,
        document_type: el.document_type,
        document_symbol: el.document_symbol,
      },
      ]
    } else {
      const isDuplicateDocType =
        el.authentication_type === ekycAuthenticationType.Identification_Auth &&
        flow.step[`step_${el.step}`].find((kyc) => kyc.document_type === el.document_type)
      if (!isDuplicateDocType) {
        flow.step[`step_${el.step}`].push({
          kyc_flow_id: el.id,
          kyc_document_id: el.kyc_document_id,
          document_type: el.document_type,
          document_symbol: el.document_symbol,
        })
      }
    }
  })
  return flow
}

module.exports = {
  verifyAccessToken,
}
