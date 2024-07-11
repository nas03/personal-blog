'use strict'

/* constant */
const { commonSiteId, timeExpires } = require('constant')

/* library */
const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
const format = require('string-format')
const VoiceResponse = require('twilio').twiml.VoiceResponse

/* DB */
const { onetimeAuthorityRepository } = require('repository')

const utility = require('utility')

format.extend(String.prototype, {})

const getCodeSms = async (phoneNumber, locale, ipAddress) => {
  try {
    const codeSms = Math.floor(100000 + Math.random() * 900000)

    const lang = await utility.getMultilingualism(process.env.LOCALES_SOURCE, locale)
    const twilioLang = lang.email.format_twilio
    // TODO fix SMS message
    const body = `${twilioLang.twl_formatMessageSms.format(codeSms, timeExpires.SMS)} (IP:${ipAddress})`
    const result = await client.messages
      .create({
        body: body,
        from: process.env.SERVICES_SID,
        to: phoneNumber,
      })

    return { status: true, data: result, code: codeSms }
  } catch (error) {
    console.error(error)
    return { status: false, error: error }
  }
}

const verifyCodeSms = async (email, phoneNumber, code, actionClass, isDelete = true) => {
  const verify = await onetimeAuthorityRepository.verifyOneTimeAuthorityCode({
    site_id: commonSiteId.P2TECH,
    action_class: actionClass,
    email: email,
    phone_number: phoneNumber,
    code: code,
  })
  if (!verify.status) {
    return { status: false, error: verify.message }
  }

  if (isDelete) {
    await onetimeAuthorityRepository.deleteOneTimeAuthorityCode(verify.data.id)
  }
  return { status: true }
}

const getVoiceCode = async (phoneNumber, locale) => {
  // generate code
  const codeSms = Math.floor(100000 + Math.random() * 900000)
  try {
    // check lang
    const formatLocale = _formatLocale(locale)

    // convert code to string
    const codeConvert = codeSms.toString().split('').join(' ')

    const lang = await utility.getMultilingualism(process.env.LOCALES_SOURCE, locale)
    const twilioLang = lang.email.format_twilio
    const body = `${twilioLang.twl_formatVoiceMessage.format(codeConvert, timeExpires.SMS)}`

    // make a call
    const twiml = new VoiceResponse()
    const configCall = twiml.say(
      {
        voice: formatLocale.voice,
        language: formatLocale.lang,
        loop: 2,
      },
    )
    configCall.prosody({
      rate: formatLocale.rate,
    }, `${body}`)

    const result = await client.calls
      .create({
        twiml: configCall.toString(),
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      })

    return { status: true, data: result, code: codeSms }
  } catch (error) {
    console.error(error)
    if (error.code === 21215 && error.status === 400) {
      return { status: true, code: codeSms }
    }
    return { status: false, error: error }
  }
}

const _formatLocale = (locale) => {
  switch (locale) {
    case 'en':
      return {
        lang: 'en-US',
        voice: 'Polly.Joanna',
        rate: '50%',
      }
    case 'ja':
      return {
        lang: 'ja-JP',
        voice: 'Polly.Mizuki',
        rate: '60%',
      }
    case 'kr':
      return {
        lang: 'ko-KR',
        voice: 'Google.ko-KR-Standard-A',
        rate: '55%',
      }
    case 'cn':
      return {
        lang: 'cmn-CN',
        voice: 'Polly.Zhiyu',
        rate: '55%',
      }
    default:
      break
  }
}

module.exports = {
  getCodeSms,
  verifyCodeSms,
  getVoiceCode,
}
