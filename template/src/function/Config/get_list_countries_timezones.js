'use strict'

const countryRepository = require('repository').countryRepository
const timezonesRepository = require('repository').timezonesRepository
const errorLogRepository = require('repository').errorLogRepository
const { errorMessageCodeConstant, dataStatus } = require('constant')
const utility = require('utility')
const _ = require('lodash')

module.exports.getListCountriesTimezones = async (event) => {
  try {
    const countries = await countryRepository.getAll()
    if (!countries.length) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
    }
    const timezones = await timezonesRepository.getTimeZones()
    if (timezones.status === dataStatus.FAIL) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
    }

    return utility.createResponse(true, {
      countries: countries,
      timezones: timezones.data.map((el) => _.omit(el, 'timezone_offset')),
    })
  } catch (error) {
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

