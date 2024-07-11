/* constant */
const { statusCode, statusClassConstant, actionMethod, flag, commonSiteId,
  emailDetailContentId, approvedStatusItems, errorMessageCodeConstant } = require('constant')

/* function */
const utility = require('utility')

const { mailer } = require('helper')

/* DB */
const { usersBasicDataRepository, errorLogRepository, statusHistoryRepository, usersPersonalRepository,
  statusMasterRepository, usersCorporateRepository, emailDetailContentRepository, emailHistoryRepository } = require('repository')

const changeAccountStatusCode = async (event) => {
  try {
    const accountId = event.pathParameters.accountId
    const staff_id = utility.getUserIdByToken(event)

    const { account_status_code, account_status_label_number, send_mail_approved } = JSON.parse(event.body)

    // validation
    if (!accountId ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }
    // get user
    const userInfo = await usersBasicDataRepository.getUserInfo(accountId)
    event.user_id = userInfo?.id || null
    if (!account_status_code ||
      ([statusCode.PROCESSING, statusCode.PENDING, statusCode.CLOSED].includes(account_status_code) && !account_status_label_number)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // check status label number
    if ([statusCode.PROCESSING, statusCode.PENDING, statusCode.CLOSED].includes(account_status_code)) {
      const isCheckLabel = await statusMasterRepository.checkExistStatusLabel(account_status_code, account_status_label_number)
      if ( !isCheckLabel ) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
      }
    }

    if ( !userInfo || userInfo.account_status_code === statusCode.CLOSED ||
      ![statusCode.PROCESSING, statusCode.APPROVED, statusCode.PENDING, statusCode.CLOSED].includes(account_status_code) ||
      account_status_code === statusCode.ACTIVATED ||
      (userInfo.account_status_code === account_status_code && userInfo.status_label_number === account_status_label_number) ||
      (userInfo.account_status_code === statusCode.APPROVED &&
        ![statusCode.PENDING, statusCode.CLOSED].includes(account_status_code) )
    ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    const payloadUser = {
      user_id: accountId,
      staff_id: staff_id,
      new_account_status: account_status_code,
      current_account_status: userInfo.account_status_code,
      site_id: userInfo.site_id,
      current_ekyc_level: userInfo.ekyc_level,
    }

    let personals
    let corporates
    let updatePersonals = []
    let updateCorporates = []
    // check and update profile
    if ( account_status_code === statusCode.APPROVED ) {
      if ( userInfo.reg_category === flag.TRUE ) {
        if (
          (userInfo.site_id === commonSiteId.FXT && userInfo.step_setting === 3) ||
          (userInfo.site_id === commonSiteId.ICPAY && userInfo.step_setting === 4)
        ) {
          corporates = await usersCorporateRepository.getCorporates({ user_basic_data_id: accountId })
          // UPDATE STATUS_ITEM FOR CORPORATE
          updateCorporates = corporates.map((el) => getCorporateStatusItem(account_status_code, userInfo, el))
          personals = await usersPersonalRepository.getPersonals({ user_basic_data_id: accountId })
          // UPDATE STATUS_ITEM FOR PERSONAL
          updatePersonals = personals.map((el) => getPersonalStatusItem(account_status_code, userInfo, el))
        }
      } else {
        personals = await usersPersonalRepository.getPersonals({ user_basic_data_id: accountId })
        if ( personals.length && userInfo.site_id !== commonSiteId.FXS_XEM) {
        // UPDATE STATUS_ITEM FOR PERSONAL
          updatePersonals = personals.map((el) => getPersonalStatusItem(account_status_code, userInfo, el))
        }
      }
    }

    let updateStatus

    if ( account_status_code === statusCode.CLOSED ) {
      updateStatus = await usersBasicDataRepository.updateAccountStatusClosed({
        user_id: accountId,
        staff_id: staff_id,
        newStatus: account_status_code,
        currentStatus: userInfo.account_status_code,
        status_label_number: account_status_label_number ? account_status_label_number : 0,
        site_id: userInfo.site_id,
      }, event)
    } else if (account_status_code === statusCode.APPROVED) {
      updateStatus = await usersBasicDataRepository.updateAccountStatus(
        updatePersonals,
        updateCorporates,
        payloadUser)
    } else {
      updateStatus = await statusHistoryRepository.insertStatusHistory({
        target_id: accountId,
        status_code: account_status_code,
        status_label_number: account_status_label_number ? account_status_label_number : 0,
        status_class_id: statusClassConstant.ACCOUNT_STATUS,
        updated_by_user_id: staff_id,
        action_method: actionMethod.OPERATOR_ACTION,
      })
    }

    if ( !updateStatus ) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.CHANGE_ACCOUNT_STATUS.UPDATE_ACCOUNT_STATUS_FAIL])
    }

    // send mail
    if (account_status_code === statusCode.APPROVED && send_mail_approved === flag.TRUE && userInfo.site_id !== commonSiteId.FXS_XEM) {
      await sendEmailChangeAccountStt(userInfo, account_status_code)
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const sendEmailChangeAccountStt = async (userInfo, status) =>{
  try {
    const siteId = userInfo.site_id
    const mailLang = userInfo.language_email ? userInfo.language_email : 'en'
    const portalLang = userInfo.language_portal ? userInfo.language_portal : 'en'
    const userName = `${userInfo.first_name_romaji} ${userInfo.last_name_romaji}`.toUpperCase()
    let emailTemplate
    let emailParameters
    let html
    let responseSendMail
    if (status === statusCode.APPROVED) {
      switch (siteId) {
        case commonSiteId.MY_FOREX:
        {
          // get template email
          emailTemplate = await emailDetailContentRepository.getTemplateSendEmailById(emailDetailContentId.EMAIL_APPROVED_ACCOUNT_MF)
          // email body
          emailTemplate.subject = emailTemplate[`${mailLang}_subject`]
          emailParameters = {
            user_name: userName,
            url_login: `${process.env.WF_DOMAIN_MYFOREX}/access.php?id=login`,
          }
          html = utility.renderEmail(emailParameters, emailTemplate, mailLang)
          responseSendMail = await mailer.sendMailMyForex(userInfo.email, emailTemplate.subject, '', html, emailTemplate)
          if (responseSendMail) {
            await emailHistoryRepository.createEmailHistory({
              ...responseSendMail,
              email_detail_content_id: emailTemplate.id,
              user_basic_data_id: userInfo.id,
            })
          }
          break
        }
        case commonSiteId.ICPAY:
        {
          // get template email
          emailTemplate = await emailDetailContentRepository.getTemplateSendEmailById(emailDetailContentId.EMAIL_APPROVED_ACCOUNT_ICPAY)
          // email body
          emailTemplate.subject = emailTemplate[`${mailLang}_subject`]
          emailParameters = {
            user_name: userName,
            url_login: `${process.env.URL_FE_ICPAY}/login/?lang=${portalLang}`,
          }
          html = utility.renderEmail(emailParameters, emailTemplate, mailLang)
          responseSendMail = await mailer.sendMailICPAY(userInfo.email, emailTemplate.subject, '', html, emailTemplate)
          if (responseSendMail) {
            await emailHistoryRepository.createEmailHistory({
              ...responseSendMail,
              email_detail_content_id: emailTemplate.id,
              user_basic_data_id: userInfo.id,
            })
          }
          break
        }
        case commonSiteId.FXT:
        {
          // get template email
          emailTemplate = await emailDetailContentRepository.getTemplateSendEmailById(emailDetailContentId.EMAIL_ACTIVE_ACCOUNT)
          // email body
          emailTemplate.subject = emailTemplate[`${mailLang}_subject`]
          emailParameters = {
            user_name: userName,
            url_login: `${process.env.URL_FE_FXT}/login/?lang=${portalLang}`,
          }
          html = utility.renderEmail(emailParameters, emailTemplate, mailLang)
          responseSendMail = await mailer.sendMailFXT(userInfo.email, emailTemplate.subject, '', html, emailTemplate)
          if (responseSendMail) {
            await emailHistoryRepository.createEmailHistory({
              ...responseSendMail,
              email_detail_content_id: emailTemplate.id,
              user_basic_data_id: userInfo.id,
            })
          }
          break
        }
        default:
          break
      }
    } else if (status === statusCode.CLOSED) {
      switch (siteId) {
        case commonSiteId.MY_FOREX:
        {
          // get template email
          emailTemplate = await emailDetailContentRepository.getTemplateSendEmailById(emailDetailContentId.EMAIL_CLOSE_USER_MF)
          // email body
          emailTemplate.subject = emailTemplate[`${mailLang}_subject`]
          emailParameters = {
            user_name: userName,
            type_lang: mailLang,
          }
          html = utility.renderEmail(emailParameters, emailTemplate, mailLang)
          responseSendMail = await mailer.sendMailMyForex(userInfo.email, emailTemplate.subject, '', html, emailTemplate)
          if (responseSendMail) {
            await emailHistoryRepository.createEmailHistory({
              ...responseSendMail,
              email_detail_content_id: emailTemplate.id,
              user_basic_data_id: userInfo.id,
            })
          }
          break
        }
        case commonSiteId.ICPAY:
        {
          // get template email
          emailTemplate = await emailDetailContentRepository.getTemplateSendEmailById(emailDetailContentId.EMAIL_CLOSE_USER_ICPAY)
          // email body
          emailTemplate.subject = emailTemplate[`${mailLang}_subject`]
          emailParameters = {
            user_name: userName,
          }
          html = utility.renderEmail(emailParameters, emailTemplate, mailLang)
          responseSendMail = await mailer.sendMailICPAY(userInfo.email, emailTemplate.subject, '', html, emailTemplate)
          if (responseSendMail) {
            await emailHistoryRepository.createEmailHistory({
              ...responseSendMail,
              email_detail_content_id: emailTemplate.id,
              user_basic_data_id: userInfo.id,
            })
          }
          break
        }
        case commonSiteId.FXT:
        {
          const userName = `${userInfo.first_name_romaji} ${userInfo.last_name_romaji}`
          // get template email
          const emailTemplateUrl = await emailDetailContentRepository.getTemplateSendEmailById(emailDetailContentId.EMAIL_CLOSE_ACCOUNT)
          // email body
          emailTemplateUrl.subject = emailTemplateUrl[`${mailLang}_subject`]
          const emailParameters = {
            user_name: userName.toUpperCase(),
            url_login: `${process.env.URL_FE_FXT}/login/?lang=${portalLang}`,
          }
          const html = utility.renderEmail(emailParameters, emailTemplateUrl, mailLang)
          const responseSendMail = await mailer.sendMailFXT(userInfo.email, emailTemplateUrl.subject, '', html, emailTemplateUrl)
          if (responseSendMail) {
            await emailHistoryRepository.createEmailHistory({
              ...responseSendMail,
              email_detail_content_id: emailTemplateUrl.id,
              user_basic_data_id: userInfo.id,
            })
          }
          break
        }
        default:
          break
      }
    }
  } catch (error) {
    console.log(error)
  }
}

const getPersonalStatusItem = (status, user, personal) => {
  const res = {
    id: personal.id,
    status_items: JSON.stringify({}),
  }
  if (user.site_id === commonSiteId.ICPAY) {
    if (!user.reg_category) {
      res.status_items = status === statusCode.APPROVED ?
        approvedStatusItems.icpay.personal :
        getActiveStatusItem(personal, commonSiteId.ICPAY, 'personal')
    } else {
      const isRepresentPerson = personal.transaction_person === 0 && personal.representative_person === 1 && personal.beneficial_owner === 0
      const isTransactionPerson = personal.transaction_person === 1 && personal.representative_person === 0 && personal.beneficial_owner === 0
      const isShareholderPerson = personal.transaction_person === 1 && personal.representative_person === 1 && personal.beneficial_owner === 1
      if (isRepresentPerson) {
        res.status_items = status === statusCode.APPROVED ?
          approvedStatusItems.icpay.representPerson :
          getActiveStatusItem(personal, commonSiteId.ICPAY, 'representPerson')
      } else if (isTransactionPerson) {
        res.status_items = status === statusCode.APPROVED ?
          approvedStatusItems.icpay.transactionPerson :
          getActiveStatusItem(personal, commonSiteId.ICPAY, 'transactionPerson')
      } else if (isShareholderPerson) {
        res.status_items = status === statusCode.APPROVED ?
          approvedStatusItems.icpay.shareholderPerson :
          getActiveStatusItem(personal, commonSiteId.ICPAY, 'shareholderPerson')
      }
    }
  } else if (user.site_id === commonSiteId.FXT) {
    if (!user.reg_category) {
      res.status_items = status === statusCode.APPROVED ?
        approvedStatusItems.fxt.personal : getActiveStatusItem(personal, commonSiteId.FXT, 'personal')
    } else {
      const isRepresentPerson = personal.transaction_person === 0 && personal.representative_person === 1 && personal.beneficial_owner === 0
      const isTransactionPerson = personal.transaction_person === 1 && personal.representative_person === 0 && personal.beneficial_owner === 0
      if (isRepresentPerson) {
        res.status_items = status === statusCode.APPROVED ?
          approvedStatusItems.fxt.representPerson : getActiveStatusItem(personal, commonSiteId.FXT, 'representPerson')
      } else if (isTransactionPerson) {
        res.status_items = status === statusCode.APPROVED ?
          approvedStatusItems.fxt.transactionPerson : getActiveStatusItem(personal, commonSiteId.FXT, 'transactionPerson')
      }
    }
  } else if (user.site_id === commonSiteId.MY_FOREX) {
    res.status_items = status === statusCode.APPROVED ?
      approvedStatusItems.myforex.personal : getActiveStatusItem(personal, commonSiteId.MY_FOREX, 'personal')
  }
  return res
}

const getCorporateStatusItem = (status, user, corporate) => {
  const res = {
    id: corporate.id,
    status_items: JSON.stringify({}),
  }
  if (user.site_id === commonSiteId.ICPAY) {
    if (!corporate.beneficial_owner) {
      res.status_items = status === statusCode.APPROVED ?
        approvedStatusItems.icpay.corporate :
        getActiveStatusItem(corporate, commonSiteId.ICPAY, 'corporate')
    } else {
      res.status_items = status === statusCode.APPROVED ?
        approvedStatusItems.icpay.shareholderCorporate :
        getActiveStatusItem(corporate, commonSiteId.ICPAY, 'shareholderCorporate')
    }
  } else if (user.site_id === commonSiteId.FXT) {
    res.status_items = status === statusCode.APPROVED ?
      approvedStatusItems.fxt.corporate :
      getActiveStatusItem(corporate, commonSiteId.FXT, 'corporate')
  }
  return res
}

const getActiveStatusItem = (obj, site, type) =>{
  if (site === commonSiteId.ICPAY) {
    switch (type) {
      case 'personal':
        return JSON.stringify({
          nationality_id: obj.nationality_id ? 1 : 0,
          name_romaji: 1,
          name_kanji: obj.first_name_kanji && obj.last_name_kanji ? 1 : 0,
          name_katakana: obj.first_name_katakana && obj.last_name_katakana ? 1 : 0,
          gender: obj.gender ? 1 : 0,
          date_of_birth: obj.date_of_birth ? 1 : 0,
          country_id: 1,
          zip_postal_code: obj.zip_postal_code ? 1 : 0,
          state_province: obj.state_province ? 1 : 0,
          city: obj.city ? 1 : 0,
          address_line_1: obj.address_line_1 ? 1 : 0,
          address_line_2: obj.address_line_2 ? 1 : 0,
          occupation_id: obj.occupation_id ? 1 : 0,
          funding_source_id: obj.funding_source_id ? 1 : 0,
          industry_id: obj.industry_id ? 1 : 0,
          purpose_of_investment: obj.purpose_of_investment ? 1 : 0,
        })
      case 'representPerson':
        return JSON.stringify({
          nationality_id: obj.nationality_id ? 1 : 0,
          name_romaji: obj.first_name_romaji && obj.last_name_romaji ? 1 : 0,
          name_kanji: obj.first_name_kanji && obj.last_name_kanji ? 1 : 0,
          name_katakana: obj.first_name_katakana && obj.last_name_katakana ? 1 : 0,
          gender: obj.gender ? 1 : 0,
          date_of_birth: obj.date_of_birth ? 1 : 0,
          country_id: obj.country_id ? 1 : 0,
          zip_postal_code: obj.zip_postal_code ? 1 : 0,
          state_province: obj.state_province ? 1 : 0,
          city: obj.city ? 1 : 0,
          address_line_1: obj.address_line_1 ? 1 : 0,
          address_line_2: obj.address_line_2 ? 1 : 0,
          contact_phone_number: obj.contact_phone_number && obj.phone_number_country_id ? 1 : 0,
        })
      case 'transactionPerson':
        return JSON.stringify({
          nationality_id: obj.nationality_id ? 1 : 0,
          name_romaji: 1,
          name_kanji: obj.first_name_kanji && obj.last_name_kanji ? 1 : 0,
          name_katakana: obj.first_name_katakana && obj.last_name_katakana ? 1 : 0,
          gender: obj.gender ? 1 : 0,
          date_of_birth: obj.date_of_birth ? 1 : 0,
          country_id: 1,
          zip_postal_code: obj.zip_postal_code ? 1 : 0,
          state_province: obj.state_province ? 1 : 0,
          city: obj.city ? 1 : 0,
          address_line_1: obj.address_line_1 ? 1 : 0,
          address_line_2: obj.address_line_2 ? 1 : 0,
          contact_phone_number: 2,
          email: 2,
        })
      case 'shareholderPerson':
        return JSON.stringify({
          nationality_id: obj.nationality_id ? 1 : 0,
          name_romaji: obj.first_name_romaji && obj.last_name_romaji ? 1 : 0,
          name_kanji: obj.first_name_kanji && obj.last_name_kanji ? 1 : 0,
          name_katakana: obj.first_name_katakana && obj.last_name_katakana ? 1 : 0,
          gender: obj.gender ? 1 : 0,
          date_of_birth: obj.date_of_birth ? 1 : 0,
          country_id: obj.country_id ? 1 : 0,
          zip_postal_code: obj.zip_postal_code ? 1 : 0,
          state_province: obj.state_province ? 1 : 0,
          city: obj.city ? 1 : 0,
          address_line_1: obj.address_line_1 ? 1 : 0,
          address_line_2: obj.address_line_2 ? 1 : 0,
          contact_phone_number: obj.contact_phone_number && obj.phone_number_country_id ? 1 : 0,
          voting_ratio: utility.checkFalsyExceptZero(obj.voting_ratio) ? 1 : 0,
        })
      case 'corporate':
        return JSON.stringify({
          country_id: obj.country_id ? 1 : 0,
          corporate_name_registered: obj.corporate_name_registered ? 1 : 0,
          corporate_name_english: obj.corporate_name_english ? 1 : 0,
          corporate_name_katakana: obj.corporate_name_katakana ? 1 : 0,
          date_of_establish: obj.date_of_establish ? 1 : 0,
          zip_postal_code: obj.zip_postal_code ? 1 : 0,
          state_province: obj.state_province ? 1 : 0,
          city: obj.city ? 1 : 0,
          address_line_1: obj.address_line_1 ? 1 : 0,
          address_line_2: obj.address_line_2 ? 1 : 0,
          corporate_phone_number: obj.corporate_phone_number && obj.phone_number_country_id ? 1 : 0,
          industry_id: obj.industry_id ? 1 : 0,
          business_content: obj.business_content ? 1 : 0,
          website_url: obj.website_url ? 1 : 0,
          purpose_of_use: obj.purpose_of_use ? 1 : 0,
          estimated_annual_usage_amount: obj.estimated_annual_usage_amount ? 1 : 0,
        })
      case 'shareholderCorporate':
        return JSON.stringify({
          country_id: obj.country_id ? 1 : 0,
          corporate_name_registered: obj.corporate_name_registered ? 1 : 0,
          corporate_name_english: obj.corporate_name_english ? 1 : 0,
          corporate_name_katakana: obj.corporate_name_katakana ? 1 : 0,
          date_of_establish: obj.date_of_establish ? 1 : 0,
          zip_postal_code: obj.zip_postal_code ? 1 : 0,
          state_province: obj.state_province ? 1 : 0,
          city: obj.city ? 1 : 0,
          address_line_1: obj.address_line_1 ? 1 : 0,
          address_line_2: obj.address_line_2 ? 1 : 0,
          corporate_phone_number: obj.corporate_phone_number && obj.phone_number_country_id ? 1 : 0,
          industry_id: obj.industry_id ? 1 : 0,
          business_content: obj.business_content ? 1 : 0,
          website_url: obj.website_url ? 1 : 0,
          voting_ratio: utility.checkFalsyExceptZero(obj.voting_ratio) ? 1 : 0,
        })
      default:
        break
    }
  } else if (site === commonSiteId.FXT) {
    switch (type) {
      case 'personal':
        return JSON.stringify({
          nationality_id: obj.nationality_id ? 1 : 0,
          name_romaji: 1,
          name_kanji: obj.first_name_kanji && obj.last_name_kanji ? 1 : 0,
          name_katakana: obj.first_name_katakana && obj.last_name_katakana ? 1 : 0,
          gender: obj.gender ? 1 : 0,
          date_of_birth: obj.date_of_birth ? 1 : 0,
          us_tax_obligations: utility.checkFalsyExceptZero(obj.us_tax_obligations) ? 1 : 0,
          us_taxpayer_number: obj.us_taxpayer_number ? 1 : 0,
          country_id: 1,
          zip_postal_code: obj.zip_postal_code ? 1 : 0,
          state_province: obj.state_province ? 1 : 0,
          city: obj.city ? 1 : 0,
          address_line_1: obj.address_line_1 ? 1 : 0,
          address_line_2: obj.address_line_2 ? 1 : 0,
          occupation_id: obj.occupation_id ? 1 : 0,
          funding_source_id: obj.funding_source_id ? 1 : 0,
          industry_id: obj.industry_id ? 1 : 0,
          annual_income: obj.annual_income ? 1 : 0,
          net_worth: obj.net_worth ? 1 : 0,
          planned_annual_investment: obj.planned_annual_investment ? 1 : 0,
          purpose_of_investment: obj.purpose_of_investment ? 1 : 0,
          user_name: 2,
        })
      case 'representPerson':
        return JSON.stringify({
          nationality_id: obj.nationality_id ? 1 : 0,
          name_romaji: obj.first_name_romaji && obj.last_name_romaji ? 1 : 0,
          name_kanji: obj.first_name_kanji && obj.last_name_kanji ? 1 : 0,
          name_katakana: obj.first_name_katakana && obj.last_name_katakana ? 1 : 0,
          gender: obj.gender ? 1 : 0,
          date_of_birth: obj.date_of_birth ? 1 : 0,
          us_tax_obligations: Number(obj.us_tax_obligations) === 0 || Number(obj.us_tax_obligations) === 1 ? 1 : 0,
          us_taxpayer_number: obj.us_taxpayer_number ? 1 : 0,
          country_id: obj.country_id ? 1 : 0,
          zip_postal_code: obj.zip_postal_code ? 1 : 0,
          state_province: obj.state_province ? 1 : 0,
          city: obj.city ? 1 : 0,
          address_line_1: obj.address_line_1 ? 1 : 0,
          address_line_2: obj.address_line_2 ? 1 : 0,
          contact_phone_number: obj.contact_phone_number && obj.phone_number_country_id ? 1 : 0,

        })
      case 'transactionPerson':
        return JSON.stringify({
          nationality_id: obj.nationality_id ? 1 : 0,
          name_romaji: 1,
          name_kanji: obj.first_name_kanji && obj.last_name_kanji ? 1 : 0,
          name_katakana: obj.first_name_katakana && obj.last_name_katakana ? 1 : 0,
          gender: obj.gender ? 1 : 0,
          date_of_birth: obj.date_of_birth ? 1 : 0,
          us_tax_obligations: Number(obj.us_tax_obligations) === 0 || Number(obj.us_tax_obligations) === 1 ? 1 : 0,
          us_taxpayer_number: obj.us_taxpayer_number ? 1 : 0,
          country_id: 1,
          zip_postal_code: obj.zip_postal_code ? 1 : 0,
          state_province: obj.state_province ? 1 : 0,
          city: obj.city ? 1 : 0,
          address_line_1: obj.address_line_1 ? 1 : 0,
          address_line_2: obj.address_line_2 ? 1 : 0,
          phone_number: 2,
          email: 2,
          user_name: 2,
        })
      case 'corporate':
        return JSON.stringify({
          country_id: obj.country_id ? 1 : 0,
          corporate_name_registered: obj.corporate_name_registered ? 1 : 0,
          corporate_name_english: obj.corporate_name_english ? 1 : 0,
          corporate_name_katakana: obj.corporate_name_katakana ? 1 : 0,
          us_tax_obligations: Number(obj.us_tax_obligations) === 0 || Number(obj.us_tax_obligations) === 1 ? 1 : 0,
          us_taxpayer_number: obj.us_taxpayer_number ? 1 : 0,
          date_of_establish: obj.date_of_establish ? 1 : 0,
          zip_postal_code: obj.zip_postal_code ? 1 : 0,
          state_province: obj.state_province ? 1 : 0,
          city: obj.city ? 1 : 0,
          address_line_1: obj.address_line_1 ? 1 : 0,
          address_line_2: obj.address_line_2 ? 1 : 0,
          corporate_phone_number: obj.corporate_phone_number && obj.phone_number_country_id ? 1 : 0,
          industry_id: obj.industry_id ? 1 : 0,
          business_content: obj.business_content ? 1 : 0,
          website_url: obj.website_url ? 1 : 0,
          company_annual_sales: obj.company_annual_sales ? 1 : 0,
          net_asset_amount: obj.net_asset_amount ? 1 : 0,
          estimated_annual_usage_amount: obj.estimated_annual_usage_amount ? 1 : 0,
          purpose_of_use: obj.purpose_of_use ? 1 : 0,
        })
      default:
        break
    }
  } else if (site === commonSiteId.MY_FOREX) {
    switch (type) {
      case 'personal':
        return JSON.stringify({
          nationality_id: 1,
          name_romaji: 1,
          name_kanji: obj.first_name_kanji && obj.last_name_kanji ? 1 : 0,
          name_katakana: obj.first_name_katakana && obj.last_name_katakana ? 1 : 0,
          gender: 1,
          date_of_birth: 1,
          country_id: 1,
          zip_postal_code: 1,
          state_province: 1,
          city: 1,
          address_line_1: 1,
          address_line_2: obj.address_line_2 ? 1 : 0,
          user_name: 2,
        })
      default:
        break
    }
  }
}

module.exports = {
  changeAccountStatusCode,
  sendEmailChangeAccountStt,
  getPersonalStatusItem,
  getCorporateStatusItem,
}
