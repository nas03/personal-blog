const { getListWorldCheck, getDetailsWorldCheck, createScreeningCase, onGoingScreeningCase } = require('./world_check_deps/world_check_one_api')
const { worldCheckScreeningCasesRepository, errorLogRepository } = require('repository')

const { message, errorMessageCodeConstant } = require('constant')
const { createResponse } = require('utility')

async function getWorldCheckOneCases(name_romaji, date_of_birth) {
  try {
    // CHECK IN DB IF THERE IS DUPLICATED CASES
    const existingWorldCheck = await worldCheckScreeningCasesRepository.getExistingWorldCheck(name_romaji, date_of_birth)
    let caseSystemId
    if (existingWorldCheck) {
      caseSystemId = existingWorldCheck.case_system_id
    } else {
      // CREATE NEW CASE
      const result = await createScreeningCase(name_romaji, date_of_birth)
      caseSystemId = result.caseSystemId

      // ON GOING SCREENING
      await onGoingScreeningCase(caseSystemId)

      // SAVE RESULT TO DB
      await worldCheckScreeningCasesRepository.createNewWorldCheck(name_romaji, date_of_birth, result.caseSystemId)
    }

    // GET LIST WORLD CHECK
    const worldCheckData = await getListWorldCheck(caseSystemId)
    const modifyWorldCheckData = worldCheckData.map((el) => {
      const dobEvent = el.events?.find((event) => event.type === 'BIRTH') || null
      const nationality = el.countryLinks?.find((countryLink) => countryLink.type === 'NATIONALITY') || null
      const location = el.countryLinks?.find((countryLink) => countryLink.type === 'LOCATION') || null
      return {
        reference_id: el.referenceId,
        name: el.primaryName || null,
        match_score: el.matchScore || null,
        matched_alias: el.matchedTerm || null,
        date_of_birth: dobEvent || null,
        gender: el.gender,
        nationality: nationality?.countryText || null,
        location: location?.countryText || null,
        pep_status: el.pepStatus || null,
        category: el.category || null,
        registration_date: el.entityCreationDate || null,
        update_date: el.entityModificationDate || null,
      }
    })

    return {
      status: true,
      data: {
        case_system_id: caseSystemId || null,
        data: modifyWorldCheckData,
      },

    }
  } catch (e) {
    console.log(e)
    return {
      status: false,
      data: message.server_error,
    }
  }
}

async function getCaseDetails(event) {
  try {
    const ref_id = event.pathParameters.ref_id
    if (!ref_id) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // CALL API TO RETRIEVE CASE DETAILS
    const response = await getDetailsWorldCheck(ref_id)
    const dobEvent = response.events?.find((event) => event.type === 'BIRTH') || null
    const nationality = response.countryLinks?.find((countryLink) => countryLink.type === 'NATIONALITY') || null
    const residence = response.countryLinks?.find((countryLink) => countryLink.type === 'LOCATION') || null
    const name = response.names?.find((name) => name.type === 'PRIMARY') || null
    const matchedData = {
      name: name?.fullName || null,
      gender: response.gender,
      date_of_birth: dobEvent || null,
      nationality: nationality?.countryText || null,
      residence: residence?.countryText || null,
    }
    const keyData = {
      age: response?.age || null,
      pob: dobEvent?.address || null,
      category: response?.category || null,
    }
    const identityDocuments = response.identityDocuments?.map((identityDocument) => {
      return {
        documentName: identityDocument?.locationType?.name || null,
        country: identityDocument?.locationType?.country?.name || null,
        documentNumber: identityDocument?.number || null,
        expiryDate: identityDocument?.expiryDate || null,
        issueDate: identityDocument?.issueDate || null,
      }
    }) || []

    const locationDetails = response?.addresses?.map((address) => {
      return {
        street: address?.street,
        city: address?.city,
        country: address?.country?.name,
        region: address?.region,
        postal_code: address?.postCode,
      }
    }) || []
    const aliases = response.names?.reduce((acc, alias) => {
      const { type, fullName, originalScript, languageCode } = alias
      if (type === 'AKA') {
        acc.aliases.push(fullName)
      } else if (type === 'LOW_QUALITY_AKA') {
        acc.low_quality_aliases.push(originalScript)
      } else if (type === 'NATIVE_AKA') {
        acc.native_aka.push({
          language: languageCode?.name,
          name: originalScript,
        })
      }
      return acc
    }, { aliases: [], low_quality_aliases: [], native_aka: [] }) || {
      aliases: [],
      low_quality_aliases: [],
      native_aka: [],
    }
    const details = response.details?.reduce((acc, detail) => {
      const { detailType, text } = detail
      if (detailType === 'BIOGRAPHY') {
        acc.biography = text
      } else if (detailType === 'IDENTIFICATION') {
        acc.identification = text
      } else if (detailType === 'REPORTS') {
        acc.report = text
      }
      return acc
    }, { biography: [], identification: [], report: [] }) || {
      biography: [],
      identification: [],
      report: [],
    }
    const webLinks = response.weblinks?.map((webLink) => {
      const dateTag = webLink.tags?.find((tag) => tag.startsWith('DATE:')) || null
      return {
        uri: webLink.uri,
        date: dateTag ? dateTag.split(':')[1] : null,
      }
    }) || []
    const responsePayload = {
      matchedData,
      keyData,
      locationDetails,
      details,
      aliases,
      webLinks,
      identityDocuments,
      associates: response.associates,
      ref_id,
    }
    return createResponse(true, responsePayload)
  } catch (error) {
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  getWorldCheckOneCases,
  getCaseDetails,
}
