'use strict'

const {
  profileStatus,
  commonSiteId,
  regCategory,
  errorMessageCodeConstant,
} = require('constant')

/* function */
const utility = require('utility')

/* DB */
const { errorLogRepository,
  usersBasicDataRepository, usersPersonalRepository, fxsXemAddDataRepository,
  statusHistoryRepository, supportHistoryRepository, usersCorporateRepository, emailHistoryRepository,
} = require('repository')

const getProfileInfo = async (event) => {
  try {
    const userId = event.pathParameters.userId

    const queryString = event.queryStringParameters || {}

    const user = await usersBasicDataRepository.getDetailUserById(userId)

    if (!user) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // Get staff display date time and handle timezone
    const staffId = await utility.getUserIdByToken(event)
    const staffInfo = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': staffId })
    const _renderDate = (datetime) => {
      return utility.getDateTimeFormatted(
        datetime,
        staffInfo.display_date_time,
        null,
        ' ',
      ).trim()
    }

    let profile = {}

    switch (queryString.typeTab) {
      case 'personal':
        if (user.reg_category === regCategory.PERSONAL) {
          // get personal
          profile = await usersPersonalRepository.getPersonalInfo(userId)

          if (!profile.date_of_birth) {
            profile.profile_status = profileStatus.UNREGISTER
          } else {
            profile.date_of_birth = _renderDate(profile.date_of_birth)
            profile.profile_status = profileStatus.REGISTER
          }
        }
        break
      case 'fxs_xem_add':
        profile = await fxsXemAddDataRepository.getTradingAccountFxsInfo(userId)
        break
      case 'history':
        [profile.account_status_history, profile.support_history] = await Promise.all([
          statusHistoryRepository.getAccountStatusHistoriesByUserId(userId),
          supportHistoryRepository.getSupportHistoriesByUserId(userId),
        ])
        // get email history
        const listEmailHistory = await emailHistoryRepository.getEmailHistoryByUser(userId)

        profile.email_history = listEmailHistory
        break
    }

    let profileStatusParameter

    // Handle case user corporate
    if (user.reg_category === regCategory.CORPORATE) {
      let data
      switch (queryString.typeTab) {
        case 'corporate':
          data = await usersCorporateRepository.getCorporateInfo(userId)
          break
        case 'transaction_person':
          data = await usersPersonalRepository.getTransactionPersonInfo(userId)
          break
        case 'representative_person':
          data = await usersPersonalRepository.getRepresentativePersonInfo(userId)
          break
        case 'beneficial_owner':
          const [nationalInfo, shareholderPersonData, shareholderCorporateData, representData] = await Promise.all([
            usersCorporateRepository.getNationalInstitutionInfo(userId),
            usersPersonalRepository.getBeneficialOwnerInfo(userId),
            usersCorporateRepository.getShareholderCorporate(userId),
            usersPersonalRepository.getRepresentShareholderPerson(userId),
          ])

          profileStatusParameter = nationalInfo

          data = {
            corporate_id: nationalInfo?.corporate_id ? nationalInfo.corporate_id : null,
            is_national_institution: (nationalInfo?.is_national_institution ||
            nationalInfo?.is_national_institution === 0) ? nationalInfo.is_national_institution : null,
            number_shareholders_person: (nationalInfo?.number_shareholders_person || nationalInfo?.number_shareholders_person === 0) ?
              nationalInfo.number_shareholders_person : null,
            number_shareholders_corporate: (nationalInfo?.number_shareholders_corporate || nationalInfo?.number_shareholders_corporate === 0) ?
              nationalInfo.number_shareholders_corporate : null,
          }

          data.shareholder_person = shareholderPersonData.map((el) => {
            return {
              ...el,
              date_of_birth: _renderDate(el.date_of_birth),
              status_items: JSON.parse(el.status_items),
            }
          })

          const mapData = []
          data.shareholder_corporate = shareholderCorporateData.map((corporate) => {
            representData.map((represent) => {
              if (corporate.corporate_id === represent.corporate_id) {
                corporate.date_of_establish = _renderDate( corporate.date_of_establish)
                represent.date_of_birth = _renderDate( represent.date_of_birth )
                const data = {
                  corporate: corporate,
                  represent: {
                    ...represent,
                    like_shareholder_corporate: corporate.like_shareholder_corporate,
                  },
                }
                mapData.push(data)
              }
            })
          })

          data.shareholder_corporate = mapData

          break
      }

      if (data) {
        // get profile status
        profile.profile_status = getCorporateStatus(
          queryString.typeTab === 'beneficial_owner' && user.reg_category === regCategory.CORPORATE ?
            profileStatusParameter :
            data,
        )

        // check profile has completed setting or not
        profile[queryString.typeTab] = {}
        if (profile.profile_status === 2) {
          if (queryString.typeTab === 'corporate') {
            data.date_of_establish = _renderDate(data.date_of_establish)
          } else if ( queryString.typeTab !== 'beneficial_owner') {
            data.date_of_birth = _renderDate(data.date_of_birth)
          }
          profile[queryString.typeTab] = data
        }
      }
    }

    return utility.createResponse(true, profile)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}


const getCorporateStatus = (data) => {
  let status
  if (!data) {
    status = profileStatus.UNREGISTER
  }

  if (data && data.site_id === commonSiteId.FXT) {
    if (data.step_setting > 2) {
      status = profileStatus.REGISTER
    } else {
      status = profileStatus.UNREGISTER
    }
  }
  if (data && data.site_id === commonSiteId.ICPAY) {
    if (data.step_setting > 3) {
      status = profileStatus.REGISTER
    } else {
      status = profileStatus.UNREGISTER
    }
  }
  return status
}

module.exports = {
  getProfileInfo,
}
