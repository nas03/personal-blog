const moment = require('moment')

/* eslint-disable max-len */
const templateA = (
  urlImage,
  lang,
  typeLang,
  title,
  userName,
  bodyList,
  title_2,
  contentInfo,
  annotationList,
  isText = false,
  urlLogin = false,
) => {
  let content = ''
  if (Array.isArray(contentInfo)) {
    contentInfo.forEach((el) => {
      content = content +
        `<div style="line-height: 1.7; font-size: 15px; margin-top: 1.2em; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif; word-break: break-all; ${el.isBold ? 'font-weight: bold;' : ''}">${el.title}</div>
        <div style="line-height: 1.7; font-size: 15px; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif; padding-left: 0.9em; word-break: break-all;">${el.content}</div>`
    })
  } else if (isText) {
    content = `<div style="line-height: 1.7; font-size: 15px; margin-top: 1.2em; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif; word-break: break-all;">${contentInfo}</div>`
  } else {
    content = `<div style="line-height: 1.7; font-size: 15px; margin-top: 1.2em; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif; word-break: break-all;"> <a href="${contentInfo}" style="text-decoration: none;">${contentInfo}</a></div>`
  }

  let body = ''
  bodyList.forEach((el) => {
    body = body + `<div style="line-height: 1.7; font-size: 15px; margin-top: 1.2em; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">${el}</div>`
  })

  let note = ''
  annotationList.forEach((el, index) => {
    if (index === 0) {
      note = note + `<div style="line-height: 1.7; font-size: 15px; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">${el}</div>`
    } else {
      note = note + ` <div style="line-height: 1.7; font-size: 15px; margin-top: 1.2em; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">${el}</div>`
    }
  })

  const titleBlock = title_2 ? `<div style="line-height: 1.7; font-size: 15px; font-weight: bold; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif; word-break: break-all;">${title_2}</div>` :
    ''

  const buttonLogin = urlLogin ?
    `<div style="width: 400px; margin: 3em auto 0;"><a href="${urlLogin}" target="_blank" style="display:block; background-color:#F4A231; color:#FFF; text-align:center; text-decoration:none; padding: 10px 5px; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif; font-size: 18px; font-weight: bold; border-radius: 5px;">${lang.cm_button_login}</a></div>` :
    ''


  const bodyBlock2 = titleBlock || content || buttonLogin ? `<div style="padding: 3em 0; border-top: 4px solid #F4A231;">
  <table border="0" cellspacing="0" cellpadding="0" width="100%">
  <tr>
  <td>
  ${titleBlock}
  ${content}
  </td>
  </tr>
  </table>
  ${buttonLogin}
  </div>` : '<div></div>'

  return `<body style="font-size:13px; color: #444444; background-color: #EEEEEE; padding:0; margin: 0;">

  <div class="page" style="background-color: #EEEEEE; padding:0; margin: 0;">
  
  <!-- header start -->
  <table border="0" cellspacing="0" cellpadding="0" width="100%" align="center">
  <tr>
  <td valign="top" style="background-color: #FFFFFF;">
  <table border="0" cellspacing="0" cellpadding="0" width="700" align="center">
  <tr>
  <td valign="top">
  <table border="0" cellspacing="0" cellpadding="0" align="center" width="100%" style="height: 70px;">
  <tr>
  <td style="text-align: left; width: 400px;"><a href="${process.env.WF_DOMAIN_MYFOREX}/access.php?id=home" target="_blank"><img src="${urlImage}/logo_color.png" alt="Myforex" width="147" height="17" border="0"></a></td>
  <td style="text-align: right; width: 300px;"><img src="${urlImage}/header_lang_${_renderCountryImg(typeLang)}.png" alt="JA" width="97" height="31" border="0"></td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  <tr>
  <td valign="top" style="background-color: #FFFFFF; padding: 0; height: 9px;">
  <div><img src="${urlImage}/header_shadow.png" alt="shadow" width="100%" height="9" border="0" style="vertical-align: bottom; padding: 0; margin: 0;"></div>
  </td>
  </tr>
  </table>
  <!-- header end -->
  <!-- container start -->
  <table border="0" cellspacing="0" cellpadding="0" align="center" width="700" style="margin: 2em auto 0;">
  <tr>
  <td style="padding-bottom: 1.5em;">
  <div style="background-color: #FDE4B7; padding: 1em; border-radius: 3px; text-align: center; font-size: 18px; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">
${title}
  </div>
  </td>
  </tr>
  <tr>
  <td valign="top" style="background-color: #FFFFFF;">
  
  <!-- contents start -->
  <table border="0" cellspacing="0" cellpadding="0" width="100%">
  <tr>
  <td style="padding: 0 2em">
  
  <!-- intro start -->
  <table border="0" cellspacing="0" cellpadding="0" width="100%">
  <tr>
  <td style="padding: 2em 0 3em;">
  <div style="line-height: 1.7; font-size: 15px; font-weight: bold; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">${setDear(typeLang, lang, userName)}</div>
  ${body}
  </td>
  </tr>
  </table>
  <!-- intro end -->
  
  <!-- body start -->
  ${bodyBlock2}
  <!-- body end -->
  
  </td>
  </tr>
  </table>
  <!-- contents end -->
  
  <!-- footer start -->
  
  <!-- thanks start -->
  <table border="0" cellspacing="0" cellpadding="0" width="100%">
  <tr>
  <td style="padding: 0 2em">
  <table border="0" cellspacing="0" cellpadding="0" width="100%">
  <tr>
  <td style="padding: 2em 0; border-top: 1px solid #BBBBBB;">
  ${note}
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  <!-- thanks end -->
  
  <!-- contact start -->
  <table border="0" cellspacing="0" cellpadding="0" width="100%">
  <tr>
  <td style="padding: 0 2em">
  <table border="0" cellspacing="0" cellpadding="0" width="100%">
  <tr>
  <td style="padding: 2em 0; border-top: 1px solid #BBBBBB;">
  <div style="line-height: 1.7; font-size: 15px; font-weight: bold; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">${lang.cm_inquiries}</div>
  <table border="0" cellspacing="0" cellpadding="0" width="100%" style="margin-top: 1.2em;">
  <tr>
  <td valign="top">
  <div style="line-height: 1.7; font-size: 15px; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;"><a href="${process.env.WF_DOMAIN_MYFOREX}/access.php?id=contact" target="_blank" style="color: #1F2672; text-decoration: none;">${lang.cm_inquiries_email}</a></div>
  </td>
  <td valign="top">
  <div style="line-height: 1.7; font-size: 15px; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">${lang.cm_time1}<br>${lang.cm_time2}</div>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  <!-- contact end -->
  
  <!-- disclaimer start -->
  <table border="0" cellspacing="0" cellpadding="0" width="100%">
  <tr>
  <td style="padding: 0 2em">
  <table border="0" cellspacing="0" cellpadding="0" width="100%">
  <tr>
  <td style="padding: 2em 0; border-top: 1px solid #BBBBBB;">
  <div style="line-height: 1.7; font-size: 13px; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">${lang.cm_text}</div>
  <div style="line-height: 1.7; font-size: 13px; text-align: center; margin-top: 1.2em; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;"><a href="${process.env.WF_DOMAIN_MYFOREX}/access.php?id=tandc" target="_blank" style="color: #1F2672; text-decoration: none;">${lang.cm_tandc}</a> | <a href="${process.env.WF_DOMAIN_MYFOREX}/access.php?id=kyc" target="_blank" style="color: #1F2672; text-decoration: none;">${lang.cm_kyc}</a> | <a href="${process.env.WF_DOMAIN_MYFOREX}/access.php?id=privacy-policy" target="_blank" style="color: #1F2672; text-decoration: none;">${lang.cm_privacy_policy}</a></div>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  <!-- disclaimer end -->
  
  <!-- info start -->
  <div style="padding: 2em; background-color: #FEF4E7; border-top: 4px solid #FDE4B7;">
  <table border="0" cellspacing="0" cellpadding="0" width="100%">
  <tr>
  <td>
  <table border="0" cellspacing="0" cellpadding="0" width="100%">
  <tr>
  <td style="width: 167px;"><a href="${process.env.WF_DOMAIN_MYFOREX}/access.php?id=home" target="_blank"><img src="${urlImage}/footer_logo.png" alt="Myforex" width="165" height="23" border="0"></a></td>
  <td style="padding: 0 2em">
  <div style="line-height: 1.7; font-size: 13px; font-weight: bold; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">MYFOREX INVESTMENT LLC</div>
  <div style="line-height: 1.7; font-size: 13px; margin-top: 0.5em; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">Georgia, Tbilisi, Chughureti district, <br>Iv. Javakhishvili str., N91, apt. 2b</div>
  </td>
  <td style="width: 130px; text-align: right;">
  <table border="0" cellspacing="0" cellpadding="0" width="100%">
  <tr>
  <td style="text-align: left;">
  <a href="${process.env.WF_DOMAIN_MYFOREX}/access.php?id=facebook" target="_blank"><img src="${urlImage}/footer_facebook.png" alt="facebook" width="32" height="32" border="0"></a></td>
  <td style="text-align: center; padding: 0 10px;">
  <a href="${process.env.WF_DOMAIN_MYFOREX}/access.php?id=twitter" target="_blank"><img src="${urlImage}/footer_twitter.png" alt="twitter" width="32" height="32" border="0"></a>
  </td>
  <td style="text-align: right;">
  <a href="${process.env.WF_DOMAIN_MYFOREX}/access.php?id=youtube" target="_blank"><img src="${urlImage}/footer_youtube.png" alt="Youtube" width="32" height="32" border="0"></a>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </div>
  <!-- info end -->
  
  <!-- copyright start -->
  <div style="padding: 0.5em; background-color: #F4A231;">
  <table border="0" cellspacing="0" cellpadding="0" align="center" width="700">
  <tr>
  <td>
  <table border="0" cellspacing="0" cellpadding="0" width="100%">
  <tr>
  <td>
  <div style="line-height: 1.7; font-size: 13px; text-align: center; color: #FFFFFF; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">Copyright &copy; 2020-${moment.utc().format('YYYY')} MYFOREX INVESTMENT LLC All rights reserved.</div>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </div>
  <!-- copyright end -->
  <!-- footer end -->
  
  </td>
  </tr>
  </table>
  <!-- container end -->
  
  </div>
  
  </body>`
}


