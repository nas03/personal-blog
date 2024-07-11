/* library */
const moment = require('moment')

/* constant */
const { dateFormat, aiStatus, ekycKeywords, tokenAuthorityClass, ekycType, errorMessageCodeConstant, ekycSymbol } = require('constant')

/* db */
const {
  ekycRepository,
  ekycDocumentsRepository,
  ekycDocumentsAnalysisRepository,
  errorLogRepository,
  prefecturesRepository,
  usersPersonalRepository,
  kycDocumentRepository,
  transactionCautionRepository,
} = require('repository')

/* func */
const utility = require('utility')
const { awsFaceDetection } = require('helper').aws
const { kairosFaceDetection } = require('helper').kairos
const { signedUrlEkyc } = require('./kyc_process')
const { getWorldCheckOneCases } = require('./world_check')

const newCreateDocumentAnalysis = async (event) => {
  try {
    const body = JSON.parse(event.body)
    console.log(body)
    const {
      session_id,
      status,
      message: ai_message,
      recognition_symbol,
      chosen_symbol,
      confidence,
      is_valid_shape,
      // is_valid_material,
      is_valid_id,
      is_valid_expiry,
      aspect_ratio,
      valid_frame,
      valid_video_idx,
      align,
      text_recognition,
      documents,
    } = body
    if (!session_id) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    const isExpiredSession = await isExpiredTime(session_id)
    const kycPerson = await usersPersonalRepository.getEkycPersonal(isExpiredSession.ekyc.personal_id)
    event.user_id = kycPerson?.user_id || null
    if (isExpiredSession.status || isExpiredSession === false) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.CREATE_DOCUMENT_ANALYSIS.SESSION_EXPIRED])
    }


    let payloadEkyc
    let payloadEkycDocumentAnalysis
    const aiDetectSymbols = [ekycSymbol.ADL, ekycSymbol.PAS, ekycSymbol.MNU, ekycSymbol.FRE, ekycSymbol.PRC, ekycSymbol.MNN]

    // PARAM CHANGE WHEN ADMIN CHANGE SYMBOL
    if (status !== aiStatus.SUCCESS) {
      const isValidShape = aiDetectSymbols.includes(isExpiredSession.ekyc?.document_symbol) ? is_valid_shape : 1
      payloadEkyc = {
        valid_shape_flag: isValidShape,
        valid_material_flag: 1,
      }
      payloadEkycDocumentAnalysis = []
    } else {
      let isValidShape = 0
      const aiDetectSymbols = [ekycSymbol.ADL, ekycSymbol.PAS, ekycSymbol.MNU, ekycSymbol.FRE, ekycSymbol.PRC]

      if (chosen_symbol) {
        isValidShape = aiDetectSymbols.includes(chosen_symbol) ? is_valid_shape : 1
      } else {
        isValidShape = aiDetectSymbols.includes(recognition_symbol) ? is_valid_shape : 1
      }

      payloadEkyc = {
        valid_shape_flag: isValidShape,
        valid_material_flag: 1,
        valid_expiry_flag: is_valid_expiry,
        valid_id_flag: is_valid_id,
        aspect_ratio: aspect_ratio,
      }
      payloadEkycDocumentAnalysis = await Promise.all(documents.map(async (el) => {
        const { file_uri, type, ocr } = el
        let percent = 0
        if (type === 'id_face') {
          const ekycFace = await ekycRepository.getEkycFace(isExpiredSession.ekyc.id)
          if (!ekycFace) return
          const ekycFaceDocuments = await ekycDocumentsRepository.getEkycDocuments({
            'ad.kyc_transaction_id': ekycFace.id,
            'ad.is_preview': 0,
            'ad.is_video': 0,
            'ad.original_flag': 1,
          })

          const [awsResult, kairosResult] = await Promise.all([
            awsFaceAnalysis(ekycFaceDocuments, file_uri, 0),
            kairosFaceAnalysis(ekycFaceDocuments, file_uri),
          ])
          payloadEkyc.confidence_aws_face = awsResult
          payloadEkyc.confidence_kairos_face = kairosResult
        }

        if (['first_name', 'last_name', 'date_of_birth', 'post_code', 'address'].includes(type)) {
          percent = await compareOCRnDatabase(type, ocr, kycPerson)
        }

        return {
          kyc_transaction_id: isExpiredSession.ekyc.id,
          file_uri: file_uri || null,
          type: type || null,
          ocr_result: ocr || null,
          similarity: percent,
        }
      }))
    }

    // PARAM NOT CHANGE. ONLY SAVE ONCE TIME
    if (!chosen_symbol) {
      if (recognition_symbol) {
        const kycDocuments = await kycDocumentRepository.getKycDocuments({
          document_symbol: recognition_symbol,
          kyc_type: ekycType.EKYC,
        })
        payloadEkyc.ai_detected_document_id = kycDocuments[0]?.id
      }
      payloadEkyc.confidence_ai_detected = confidence
      payloadEkyc.ai_specification = JSON.stringify({
        valid_frame: valid_frame,
        valid_video_idx: valid_video_idx,
        align: align,
        text_recognition: text_recognition,
      })
    }

    // PARAM CHANGE EVERY TIME ADMIN SELECT ALIGN OR SELECT DOCUMENT TYPE
    payloadEkyc.ai_status = status
    payloadEkyc.ai_message = ai_message
    try {
      const [transactionCaution, worldCheckResponse] = await Promise.all([
        transactionCautionRepository.getTransactionCaution(`${kycPerson.first_name_romaji} ${kycPerson.last_name_romaji}`, kycPerson.date_of_birth),
        getWorldCheckOneCases(`${kycPerson.first_name_romaji} ${kycPerson.last_name_romaji}`, kycPerson.date_of_birth),
      ])
      payloadEkyc.match_blacklist_flag = transactionCaution.length ? true : false
      payloadEkyc.match_refinitiv_criminal_flag = worldCheckResponse?.data?.data?.length ? true : false
    } catch (error) {
      console.log(error)
    }

    console.log('Payload Ekyc ai_specification', JSON.stringify(payloadEkyc.ai_specification))

    await ekycDocumentsAnalysisRepository.createEkycDocumentAnalysis(
      isExpiredSession.ekyc.id,
      payloadEkyc,
      payloadEkycDocumentAnalysis,
    )

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const isExpiredTime = async (request_ai_key) => {
  const ekyc = await ekycRepository.getListEkyc({
    'ta.activation_key': request_ai_key,
    'ta.action_class': tokenAuthorityClass.EKYC_AI,
  })

  if (!ekyc) return { status: true }

  // check the time has expired
  const isExpired =
        moment().utc().format(dateFormat.DATE_TIME) >
        moment(ekyc[0].request_ai_expired).format(dateFormat.DATE_TIME)

  return { status: isExpired, ekyc: ekyc[0] }
}

