/* eslint-disable max-len */
const moment = require('moment')
const { setDear } = require('../helper/template_myforex')
const { _renderCountryImg } = require('../helper/template_myforex')
const templateA = (
  urlImage,
  lang,
  typeLang,
  title,
  userName,
  contentList,
  urlTitle,
  url,
  code,
  urlLogin,
) => {
  // --------------------------Template A Default Variable--------------------------//
  const cmContact = ['ja', 'kr'].includes(typeLang) ?
    `<div style="color: #888888; line-height: 1.7; font-size: 14px; margin-top: 2.2em; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">${lang.cm_contact.pls}<a href="#" target="_blank" style="color: #0B3B5A; text-decoration: none; font-weight: bold;">${lang.cm_contact.company}</a>${lang.cm_contact.us}</div>` :
    `<div style="color: #888888; line-height: 1.7; font-size: 14px; margin-top: 2.2em; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">${lang.cm_contact.pls}${lang.cm_contact.us}<a href="#" target="_blank" style="color: #133F5D; text-decoration: none; font-weight: bold;">${lang.cm_contact.company}</a></div>`

  const cmEmail = ['ja', 'kr'].includes(typeLang) ?
    `<div style="color: #888888; line-height: 1.7; font-size: 14px; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">${lang.cm_email.value1}<a href="#" target="_blank" style="color: #0B3B5A; text-decoration: none; font-weight: bold;">${lang.cm_email.value2}</a>${lang.cm_email.value3}</div>` :
    `<div style="color: #888888; line-height: 1.7; font-size: 14px; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">${lang.cm_email.value1}${lang.cm_email.value2}<a href="#" target="_blank" style="color: #0B3B5A; text-decoration: none; font-weight: bold;">${lang.cm_email.value3}</a></div>`

  const cmQuestion = `<div style="color: #888888; line-height: 1.7; font-size: 14px; margin-top: 1.2em; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">${lang.cm_questions.value1}<a href="#" target="_blank" style="color: #0B3B5A; text-decoration: none; font-weight: bold;">${lang.cm_questions.value2}</a>${lang.cm_questions.value3}</div>`

  // --------------------------Template A Param Render--------------------------//
  let content = ''
  contentList.forEach((el, index) => {
    if (index === 0) {
      content =
        content +
        `<div style="color: #888888; line-height: 1.7; font-size: 14px; margin-top: 2.2em; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">${el}</div>`
    } else {
      content =
        content +
        `<div style="color: #888888; line-height: 1.7; font-size: 14px; margin-top: 1.2em; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">${el}</div>`
    }
  })
  const urlBlock =
    urlTitle && url ?
      `<div style="color: #888888; line-height: 1.7; font-size: 16px; font-weight: bold; margin-top: 2.2em; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif; word-break: break-all;">${urlTitle}</div>
  <div style="color: #888888; line-height: 1.7; font-size: 16px; margin-top: 1.2em; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif; word-break: break-all; background: #F6F6F6; border-radius: 4px; padding: 1em;"><a href="${url}" target="_blank" style="color: #0B3B5A; text-decoration: none;">${url}</a></div>` :
      '<div></div>'
  const codeBlock =
    urlTitle && code ?
      `<div style="color: #888888; line-height: 1.7; font-size: 16px; font-weight: bold; margin-top: 2.2em; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif; word-break: break-all;">${urlTitle}</div>
    <div style="color: #888888; line-height: 1.7; font-size: 16px; margin-top: 1.2em; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif; word-break: break-all; background: #F6F6F6; border-radius: 4px; padding: 1em;"><div style="color: #0B3B5A; text-decoration: none;">${code}</div></div>` :
      '<div></div>'

  const buttonLogin = urlLogin ?
    `<div style="margin-top: 2.2em;"><a href="${urlLogin}" target="_blank" style="display:block; background:#0B3B5A; color:#FFF; text-align:center; text-decoration:none; padding: 10px 5px; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif; font-size: 16px; font-weight: bold; border-radius: 4px;">${lang.cm_button}</a></div>` :
    '<div></div>'

  return `<body style="font-size:13px; color: #888888; background-color: #EAF0F2; padding:0; margin: 0;">
  
    <div class="page" style="background-color: #EAF0F2; padding:0; margin: 0;">
    
    <!-- container start -->
    <table border="0" cellspacing="0" cellpadding="0" align="center" width="800" style="margin: 0 auto;">
    
    <tbody><tr>
    <td valign="top" style="background-color: #FFFFFF;">
    <img src="${urlImage}/spacer.png" alt="spacer" width="800" height="1" border="0">
    </td>
    </tr>
    <tr>
    <td valign="top" style="background-color: #FFFFFF;">
    
    <!-- header start -->
    <table border="0" cellspacing="0" cellpadding="0" width="100%">
    <tbody><tr>
    <td style="padding: 45px 20px 30px">
    
    <table border="0" cellspacing="0" cellpadding="0" width="100%">
    <tbody><tr>
    <td style="width: 489px;">
    <img src="${urlImage}/logo_horizontal_color.png" alt="IC Pay" width="126" height="30" border="0">
    </td>
    <td style="width: 271px; text-align: right;">
    <img src="${urlImage}/header_lang_${_renderCountryImg(typeLang)}.png" alt="${_renderCountryImg(typeLang).toUpperCase()}" width="70" height="23" border="0">
    </td>
    </tr>
    </tbody></table>
    
    </td>
    </tr>
    </tbody></table>
    <!-- header end -->
    <!-- heading start -->
    <table border="0" cellspacing="0" cellpadding="0" width="100%">
    <tbody><tr>
    <td style="padding: 0 20px 40px">
    
    <table border="0" cellspacing="0" cellpadding="0" width="100%">
    <tbody><tr>
    <td style="width: 760px; color: #888888; border-top: 1px solid #0B3B5A; border-bottom: 3px solid #63B167; line-height: 1.7; font-size: 18px; font-weight: bold; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif; text-align: center; padding: 1em 0;">
    ${title}
    </td>
    </tr>
    </tbody></table>
    
    </td>
    </tr>
    </tbody></table>
    <!-- heading end -->
    
    <!-- contents start -->
    <table border="0" cellspacing="0" cellpadding="0" width="100%">
    <tbody><tr>
    <td style="padding: 0 30px 40px">
    
    <!-- main start -->
    <table border="0" cellspacing="0" cellpadding="0" width="100%">
    <tbody><tr>
    <td>
    
    <div style="color: #888888; line-height: 1.7; font-size: 16px; font-weight: bold; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">
    ${setDear(typeLang, lang, userName)}
    </div>

    ${content}
    ${urlBlock}
    ${codeBlock}
    ${buttonLogin}
    ${cmContact}
    
    </td>
    </tr>
    </tbody></table>
    <!-- main end -->
    
    </td>
    </tr>
    </tbody></table>
    <!-- contents end -->
    
    <!-- thanks start -->
    <table border="0" cellspacing="0" cellpadding="0" width="100%">
    <tbody><tr>
    <td style="padding: 0 20px 40px">
    
    <table border="0" cellspacing="0" cellpadding="0" width="100%">
    <tbody><tr>
    <td style="border-top: 1px solid #888888; padding: 30px 0 0;">
    ${cmEmail}
    ${cmQuestion}
    </td>
    </tr>
    </tbody></table>
    
    </td>
    </tr>
    </tbody></table>
    <!-- thanks end -->
    
    <!-- sns start -->
    <table border="0" cellspacing="0" cellpadding="0" width="100%">
    <tbody><tr>
    <td style="background: #F6F6F6; padding: 2em">
    
    <table border="0" cellspacing="0" cellpadding="0" width="100%">
    <tbody><tr>
    <td style="width: 632px">
    <img src="${urlImage}/logo_horizontal_gray.png" alt="IC Pay" width="158" height="37" border="0">
    </td>
    <td style="text-align: right; width: 116px;">
    
    <table border="0" cellspacing="0" cellpadding="0">
    <tbody><tr>
    <td><a href="#" target="_blank" style="text-decoration: none;"><img src="${urlImage}/footer_twitter.png" alt="twitter" width="32" height="32" border="0"></a></td>
    <td style="padding: 0 10px;"><a href="#" target="_blank" style="text-decoration: none;"><img src="${urlImage}/footer_facebook.png" alt="facebook" width="32" height="32" border="0"></a></td>
    <td><a href="#" target="_blank" style="text-decoration: none;"><img src="${urlImage}/footer_youtube.png" alt="youtube" width="32" height="32" border="0"></a></td>
    </tr>
    </tbody></table>
    
    </td>
    </tr>
    </tbody></table>
    
    </td>
    </tr>
    </tbody></table>
    <!-- sns end -->
    
    <!-- footer start -->
    <table border="0" cellspacing="0" cellpadding="0" width="100%">
    <tbody><tr>
    <td style="padding: 3em 2em 2em">
    
    <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
    <tbody><tr>
    <td style="padding-right: 6em;">
    <div style="line-height: 1.7; color: #0B3B5A; font-size: 14px; font-weight: bold; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">${lang.cm_footer.value1
}</div>
    <div style="line-height: 1.7; color: #888888; font-size: 14px; margin-top: 1.2em; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">${lang.cm_footer.value2
}<br>${lang.cm_footer.value3}</div>
    <div style="line-height: 1.7; color: #888888; font-size: 14px; margin-top: 1.2em; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">${lang.cm_footer.value4
}<br>${lang.cm_footer.value5}<br>${lang.cm_footer.value6}</div>
    </td>
    <td>
    <div style="line-height: 1.7; color: #0B3B5A;font-size: 14px; font-weight: bold; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">IC PAYMENT PTE LTD</div>
    <div style="line-height: 1.7; color: #888888; font-size: 14px; margin-top: 1.2em; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">ACRA/Registration No.202035062D<br>LEI CODE: 353800QJGESSGRH91885</div>
    <div style="line-height: 1.7; color: #888888; font-size: 14px; margin-top: 1.2em; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">2 Kallang Avenue #07-25<br>CT HUB, Singapore 339407<br>TEL: +65-6715-1501 FAX: +65-6715-1503</div>
    </td>
    </tr>
    </tbody></table>
    
    <div style="line-height: 1.7; color: #888888; font-size: 12px; margin-top: 2.2em; text-align: center; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;"><a href="#" target="_blank" style="color: #0B3B5A; text-decoration: none; font-weight: bold;">${lang.cm_policy.value1}</a><span style="padding: 0 0.5em;">|</span><a href="#" target="_blank" style="color: #0B3B5A; text-decoration: none; font-weight: bold;">${lang.cm_policy.value2
}</a><span style="padding: 0 0.5em;">|</span><a href="#" target="_blank" style="color: #0B3B5A; text-decoration: none; font-weight: bold;">${lang.cm_policy.value3
}</a></div>
    
    </td>
    </tr>
    </tbody></table>
    <!-- footer end -->
    
    <!-- copyright start -->
    <table border="0" cellspacing="0" cellpadding="0" width="100%">
    <tbody><tr>
    <td style="width: 800px; line-height: 1.7; font-size: 12px; padding: 0.5em; background: #0B3B5A; color: #FFF; text-align: center; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif;">
    Copyright © 2020-${moment.utc().format('YYYY')} IC PAYMENT. All rights reserved.
    </td>
    </tr>
    </tbody></table>
    <!-- copyright end -->
    </td>
    </tr>
    </tbody></table>
    <!-- container end -->
    
    </div>
    </body>`
}

module.exports = {
  templateA,
}
