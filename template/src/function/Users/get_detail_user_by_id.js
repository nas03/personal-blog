/* func */
const utility = require('utility')
const { omit } = require('lodash')
const { mailer } = require('helper')

/* constant */
const { paymentTransactionStatus, flag,
  tokenAuthorityClass, emailDetailContentId, commonSiteId, errorMessageCodeConstant,
} = require('constant')

/* db */
const {
  errorLogRepository,
  tradingAccountRepository,
  paymentTransactionRepository,
  usersBasicDataRepository,
  walletsRepository, tokenAuthorityRepository,
  emailDetailContentRepository,
  emailHistoryRepository,
} = require('repository')


const getDetailUserById = async (event) => {
  try {
    const userId = event.pathParameters.id
    event.user_id = userId

    const [user, tradingAccount, paymenTrans, walletInfo] = await Promise.all([
      usersBasicDataRepository.getDetailUserById(userId),
      tradingAccountRepository.getAccountAcceptedAmount(userId),
      paymentTransactionRepository.getPaymentTransByUser(userId,
        { 'payment_status': paymentTransactionStatus.ACTION_REQUIRED, 'delete_flag': flag.FALSE }),
      walletsRepository.getWalletsByUserId(userId),
    ])

    if (!user) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    user.trading_account_accepted = tradingAccount.count
    user.payment_action_required = paymenTrans.length

    user.wallets = walletInfo

    return utility.createResponse(true, omit(user, 'hash_password'))
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const sendUserResetPasswordMail = async (event) => {
  try {
    const userId = event.pathParameters.userId
    event.user_id = userId

    // GET AND CHECK DATA PREPARE FOR SEND MAIL
    const userBasicData = await usersBasicDataRepository.getUserDataForSendMail(userId)
    if (!userBasicData) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }
    const { site_id, email } = userBasicData

    // RENDER KEY AND EXPIRED DATE
    const { key, expiresIn } = utility.createAuthorizationKey(30, 'minute')

    // CREATE TOKEN AUTHORITY
    await tokenAuthorityRepository.createTokenAuthority({
      site_id,
      action_class: tokenAuthorityClass.RESET_PASSWORD,
      activation_key: key,
      activation_key_expire_datetime: expiresIn,
      target_id: userId,
    })

    // Send Mail
    const defaultLang = 'ja'
    const language_email = userBasicData.language_email || defaultLang
    const language_portal = userBasicData.language_portal || defaultLang
    const clientName = userBasicData.first_name_romaji.toUpperCase() + ' ' + userBasicData.last_name_romaji.toUpperCase()
    let responseSendMail
    let emailTemplate
    let html
    switch (userBasicData.site_id) {
      case commonSiteId.FXT:

        emailTemplate = await emailDetailContentRepository.getTemplateSendEmailById(emailDetailContentId.URL_FOR_PASSWORD_RESET)

        emailTemplate.subject = emailTemplate[`${language_email}_subject`]
        // Render email
        html = utility.renderEmail(
          {
            user_name: clientName,
            link_path: `${process.env.URL_FE_FXT}/verify-path/?resetKey=${key}&lang=${language_portal}`,
          },
          emailTemplate,
          language_email)

        responseSendMail = await mailer.sendMailFXT(email, emailTemplate.subject, '', html, emailTemplate)
        if (responseSendMail.isError) {
          return await errorLogRepository.createResponseAndLog(event, responseSendMail, null,
            [errorMessageCodeConstant.SEND_MAIL_RESET_PASSWORD.SEND_MAIL_ERROR_FXT])
        }

        break
      case commonSiteId.ICPAY:

        emailTemplate = await emailDetailContentRepository.getTemplateSendEmailById(emailDetailContentId.EMAIL_FORGOT_PASSWORD_ICPAY)

        emailTemplate.subject = emailTemplate[`${language_email}_subject`]
        // Render email
        html = utility.renderEmail(
          {
            user_name: clientName,
            url_reset_password: `${process.env.URL_FE_ICPAY}/verify-path/?resetKey=${key}&lang=${language_portal}`,
          },
          emailTemplate,
          language_email)

        responseSendMail = await mailer.sendMailICPAY(email, emailTemplate.subject, '', html, emailTemplate)
        if (responseSendMail.isError) {
          return await errorLogRepository.createResponseAndLog(event, responseSendMail, null,
            [errorMessageCodeConstant.SEND_MAIL_RESET_PASSWORD.SEND_MAIL_ERROR_ICPAY])
        }

        break
      case commonSiteId.MY_FOREX:

        emailTemplate = await emailDetailContentRepository.getTemplateSendEmailById(emailDetailContentId.EMAIL_FORGOT_PASSWORD_MF)

        emailTemplate.subject = emailTemplate[`${language_email}_subject`]
        // Render email
        html = utility.renderEmail(
          {
            user_name: clientName,
            url_reset_password: `${process.env.URL_FE_MYFOREX}/verify-path/?resetKey=${key}&lang=${language_portal}`,
          },
          emailTemplate,
          language_email)

        responseSendMail = await mailer.sendMailMyForex(email, emailTemplate.subject, '', html, emailTemplate)
        if (responseSendMail.isError) {
          return await errorLogRepository.createResponseAndLog(event, responseSendMail, null,
            [errorMessageCodeConstant.SEND_MAIL_RESET_PASSWORD.SEND_MAIL_ERROR_MY_FOREX])
        }

        break
      default:
        return await errorLogRepository.createResponseAndLog(event, null, null,
          [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }


    if (responseSendMail) {
      // Create email history
      await emailHistoryRepository.createEmailHistory({
        ...responseSendMail,
        email_detail_content_id: emailTemplate.id,
        user_basic_data_id: userBasicData.id,
      })
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

module.exports = {
  getDetailUserById,
  sendUserResetPasswordMail,
}
