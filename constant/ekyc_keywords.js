module.exports.common = {
  eraYearJapanese: {
    '明治': {
      name: 'MEIJI',
      start: 1868,
    },
    '大正': {
      name: 'TAISHO',
      start: 1912,
    },
    '昭和': {
      name: 'SHOWA',
      start: 1926,
    },
    '平成': {
      name: 'HEISEI',
      start: 1989,
    },
    '令和': {
      name: 'REIWA',
      start: 2019,
    },
  },
  regex: {
    DATE_JAPANESE: /(?=.*年)(?=.*月)(?=.*日).+$/,
    YEAR_MATCH: /([0-9]{4}|[0-9]{1,2}|[元一二三四五六七八九]{1})年/,
    MONTH_MATCH: /([0-9]{1,2})月/,
    DAY_MATCH: /([0-9]{1,2})日/,
    SPACE: /\s+/g,
    DATE_FORMAT_A: /^([1-9]|0[1-9]|[12][0-9]|3[01]) ([A-Z]{3}) (\d{4})$/, // Ex: 06 NOV 1998
    JAPANESE_TEXT: /[\u3000-\u303F]|[\u3040-\u309F]|[\u30A0-\u30FF]|[\uFF00-\uFFEF]|[\u4E00-\u9FAF]|[\u2605-\u2606]|[\u2190-\u2195]|\u203B/,
    SPECIAL_CHARACTERS: /[ｰ−，．・：；！？＂＇｀＾～￣＿＆＠＃％＋ー＊＝＜＞（）［］｛｝｟｠「」『』｜￤／＼￢＄￡￠￦\-–/,.:;!@#$%&*^`()_=+{}|"'?><[~￥]+/g,
    KANJI: /^[一-龥]+$/,
    UPPERCASE: /^[A-Z]*$/,
  },
  japaneseDate: {
    DAY: '日',
    MONTH: '月',
    YEAR: '年',
    BIRTH: '生',
  },
  text: {
    ZERO_STRING: '0',
    SPACE: ' ',
    NONE: '',
    COMPARE_FACE_THRESHOLD: 80,
    NAME: 'name',
  },
  months: {
    'JAN': '01',
    'FEB': '02',
    'MAR': '03',
    'APR': '04',
    'MAY': '05',
    'JUN': '06',
    'JUL': '07',
    'AUG': '08',
    'SEP': '09',
    'OCT': '10',
    'NOV': '11',
    'DEC': '12',
  },
  japaneseDigit: {
    '元': '01',
    '一': '01',
    '二': '02',
    '三': '03',
    '四': '04',
    '五': '05',
    '六': '06',
    '七': '07',
    '八': '08',
    '九': '09',
  },
}

module.exports.Identification_A = {
}

module.exports.Identification_B = {
  ID_NUMBER_TITLE: 'Passport No',
  FIRST_NAME_TITLE: 'Surname',
  LAST_NAME_TITLE: 'Given name',
  DATE_OF_BIRTH_TITLE: 'Date of birth',
  DATE_OF_EXPIRY_TITLE: 'Date of expiry',
}

module.exports.Identification_C = {
}

module.exports.Identification_D = {
}

