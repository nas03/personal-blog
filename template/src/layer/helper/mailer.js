
const nodeMailer = require('nodemailer')
const aws = require('./aws')
const { envCommon, commonSiteId } = require('constant')

const sendMail = async (to, subject, text, htmlContent, settingOption) => {
  try {
    const env = await _getEnvConfig([
      envCommon.EMAIL,
      envCommon.PASSWORD_EMAIL,
      envCommon.MAIL_HOST,
      envCommon.MAIL_PORT,
      envCommon.EMAIL_BCC,
    ], commonSiteId.P2TECH, settingOption)
    const transporter = nodeMailer.createTransport({
      host: env[envCommon.MAIL_HOST],
      port: env[envCommon.MAIL_PORT],
      auth: {
        user: env[envCommon.EMAIL],
        pass: env[envCommon.PASSWORD_EMAIL],
      },
    })

    const options = {
      from: env[envCommon.EMAIL],
      to: to,
      subject: subject,
      text: text,
      html: htmlContent,
      headers: {
        References: Date.now(),
      },
    }

    if (env[envCommon.EMAIL_BCC]) {
      options.bcc = env[envCommon.EMAIL_BCC]
    }

    const res = await transporter.sendMail(options)
    console.log(res)
    return { isError: false }
  } catch (error) {
    console.log(error)
    return { isError: true, message: error.message }
  }
}

const sendMailFXT = async (to, subject, text, htmlContent, settingOption) => {
  try {
    const env = await _getEnvConfig([
      envCommon.EMAIL,
      envCommon.PASSWORD_EMAIL,
      envCommon.MAIL_HOST,
      envCommon.MAIL_PORT,
      envCommon.EMAIL_BCC,
    ], commonSiteId.FXT, settingOption)

    const transporter = nodeMailer.createTransport({
      host: env[envCommon.MAIL_HOST],
      port: env[envCommon.MAIL_PORT],
      auth: {
        user: env[envCommon.EMAIL],
        pass: env[envCommon.PASSWORD_EMAIL],
      },
    })

    const options = {
      from: env[envCommon.EMAIL],
      to: to,
      subject: subject,
      text: text,
      html: htmlContent,
      headers: {
        References: Date.now(),
      },
    }

    if (env[envCommon.EMAIL_BCC]) {
      options.bcc = env[envCommon.EMAIL_BCC]
    }

    const res = await transporter.sendMail(options)
    console.log(res)

    return {
      email_from: options.from,
      email_to: options.to,
      subject: options.subject,
      content: options.text || options.html,
      email_bcc: options.bcc || null,
    }
  } catch (error) {
    console.log(error)
    return { isError: true, message: error.message }
  }
}

const sendMailICPAY = async (to, subject, text, htmlContent, settingOption) => {
  try {
    const env = await _getEnvConfig([
      envCommon.EMAIL,
      envCommon.PASSWORD_EMAIL,
      envCommon.MAIL_HOST,
      envCommon.MAIL_PORT,
      envCommon.EMAIL_BCC,
    ], commonSiteId.ICPAY, settingOption)

    const transporter = nodeMailer.createTransport({
      host: env[envCommon.MAIL_HOST],
      port: env[envCommon.MAIL_PORT],
      auth: {
        user: env[envCommon.EMAIL],
        pass: env[envCommon.PASSWORD_EMAIL],
      },
    })

    const options = {
      from: env[envCommon.EMAIL],
      to: to,
      subject: subject,
      text: text,
      html: htmlContent,
      headers: {
        References: Date.now(),
      },
    }

    if (env[envCommon.EMAIL_BCC]) {
      options.bcc = env[envCommon.EMAIL_BCC]
    }

    await transporter.sendMail(options)

    return {
      email_from: options.from,
      email_to: options.to,
      subject: options.subject,
      content: options.text || options.html,
      email_bcc: options.bcc || null,
    }
  } catch (error) {
    console.log(error)
    return { isError: true, message: error.message }
  }
}

