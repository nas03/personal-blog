const { message, ekycAuthenticationType, ekycDocumentType, ekycSymbol, KYC_DOCUMENT_ID_UNDEFINED,
  kycProcessStep, ekycMethod, tokenAuthorityClass, flag, errorMessageCodeConstant } = require('constant')
const { getUserIdByToken, createResponse, createAuthorizationKey } = require('utility')
const { ekycRepository, ekycEvaluationRepository, errorLogRepository, kycDocumentRepository, ekycDocumentsRepository } = require('repository')
const { axios } = require('helper')
const { signedUrlEkyc } = require('./kyc_process')
const { checkDuplicateError } = require('./ekyc_transaction')
const sleep = require('util').promisify(setTimeout)

const updateKycProcess = async (event) => {
  try {
    const staff_id = getUserIdByToken(event)

    console.log('---API UPDATE PROCESS--- STAFF_ID: ', staff_id )
    console.log(JSON.parse(event.body))
    const { meta, kyc_ids, data } = JSON.parse(event.body)
    const fieldsBlank = !meta || !kyc_ids.length || !data
    const ekyc_id = kyc_ids[0]

    if (fieldsBlank) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    const isDuplicateError = await checkDuplicateError(staff_id, kyc_ids)

    const kycProcessData = await ekycRepository.getKycProcess({ id: ekyc_id })
    if (kycProcessData === false ) {
      throw new Error('KYC process not found')
    }
    event.user_id = kycProcessData?.user_id || null
    if (!isDuplicateError) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_KYC_PROCESS.KYC_PROCESS_DUPLICATE_ERROR])
    }
    if (!kycProcessData.completed_flag) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_KYC_PROCESS.EKYC_EXPIRY])
    }

    let updateKycProcess

    switch (meta) {
      case 'align':
        updateKycProcess = await updateAlign(data, kyc_ids)
        break
      case 'type_determination':
        updateKycProcess = await updateDocumentType(data, kycProcessData)
        break
      case 'verified':
        updateKycProcess = await verifiedData(data, kycProcessData)
        break
      case 'crop_image':
        updateKycProcess = await updateCropImageStep(data, kycProcessData)
        break
      case 'step_check':
        updateKycProcess = await updateStepCheck(data, kycProcessData)
        break
      default:
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    if (!updateKycProcess.status) {
      if (updateKycProcess.message === message.update_failed) {
        return await errorLogRepository.createResponseAndLog(event, null, null,
          [errorMessageCodeConstant.UPDATE_KYC_PROCESS.UPDATE_FAILED])
      } else {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
      }
    }

    return createResponse(true)
  } catch (error) {
    console.error(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

// STEP 1 ALIGN
const updateAlign = async (bodyData, kycIds) => {
  try {
    // RESET DB
    const payloadEkycEvaluation = {
      ...DEFAULT_EVALUATION,
      align: JSON.stringify(bodyData.align),
      step_check: kycProcessStep.STEP_ALIGN,
    }
    await ekycRepository.resetKycProcess(kycIds, DEFAULT_KYC_TRANSACTION, payloadEkycEvaluation)

    return { status: true }
  } catch (error) {
    console.log(error)
    return { status: false, message: message.server_error }
  }
}

// STEP 2.1 TYPE
const updateDocumentType = async (bodyData, kycProcessData) => {
  try {
    // ONLY UPDATE ONCE TIME WHEN STEP < 2.1
    if (
      Number(kycProcessData.step_check) >= Number(kycProcessStep.STEP_2_1)
    ) {
      return { status: false, message: message.update_failed }
    }

    // SAVE DB
    await ekycEvaluationRepository.updateEkycEvaluation(
      kycProcessData.ekyc_evaluation_id,
      {
        ...DEFAULT_EVALUATION,
        admin_selected_document_id: bodyData.admin_selected_document_id,
        align: kycProcessData.align || null,
        step_check: kycProcessStep.STEP_2_1,
      },
    )

    const parseAdminAlign = kycProcessData.align ? (JSON.parse(kycProcessData.align) || null) : null

    // REQUEST AI
    /*
    2 CASE THAT NEED TO CALL AI
      1. ALIGN: null && TYPE: ADMIN DO NOT CHOSE UNDEFINED OR SAME RESULT WITH AI
      2. ALIGN: !null && TYPE: ADMIN DO NOT CHOSE UNDEFINED
    */
    const caseOne =
      kycProcessData.align === null &&
      ![KYC_DOCUMENT_ID_UNDEFINED, kycProcessData.ai_detected_document_id].includes(bodyData.admin_selected_document_id)

    const caseTwo =
      kycProcessData.align !== null &&
      bodyData.admin_selected_document_id !== KYC_DOCUMENT_ID_UNDEFINED

    if (caseOne || caseTwo) {
      await requestAiDetect(kycProcessData, bodyData.admin_selected_document_id, parseAdminAlign, 'recognition_symbol')
    }

    return { status: true }
  } catch (error) {
    console.log(error)
    return { status: false, message: message.server_error }
  }
}

// STEP 2.2 -> 2.7
const verifiedData = async (bodyData, kycProcessData) => {
  try {
    const keyUpdate = Object.keys(bodyData).find((el) => el.includes('verified'))
    // ONLY UPDATE WHEN DATA IN DB = -1 AND STEP < 3.0
    if (
      kycProcessData[keyUpdate] !== -1 ||
      Number(kycProcessData.step_check) >= Number(kycProcessStep.STEP_3_0)
    ) {
      return { status: false, message: message.update_failed }
    }

    bodyData['step_check'] = KYC_PROCESS_STEP[kycProcessData.user_check_method].find((el) => el.name === keyUpdate).step

    // UPDATE DB
    await ekycEvaluationRepository.updateEkycEvaluation(kycProcessData.ekyc_evaluation_id, bodyData)

    return { status: true }
  } catch (error) {
    console.log(error)
    return { status: false, message: message.server_error }
  }
}

// STEP 3.0 -> 3.1
const updateCropImageStep = async (data, kycProcessData) =>{
  try {
    const { action, body } = data
    const { ekyc_id, directory_path } = kycProcessData
    let update

    switch (action) {
      case 'complete_image_crop':
        const kycDocuments = await ekycDocumentsRepository.getArchivedDocumentsByKyc(
          null,
          { 'archived_documents.is_video': flag.FALSE,
            'archived_documents.is_preview': flag.FALSE,
            'archived_documents.delete_flag': flag.FALSE,
            'kyc_transaction.directory_path': directory_path,
          })

        const originalDocs = kycDocuments?.filter((originalDocument) => originalDocument.original_flag === flag.TRUE) || []
        const croppedDocs = kycDocuments?.filter((originalDocument) => originalDocument.original_flag === flag.FALSE) || []

        // COMPLETE IMAGE CROP WHEN NUMBER OF ORIGINAL DOCUMENT = NUMBER OF CROPPED DOCUMENT
        if (originalDocs.length !== croppedDocs.length) {
          return { status: false, message: message.update_failed }
        }

        update = await ekycEvaluationRepository.updateEkycEvaluationByKycId(ekyc_id, { step_check: kycProcessStep.STEP_TRIMMING })
        break
      case 'delete_image':
        const ekyc_document_id = body?.ekyc_document_id
        const payloadKycEvaluation = { step_check: kycProcessStep.STEP_3_0 }
        update = await ekycDocumentsRepository.deleteCroppedDocument(ekyc_id, ekyc_document_id, payloadKycEvaluation)
        break
      default:
        break
    }

    if (!update ) {
      return { status: false, message: message.server_error }
    }

    return { status: true }
  } catch (error) {
    console.log(error)
    return { status: false, message: message.server_error }
  }
}

// UPDATE STEP WHEN CLICK NEXT
/*
      STEP 1 -> STEP 2: step_check = 2.0
      STEP 2 -> STEP 3: step_check = 3.0
*/
const updateStepCheck = async (bodyData, kycProcessData) =>{
  try {
    // VALIDATE INPUT
    if (![kycProcessStep.STEP_2_0, kycProcessStep.STEP_3_0].includes(bodyData.step_check)) {
      return { status: false, message: message.update_failed }
    }

    // DO NOT UPDATE WHEN BODY STEP_CHECK < DB STEP_CHECK
    if (Number(bodyData.step_check) <= Number(kycProcessData.step_check)) {
      return { status: true }
    }

    // VALIDATE STEP
    if (
      bodyData.step_check === kycProcessStep.STEP_2_0 &&
      kycProcessData.step_check !== kycProcessStep.STEP_ALIGN
    ) {
      return { status: false, message: message.update_failed }
    }

    if (bodyData.step_check === kycProcessStep.STEP_3_0) {
      if (
        (kycProcessData.user_authentication_type === ekycAuthenticationType.Identification_Auth &&
            kycProcessData.step_check !== kycProcessStep.STEP_2_7) ||
          (kycProcessData.user_authentication_type === ekycAuthenticationType.PoA_Auth &&
            kycProcessData.step_check !== kycProcessStep.STEP_2_5) ||
          (kycProcessData.user_authentication_type === ekycAuthenticationType.MNC_Auth &&
            kycProcessData.step_check !== kycProcessStep.STEP_2_4)
      ) {
        return { status: false, message: message.update_failed }
      }
    }

    await ekycEvaluationRepository.updateEkycEvaluation(
      kycProcessData.ekyc_evaluation_id,
      {
        step_check: bodyData.step_check.toString(),
      },
    )

    return { status: true }
  } catch (error) {
    console.log(error)
    return { status: false, message: message.server_error }
  }
}

const requestAiDetect = async (kycProcessData, admin_selected_document_id, admin_align, meta) => {
  try {
    console.log('Resend request to AI')
    const { key, expiresIn } = createAuthorizationKey(30, 'minutes')

    const masterKycDocuments = await kycDocumentRepository.getKycDocuments({ id: admin_selected_document_id })

    const sessionAi = await ekycRepository.createSessionAI(kycProcessData.ekyc_id, {
      site_id: kycProcessData.site_id,
      target_id: kycProcessData.ekyc_id,
      action_class: tokenAuthorityClass.EKYC_AI,
      activation_key: key,
      activation_key_expire_datetime: expiresIn,
    })

    const video = sessionAi.ekycDocuments.find((el) => el.is_video)
    const customEkycDocs = customEkycDocsAI(sessionAi.ekyc, sessionAi.ekycDocuments.filter((el) => !el.is_video))

    const { valid_frame, valid_video_idx, align: ai_align, text_recognition } = JSON.parse(sessionAi.ekyc.ai_specification) || {}
    const align = {
      front: admin_align && admin_align?.front ? admin_align?.front : ai_align.front,
      diagonal_65: ai_align.diagonal_65,
      back: ai_align.back,
    }
    console.log(JSON.stringify(align))

    const chosenSymbol = masterKycDocuments[0].document_symbol === ekycSymbol.MNN ? ekycSymbol.MNU : masterKycDocuments[0].document_symbol

    const bodyRequestAI = {
      session_id: sessionAi.ekyc.request_ai_key,
      chosen_symbol: chosenSymbol,
      aspect_ratio: sessionAi.ekyc.aspect_ratio || null,
      valid_frame: valid_frame,
      valid_video_idx: valid_video_idx,
      align: align,
      text_recognition: text_recognition,
      is_admin_align: meta === 'align' ? true : false,
      directory_path: sessionAi.ekyc.directory_path + '/' + sessionAi.ekyc.document_type,
      documents: customEkycDocs.map((el) => {
        return {
          file_uri:
              's3://' +
              process.env.BUCKET +
              '/' +
              sessionAi.ekyc.directory_path +
              '/' +
              sessionAi.ekyc.document_type?.replace(/\s/g, '_') +
              '/' +
              el.file_name,
          process: el.photo_process_name,
          time: el.ts_regist,
        }
      }),
      video_url: await signedUrlEkyc(video.file_url) || null,
    }
    console.log(bodyRequestAI)
    const resAI = await axios.post(process.env.AI_ENDPOINT_URL + '/api/v2/upload', bodyRequestAI)
    console.log(resAI)
    await sleep(15000)
    return true
  } catch (error) {
    console.log(error)
    return false
  }
}

const customEkycDocsAI = (ekyc, ekycDocuments) => {
  let documents = []
  if (ekyc.document_type === ekycDocumentType.MNC_A) {
    const front = ekycDocuments.find((el) => el.photo_process === 1)
    const diagonal_65 = {
      file_name: front.file_name,
      file_url: front.file_url,
      photo_process_name: 'diagonal_65',
    }
    const thickness = {
      file_name: front.file_name,
      file_url: front.file_url,
      photo_process_name: 'thickness',
    }
    ekycDocuments.push(diagonal_65, thickness)
    documents = ekycDocuments
  } else {
    documents = ekycDocuments
  }
  return documents
}

const KYC_PROCESS_STEP = {
  [ekycMethod.ID_Fact]: [
    {
      name: 'shape_verified',
      step: kycProcessStep.STEP_2_1,
    },
    {
      name: 'info_verified',
      step: kycProcessStep.STEP_2_2,
    },
    {
      name: 'identity_verified',
      step: kycProcessStep.STEP_2_3,
    },
    {
      name: 'validity_verified',
      step: kycProcessStep.STEP_2_4,
    },
    {
      name: 'face_verified',
      step: kycProcessStep.STEP_2_5,
    },
    {
      name: 'consistency_verified',
      step: kycProcessStep.STEP_2_6,
    },
    {
      name: 'internal_verified',
      step: kycProcessStep.STEP_2_6,
    },
    {
      name: 'third_party_verified',
      step: kycProcessStep.STEP_2_7,
    },
  ],

  [ekycMethod.MNC]: [
    {
      name: 'shape_verified',
      step: kycProcessStep.STEP_2_1,
    },
    {
      name: 'info_verified',
      step: kycProcessStep.STEP_2_2,
    },
    {
      name: 'identity_verified',
      step: kycProcessStep.STEP_2_3,
    },
    {
      name: 'validity_verified',
      step: kycProcessStep.STEP_2_4,
    },
  ],
  [ekycMethod.PoA]: [
    {
      name: 'shape_verified',
      step: kycProcessStep.STEP_2_1,
    },
    {
      name: 'info_verified',
      step: kycProcessStep.STEP_2_2,
    },
    {
      name: 'identity_verified',
      step: kycProcessStep.STEP_2_3,
    },
    {
      name: 'address_verified',
      step: kycProcessStep.STEP_2_4,
    },
    {
      name: 'validity_verified',
      step: kycProcessStep.STEP_2_5,
    },
  ],
}

const DEFAULT_EVALUATION = {
  admin_selected_document_id: null,
  align: null,
  shape_verified: -1,
  info_verified: -1,
  validity_verified: -1,
  consistency_verified: -1,
  face_verified: -1,
  identity_verified: -1,
  address_verified: -1,
  internal_verified: -1,
  third_party_verified: -1,
  date_of_expiry: null,
  date_of_issue: null,
  identifier_number: null,
  first_name: null,
  last_name: null,
  date_of_birth: null,
  post_code: null,
  address: null,
  step_check: null,
}

const DEFAULT_KYC_TRANSACTION = {
  confidence_aws_face: 0,
  confidence_kairos_face: 0,
  valid_shape_flag: 0,
  valid_material_flag: 1,
  valid_expiry_flag: 0,
  valid_id_flag: 0,
  match_blacklist_flag: 1,
  match_refinitiv_criminal_flag: 1,
}

module.exports = {
  updateKycProcess,
  KYC_PROCESS_STEP,
}
