/* eslint-disable max-len */
const moment = require('moment')
const { urlImageBase } = require('constant')

const urlImg = urlImageBase.MAIL_P2T
const siteNameFxon = process.env.SITE_NAME_FXON

const templateP2T = (lang, typeLang, clientName, title, tableTitle, content, footer, urlLogin) => {
  let dataTitle = ''
  let dataTable = ''
  let dataFooter = ''

  // MODIFY TITLE MAIL
  title.forEach((el, index) => {
    if (index === 0) {
      dataTitle =
        dataTitle +
        `<div style="color: #666666; line-height: 1.7; font-family: 'メイリオ', 'Meiryo', sans-serif; font-size: 14px; margin-top: 2.2em;">${el}</div>`
    } else {
      dataTitle =
        dataTitle +
        `<div style="color: #666666; line-height: 1.7; font-family: 'メイリオ', 'Meiryo', sans-serif; font-size: 14px; margin-top: 1.2em;">${el}</div>`
    }
  })

  // MODIFY CONTENT MAIL
  const { type, data } = content
  if (type === 'table') {
    dataTable =
      dataTable +
      '<td style="color: #666666; line-height: 1.7; text-align: left; padding: 20px; background-color: #F7F7F7; border-radius: 4px; font-size: 14px;"><table border="0" cellspacing="0" cellpadding="0" align="center" width="100%">'
    data.forEach((el) => {
      if (el.img) {
        dataTable =
          dataTable +
          `<tr><td style="width: 160px; color: #666666; line-height: 2.4; font-family: 'メイリオ', 'Meiryo', sans-serif; font-size: 14px; font-weight: bold; text-align: left; vertical-align: middle;">${el.title}:</td>
          <td style="width: 16px; color: #666666; line-height: 2.4; text-align: left; vertical-align: middle;"><img src="${el.img}" alt="pc" width="16" height="16" border="0" style="vertical-align: middle;"></td>
          <td style="width: 430px; padding-left: 4px; color: #666666; line-height: 2.4; font-family: 'メイリオ', 'Meiryo', sans-serif; font-size: 14px; text-align: left; vertical-align: middle;">${el.data}</td></tr>`
      } else {
        dataTable =
          dataTable +
          `<tr><td style="width: 160px; color: #666666; line-height: 2.4; font-family: 'メイリオ', 'Meiryo', sans-serif; font-size: 14px; font-weight: bold; text-align: left; vertical-align: middle;">${el.title}:</td>
          <td colspan="2" style="width: 450px; color: #666666; line-height: 2.4; font-family: 'メイリオ', 'Meiryo', sans-serif; font-size: 14px; text-align: left; vertical-align: middle;">${el.data}</td></tr>`
      }
    })
    dataTable = dataTable + '</table></td>'
  } else if (type === 'link') {
    dataTable =
      '<td style="color: #666666; line-height: 1.7; text-align: left; padding: 20px; background-color: #F7F7F7; border-radius: 4px; font-size: 14px;">' +
      `<a href="${data}" target="_blank" style="color: #0085B2; line-height: 1.7; font-family: 'メイリオ', 'Meiryo', sans-serif; font-size: 14px; text-decoration: none;">${data}</a></td>`
  } else {
    dataTable = `<td style="color: #666666; line-height: 1.7; text-align: left; padding: 20px; background-color: #F7F7F7; border-radius: 4px; font-size: 20px; font-weight: bold;">${data}</td>`
  }

  // MODIFY FOOTER MAIL
  footer.forEach((el, index) => {
    if (index === 0) {
      dataFooter =
        dataFooter +
        `<div style="color: #666666; line-height: 1.7; font-family: 'メイリオ', 'Meiryo', sans-serif; font-size: 14px; margin-top: 2.2em;">${el}</div>`
    } else {
      dataFooter =
        dataFooter +
        `<div style="color: #666666; line-height: 1.7; font-family: 'メイリオ', 'Meiryo', sans-serif; font-size: 14px; margin-top: 1.2em;">${el}</div>`
    }
  })

  const loginTag = urlLogin ?
    `<div style="color: #666666; line-height: 1.7; font-family: 'メイリオ', 'Meiryo', sans-serif; font-size: 14px; margin-top: 1.2em;">
    <a href="${urlLogin}" target="_blank" style="color: #0085B2; line-height: 1.7; font-family: 'メイリオ', 'Meiryo', sans-serif; font-size: 14px; text-decoration: underline;">${lang.cm_login}</a>
    </div>` :
    '<div></div>'

  return `<body style="font-size:14px; color: #666666; background-color: #EBEBEB; padding: 0; margin: 0;">

  <div class="page" style="background-color: #EBEBEB; padding: 2em 0; margin: 0;">
  <!-- container start -->
  <table border="0" cellspacing="0" cellpadding="0" align="center" width="700" style="margin: 0 auto;">
  <tr>
  <td valign="top" style="background-color: #FFFFFF; padding: 0;">
  <!-- contents start -->
  <table border="0" cellspacing="0" cellpadding="0" width="100%">
  <tr>
  <td style="border-top: solid 1px #DDDDDD; border-left: solid 1px #DDDDDD; border-right: solid 1px #DDDDDD; padding: 0 24px 3em;">
  <!-- header start -->
  <table border="0" cellspacing="0" cellpadding="0" align="center" width="100%" style="margin: 0 auto;">
  <tr>
  <td style="border-bottom: #dddddd 1px solid; text-align: left; padding: 2.5em 0 1.5em;">
  <div style="height: 1px;"><img src="${urlImg}/spacer.png" alt="spacer" width="650" height="1" border="0" style="margin: 0; padding: 0;"></div>
  <div style="height: 32px;"><img src="${urlImg}/logo_p2_mono.png" alt="P2 TECH" width="118" height="32" border="0"></div>
  </td>
  </tr>
  </table>
  <!-- header end -->
  <!-- inner start -->
  <table border="0" cellspacing="0" cellpadding="0" align="center" width="100%" style="margin: 0 auto; color: #666666; line-height: 1.7; font-family: 'メイリオ', 'Meiryo', sans-serif;">
  <tr>
  <td style="text-align: left;">
  <div style="color: #666666; line-height: 1.7; font-family: 'メイリオ', 'Meiryo', sans-serif; font-size: 16px; margin-top: 3em; font-weight: bold;">${setDear(typeLang, lang, clientName)}</div>
  ${dataTitle}
  <div style="color: #666666; line-height: 1.7; font-family: 'メイリオ', 'Meiryo', sans-serif; font-size: 16px; margin-top: 2.2em; margin-bottom: 1.2em; font-weight: bold;">${tableTitle}</div>
  <table border="0" cellspacing="0" cellpadding="0" align="center" width="100%">
  <tr>
  ${dataTable}
  </tr>
  </table>
  ${dataFooter}
  ${loginTag}
  </td>
  </tr>
  </table>
  <!-- inner end -->
  </td>
  </tr>
  </table>
  <!-- contents end -->
  </td>
  </tr>
  
  <tr>
  <td valign="top" style="background-color: #2A3F54;">
  <!-- footer start -->
  <table border="0" cellspacing="0" cellpadding="0" align="center" width="700">
  <tr>
  <td style="padding: 0 24px;">
  <table border="0" cellspacing="0" cellpadding="0" align="center" width="100%" style="font-family: 'メイリオ', 'Meiryo', sans-serif;">
  <tr>
  <td style="width: 150px; height: 44px; vertical-align: middle; text-align: left;">
  <div style="color: #FFFFFF; line-height: 1.7; font-family: 'メイリオ', 'Meiryo', sans-serif; font-size: 12px; font-weight: bold; ">P2 TECH PTE LTD</div>
  </td>
  <td style="width: 400px; height: 44px; vertical-align: middle; text-align: right;">
  <div style="color: #FFFFFF; line-height: 1.7; font-family: 'メイリオ', 'Meiryo', sans-serif; font-size: 12px;">83 Clemenceau Avenue, #18-01 UE Square, Singapore 239920</div>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  <!-- footer end -->
  </td>
  </tr>
  
  <tr>
  <td valign="top">
  <!-- footer nav start -->
  <table border="0" cellspacing="0" cellpadding="0" align="center" width="700" style="font-family: 'メイリオ', 'Meiryo', sans-serif;">
  <tr>
  <td style="text-align: center;">
  <div style="color: #666666; line-height: 1.7; margin-top: 1.2em; font-family: 'メイリオ', 'Meiryo', sans-serif; font-size: 12px;">Copyright © 2017-${moment.utc().format('YYYY')} P2 TECH PTE LTD. All rights reserved.</div>
  <div style="color: #666666; line-height: 1.7; margin-top: 0.6em; font-family: 'メイリオ', 'Meiryo', sans-serif; font-size: 12px;"><a href="https://p2t.sg/access.php?id=privacy" target="_blank" style="color: #666666; text-decoration: underline;">Privacy</a> | <a href="#" style="color: #666666; text-decoration: underline;">T & C</a></div>
  <div style="height: 1px;"><img src="${urlImg}/spacer.png" alt="spacer" width="700" height="1" border="0" style="margin: 0; padding: 0;"></div>
  </td>
  </tr>
  </table>
  <!-- footer nav start -->
  </td>
  </tr>
  
  </table>
  <!-- container end -->
  </div>
  
  </body>`
}