const templateB = (
  urlImage,
  lang,
  typeLang,
  title,
  userName,
  bodyList,
  blockList,
  annotationList,
  urlLogin = false,
) => {
  let content = ''

  blockList.forEach((block, index) => {
    let table = ''
    block.blockData.forEach((el, index) => {
      if (index === 0) {
        table = table + `<tr>
        <td width="600" style="background-color: #EEEEEE; padding: 0.7em 1em;">
        <div style="line-height: 1.7; font-size: 15px; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif; word-break: break-all;">${el.title}</div>
        </td>
        </tr>
        <tr>
        <td width="600" style="border-top: 1px solid #DDDDDD; background-color: #FFFFFF; padding: 0.7em 1em; text-align: right;">
        <div style="line-height: 1.7; font-size: 15px; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif; word-break: break-all;">${el.content}</div>
        </td>
        </tr>`
      } else {
        table = table + `<tr>
        <td width="600" style="border-top: 1px solid #DDDDDD; background-color: #EEEEEE; padding: 0.7em 1em;">
        <div style="line-height: 1.7; font-size: 15px; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif; word-break: break-all;">${el.title}</div>
        </td>
        </tr>
        <tr>
        <td width="600" style="border-top: 1px solid #DDDDDD; background-color: #FFFFFF; padding: 0.7em 1em; text-align: right;">
        <div style="line-height: 1.7; font-size: 15px; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif; word-break: break-all;">${el.content}</div>
        </td>
        </tr>`
      }
    })

    if (index === 0) {
      content = content + `
          <table border="0" cellspacing="0" cellpadding="0" width="100%">
          <tr>
          <td>
          <div style="line-height: 1.7; font-size: 15px; font-weight: bold; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif; word-break: break-all;">${block.blockTitle}</div>
          <div style="margin: 2em auto 0; width: 600px; border: 1px solid #DDDDDD; border-radius: 3px; overflow: hidden;">
          <table border="0" cellspacing="0" cellpadding="0" width="600" align="center" style="border-collapse: collapse;">
          <tbody>
          ${table}
          </tbody>
          </table>
          </div>
          </td>
          </tr>
          </table>`
    } else {
      content = content + `
          <table border="0" cellspacing="0" cellpadding="0" width="100%" style="margin-top: 30px;">
          <tr>
          <td>
          <div style="line-height: 1.7; font-size: 15px; font-weight: bold; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif; word-break: break-all;">${block.blockTitle}</div>
          <div style="margin: 2em auto 0; width: 600px; border: 1px solid #DDDDDD; border-radius: 3px; overflow: hidden;">
          <table border="0" cellspacing="0" cellpadding="0" width="600" align="center" style="border-collapse: collapse;">
          <tbody>
          ${table}
          </tbody>
          </table>
          </div>
          </td>
          </tr>
          </table>`
    }
    table = ''
  })


  let body = ''
  bodyList.forEach((el) => {
    body = body + `<div style="line-height: 1.7; font-size: 15px; margin-top: 1.2em; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">${el}</div>`
  })

  let note = ''
  annotationList.forEach((el, index) => {
    if (index === 0) {
      note = note + `<div style="line-height: 1.7; font-size: 15px; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">${el}</div>`
    } else {
      note = note + ` <div style="line-height: 1.7; font-size: 15px; margin-top: 1.2em; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">${el}</div>`
    }
  })

  const buttonLogin = urlLogin ?
    `<div style="width: 400px; margin: 3em auto 0;"><a href="${urlLogin}" target="_blank" style="display:block; background-color:#F4A231; color:#FFF; text-align:center; text-decoration:none; padding: 10px 5px; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif; font-size: 18px; font-weight: bold; border-radius: 5px;">${lang.cm_button_login}</a></div>` :
    '<div></div>'

  return `<body style="font-size:13px; color: #444444; background-color: #EEEEEE; padding:0; margin: 0;">

  <div class="page" style="background-color: #EEEEEE; padding:0; margin: 0;">
  
  <!-- header start -->
  <table border="0" cellspacing="0" cellpadding="0" width="100%" align="center">
  <tr>
  <td valign="top" style="background-color: #FFFFFF;">
  <table border="0" cellspacing="0" cellpadding="0" width="700" align="center">
  <tr>
  <td valign="top">
  <table border="0" cellspacing="0" cellpadding="0" align="center" width="100%" style="height: 70px;">
  <tr>
  <td style="text-align: left; width: 400px;"><a href="${process.env.WF_DOMAIN_MYFOREX}/access.php?id=home" target="_blank"><img src="${urlImage}/logo_color.png" alt="Myforex" width="147" height="17" border="0"></a></td>
  <td style="text-align: right; width: 300px;"><img src="${urlImage}/header_lang_${_renderCountryImg(typeLang)}.png" alt="JA" width="97" height="31" border="0"></td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  <tr>
  <td valign="top" style="background-color: #FFFFFF; padding: 0; height: 9px;">
  <div><img src="${urlImage}/header_shadow.png" alt="shadow" width="100%" height="9" border="0" style="vertical-align: bottom; padding: 0; margin: 0;"></div>
  </td>
  </tr>
  </table>
  <!-- header end -->
  <!-- container start -->
  <table border="0" cellspacing="0" cellpadding="0" align="center" width="700" style="margin: 2em auto 0;">
  <tr>
  <td style="padding-bottom: 1.5em;">
  <div style="background-color: #FDE4B7; padding: 1em; border-radius: 3px; text-align: center; font-size: 18px; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">
${title}
  </div>
  </td>
  </tr>
  <tr>
  <td valign="top" style="background-color: #FFFFFF;">
  
  <!-- contents start -->
  <table border="0" cellspacing="0" cellpadding="0" width="100%">
  <tr>
  <td style="padding: 0 2em">
  
  <!-- intro start -->
  <table border="0" cellspacing="0" cellpadding="0" width="100%">
  <tr>
  <td style="padding: 2em 0 3em;">
  <div style="line-height: 1.7; font-size: 15px; font-weight: bold; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">${setDear(typeLang, lang, userName)}</div>
  ${body}
  </td>
  </tr>
  </table>
  <!-- intro end -->
  
  <!-- body start -->
  <div style="padding: 3em 0; border-top: 4px solid #F4A231;">
  
  ${content}
  ${buttonLogin}
  </div>
  <!-- body end -->
  
  </td>
  </tr>
  </table>
  <!-- contents end -->
  
  <!-- footer start -->
  
  <!-- thanks start -->
  <table border="0" cellspacing="0" cellpadding="0" width="100%">
  <tr>
  <td style="padding: 0 2em">
  <table border="0" cellspacing="0" cellpadding="0" width="100%">
  <tr>
  <td style="padding: 2em 0; border-top: 1px solid #BBBBBB;">
  ${note}
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  <!-- thanks end -->
  
  <!-- contact start -->
  <table border="0" cellspacing="0" cellpadding="0" width="100%">
  <tr>
  <td style="padding: 0 2em">
  <table border="0" cellspacing="0" cellpadding="0" width="100%">
  <tr>
  <td style="padding: 2em 0; border-top: 1px solid #BBBBBB;">
  <div style="line-height: 1.7; font-size: 15px; font-weight: bold; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">${lang.cm_inquiries}</div>
  <table border="0" cellspacing="0" cellpadding="0" width="100%" style="margin-top: 1.2em;">
  <tr>
  <td valign="top">
  <div style="line-height: 1.7; font-size: 15px; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;"><a href="${process.env.WF_DOMAIN_MYFOREX}/access.php?id=contact" target="_blank" style="color: #1F2672; text-decoration: none;">${lang.cm_inquiries_email}</a></div>
  </td>
  <td valign="top">
  <div style="line-height: 1.7; font-size: 15px; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">${lang.cm_time1}<br>${lang.cm_time2}</div>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  <!-- contact end -->
  
  <!-- disclaimer start -->
  <table border="0" cellspacing="0" cellpadding="0" width="100%">
  <tr>
  <td style="padding: 0 2em">
  <table border="0" cellspacing="0" cellpadding="0" width="100%">
  <tr>
  <td style="padding: 2em 0; border-top: 1px solid #BBBBBB;">
  <div style="line-height: 1.7; font-size: 13px; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">${lang.cm_text}</div>
  <div style="line-height: 1.7; font-size: 13px; text-align: center; margin-top: 1.2em; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;"><a href="${process.env.WF_DOMAIN_MYFOREX}/access.php?id=tandc" target="_blank" style="color: #1F2672; text-decoration: none;">${lang.cm_tandc}</a> | <a href="${process.env.WF_DOMAIN_MYFOREX}/access.php?id=kyc" target="_blank" style="color: #1F2672; text-decoration: none;">${lang.cm_kyc}</a> | <a href="${process.env.WF_DOMAIN_MYFOREX}/access.php?id=privacy-policy" target="_blank" style="color: #1F2672; text-decoration: none;">${lang.cm_privacy_policy}</a></div>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  <!-- disclaimer end -->
  
  <!-- info start -->
  <div style="padding: 2em; background-color: #FEF4E7; border-top: 4px solid #FDE4B7;">
  <table border="0" cellspacing="0" cellpadding="0" width="100%">
  <tr>
  <td>
  <table border="0" cellspacing="0" cellpadding="0" width="100%">
  <tr>
  <td style="width: 167px;"><a href="${process.env.WF_DOMAIN_MYFOREX}/access.php?id=home" target="_blank"><img src="${urlImage}/footer_logo.png" alt="Myforex" width="165" height="23" border="0"></a></td>
  <td style="padding: 0 2em">
  <div style="line-height: 1.7; font-size: 13px; font-weight: bold; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">MYFOREX INVESTMENT LLC</div>
  <div style="line-height: 1.7; font-size: 13px; margin-top: 0.5em; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">Georgia, Tbilisi, Chughureti district, <br>Iv. Javakhishvili str., N91, apt. 2b</div>
  </td>
  <td style="width: 130px; text-align: right;">
  <table border="0" cellspacing="0" cellpadding="0" width="100%">
  <tr>
  <td style="text-align: left;">
  <a href="${process.env.WF_DOMAIN_MYFOREX}/access.php?id=facebook" target="_blank"><img src="${urlImage}/footer_facebook.png" alt="facebook" width="32" height="32" border="0"></a></td>
  <td style="text-align: center; padding: 0 10px;">
  <a href="${process.env.WF_DOMAIN_MYFOREX}/access.php?id=twitter" target="_blank"><img src="${urlImage}/footer_twitter.png" alt="twitter" width="32" height="32" border="0"></a>
  </td>
  <td style="text-align: right;">
  <a href="${process.env.WF_DOMAIN_MYFOREX}/access.php?id=youtube" target="_blank"><img src="${urlImage}/footer_youtube.png" alt="Youtube" width="32" height="32" border="0"></a>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </div>
  <!-- info end -->
  
  <!-- copyright start -->
  <div style="padding: 0.5em; background-color: #F4A231;">
  <table border="0" cellspacing="0" cellpadding="0" align="center" width="700">
  <tr>
  <td>
  <table border="0" cellspacing="0" cellpadding="0" width="100%">
  <tr>
  <td>
  <div style="line-height: 1.7; font-size: 13px; text-align: center; color: #FFFFFF; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">Copyright &copy; 2020-${moment.utc().format('YYYY')} MYFOREX INVESTMENT LLC All rights reserved.</div>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </div>
  <!-- copyright end -->
  <!-- footer end -->
  
  </td>
  </tr>
  </table>
  <!-- container end -->
  
  </div>
  
  </body>`
}


const setDear = (typeLang, lang, clientName) => {
  if (typeLang === 'en') {
    return lang.dear + ' ' + clientName
  } else {
    return clientName + ' ' + lang.dear
  }
}

const _renderCountryImg = (lang) => {
  return lang.toLowerCase() === 'ja' ? 'jp' : lang.toLowerCase()
}

module.exports = {
  templateA,
  templateB,
  setDear,
  _renderCountryImg,
}