// -------------Compare OCR vs Database-------------//
const compareOCRnDatabase = async (type, ocrResult, ekycPerson) => {
  try {
    let percent = 0

    switch (type) {
      case 'date_of_birth':
        percent = await compareDoB(ocrResult, ekycPerson)
        break
      case 'first_name':
      case 'last_name':
        percent = await compareName(ocrResult, ekycPerson, type)
        break
      case 'post_code':
        percent = await comparePostCode(ocrResult, ekycPerson)
        break
      case 'address':
        percent = await compareAddress(ocrResult, ekycPerson)
        break
      default:
        break
    }
    return percent
  } catch (error) {
    console.log(error)
    return 0
  }
}

const compareDoB = async (ocrResult, personalData) => {
  try {
    const dateDB = moment(personalData.date_of_birth).format(dateFormat.DATE_1)
    console.log('DOB: ', dateDB, 'OCR: ', ocrResult)
    return compareText(ocrResult, dateDB )
  } catch (error) {
    console.log(error)
    return 0
  }
}

const compareName = async (ocrResult, personalData, type) => {
  try {
    let nameDB = ''
    const isJapaneseText = ekycKeywords.common.regex.JAPANESE_TEXT.test(ocrResult) || ekycKeywords.common.regex.KANJI.test(ocrResult)

    switch (type) {
      case 'first_name':
        if (isJapaneseText) {
          nameDB = personalData.first_name_kanji ?
            personalData.first_name_kanji.replace(ekycKeywords.common.regex.SPACE, ekycKeywords.common.text.NONE) : ''
        } else {
          nameDB = personalData.first_name_romaji ?
            personalData.first_name_romaji.replace(ekycKeywords.common.regex.SPACE, ekycKeywords.common.text.NONE) : ''
        }
        break
      case 'last_name':
        if (isJapaneseText) {
          nameDB = personalData.last_name_kanji ?
            personalData.last_name_kanji.replace(ekycKeywords.common.regex.SPACE, ekycKeywords.common.text.NONE) : ''
        } else {
          nameDB = personalData.last_name_romaji ?
            personalData.last_name_romaji.replace(ekycKeywords.common.regex.SPACE, ekycKeywords.common.text.NONE) : ''
        }
        break
      default:
        nameDB = ''
        break
    }
    console.log('Name: ', nameDB, 'OCR: ', ocrResult)
    return compareText(ocrResult, nameDB )
  } catch (error) {
    console.log(error)
    return 0
  }
}

