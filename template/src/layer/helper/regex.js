const { dateFormat } = require('constant')
const moment = require('moment')

const emailValidator = (value) => {
  if (!value) return true
  // eslint-disable-next-line
  const regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return regex.test(value)
}

const formattedEmailSiteUser = (str) => {
  const value = str.split('@')[0]
  if (!str) return false
  if (str.split('@')[0].length > 64) {
    return false
  }
  if (!/^[a-zA-Z0-9@\.\-\+_]+$/g.test(value)) {
    return false
  }
  const patt =
    // eslint-disable-next-line max-len
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))|(^.*[àÀảẢãÃáÁạẠăĂằẰẳẲẵẴắẮặẶâÂầẦẩẨẫẪấẤậẬđĐèÈẻẺẽẼéÉẹẸêÊềỀểỂễỄếẾệỆìÌỉỈĩĨíÍịỊòÒỏỎõÕóÓọỌôÔồỒổỔỗỖốỐộỘơƠờỜởỞỡỠớỚợỢùÙủỦũŨúÚụỤưƯừỪửỬữỮứỨựỰỳỲỷỶỹỸýÝỵỴ].*$)|(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])$/
  return patt.test(str)
}

const masterValidator = (value) => {
  if (!value) return true

  const regex = /^\d+(?:,\d+)*$/
  return regex.test(value)
}

const notTextJapanValidate = (value) => {
  const regex =
    /[\u3000-\u303F]|[\u3040-\u309F]|[\u30A0-\u30FF]|[\uFF00-\uFFEF]|[\u4E00-\u9FAF]|[\u2605-\u2606]|[\u2190-\u2195]|\u203B/g
  return !regex.test(value)
}

const mustNotEmoji = (value) => {
  // eslint-disable-next-line max-len
  return !/[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}ヴヸヹヺ]/gu.test(
    value,
  )
}

const notSpaceValidate = (value) => {
  return !/\s/.test(value)
}

const onlyJapanValidate = (value) => {
  const regex = /^[ァ-ンー]+$/
  if (!value) return false
  return regex.test(value)
}

const passwordValidate = (value) => {
  // eslint-disable-next-line
  const regex = /^((?=.*[A-Z])(?=.*[a-z])(?=.*\d)|(?=.*[a-z])(?=.*\d)(?=.*[\$\%\&])|(?=.*[A-Z])(?=.*\d)(?=.*[\$\%\&])|(?=.*[A-Z])(?=.*[a-z])(?=.*[\$\%\&])).{8,255}$/
  return regex.test(value)
}

// passWord validate not required
const passwordValidateV1 = (value) => {
  if (!value) return true
  // eslint-disable-next-line
  const regex = /^((?=.*[A-Z])(?=.*[a-z])(?=.*\d)|(?=.*[a-z])(?=.*\d)(?=.*[\$\%\&])|(?=.*[A-Z])(?=.*\d)(?=.*[\$\%\&])|(?=.*[A-Z])(?=.*[a-z])(?=.*[\$\%\&])).{8,255}$/
  return regex.test(value)
}

const lengthValidator = (value, minLength, maxLength) => {
  if (!value) return false

  let regex = `^.{${minLength},${maxLength}}$`
  regex = new RegExp(regex)
  return regex.test(value)
}

const mailValidator = (value) => {
  if (!value) return false

  const emailVl = emailValidator(value)
  const textJpVl = notTextJapanValidate(value)
  const spaceVl = notSpaceValidate(value)
  const lengthVl = lengthValidator(value, 1, 255)

  return emailVl && textJpVl && spaceVl && lengthVl
}

const passwordValidator = (value) => {
  if (!value) return false

  const textJpVl = notTextJapanValidate(value)
  const spaceVl = notSpaceValidate(value)
  const lengthVl = lengthValidator(value, 8, 255)
  const passwordVl = strongEnoughPassword(value)

  return passwordVl && textJpVl && spaceVl && lengthVl
}