// template A, template B FXON
const templateB = (
  urlImage,
  loginUrl,
  lang,
  typeLang,
  title,
  userName,
  contentList,
  blockList,
  hrefUrl = null,
) => {
  const footer = ['ja', 'kr'].includes(typeLang) ?
    `<div style="color: #444444; line-height: 1.7; font-size: 14px; margin-top: 2.2em; font-family:'メイリオ', 'Meiryo', sans-serif;">${lang.cm_contact.pls}<a href="${process.env.WF_DOMAIN_FXON}/access.php?id=inquiry" target="_blank" style="color: #133F5D; text-decoration: none; font-weight: bold;">${lang.cm_contact.company}</a>${lang.cm_contact.us}</div>` :
    `<div style="color: #444444; line-height: 1.7; font-size: 14px; margin-top: 2.2em; font-family:'メイリオ', 'Meiryo', sans-serif;">${lang.cm_contact.pls}${lang.cm_contact.us}<a href="${process.env.WF_DOMAIN_FXON}/access.php?id=inquiry" target="_blank" style="color: #133F5D; text-decoration: none; font-weight: bold;">${lang.cm_contact.company}</a></div>`

  let content = ''
  contentList.forEach((el, index) => {
    if (index === 0) {
      content =
        content +
        `<div style="color: #444444; line-height: 1.7; font-size: 14px; margin-top: 2.2em; font-family:'メイリオ', 'Meiryo', sans-serif;">${el}</div>`
    } else {
      content =
        content +
        `<div style="color: #444444; line-height: 1.7; font-size: 14px; margin-top: 1.2em; font-family:'メイリオ', 'Meiryo', sans-serif;">${el}</div>`
    }
  })

  let scope = ''
  blockList.forEach((block) => {
    let table = ''
    // only content (does not contain tables)
    if (typeof block.blockData === 'string') {
      scope = scope + `
        <div style="color: #444444; line-height: 1.7; font-size: 16px; font-weight: bold; margin-top: 2.2em; font-family:'メイリオ', 'Meiryo', sans-serif; word-break: break-all;">${block?.blockTitle}</div>
        <div style="color: #444444; line-height: 1.7; font-size: 14px; margin-top: 1.2em; font-family:'メイリオ', 'Meiryo', sans-serif;">${block?.blockData}</div>
      `
      return
    }

    block.blockData.forEach((el, index) => {
      if (index === 0) {
        table =
          table +
          `<tr>
  <th style="width: 406px; color: #444444; line-height: 1.7; font-size: 14px; font-weight: bold; padding: 0.8em; font-family:'メイリオ', 'Meiryo', sans-serif; word-break: break-all; text-align: left; border-right: 1px solid #888888; background: #F4F4F4;">${el.title}</th>
  <td style="width: 332px; color: #444444; line-height: 1.7; font-size: 14px; font-weight: bold; padding: 0.8em; font-family:'メイリオ', 'Meiryo', sans-serif; word-break: break-all; text-align: right;">${el.content}</td>
  </tr>`
      } else {
        table =
          table +
          `<tr>
    <th style="width: 406px; color: #444444; line-height: 1.7; font-size: 14px; font-weight: bold; padding: 0.8em; font-family:'メイリオ', 'Meiryo', sans-serif; word-break: break-all; text-align: left; border-right: 1px solid #888888; background: #F4F4F4; border-top: 1px solid #888888;">${el.title}</th>
    <td style="width: 332px; color: #444444; line-height: 1.7; font-size: 14px; font-weight: bold; padding: 0.8em; font-family:'メイリオ', 'Meiryo', sans-serif; word-break: break-all; text-align: right; border-top: 1px solid #888888;">${el.content}</td>
    </tr>`
      }
      return table
    })

    scope =
      scope +
      `<div style="color: #444444; line-height: 1.7; font-size: 16px; font-weight: bold; margin-top: 2.2em; font-family:'メイリオ', 'Meiryo', sans-serif; word-break: break-all;">${block?.blockTitle}</div>
<div style="color: #444444; line-height: 1.7; font-size: 14px; margin-top: 1.2em; font-family:'メイリオ', 'Meiryo', sans-serif; word-break: break-all; border: 1px solid #888888; border-radius: 4px; overflow: hidden;">
<table border="0" cellspacing="0" cellpadding="0" width="100%" style="border-collapse: collapse;">
<colgroup>
<col style="width: 55%;">
<col style="width: 45%;">
</colgroup>
<tbody>
  ${table}
</tbody>
</table>
</div>`

    return scope
  })

  const buttonLogin = loginUrl ?
    `<div style="margin-top: 2.2em;"><a href="${loginUrl}" target="_blank" style="display:block; background:#0B3B5A; color:#FFF; text-align:center; text-decoration:none; padding: 10px 5px; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif; font-size: 16px; font-weight: bold; border-radius: 4px;">${lang.cm_button}</a></div>` :
    '<div></div>'

  const download = hrefUrl ? `<div style="color: #444444; line-height: 1.7; font-size: 14px; margin-top: 2.2em; font-family:'メイリオ', 'Meiryo', sans-serif;">${lang.cm_download.dl1}<a href="${hrefUrl}" target="_blank" style="color: #133F5D; text-decoration: none; font-weight: bold;">${lang.cm_download.dl2}</a>${lang.cm_download.dl3}</div>` : '<div></div>'

  return `<body style="font-size:13px; color: #444444; background-color: #F0F0F0; padding:0; margin: 0;">

<!-- header start -->
<div class="header" style="background: #FFF; padding:20px; text-align: center; border-top: 10px solid #01263F;">
<table border="0" cellspacing="0" cellpadding="0" align="center" width="800" style="margin: 0 auto;">
<tbody><tr>
<td valign="top" style="background-color: #FFFFFF;">
<div style="text-align: center;"><img src="${urlImage}/logo_horizontal_color2.png" alt="${siteNameFxon}" width="145" height="35" border="0"></div>
</td>
</tr>
</tbody></table>
</div>
<!-- header end -->
<!-- visual start -->
<div class="visual" style="background: url('${urlImage}/visual-b.jpg') center center no-repeat; background-size: cover; width: 100%; height: 156px; text-align: center; border-bottom: 3px solid #D71920;">
</div>
<!-- visual end -->
<div class="page" style="background-color: #F0F0F0; padding:0; margin: 0;">

<!-- container start -->
<table border="0" cellspacing="0" cellpadding="0" align="center" width="800" style="margin: 0 auto;">

<tbody><tr>
<td valign="top" style="background-color: #FFFFFF;">
<img src="${urlImage}/spacer.png" alt="spacer" width="800" height="1" border="0">
</td>
</tr>
<tr>
<td valign="top" style="background-color: #FFFFFF;">

<!-- heading start -->
<table border="0" cellspacing="0" cellpadding="0" width="100%">
<tbody><tr>
<td style="padding: 20px 20px 40px">

<table border="0" cellspacing="0" cellpadding="0" width="100%">
<tbody><tr>
<td style="width: 760px; color: #444444; border-bottom: 1px solid #888888; line-height: 1.7; font-size: 20px; font-weight: bold; font-family:'メイリオ', 'Meiryo', sans-serif; padding: 1em 10px;">
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
<td style="padding: 0 30px">

<!-- main start -->
<table border="0" cellspacing="0" cellpadding="0" width="100%">
<tbody><tr>
<td>

<div style="color: #444444; line-height: 1.7; font-size: 14px; font-weight: bold; font-family:'メイリオ', 'Meiryo', sans-serif;">${setDear(typeLang, lang, userName)}</div>

${content}

${scope}

${download}

${buttonLogin}

${footer}

</td>
</tr>
</tbody></table>
<!-- main end -->

</td>
</tr>
</tbody></table>
<!-- contents end -->

<!-- bottom start -->
<table border="0" cellspacing="0" cellpadding="0" width="100%">
<tbody><tr>
<td style="padding: 3em 20px 2em">

<table border="0" cellspacing="0" cellpadding="0" width="100%">
<tbody><tr>
<td style="width: 760px; border-top: 1px solid #888888; padding: 30px 0 0;">

<div style="color: #01263F; line-height: 1.7; font-size: 12px; font-family:'メイリオ', 'Meiryo', sans-serif; font-weight: bold;">${siteNameFxon} Ltd.</div>
<div style="color: #444444; line-height: 1.7; font-size: 12px; font-family:'メイリオ', 'Meiryo', sans-serif; margin-top: 0.2em;">House of Francis, Room 301(A), Ile Du Port, Mahe, Seychelles<br>Seychelles FSA Securities Dealer License : No.SD091</div>

<div style="color: #444444; line-height: 1.7; font-size: 12px; font-family:'メイリオ', 'Meiryo', sans-serif; font-weight: bold; margin-top: 2.2em; text-align: center;"><span style="font-weight: bold; padding-right: 1em;">${lang.cm_address.sp_desk}</span> <a href="${process.env.WF_DOMAIN_FXON}/access.php?id=help-contact" target="_blank" style="color: #133F5D; text-decoration: none; font-weight: bold;">${lang.cm_address.email}</a>${lang.cm_address.time_desk}<a href="${process.env.WF_DOMAIN_FXON}/access.php?id=inquiry" target="_blank" style="color: #01263F; text-decoration: none; font-weight: bold; padding-left: 2em; ">${lang.cm_address.onl_chat}</a>${lang.cm_address.time_chat}</div>

</td>
</tr>
</tbody></table>

</td>
</tr>
</tbody></table>
<!-- bottom end -->

<!-- partner start -->
<table border="0" cellspacing="0" cellpadding="0" width="100%">
<tbody><tr>
<td style="width: 800px; background: #01263F; padding: 1.5em">

<table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
<tbody><tr>
<td><img src="${urlImage}/footer_metaquotes.png" alt="metaquotes" width="126" height="26" border="0"></td>
<td style="padding-left: 40px;"><img src="${urlImage}/footer_equinix.png" alt="equinix" width="162" height="24" border="0"></td>
<td style="padding-left: 40px;"><img src="${urlImage}/footer_aws.png" alt="aws" width="55" height="32" border="0"></td>
<td style="padding-left: 40px;"><img src="${urlImage}/footer_b2broker.png" alt="b2broker" width="142" height="24" border="0"></td>
</tr>
</tbody></table>

</td>
</tr>
</tbody></table>
<!-- partner end -->
</td>
</tr>
</tbody></table>
<!-- container end -->

<!-- footer start -->
<table border="0" cellspacing="0" cellpadding="0" width="100%">
<tbody><tr>
<td style="padding: 2em 0;">
<table border="0" cellspacing="0" cellpadding="0" align="center" width="800" style="margin: 0 auto;">
<tbody><tr>
<td valign="top">

<div style="color: #444444; line-height: 1.7; font-size: 10px; font-family:'メイリオ', 'Meiryo', sans-serif;"><span style="font-weight: bold;">${lang.cm_notice.title}</span>${lang.cm_notice.content}</div>

<div style="color: #444444; line-height: 1.7; font-size: 10px; font-family:'メイリオ', 'Meiryo', sans-serif; margin-top: 1.2em;"><span style="font-weight: bold;">${lang.cm_zone.title}</span>${lang.cm_zone.content}</div>

<div style="color: #444444; line-height: 1.7; font-size: 10px; font-family:'メイリオ', 'Meiryo', sans-serif; margin-top: 1.2em;">${lang.cm_confirm}</div>

<div style="color: #444444; line-height: 1.7; font-size: 12px; margin-top: 2.2em; text-align: center; font-family:'メイリオ', 'Meiryo', sans-serif;"><a href="${process.env.WF_DOMAIN_FXON}/access.php?id=client-agreement" target="_blank" style="color: #01263F; text-decoration: none; font-weight: bold;">${lang.cm_policy.left}</a><span style="padding: 0 0.5em;">|</span><a href="${process.env.WF_DOMAIN_FXON}/access.php?id=privacy-policy" target="_blank" style="color: #01263F; text-decoration: none; font-weight: bold;">${lang.cm_policy.right}</a></div>

<table border="0" cellspacing="0" cellpadding="0" style="margin: 2.2em auto 0;">
<tbody><tr>
<td><a href="${process.env.WF_DOMAIN_FXON}/access.php?id=twitter" target="_blank" style="text-decoration: none;"><img src="${urlImage}/footer_twitter.png" alt="twitter" width="32" height="32" border="0"></a></td>
<td style="padding: 0 10px;"><a href="${process.env.WF_DOMAIN_FXON}/access.php?id=instagram" target="_blank" style="text-decoration: none;"><img src="${urlImage}/footer_instagram.png" alt="instagram" width="32" height="32" border="0"></a></td>
<td><a href="${process.env.WF_DOMAIN_FXON}/access.php?id=youtube" target="_blank" style="text-decoration: none;"><img src="${urlImage}/footer_youtube.png" alt="youtube" width="32" height="32" border="0"></a></td>
<td style="padding: 0 10px;"><a href="${process.env.WF_DOMAIN_FXON}/access.php?id=tiktok" target="_blank" style="text-decoration: none;"><img src="${urlImage}/footer_tiktok.png" alt="tiktok" width="32" height="32" border="0"></a></td>
<td><a href="${process.env.WF_DOMAIN_FXON}/access.php?id=linkedin" target="_blank" style="text-decoration: none;"><img src="${urlImage}/footer_linkedin.png" alt="linkedin" width="32" height="32" border="0"></a></td>
</tr>
</tbody></table>

</td>
</tr>
</tbody></table>
</td>
</tr>
</tbody></table>
<!-- footer end -->

<!-- copyright start -->
<table border="0" cellspacing="0" cellpadding="0" width="100%">
<tbody><tr>
<td style="background: #01263F;">
<table border="0" cellspacing="0" cellpadding="0" align="center" width="800" style="margin: 0 auto;">
<tbody><tr>
<td valign="top" style="width: 800px; line-height: 1.7; font-size: 12px; padding: 0.5em; color: #FFF; text-align: center; font-family:'メイリオ', 'Meiryo', sans-serif;">
Copyright © 2020-${moment.utc().format('YYYY')} ${siteNameFxon} Ltd. All rights reserved. 
</td>
</tr>
</tbody></table>
</td>
</tr>
</tbody></table>
<!-- copyright end -->
</div>

</body>`
}

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
  loginUrl,
) => {
  const footer = ['ja', 'kr'].includes(typeLang) ?
    `<div style="color: #444444; line-height: 1.7; font-size: 14px; margin-top: 2.2em; font-family:'メイリオ', 'Meiryo', sans-serif;">${lang.cm_contact.pls}<a href="${process.env.WF_DOMAIN_FXON}/access.php?id=inquiry" target="_blank" style="color: #133F5D; text-decoration: none; font-weight: bold;">${lang.cm_contact.company}</a>${lang.cm_contact.us}</div>` :
    `<div style="color: #444444; line-height: 1.7; font-size: 14px; margin-top: 2.2em; font-family:'メイリオ', 'Meiryo', sans-serif;">${lang.cm_contact.pls}${lang.cm_contact.us}<a href="${process.env.WF_DOMAIN_FXON}/access.php?id=inquiry" target="_blank" style="color: #133F5D; text-decoration: none; font-weight: bold;">${lang.cm_contact.company}</a></div>`

  let content = ''
  contentList.forEach((el, index) => {
    if (index === 0) {
      content =
        content +
        `<div style="color: #444444; line-height: 1.7; font-size: 14px; margin-top: 2.2em; font-family:'メイリオ', 'Meiryo', sans-serif;">${el}</div>`
    } else {
      content =
        content +
        `<div style="color: #444444; line-height: 1.7; font-size: 14px; margin-top: 1.2em; font-family:'メイリオ', 'Meiryo', sans-serif;">${el}</div>`
    }
  })

  const urlBlock =
    urlTitle && url ?
      `<div style="color: #444444; line-height: 1.7; font-size: 16px; font-weight: bold; margin-top: 2.2em; font-family:'メイリオ', 'Meiryo', sans-serif; word-break: break-all;">${urlTitle}</div>
      <div style="color: #444444; line-height: 1.7; font-size: 16px; margin-top: 1.2em; font-family:'メイリオ', 'Meiryo', sans-serif; word-break: break-all; background: #F4F4F4; border-radius: 4px; padding: 1em;"><a href="${url}" target="_blank" style="color: #133F5D; text-decoration: none;">${url}</a></div>` :
      '<div></div>'

  const codeBlock =
    urlTitle && code ?
      `<div style="color: #444444; line-height: 1.7; font-size: 16px; font-weight: bold; margin-top: 2.2em; font-family:'メイリオ', 'Meiryo', sans-serif; word-break: break-all;">${urlTitle}</div>
      <div style="color: #444444; line-height: 1.7; font-size: 16px; margin-top: 1.2em; font-family:'メイリオ', 'Meiryo', sans-serif; word-break: break-all; background: #F4F4F4; border-radius: 4px; padding: 1em;"><span style="color: #133F5D; text-decoration: none;">${code}</span></div>` :
      '<div></div>'

  const buttonLogin = loginUrl ?
    `<div style="margin-top: 2.2em;"><a href="${loginUrl}" target="_blank" style="display:block; background:#0B3B5A; color:#FFF; text-align:center; text-decoration:none; padding: 10px 5px; font-family: Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif; font-size: 16px; font-weight: bold; border-radius: 4px;">${lang.cm_button}</a></div>` :
    '<div></div>'

  return `<body style="font-size:13px; color: #444444; background-color: #F0F0F0; padding:0; margin: 0;">

<!-- header start -->
<div class="header" style="background: #FFF; padding:20px; text-align: center; border-top: 10px solid #01263F;">
<table border="0" cellspacing="0" cellpadding="0" align="center" width="800" style="margin: 0 auto;">
<tbody><tr>
<td valign="top" style="background-color: #FFFFFF;">
<div style="text-align: center;"><img src="${urlImage}/logo_horizontal_color2.png" alt="${siteNameFxon}" width="145" height="35" border="0"></div>
</td>
</tr>
</tbody></table>
</div>
<!-- header end -->
<!-- visual start -->
<div class="visual" style="background: url('${urlImage}/visual-a.jpg') center center no-repeat; background-size: cover; width: 100%; height: 156px; text-align: center; border-bottom: 3px solid #D71920;">
</div>
<!-- visual end -->
<div class="page" style="background-color: #F0F0F0; padding:0; margin: 0;">

<!-- container start -->
<table border="0" cellspacing="0" cellpadding="0" align="center" width="800" style="margin: 0 auto;">

<tbody><tr>
<td valign="top" style="background-color: #FFFFFF;">
<img src="${urlImage}/spacer.png" alt="spacer" width="800" height="1" border="0">
</td>
</tr>
<tr>
<td valign="top" style="background-color: #FFFFFF;">

<!-- heading start -->
<table border="0" cellspacing="0" cellpadding="0" width="100%">
<tbody><tr>
<td style="padding: 20px 20px 40px">

<table border="0" cellspacing="0" cellpadding="0" width="100%">
<tbody><tr>
<td style="width: 760px; color: #444444; border-bottom: 1px solid #888888; line-height: 1.7; font-size: 20px; font-weight: bold; font-family:'メイリオ', 'Meiryo', sans-serif; padding: 1em 10px;">
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
<td style="padding: 0 30px">

<!-- main start -->
<table border="0" cellspacing="0" cellpadding="0" width="100%">
<tbody><tr>
<td>

<div style="color: #444444; line-height: 1.7; font-size: 14px; font-weight: bold; font-family:'メイリオ', 'Meiryo', sans-serif;">
  ${setDear(typeLang, lang, userName)}
</div>

${content}
${urlBlock}
${codeBlock}
${buttonLogin}
${footer}  

</td>
</tr>
</tbody></table>
<!-- main end -->

</td>
</tr>
</tbody></table>
<!-- contents end -->

<!-- bottom start -->
<table border="0" cellspacing="0" cellpadding="0" width="100%">
<tbody><tr>
<td style="padding: 3em 20px 2em">

<table border="0" cellspacing="0" cellpadding="0" width="100%">
<tbody><tr>
<td style="width: 760px; border-top: 1px solid #888888; padding: 30px 0 0;">

<div style="color: #01263F; line-height: 1.7; font-size: 12px; font-family:'メイリオ', 'Meiryo', sans-serif; font-weight: bold;">${siteNameFxon} Ltd.</div>
<div style="color: #444444; line-height: 1.7; font-size: 12px; font-family:'メイリオ', 'Meiryo', sans-serif; margin-top: 0.2em;">House of Francis, Room 301(A), Ile Du Port, Mahe, Seychelles<br>Seychelles FSA Securities Dealer License : No.SD091</div>

<div style="color: #444444; line-height: 1.7; font-size: 12px; font-family:'メイリオ', 'Meiryo', sans-serif; font-weight: bold; margin-top: 2.2em; text-align: center;"><span style="font-weight: bold; padding-right: 1em;">
${lang.cm_address.sp_desk}</span> <a href="${process.env.WF_DOMAIN_FXON}/access.php?id=help-contact" target="_blank" style="color: #133F5D; text-decoration: none; font-weight: bold;">${lang.cm_address.email}</a>${lang.cm_address.time_desk}
<a href="${process.env.WF_DOMAIN_FXON}/access.php?id=inquiry" target="_blank" style="color: #01263F; text-decoration: none; font-weight: bold; padding-left: 2em; ">${lang.cm_address.onl_chat}</a>${lang.cm_address.time_chat}</div>

</td>
</tr>
</tbody></table>

</td>
</tr>
</tbody></table>
<!-- bottom end -->

<!-- partner start -->
<table border="0" cellspacing="0" cellpadding="0" width="100%">
<tbody><tr>
<td style="width: 800px; background: #01263F; padding: 1.5em">

<table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
<tbody><tr>
<td><img src="${urlImage}/footer_metaquotes.png" alt="metaquotes" width="126" height="26" border="0"></td>
<td style="padding-left: 40px;"><img src="${urlImage}/footer_equinix.png" alt="equinix" width="162" height="24" border="0"></td>
<td style="padding-left: 40px;"><img src="${urlImage}/footer_aws.png" alt="aws" width="55" height="32" border="0"></td>
<td style="padding-left: 40px;"><img src="${urlImage}/footer_b2broker.png" alt="b2broker" width="142" height="24" border="0"></td>
</tr>
</tbody></table>

</td>
</tr>
</tbody></table>
<!-- partner end -->
</td>
</tr>
</tbody></table>
<!-- container end -->

<!-- footer start -->
<table border="0" cellspacing="0" cellpadding="0" width="100%">
<tbody><tr>
<td style="padding: 2em 0;">
<table border="0" cellspacing="0" cellpadding="0" align="center" width="800" style="margin: 0 auto;">
<tbody><tr>
<td valign="top">

<div style="color: #444444; line-height: 1.7; font-size: 10px; font-family:'メイリオ', 'Meiryo', sans-serif;"><span style="font-weight: bold;">
${lang.cm_notice.title}</span>${lang.cm_notice.content}</div>

<div style="color: #444444; line-height: 1.7; font-size: 10px; font-family:'メイリオ', 'Meiryo', sans-serif; margin-top: 1.2em;"><span style="font-weight: bold;">
${lang.cm_zone.title}</span>${lang.cm_zone.content}</div>

<div style="color: #444444; line-height: 1.7; font-size: 10px; font-family:'メイリオ', 'Meiryo', sans-serif; margin-top: 1.2em;">
${lang.cm_confirm}</div>

<div style="color: #444444; line-height: 1.7; font-size: 12px; margin-top: 2.2em; text-align: center; font-family:'メイリオ', 'Meiryo', sans-serif;"><a href="${process.env.WF_DOMAIN_FXON}/access.php?id=client-agreement" target="_blank" style="color: #01263F; text-decoration: none; font-weight: bold;">
${lang.cm_policy.left}</a><span style="padding: 0 0.5em;">|</span><a href="${process.env.WF_DOMAIN_FXON}/access.php?id=privacy-policy" target="_blank" style="color: #01263F; text-decoration: none; font-weight: bold;">${lang.cm_policy.right}</a></div>

<table border="0" cellspacing="0" cellpadding="0" style="margin: 2.2em auto 0;">
<tbody><tr>
<td><a href="${process.env.WF_DOMAIN_FXON}/access.php?id=twitter" target="_blank" style="text-decoration: none;"><img src="${urlImage}/footer_twitter.png" alt="twitter" width="32" height="32" border="0"></a></td>
<td style="padding: 0 10px;"><a href="${process.env.WF_DOMAIN_FXON}/access.php?id=instagram" target="_blank" style="text-decoration: none;"><img src="${urlImage}/footer_instagram.png" alt="instagram" width="32" height="32" border="0"></a></td>
<td><a href="${process.env.WF_DOMAIN_FXON}/access.php?id=youtube" target="_blank" style="text-decoration: none;"><img src="${urlImage}/footer_youtube.png" alt="youtube" width="32" height="32" border="0"></a></td>
<td style="padding: 0 10px;"><a href="${process.env.WF_DOMAIN_FXON}/access.php?id=tiktok" target="_blank" style="text-decoration: none;"><img src="${urlImage}/footer_tiktok.png" alt="tiktok" width="32" height="32" border="0"></a></td>
<td><a href="${process.env.WF_DOMAIN_FXON}/access.php?id=linkedin" target="_blank" style="text-decoration: none;"><img src="${urlImage}/footer_linkedin.png" alt="linkedin" width="32" height="32" border="0"></a></td>
</tr>
</tbody></table>

</td>
</tr>
</tbody></table>
</td>
</tr>
</tbody></table>
<!-- footer end -->

<!-- copyright start -->
<table border="0" cellspacing="0" cellpadding="0" width="100%">
<tbody><tr>
<td style="background: #01263F;">
<table border="0" cellspacing="0" cellpadding="0" align="center" width="800" style="margin: 0 auto;">
<tbody><tr>
<td valign="top" style="width: 800px; line-height: 1.7; font-size: 12px; padding: 0.5em; color: #FFF; text-align: center; font-family:'メイリオ', 'Meiryo', sans-serif;">
Copyright © 2020-${moment.utc().format('YYYY')} ${siteNameFxon} Ltd. All rights reserved. 
</td>
</tr>
</tbody></table>
</td>
</tr>
</tbody></table>
<!-- copyright end -->
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

module.exports = {
  templateP2T,
  templateB,
  templateA,
}
