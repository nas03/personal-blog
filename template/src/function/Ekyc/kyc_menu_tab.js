/* FUNCTION */
const utility = require('utility')

/* CONSTANT */
const { kycTarget, flag, errorMessageCodeConstant } = require('constant')

/* DATABASE */
const { errorLogRepository, ekycRepository, usersCorporateRepository, usersPersonalRepository } = require('repository')

const getKycMenuTab = async (event) => {
  try {
    let { user_id } = event.queryStringParameters || {}
    user_id = parseInt(user_id)

    // FIELD CANNOT BLANK
    if (!user_id) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    const kycInfoByPersonal = await getKycInfoByPersonal(user_id)

    const response = {
      corporate_flag: kycInfoByPersonal.corporate_flag,
      personal_info: kycInfoByPersonal.personal_info.map((personal) =>{
        return {
          personal_id: personal.personal_id,
          kyc_target: personal.kyc_target,
          kyc_info: personal.kyc_info,
        }
      }),
    }

    return utility.createResponse(true, response)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getKycInfoByPersonal = async (user_id) => {
  // GET KYC INFO, PERSONAL INFO, CORPORATE INFO
  const [personals, kycTransaction, mainCorporate] = await Promise.all([
    usersPersonalRepository.getPersonInfoByUserId(user_id),
    ekycRepository.getKycConfirmed(user_id),
    usersCorporateRepository.getCorporates({ user_basic_data_id: user_id, beneficial_owner: flag.FALSE }),
  ])

  const mainCorporateId = mainCorporate[0]?.id || null
  const corporateFlag = mainCorporateId ? true : false
  // GET KYC INFO BY PERSONAL
  const kycInfoByPersonal = personals.map((personal) => {
    const kycTarget = _renderKycTarget(
      mainCorporateId,
      personal.user_corporate_id,
      personal.transaction_person,
      personal.representative_person,
      personal.beneficial_owner,
    )

    // GET COUNTRY INFO OF PERSONAL
    const country = {
      country_name: personal.country_name,
      file_name: personal.file_name,
      japanese_notation: personal.japanese_notation,
      english_notation: personal.english_notation,
      korean_notation: personal.korean_notation,
      chinese_notation: personal.chinese_notation,
    }

    // GET PERSONAL AVATAR
    let avatar = null
    if (personal.like_transaction_person === 1 || personal.transaction_person === 1 ||
      (personal.transaction_person === 0 && personal.representative_person === 0 && personal.beneficial_owner === 0)
    ) {
      avatar = {
        profile_picture_url: personal.profile_picture_url,
        profile_picture_name: personal.profile_picture_name,
        profile_picture_color: personal.profile_picture_color,
      }
    }

    const kycInfo = kycTransaction.filter((kyc) => kyc.personal_id === personal.id)
      .map((kyc) => {
        return {
          kyc_id: kyc.kyc_id,
          kyc_id_face: kyc.kyc_id_face,
          personal_id: kyc.personal_id,
          check_method: kyc.check_method,
          authentication_type: kyc.authentication_type,
          document_type: kyc.document_type,
          status_code: kyc.status_code,
          en_status_name: kyc.en_status_name,
          ja_status_name: kyc.ja_status_name,
          cn_status_name: kyc.cn_status_name,
          kr_status_name: kyc.kr_status_name,
          ja_status_label_name: kyc.ja_status_label_name,
          en_status_label_name: kyc.en_status_label_name,
          cn_status_label_name: kyc.cn_status_label_name,
          kr_status_label_name: kyc.kr_status_label_name,
          status_label_frame_color: kyc.status_label_frame_color,
          status_label_paint_color: kyc.status_label_paint_color,
          status_label_text_color: kyc.status_label_text_color,
          status_label_message: kyc.status_label_message,
          access_start: kyc.access_start,
          access_end: kyc.access_end,
          frame_color: kyc.frame_color,
          paint_color: kyc.paint_color,
          text_color: kyc.text_color,
          ts_update: kyc.ts_update,
          operator_action: kyc.staff_name,
          kyc_target: kycTarget,
          kyc_target_name: personal.name_romaji,
        }
      })

    return {
      personal_id: personal.id,
      kyc_target: kycTarget,
      kyc_info: corporateFlag ? kycInfo?.splice(0, 5) : kycInfo,
      country,
      avatar,
    }
  })

  const response = {
    corporate_flag: corporateFlag,
    personal_info: kycInfoByPersonal,
  }
  return response
}

const _renderKycTarget = (
  main_corporate_id,
  corporate_id,
  transaction_person,
  representative_person,
  beneficial_owner,
) => {
  if (beneficial_owner) {
    return kycTarget.BENEFICIAL_OWNER
  } else if (!corporate_id) {
    return kycTarget.PERSON_APPLICANT
  } else if (transaction_person === 0 && representative_person === 1) {
    return main_corporate_id === corporate_id ?
      kycTarget.PERSON_REPRESENTATIVE :
      kycTarget.BENEFICIAL_OWNER
  } else if (transaction_person === 1 && representative_person === 0) {
    return kycTarget.PERSON_TRANSACTION
  } else {
    return ''
  }
}


module.exports = {
  getKycMenuTab,
  getKycInfoByPersonal,
}