const sendMailFXSignupXEM = async (to, subject, text, htmlContent, settingOption) => {
  try {
    const env = await _getEnvConfig([
      envCommon.EMAIL,
      envCommon.PASSWORD_EMAIL,
      envCommon.MAIL_HOST,
      envCommon.MAIL_PORT,
      envCommon.EMAIL_BCC,
    ], commonSiteId.FXS_XEM, settingOption)

    const transporter = nodeMailer.createTransport({
      host: env[envCommon.MAIL_HOST],
      port: env[envCommon.MAIL_PORT],
      auth: {
        user: env[envCommon.EMAIL],
        pass: env[envCommon.PASSWORD_EMAIL],
      },
    })

    const options = {
      from: env[envCommon.EMAIL],
      to: to,
      subject: subject,
      text: text,
      html: htmlContent,
      headers: {
        References: Date.now(),
      },
    }

    if (env[envCommon.EMAIL_BCC]) {
      options.bcc = env[envCommon.EMAIL_BCC]
    }

    await transporter.sendMail(options)

    return {
      email_from: options.from,
      email_to: options.to,
      subject: options.subject,
      content: options.text || options.html,
      email_bcc: options.bcc || null,
    }
  } catch (error) {
    console.error(error)
    return { isError: true, message: error.message }
  }
}

const sendMailMyForex = async (to, subject, text, htmlContent, settingOption) => {
  try {
    const env = await _getEnvConfig([
      envCommon.EMAIL,
      envCommon.PASSWORD_EMAIL,
      envCommon.MAIL_HOST,
      envCommon.MAIL_PORT,
      envCommon.EMAIL_BCC,
    ], commonSiteId.MY_FOREX, settingOption)

    const transporter = nodeMailer.createTransport({
      host: env[envCommon.MAIL_HOST],
      port: env[envCommon.MAIL_PORT],
      auth: {
        user: env[envCommon.EMAIL],
        pass: env[envCommon.PASSWORD_EMAIL],
      },
    })

    const options = {
      from: env[envCommon.EMAIL],
      to: to,
      subject: subject,
      text: text,
      html: htmlContent,
      headers: {
        References: Date.now(),
      },
    }

    if (env[envCommon.EMAIL_BCC]) {
      options.bcc = env[envCommon.EMAIL_BCC]
    }

    await transporter.sendMail(options)

    return {
      email_from: options.from,
      email_to: options.to,
      subject: options.subject,
      content: options.text || options.html,
      email_bcc: options.bcc || null,
    }
  } catch (error) {
    console.error(error)
    return { isError: true, message: error.message }
  }
}

// const sendMailBatchLogAlert = async (batchLogObj) => {
//   let batchType
//   try {
//     batchType = batchLogObj.batch_type
//     const htmlContent = _getBatchLogEmailContent(batchLogObj)

//     const env = await _getEnvConfig([
//       envCommon.BATCH_LOG_ALERT_MAIL_HOST,
//       envCommon.BATCH_LOG_ALERT_MAIL_PORT,
//       envCommon.BATCH_LOG_ALERT_MAIL_FROM,
//       envCommon.BATCH_LOG_ALERT_PASSWORD_MAIL,
//       envCommon.BATCH_LOG_ALERT_MAIL_TO,
//       envCommon.BATCH_LOG_ALERT_MAIL_SUBJECT,
//     ], commonSiteId.P2TECH)

//     const transporter = nodeMailer.createTransport({
//       host: env[envCommon.BATCH_LOG_ALERT_MAIL_HOST],
//       port: env[envCommon.BATCH_LOG_ALERT_MAIL_PORT],
//       auth: {
//         user: env[envCommon.BATCH_LOG_ALERT_MAIL_FROM],
//         pass: env[envCommon.BATCH_LOG_ALERT_PASSWORD_MAIL],
//       },
//     })

//     const options = {
//       from: env[envCommon.BATCH_LOG_ALERT_MAIL_FROM],
//       to: env[envCommon.BATCH_LOG_ALERT_MAIL_TO],
//       subject: env[envCommon.BATCH_LOG_ALERT_MAIL_SUBJECT],
//       text: '',
//       html: htmlContent,
//       headers: {
//         References: Date.now(),
//       },
//     }

//     await transporter.sendMail(options)
//     return true
//   } catch (error) {
//     console.error(batchType ? `---Error send email batch_type = ${batchType} - Error: ${error}` : error)
//     return false
//   }
// }