const datetimeIsValid = (value) => {
  return /^\d\d\d\d-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]) (0[0-9]|1[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/.test(value) &&
    moment(value, dateFormat.DATE_TIME, true).isValid()
}

/* eslint-disable max-len */
const lowLevelPassword = (value) => {
  return /(^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{12,}$)|(^(?=.*[A-Za-z])[A-Za-z]{12,}$)|(^(\d+){12,}$)|(^[a-z]{12,}$)|(^[A-Z]{12,}$)|(^(?=.*[{}@$!%*?&;#._+=\-\\\|¥/>'":;,><^()\[\]~`])[{}@$!%*?&;#._+=\-\\\|¥/>'":;,><^()\[\]~`]{12,}$)|(^(?=.*[a-z])(?=.*[{}@$!%*?&;#._+=\-\\\|¥/>'":;,><^()\[\]~`])[a-z{}@$!%*?&;#._+=\-\\\|¥/>'":;,><^()\[\]~`]{12,}$)|(^(?=.*[A-Z])(?=.*[{}@$!%*?&;#._+=\-\\\|¥/>'":;,><^()\[\]~`])[A-Z{}@$!%*?&;#._+=\-\\\|¥/>'":;,><^()\[\]~`]{12,}$)|(^(?=.*\d)(?=.*[{}@$!%*?&;#._+=\-\\\|¥/>'":;,><^()\[\]~`])[\d{}@$!%*?&;#._+=\-\\\|¥/>'":;,><^()\[\]~`]{12,}$)/.test(
    value,
  )
}
const middleLevelPassword = (value) => {
  const case1 =
    /^(?=(.*[a-z]){1,})(?=(.*[A-Z]){1,})(?=(.*[0-9]){1,}).{1,}$/.test(value)
  const case2 =
    /^(?=(.*[a-z]){1,})(?=(.*[A-Z]){1,})(?=(.*[@$!%{}*?&;#._+=\-\\\|¥/>'":;,><^()\[\]~`]){1,}).{1,}$/.test(
      value,
    )
  const case3 =
    /^(?=(.*[A-Z]){1,})(?=(.*[0-9]){1,})(?=(.*[@$!%{}*?&;#._+=\-\\\|¥/>'":;,><^()\[\]~`]){1,}).{1,}$/.test(
      value,
    )
  const case4 =
    /^(?=(.*[a-z]){1,})(?=(.*[0-9]){1,})(?=(.*[@$!%{}*?&;#._+=\-\\\|¥/>'":;,><^()\[\]~`]){1,}).{1,}$/.test(
      value,
    )
  return case1 || case2 || case3 || case4
}

const highLevelPassword = (value) => {
  return /^(?=(.*[a-z]){1,})(?=(.*[A-Z]){1,})(?=(.*[0-9]){1,})(?=(.*[[@$!%{~,:`|'}<->"(*^?&)/[\]{}|\\;#._+=]){1,}).{0,}$/.test(
    value,
  )
}

const strongEnoughPassword = (value) => {
  if (!value) return true
  return middleLevelPassword(value) || highLevelPassword(value)
}

const userNameValidator = (user_name) => {
  const regex = /myforex|fxon|icpay|@/i
  return regex.test(user_name)
}

const fullWidthChars = (value) => {
  return (
    value?.match(
      /[\uFF01-\uFF60\uFFE0-\uFFE6]|[\u30A0-\u30FF]|[\u4E00-\u9FFF]|[\u3040-\u309F]/g,
    ) || []
  )
}

const halfWidthChars = (value) => {
  return (
    value?.match(
      /[^[\\uFF01-\uFF60\uFFE0-\uFFE6]|[\\u30A0-\u30FF]|[\\u4E00-\u9FFF]|[\\u3040-\u309F]]/g,
    ) || []
  )
}

const convertFullToHalf = (str) => {
  return String(str).replace(/[！-～]/g, (r) =>
    String.fromCharCode(r.charCodeAt(0) - 0xfee0),
  )
}

const countStrBytes = (str) => {
  const l = str.length
  let c = ''
  let length = 0
  let isContainsFullWidth = false
  for (let i = 0; i < l; i++) {
    c = str.charCodeAt(i)
    if (0x0000 <= c && c <= 0x0019) {
      length += 0
    } else if (0x0020 <= c && c <= 0x1fff) {
      length += 1
    } else if ((0x2000 <= c && c <= 0xff60) || (c > 0xff9f && 0xffa0 <= c)) {
      length += 2
      isContainsFullWidth = true
    } else if (0xff61 <= c && c <= 0xff9f) {
      length += 1
    }
  }
  return {
    length,
    isContainsFullWidth,
  }
}

const isHalfWidthAlphabetNumberSymbol = (str)=> {
  // Half-width alphabet + half-width number + half-width symbol
  return /^[0-9A-Za-z!"#$%&'()\-^~\\|@`\[{;+:*\]},<.>\/?_]+$/.test(str)
}

const ipAddressValidator = (value) => {
  // eslint-disable-next-line
  const ipv4Regex = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])$/
  return ipv4Regex.test(value)
}

const ipAddressCIDRValidator = (value) => {
  // eslint-disable-next-line
  const ipv4CIDRRegex = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\/([0-9]|1[0-9]|2[0-9]|3[0-2]?)$/
  return ipv4CIDRRegex.test(value)
}

module.exports = {
  emailValidator,
  notTextJapanValidate,
  notSpaceValidate,
  onlyJapanValidate,
  passwordValidate,
  passwordValidateV1,
  masterValidator,
  mailValidator,
  lengthValidator,
  passwordValidator,
  formattedEmailSiteUser,
  mustNotEmoji,
  datetimeIsValid,
  lowLevelPassword,
  middleLevelPassword,
  highLevelPassword,
  userNameValidator,
  fullWidthChars,
  halfWidthChars,
  convertFullToHalf,
  countStrBytes,
  isHalfWidthAlphabetNumberSymbol,
  ipAddressValidator,
  ipAddressCIDRValidator,
}
