// LIBRARY
const moment = require('moment')
const { GetObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')

const { message, timeExpires, ekycMethod, ekycSymbol, flag, dateFormat, KYC_DOCUMENT_ID_UNDEFINED,
  statusClassConstant, ekycAuthenticationType, ekycDocumentType, ekycType, settingClass, errorMessageCodeConstant } = require('constant')
const { KYC_PROCESS_STEP } = require('./update_kyc_process')

// UTILITY
const { createResponse } = require('utility')

// REPOSITORY
const {
  ekycRepository,
  ekycDocumentsRepository,
  ekycDocumentsAnalysisRepository,
  errorLogRepository,
  kycDocumentRepository,
  statusMasterRepository,
  transactionCautionRepository,
  usersPersonalRepository,
  siteSettingRepository,
} = require('repository')
const { getWorldCheckOneCases } = require('./world_check')
const { renderSendMailDisplayClass } = require('../Config/config')

// FUNCTION
const { connectS3 } = require('helper').upload

const getKycProcess = async (event) => {
  try {
    const { meta, ekyc_id, ekyc_id_face } = event.queryStringParameters || {}

    const fieldsBlank = !meta || !ekyc_id
    if (fieldsBlank) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    const ekycId = parseInt(ekyc_id)
    const ekycIdFace = parseInt(ekyc_id_face)

    let response
    const ekycData = await ekycRepository.getKycTransaction({ 'kyc_transaction.id': ekyc_id })

    switch (meta) {
      case 'info':
        response = await getKycProcessInfo(ekycId, ekycIdFace)
        break
      case 'check':
        response = await getKycProcessCheck(ekycId, ekycIdFace)
        break
      case 'trimming':
        response = await getKycProcessTrimming(ekycId, ekycIdFace)
        break
      case 'status':
        response = await getKycProcessStatus(ekycId, ekycIdFace, ekycData)
        break
      default:
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    if (!response.status) {
      return await errorLogRepository.createResponseAndLog(event, response, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
    }
    return createResponse(true, response.data)
  } catch (error) {
    console.log(error.message)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getKycProcessInfo = async (ekycId, ekycFaceId = null) => {
  try {
    const kycProcessInfo = await ekycRepository.getKycProcessInfo(ekycId, ekycFaceId)

    kycProcessInfo.name_kanji = kycProcessInfo.name_kanji ?
      kycProcessInfo.name_kanji.replace(/\s/g, '') === '' ?
        null :
        kycProcessInfo.name_kanji :
      null

    kycProcessInfo.name_katakana = kycProcessInfo.name_katakana ?
      kycProcessInfo.name_katakana.replace(/\s/g, '') === '' ?
        null :
        kycProcessInfo.name_katakana :
      null
    return {
      status: true,
      data: kycProcessInfo,
    }
  } catch (error) {
    console.log(error)
    return {
      status: false,
      data: message.server_error,
    }
  }
}

const getKycProcessCheck = async (ekycId, ekycFaceId = undefined, isCheckScreening = true) => {
  try {
    const kycProcessData = await ekycRepository.getKycProcess({ id: ekycId })
    const kycArchivedDocuments = await ekycDocumentsRepository.getEkycDocuments({ 'ad.kyc_transaction_id': ekycId })
    const signedKycArchivedDocuments = await Promise.all(kycArchivedDocuments.map(async (el) => {
      return {
        ...el,
        file_url: await signedUrlEkyc(el.file_url),
      }
    }))

    let kycTransactionFaceData
    let kycFaceArchivedDocuments
    let signedKycFaceArchivedDocuments

    if (ekycFaceId) {
      kycTransactionFaceData = await ekycRepository.getEkycCheckInfo({ id: ekycFaceId })
      kycTransactionFaceData = kycTransactionFaceData === undefined ? false : kycTransactionFaceData
      kycFaceArchivedDocuments = await ekycDocumentsRepository.getEkycDocuments({ 'ad.kyc_transaction_id': ekycFaceId })
      signedKycFaceArchivedDocuments = await Promise.all(kycFaceArchivedDocuments.map(async (el) => {
        return {
          ...el,
          file_url: await signedUrlEkyc(el.file_url),
        }
      }))
    }


    const ekycDocumentsAnalysis = await ekycDocumentsAnalysisRepository.getEkycDocumentAnalysis({ ekyc_id: ekycId })

    if (
      !kycProcessData || kycArchivedDocuments === false ||
      kycTransactionFaceData === false || kycFaceArchivedDocuments === false ||
      ekycDocumentsAnalysis === false) {
      return {
        status: false,
        data: message.server_error,
      }
    }

    /* ----MASTER KYC_DOCUMENTS---- */
    const mKycDocuments = await renderMasterKycDocuments(kycProcessData.user_authentication_type, kycProcessData.user_document_type)

    /* ----DATA STEP 1---- */
    const dataStep1 = getJudgmentBlock(kycProcessData, signedKycArchivedDocuments, kycTransactionFaceData, signedKycFaceArchivedDocuments)

    /* ----DATA STEP 2---- */
    const typeAndAuthenticityBlock = getTypeAndAuthenticityBlock(kycProcessData, mKycDocuments)
    const identityBlock = await getIdentityBlock(kycProcessData, ekycDocumentsAnalysis)
    const validityBlock = await getValidityBlock(kycProcessData, ekycDocumentsAnalysis)

    let dataStep2
    if (kycProcessData.user_check_method === ekycMethod.ID_Fact) {
      const facialBlock = await getFacialBlock(kycProcessData, ekycDocumentsAnalysis)
      const consistencyBlock = getConsistencyBlock(kycProcessData, kycTransactionFaceData)
      const screeningBlock = await getScreeningBlock(kycProcessData, isCheckScreening)
      dataStep2 = {
        // 2.1 + 2.2
        ...typeAndAuthenticityBlock,
        // 2.3
        ...identityBlock,
        // 2.4
        ...validityBlock,
        // 2.5
        ...facialBlock,
        // 2.6
        ...consistencyBlock,
        // 2.7
        ...screeningBlock,
      }
    } else if (kycProcessData.user_check_method === ekycMethod.MNC) {
      dataStep2 = {
        // 2.1 + 2.2
        ...typeAndAuthenticityBlock,
        // 2.3
        ...identityBlock,
        // 2.4
        ...validityBlock,
      }
    } else if (kycProcessData.user_check_method === ekycMethod.PoA) {
      const addressBlock = await getAddressBlock(kycProcessData, ekycDocumentsAnalysis)
      dataStep2 = {
        // 2.1 + 2.2
        ...typeAndAuthenticityBlock,
        // 2.3
        ...identityBlock,
        // 2.4
        ...addressBlock,
        // 2.5
        ...validityBlock,
      }
    }

    return {
      status: true,
      data: {
        step_1: dataStep1,
        step_2: dataStep2,
        m_kyc_documents: mKycDocuments,
      },
    }
  } catch (error) {
    console.log(error)
    return {
      status: false,
      data: message.server_error,
    }
  }
}

const getKycProcessTrimming = async (ekycId, ekycFaceId = undefined) => {
  try {
    const kycTransactionIds = [ekycId]
    if (ekycFaceId) kycTransactionIds.push(ekycFaceId)

    // GET ORIGINAL ARCHIVED DOCUMENTS
    const archivedDocuments = await classifyDocuments(kycTransactionIds, {
      'archived_documents.is_video': flag.FALSE,
      'archived_documents.is_preview': flag.FALSE,
      'archived_documents.delete_flag': flag.FALSE,
    })

    if (!archivedDocuments) {
      return {
        status: false,
        data: message.server_error,
      }
    }

    const response = archivedDocuments.map((el) => {
      return {
        kyc_id: el.kyc_id,
        photo_type: el.photo_type,
        original_document: el.documents?.filter((originalDocument) => originalDocument.original_flag === flag.TRUE) || [],
        cropped_image: el.documents?.filter((croppedDocument) => croppedDocument.original_flag === flag.FALSE) || [],
      }
    })

    return {
      status: true,
      data: response,
    }
  } catch (error) {
    console.log(error)
    return {
      status: false,
      data: message.server_error,
    }
  }
}

const getKycProcessStatus = async (ekycId, ekycFaceId, ekycData) => {
  try {
    const data = {
      archived_documents: [],
      kyc_status_history: [],
      m_kyc_status: [],
      verified_all_block: true,
    }

    // GET KYC DOCUMENT
    const kycIds = [ekycId, ...(ekycFaceId ? [ekycFaceId] : [])]
    data.archived_documents = await classifyDocuments(kycIds, {
      'archived_documents.photo_process': flag.TRUE,
      'archived_documents.is_video': flag.FALSE,
      'archived_documents.is_preview': flag.FALSE,
      'archived_documents.original_flag': flag.FALSE,
    })

    if (!data.archived_documents) {
      return {
        status: false,
        data: message.server_error,
      }
    }

    // GET LIST KYC STATUS HISTORY
    data.kyc_status_history = await ekycRepository.getKycStatusHistory(ekycId)

    // VERIFY ALL BLOCK
    const kycEvaluation = await ekycRepository.getKycProcess({ id: ekycId })
    data.verified_all_block = verifiedAllBlock(kycEvaluation)

    // GET M_KYC_STATUS WITH USER SELECT KYC
    data.m_kyc_status = await getKycStatusMaster(ekycData)

    return {
      status: true,
      data: data,
    }
  } catch (error) {
    console.log(error)
    return {
      status: false,
      data: message.server_error,
    }
  }
}

// STEP 1
const getJudgmentBlock = (kycData, kycArchivedDocuments, kycFaceData = undefined, kycFaceArchivedDocuments = undefined) => {
  const defaultAlign = {
    'front': {
      'lower-left': {
        'confidence': 0,
        'x': 0,
        'y': 0,
      },
      'lower-right': {
        'confidence': 0,
        'x': 0,
        'y': 0,
      },
      'upper-left': {
        'confidence': 0,
        'x': 0,
        'y': 0,
      },
      'upper-right': {
        'confidence': 0,
        'x': 0,
        'y': 0,
      },
    },
  }

  const data = {
    ai_status: kycData.ai_status,
    ai_message: kycData.ai_message,
    ai_align: kycData.ai_specification ? JSON.parse(kycData.ai_specification)?.align : defaultAlign,
    admin_align: kycData.align ? JSON.parse(kycData.align) : null,
    summary_key: kycData.summary_key,
    enable_summary_url_flag: kycData.enable_summary_url_flag,
    step_check: kycData.step_check,
    kyc: [{
      ekyc_id: kycData.ekyc_id,
      access_start: kycData.access_start,
      access_end: kycData.access_end,
      authentication_type: kycData.user_authentication_type,
      document_type: kycData.user_document_type,
      // NOTE: UPDATE DTO
      documents: kycArchivedDocuments.filter((el) => el.original_flag),
      trimming_documents: kycArchivedDocuments.filter((el) => !el.original_flag),
    }],
  }

  if (kycFaceData && kycFaceArchivedDocuments) {
    const dataEkycFace = {
      ekyc_id: kycFaceData.ekyc_id,
      access_start: kycFaceData.access_start,
      access_end: kycFaceData.access_end,
      authentication_type: kycFaceData.authentication_type,
      document_type: kycFaceData.document_type,
      // NOTE: UPDATE DTO
      documents: kycFaceArchivedDocuments.filter((el) => el.original_flag),
      trimming_documents: kycFaceArchivedDocuments.filter((el) => !el.original_flag),
    }
    data.kyc.push(dataEkycFace)
  }
  return data
}

// STEP 2.1 + 2.2
const getTypeAndAuthenticityBlock = (kycData, mKycDocuments) => {
  const isValidInformation = kycData.user_check_method === ekycMethod.ID_Fact && kycData.ai_document_symbol !== ekycSymbol.BRE ?
    kycData.valid_expiry_flag && kycData.valid_id_flag :
    kycData.valid_expiry_flag

  const userSelectedDocument = mKycDocuments.user_kyc_documents.find((el) => el.id === kycData.user_selected_document_id)?.document_symbol
  const aiDetectedDocument = mKycDocuments.ai_kyc_documents.find((el) => el.id === kycData.ai_detected_document_id)?.document_symbol

  let typeDecision = 0
  if (userSelectedDocument === aiDetectedDocument) {
    typeDecision = 100
  } else {
    if (userSelectedDocument === ekycSymbol.MNN && aiDetectedDocument === ekycSymbol.MNU) {
      typeDecision = 100
    }
  }

  return {
    type_determination: {
      decision: typeDecision,
      user_selected_document_id: kycData.user_selected_document_id,
      ai_detected_document_id: kycData.ai_detected_document_id,
      admin_selected_document_id: kycData.admin_selected_document_id,
    },
    authenticity: {
      shape: {
        block_name: 'shape_verified',
        is_valid_shape: kycData.valid_shape_flag,
        is_valid_material: kycData.valid_material_flag,
        verified: kycData.shape_verified ?? -1,
      },
      info: {
        block_name: 'info_verified',
        is_valid_information: isValidInformation,
        verified: kycData.info_verified ?? -1,
      },
    },
  }
}

// STEP 2.3 (PoA does not have OCR of DoB)
const getIdentityBlock = async (kycData, ekycDocumentsAnalysis) => {
  const firstNameDoc = ekycDocumentsAnalysis.find((el) => el.type === 'first_name') || {}
  const lastNameDoc = ekycDocumentsAnalysis.find((el) => el.type === 'last_name') || {}
  const dObDoc = ekycDocumentsAnalysis.find((el) => el.type === 'date_of_birth') || {}

  const firstNameSimilarity = firstNameDoc.similarity || 0
  const lastNameSimilarity = lastNameDoc.similarity || 0
  const dObSimilarity = dObDoc.similarity || 0


  return {
    identity: {
      block_name: 'identity_verified',
      decision: kycData.user_check_method === ekycMethod.PoA ?
        (firstNameSimilarity + lastNameSimilarity) / 2 :
        (firstNameSimilarity + lastNameSimilarity + dObSimilarity) / 3,
      date_of_birth: kycData.user_check_method === ekycMethod.PoA ?
        undefined :
        {
          document: dObDoc.file_uri ? await signedUrlEkyc(null, dObDoc.file_uri) : null,
          ocr: dObDoc.ocr_result || null,
          similarity: dObSimilarity,
          input: kycData.date_of_birth ? moment(kycData.date_of_birth).format(dateFormat.DATE_1) : null,
        },
      first_name: {
        document: firstNameDoc.file_uri ? await signedUrlEkyc(null, firstNameDoc.file_uri) : null,
        ocr: firstNameDoc.ocr_result || null,
        similarity: firstNameSimilarity,
        input: kycData.first_name || null,
      },
      last_name: {
        document: lastNameDoc.file_uri ? await signedUrlEkyc(null, lastNameDoc.file_uri) : null,
        ocr: lastNameDoc.ocr_result || null,
        similarity: lastNameSimilarity || 0,
        input: kycData.last_name || null,
      },
      verified: kycData.identity_verified ?? -1,
    },
  }
}

// STEP 2.4 OF (ID + MNC) or STEP 2.5 OF (PoA)
const getValidityBlock = async (kycData, ekycDocumentsAnalysis) => {
  const issueDoc = ekycDocumentsAnalysis.find((el) => el.type === 'date_of_issue') || {}
  const expiryDoc = ekycDocumentsAnalysis.find((el) => el.type === 'date_of_expiry') || {}
  const idDoc = ekycDocumentsAnalysis.find((el) => el.type === 'id_number') || {}

  return {
    validity: {
      block_name: 'validity_verified',
      expiry: [ekycDocumentType.MNC_B, ekycDocumentType.PoA_B].includes(kycData.user_document_type) ?
        {
          is_valid_expiry: kycData.valid_expiry_flag,
          document: issueDoc.file_uri ? await signedUrlEkyc(null, issueDoc.file_uri) : null,
          ocr: issueDoc.ocr_result || null,
          input: kycData.date_of_issue ? moment(kycData.date_of_issue).format(dateFormat.DATE_1) : null,
        } :
        {
          is_valid_expiry: kycData.valid_expiry_flag,
          document: expiryDoc.file_uri ? await signedUrlEkyc(null, expiryDoc.file_uri) : null,
          ocr: expiryDoc.ocr_result || null,
          input: kycData.date_of_expiry ? moment(kycData.date_of_expiry).format(dateFormat.DATE_1) : null,
        },
      id: kycData.user_check_method === ekycMethod.ID_Fact && kycData.user_document_type !== ekycDocumentType.Identification_E ?
        {
          is_valid_id: kycData.valid_id_flag,
          document: idDoc.file_uri ? await signedUrlEkyc(null, idDoc.file_uri) : null,
          ocr: idDoc.ocr_result || null,
          input: kycData.identifier_number || null,
        } :
        undefined,
      verified: kycData.validity_verified ?? -1,
    },
  }
}

// STEP 2.4 OF PoA
const getAddressBlock = async (kycData, ekycDocumentsAnalysis) => {
  const postCodeDoc = ekycDocumentsAnalysis.find((el) => el.type === 'post_code') || {}
  const addressDoc = ekycDocumentsAnalysis.find((el) => el.type === 'address') || {}
  const postCodeSimilarity = postCodeDoc.similarity || 0
  const addressSimilarity = addressDoc.similarity || 0

  return {
    address: {
      block_name: 'address_verified',
      decision: (postCodeSimilarity + addressSimilarity) / 2,
      post_code: {
        document: postCodeDoc.file_uri ? await signedUrlEkyc(null, postCodeDoc.file_uri) : null,
        ocr: postCodeDoc.ocr_result || null,
        similarity: postCodeSimilarity,
        input: kycData.post_code || null,
      },
      address: {
        document: addressDoc.file_uri ? await signedUrlEkyc(null, addressDoc.file_uri) : null,
        ocr: addressDoc.ocr_result || null,
        similarity: addressSimilarity,
        input: kycData.address || null,
      },
      verified: kycData.address_verified ?? -1,
    },
  }
}

// STEP 2.5 OF (ID)
const getFacialBlock = async (kycData, ekycDocumentsAnalysis) => {
  const idFaceDoc = ekycDocumentsAnalysis.find((el) => el.type === 'id_face') || {}
  return {
    facial: {
      block_name: 'face_verified',
      decision: (kycData.confidence_aws_face + kycData.confidence_kairos_face) / 2,
      confidence_aws_face: kycData.confidence_aws_face || 0,
      confidence_kairos_face: kycData.confidence_kairos_face || 0,
      document: await signedUrlEkyc(null, idFaceDoc.file_uri),
      verified: kycData.face_verified ?? -1,
    },
  }
}

// STEP 2.6 OF (ID)
const getConsistencyBlock = (kycData, kycFaceData) => {
  return {
    consistency: {
      block_name: 'consistency_verified',
      info: [
        {
          ekyc_id: kycData.ekyc_id,
          access_ip: kycData.access_ip,
          access_agent: kycData.access_agent,
          access_cookie: kycData.access_cookie,
        },
        {
          ekyc_id: kycFaceData.ekyc_id,
          access_ip: kycFaceData.access_ip,
          access_agent: kycFaceData.access_agent,
          access_cookie: kycFaceData.access_cookie,
        },
      ],
      verified: kycData.consistency_verified ?? -1,
    },
  }
}

// STEP 2.7 OF (ID)
const getScreeningBlock = async (kycData, isCheckScreening) => {
  try {
    let transactionCaution = []
    let worldCheckResponse = {}

    const kycPerson = await usersPersonalRepository.getEkycPersonal(kycData.user_personal_id)

    const { first_name_romaji, last_name_romaji, date_of_birth } = kycPerson
    const name_romaji = `${first_name_romaji} ${last_name_romaji}`

    if (name_romaji && date_of_birth && isCheckScreening) {
      transactionCaution = await transactionCautionRepository.getTransactionCaution(name_romaji, date_of_birth)
      worldCheckResponse = await getWorldCheckOneCases(name_romaji, date_of_birth)
    }

    return {
      screening: {
        internal: {
          block_name: 'internal_verified',
          is_match_blacklist: kycData.match_blacklist_flag,
          verified: kycData.internal_verified ?? -1,
          transaction_caution: transactionCaution,
        },
        third_party: {
          block_name: 'third_party_verified',
          is_match_refinitiv_criminal: kycData.match_refinitiv_criminal_flag,
          verified: kycData.third_party_verified ?? -1,
          case_system_id: worldCheckResponse?.data?.case_system_id || null,
          cases: worldCheckResponse?.data?.data || [],
        },
      },
    }
  } catch (error) {
    console.log(error.message)
    return false
  }
}

const classifyDocuments = async (kycTransactionIds, payload) => {
  try {
    // GET KYC DOCUMENT BY CONDITION
    const kycDocuments = await ekycDocumentsRepository.getArchivedDocumentsByKyc(kycTransactionIds, payload)

    // SIGNED URL KYC DOCUMENT
    let signedUrlDocuments = []
    if (kycDocuments) {
      signedUrlDocuments = await Promise.all(
        kycDocuments.map(async (docs) => {
          return {
            ...docs,
            file_url: await signedUrlEkyc(docs.file_url),
          }
        }))
    }

    return kycTransactionIds.map((kycId) => {
      const { photo_type } = signedUrlDocuments.find((el) => el.kyc_transaction_id === Number(kycId)) || {}
      return {
        kyc_id: kycId,
        photo_type: photo_type,
        documents: signedUrlDocuments?.filter((el) => el.kyc_transaction_id === Number(kycId)) || [],
      }
    })
  } catch (error) {
    console.log(error)
    return false
  }
}

const signedUrlEkyc = async (url = null, uri = null) => {
  try {
    const key = url ?
      url.split('.amazonaws.com/')[1] :
      uri ?
        uri.split('s3://' + process.env.BUCKET + '/')[1] :
        ''
    const s3 = await connectS3()
    return await getSignedUrl(s3, new GetObjectCommand({
      Key: key,
      Bucket: process.env.BUCKET,
      ResponseCacheControl: 'no-store',
    }), {
      expiresIn: Number(timeExpires.SIGNED_URL) || 3600,
    })
  } catch (error) {
    console.log(error.message)
    return false
  }
}

const verifiedAllBlock = (ekycEvaluation) => {
  const checkMethod = ekycEvaluation.user_check_method
  const hasUnverified = KYC_PROCESS_STEP[checkMethod]
    .map((el) => el.name)
    .some((el) => ekycEvaluation[el] === 0 || ekycEvaluation[el] === -1)

  const undefinedSymbol = ekycEvaluation.admin_selected_document_id === KYC_DOCUMENT_ID_UNDEFINED

  return !(hasUnverified || undefinedSymbol)
}

const getKycStatusMaster = async (ekycData) =>{
  try {
    const { ja_document_name, en_document_name, cn_document_name, kr_document_name, photo_type, site_id } = ekycData
    // Get data form m_status
    const statusClass = statusClassConstant.DOCUMENT_STATUS.toString()
    const [getKycStatus, settingNotificationMail] = await Promise.all([
      statusMasterRepository.getListStatusByClass([statusClass]),
      siteSettingRepository.getSiteSetting({
        setting_class: settingClass.SEND_MAIL_SETTING,
        site_id: site_id,
      }, [statusClassConstant.DOCUMENT_STATUS]),
    ])

    return getKycStatus.filter((obj) => obj.status_label_number === flag.FALSE).map((statusMaster) => {
      const status_labels = getKycStatus.filter((el) => el.status_code === statusMaster.status_code && Number(el.status_label_number) !== flag.FALSE)
        .map((el) => {
          return {
            ...el,
            ja_status_label_detail: el.ja_status_label_detail
              .replace(/{{document_name}}/g, ja_document_name)
              .replace(/{{photo_type}}/g, photo_type),
            en_status_label_detail: el.en_status_label_detail
              .replace(/{{document_name}}/g, en_document_name)
              .replace(/{{photo_type}}/g, photo_type),
            cn_status_label_detail: el.cn_status_label_detail
              .replace(/{{document_name}}/g, cn_document_name)
              .replace(/{{photo_type}}/g, photo_type),
            kr_status_label_detail: el.kr_status_label_detail
              .replace(/{{document_name}}/g, kr_document_name)
              .replace(/{{photo_type}}/g, photo_type),
          }
        })

      const { display_flag, enable_flag, default_value } =
      settingNotificationMail.find((el) => Number(el.status_code) === Number(statusMaster.status_code)) || {}
      const send_mail_display_class = renderSendMailDisplayClass(display_flag, enable_flag)

      return {
        ...statusMaster,
        send_mail_display_class: send_mail_display_class || send_mail_display_class === 0 ? send_mail_display_class : undefined,
        default_send_mail_value: parseInt(default_value) || parseInt(default_value) === 0 ? parseInt(default_value) : undefined,
        status_labels: status_labels,
      }
    })
  } catch (err) {
    console.log(err)
    return []
  }
}

const renderMasterKycDocuments = async (userAuthenticationType, userDocumentType) => {
  try {
    const masterKycDocuments = await kycDocumentRepository.getKycDocuments({ kyc_type: ekycType.EKYC })

    const cloneMasterKycDocuments = JSON.parse(JSON.stringify(masterKycDocuments))

    const userKycDocuments = []
    cloneMasterKycDocuments.forEach((el) => {
      if (el.authentication_type === ekycAuthenticationType.Identification_Auth) {
        const find = userKycDocuments.find((doc) => doc.document_type === el.document_type)
        if (find) {
          find.ja_document_name = `${find.ja_document_name} / ${el.ja_document_name}`
          find.en_document_name = `${find.en_document_name} / ${el.en_document_name}`
          find.cn_document_name = `${find.cn_document_name} / ${el.cn_document_name}`
          find.kr_document_name = `${find.kr_document_name} / ${el.kr_document_name}`
        } else {
          userKycDocuments.push(el)
        }
      } else if ([ekycAuthenticationType.MNC_Auth, ekycAuthenticationType.PoA_Auth].includes(el.authentication_type)) {
        userKycDocuments.push(el)
      }
    })

    const aiKycDocuments = JSON.parse(JSON.stringify(masterKycDocuments))

    const adminKycDocuments = []
    masterKycDocuments.forEach((el) => {
      if (adminKycDocuments.find((doc1) => doc1.document_symbol === el.document_symbol)) return

      if (el.document_symbol === ekycSymbol.HIN && el.document_type !== userDocumentType) return

      if (el.authentication_type === userAuthenticationType) {
        adminKycDocuments.push(el)
      }
    })

    return {
      user_kyc_documents: userKycDocuments,
      ai_kyc_documents: aiKycDocuments,
      admin_kyc_documents: adminKycDocuments,
    }
  } catch (error) {

  }
}

module.exports = {
  getKycProcess,
  getKycProcessCheck,
  signedUrlEkyc,
  verifiedAllBlock,
}