const sendMailBatchLogAlert = async (batchLogObj) => {
  let batchType
  try {
    batchType = batchLogObj.batch_type
    const htmlContent = _getBatchLogEmailContent(batchLogObj)

    const transporter = nodeMailer.createTransport({
      host: process.env.BATCH_LOG_ALERT_MAIL_HOST,
      port: process.env.BATCH_LOG_ALERT_MAIL_PORT,
      auth: {
        user: process.env.BATCH_LOG_ALERT_MAIL_FROM,
        pass: process.env.BATCH_LOG_ALERT_PASSWORD_MAIL,
      },
    })

    const options = {
      from: process.env.BATCH_LOG_ALERT_MAIL_FROM,
      to: batchLogObj.sendTo,
      subject: process.env.BATCH_LOG_ALERT_MAIL_SUBJECT,
      text: '',
      html: htmlContent,
      headers: {
        References: Date.now(),
      },
    }

    await transporter.sendMail(options)
    return true
  } catch (error) {
    console.error(batchType ? `---Error send email batch_type = ${batchType} - Error: ${error}` : error)
    return false
  }
}

const _getEnvConfig = async (listENV, site, settingOption) => {
  let site_name
  switch (site) {
    case commonSiteId.P2TECH:
      site_name = 'p2t'
      break

    case commonSiteId.FXT:
      site_name = 'fxon'
      break

    case commonSiteId.ICPAY:
      site_name = 'icpay'
      break

    case commonSiteId.MY_FOREX:
      site_name = 'myforex'
      break

    case commonSiteId.FXS_XEM:
      site_name = 'fxs-xem'
      break

    default:
      site_name = 'p2t/multisite'
      break
  }

  const envArr = []
  listENV.forEach((el) => {
    if (settingOption) {
      // Do not send bcc emails
      if (settingOption.env_email_bcc_setting === 9 && el === envCommon.EMAIL_BCC) {
        return
      }

      // Get email bcc
      if (settingOption.env_email_bcc_setting && el === envCommon.EMAIL_BCC) {
        envArr.push(`/${site_name}/${process.env.NODE_ENV.toLowerCase()}/${el}/OPTION_${settingOption.env_email_bcc_setting}`)
        return
      }

      // Get email from config
      if (settingOption.env_email_from_setting && el !== envCommon.EMAIL_BCC) {
        envArr.push(`/${site_name}/${process.env.NODE_ENV.toLowerCase()}/${el}/OPTION_${settingOption.env_email_from_setting}`)
        return
      }
    }

    envArr.push(`/${site_name}/${process.env.NODE_ENV.toLowerCase()}/${el}`)
  })
  const parameters = await aws.getParameters(envArr)
  const envs = {}
  parameters.Parameters.forEach((el) => {
    envs[el.Name.replace(/\/OPTION_[0-9]+/, '').split('/').pop()] = el.Value
  })
  return envs
}

const _getBatchLogEmailContent = (obj) => {
  const resultDetail = obj.result_detail ? JSON.parse(obj.result_detail) : {}
  const content = `<p>システムのバッチ処理において、連続して三回失敗が発生いたしましたので、お知らせいたします。</p>
  <p>＊＊対象バッチ＊＊</p>
  <ul>
    <li>JOB TYPE: ${obj.batch_type}</li>
    <li>JOB名: ${obj.jobName}</li>
  </ul>
  <p>＊＊初回失敗エラー＊＊ </p>
  <ul>
    <li>初回失敗日時: "${obj.batch_error_time}"</li>
  </ul>
  <p>＊＊連続失敗回数＊＊ </p>
  <ul>
    <li>連続失敗回数: ${obj.batch_error_count}</li>
  </ul>
  <p>＊＊最終失敗のエラー概要＊＊</p>
  <ul>
    <li>バッチログID： ${obj.id}</li>
    <li>処理結果詳細ID： ${obj.result_detail_id}</li>
    <li>処理結果メッセージ: ${obj.result_message}</li>
  </ul>
  <p>＊＊最終失敗の処理結果詳細＊＊</p>
  <pre>${JSON.stringify(resultDetail, null, 2)}</pre>`

  return content
}

module.exports = {
  sendMail: sendMail,
  sendMailFXT,
  sendMailICPAY,
  sendMailMyForex,
  sendMailFXSignupXEM,
  sendMailBatchLogAlert,
  _getEnvConfig,
}