const comparePostCode = async (ocrResult, personalData) => {
  try {
    const postCodeDb = personalData.zip_postal_code || ''
    // Replace '-' before compare
    console.log('Postcode: ', postCodeDb, 'OCR: ', ocrResult.replace(/-/g, ''))
    return compareText(ocrResult.replace(/-/g, ''), postCodeDb )
  } catch (error) {
    console.log(error)
    return 0
  }
}

const compareAddress = async (ocrResult, personalData) => {
  try {
    let province
    if (personalData.country_id !== 113) {
      province = personalData.state_province
    } else {
      const prefectures = await prefecturesRepository.getPrefecture({ id: personalData.state_province })
      province = prefectures.ja_name
    }
    const city = personalData.city
    const address_line_1 = personalData.address_line_1
    const address_line_2 = personalData.address_line_2 || ''

    const addressDB = `${province}${city}${address_line_1}${address_line_2}`
    console.log('Address: ', addressDB, 'OCR: ', ocrResult)
    return compareText(ocrResult, addressDB )
  } catch (error) {
    console.log(error)
    return 0
  }
}

const compareText = (source, target) => {
  return (
    source
      .toLowerCase()
      .replace(ekycKeywords.common.regex.SPACE, ekycKeywords.common.text.NONE) ===
    target
      .toLowerCase()
      .replace(ekycKeywords.common.regex.SPACE, ekycKeywords.common.text.NONE) ?
      100 :
      0)
}

// -------------Face API-------------//
const awsFaceAnalysis = async (ekycFaceDocuments, sourceUri, threshold) => {
  try {
    const source = sourceUri.split('s3://' + process.env.BUCKET + '/')[1]
    const similarityArr = []
    await Promise.all(
      ekycFaceDocuments.map(async (el) => {
        const target = el.file_url.split('.amazonaws.com/')[1]
        const aws = await awsFaceDetection(source, target, threshold)
        const similarity = isNaN(aws.data[0].similarity) ?
          0 :
          aws.data[0].similarity
        similarityArr.push(similarity)
      }),
    )
    // Average
    console.log('AWS', similarityArr)
    return similarityArr.length ?
      similarityArr.reduce((a, b) => a + b, 0) / similarityArr.length :
      0
  } catch (err) {
    console.error(err.message)
    return 0
  }
}

const kairosFaceAnalysis = async (ekycFaceDocuments, sourceUri) => {
  try {
    const source = await signedUrlEkyc(null, sourceUri)
    const similarityArr = []
    await Promise.all(
      ekycFaceDocuments.map(async (el) => {
        const target = await signedUrlEkyc(el.file_url, null)
        const resKairos = await kairosFaceDetection(source, target)
        const similarity = isNaN(resKairos) ? 0 : resKairos
        similarityArr.push(similarity)
      }),
    )
    // Average
    console.log('Kairos', similarityArr)
    return similarityArr.length ?
      similarityArr.reduce((a, b) => a + b, 0) / similarityArr.length :
      0
  } catch (err) {
    console.error(err.message)
    return 0
  }
}

module.exports = {
  newCreateDocumentAnalysis,
}
