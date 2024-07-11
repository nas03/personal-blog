module.exports.message = Object.freeze({
  fields_cannot_blank: 'trans.fields_cannot_blank',
  fields_invalid: 'trans.fields_invalid',
  wrong_password: 'trans.wrong_password',
  wrong_email: 'trans.wrong_email',
  server_error: 'trans.server_error',
  access_token_invalid: 'trans.access_token_invalid',
  captcha_is_not_verify: 'trans.captcha_is_not_verify',
  please_check_mail_confirm: 'trans.please_check_mail_confirm',
  send_mail_error: 'trans.send_mail_error',
  password_change_success: 'trans.password_change_success',
  delete_success: 'trans.delete_success',
  invalid_reset_key: 'trans.invalid_reset_key',
  token_invalid: 'trans.token_invalid',
  update_account_success: 'trans.update_account_success',
  create_account_success: 'trans.create_account_success',
  update_status_success: 'trans.update_status_success',
  // send_mail_success: "trans.send_mail_success",
  email_exist_in_system: 'trans.email_exist_in_system',
  create_account_fail: 'trans.create_account_fail',
  update_account_fail: 'trans.update_account_fail',
  link_expired: 'trans.link_expired',
  session_expired: 'trans.session_expired',
  account_is_not_active: 'trans.account_is_not_active',
  not_exist_email: 'trans.not_exist_email',
  server_validator: 'trans.server_validator',
  update_failed: 'trans.update_failed',
  email_is_not_exist: 'trans.email_is_not_exist',
  phone_number_exist_in_system: 'trans.phone_number_exist_in_system',
  cannot_add: 'trans.cannot_add',
  trading_account_not_active: 'trans.trading_account_not_active',
  quantity_exceeded_limit: 'trans.quantity_exceeded_limit',
  not_existed: 'trans.not_existed',
  can_not_close_trading_account: 'can_not_close_trading_account',
  having_position: 'trans.having_position',
  user_name_exist: 'trans.user_name_exist',
  merchant_id_existed: 'trans.merchant_id_existed',
  merchant_id_does_not_exist: 'trans.merchant_id_does_not_exist',
  id_merchant_does_not_exist: 'trans.id_merchant_does_not_exist',
  cannot_delete_merchant_id: 'trans.cannot_delete_merchant_id',
  cannot_disable_merchant_id: 'trans.cannot_disable_merchant_id',
  ts_apply_is_less_than_present: 'trans.ts_apply_is_less_than_present',
  exist_container_name: 'trans.exist_container_name',
  segment_country_code_not_exist: 'trans.segment_country_code_not_exist',
  segment_user_not_exist: 'trans.segment_user_not_exist',
  segment_country_and_user_not_exist: 'trans.segment_country_and_user_not_exist',
  record_has_deleted: 'trans.record_has_deleted',
  chars_description_exceed: 'trans.description_exceeds_characters',
  chars_name_exceed: 'trans.chars_name_exceed',
  user_not_found: 'user not found',
  wallet_not_found: 'wallet not found',
  broker_name_exist: 'trans.broker_name_exist',
  broker_short_name_exist: 'trans.broker_short_name_exist',
  broker_name_and_short_name_exist: 'trans.broker_name_and_short_name_exist',
  ib_rank_name_is_exist: 'trans.ib_rank_name_is_exist',
  broker_is_not_exist: 'trans.broker_is_not_exist',
  iban_invalid: 'trans.iban_invalid',
  account_number_existed: 'trans.account_number_existed',
  broker_not_found: 'trans.broker_not_found',
  product_type_not_found: 'trans.product_type_not_found',
  account_type_not_found: 'trans.account_type_not_found',
  platform_not_found: 'trans.platform_not_found',
  margin_currency_not_found: 'trans.margin_currency_not_found',
  profit_currency_not_found: 'trans.profit_currency_not_found',
  has_duplicate_record: 'trans.has_duplicate_record',
  broker_disabled: 'trans.broker_disabled',
  product_type_disabled: 'trans.product_type_disabled',
  account_type_disabled: 'trans.account_type_disabled',
  margin_profit_invalid: 'trans.margin_profit_invalid',
  account_type_name_is_exist: 'trans.account_type_name_is_exist',
  account_type_code_exist: 'trans.account_type_code_exist',
  account_type_name_and_account_type_code_exist: 'trans.account_type_name_and_account_type_code_exist',
  symbol_code_is_existed: 'trans.symbol_code_is_existed',
  account_leverage_is_existed: 'trans.account_leverage_is_existed',
  division_is_exist_in_product_type: 'trans.division_is_exist_in_product_type',
  iban_existed: 'trans.iban_existed',
  ib_rank_is_exist: 'trans.ib_rank_is_exist',
  send_mail_not_eligible: 'trans.send_mail_not_eligible',
  expired_link_invite: 'trans.expired_link_invite',
  incorrect_password: 'trans.incorrect_password',
  wrong_code: 'trans.wrong_code',
  expired_code: 'trans.expired_code',
  not_found_user_match_key: 'trans.not_found_user_match_key',
  google_sso_disable: 'trans.google_sso_disable',
  wrong_phone_number: 'trans.wrong_phone_number',
  ekyc_expiry: 'trans.ekyc_expiry',
  chars_exceed: 'trans.chars_exceed',
  timestamp_invalid: 'trans.timestamp_invalid',
  field_incorrect: 'trans.field_incorrect',
  mt_group_duplicated: 'trans.mt_group_duplicated',
  field_duplicate: 'trans.field_duplicate',
  download_exceeded: 'trans.download_exceeded',
  account_not_exist: 'account_not_exist',
  access_denied: 'access_denied',
  chars_exceed: 'trans.chars_exceed',
  kyc_process_duplicate_error: 'trans.kyc_process_duplicate_error',
  kyc_summary_authentication_error: 'trans.kyc_summary_authentication_error',
  kyc_summary_session_timeout: 'trans.kyc_summary_session_timeout',
  incomplete_kyc: 'trans.incomplete_kyc',
})

module.exports.flag = Object.freeze({
  TRUE: 1,
  FALSE: 0,
})

module.exports.code = Object.freeze({
  SUCCESS: 200,
  CONFIRM_MAIL: 'CONFIRM_MAIL',
  ERROR: 500,
  INVALID: 402,
  VALIDATOR: 422,
  AUTHORIZATION: 401,
  CONFLICT: 409,
  FORBIDDEN: 403,
})

module.exports.dataStatus = Object.freeze({
  EXIST_MAIL: 'EXIST_MAIL',
  COMPLETE: 'COMPLETE',
  FAIL: 'FAIL',
  IS_EXPIRED: 'IS_EXPIRED',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
})

module.exports.type = Object.freeze({
  EMAIL: 'EMAIL',
  USER_NAME: 'USER_NAME',
  PASSWORD: 'PASSWORD',
  SITE: 'SITE',
  AUTHORIZATION: 'AUTHORIZATION',
})

module.exports.color = Object.freeze({
  CEC407A: '#EC407A',
  C7B1FA2: '#7B1FA2',
  CBE360B: '#BE360B',
  CEF6C00: '#EF6C00',
  C0388D2: '#0388D2',
  C00579B: '#00579B',
  C00897B: '#00897B',
  C004D40: '#004D40',
  C8E6D63: '#8E6D63',
  C5E4038: '#5E4038',
  C77919B: '#77919B',
})

module.exports.indexSort = [
  { column: 'siteName', index: 1 },
  { column: 'userName', index: 2 },
  { column: 'email', index: 3 },
  { column: 'authorizationName', index: 4 },
  { column: 'createdDate', index: 5 },
  { column: 'lastLoginDate', index: 6 },
]

module.exports.suspiciousLevel = Object.freeze({
  HIGH: [1],
  MIDDLE: [2],
  LOW: [3],
})

module.exports.arrLocale = ['ja', 'kr', 'en', 'cn']
module.exports.keySplitUrl = 'v@0z$1g'

module.exports.dateFormat = Object.freeze({
  DATE: 'YYYY-MM-DD',
  DATE_1: 'YYYY.MM.DD',
  DATE_2: 'MM.DD.YYYY',
  DATE_3: 'DD.MM.YYYY',
  DATE_4: 'YYYY.MM',
  DATE_5: 'YYYYMMDD',
  DATE_TIME: 'YYYY-MM-DD HH:mm:ss',
  DATE_TIME_ZONE: 'YYYY-MM-DDTHH:mm:ssZ',
  DATE_TIME_ZONE_1: 'YYYY-MM-DD HH:mm:ss.SSS',
  DATE_TIME_2: 'YYYY/MM/DD HH:mm:ss',
  DATE_TIME_3: 'YYYY.MM.DD HH:mm',
  DATE_TIME_4: 'YYYY.MM.DD HH:mm:ss',
  DATE_TIME_5: 'MM.DD.YYYY HH:mm:ss',
  DATE_TIME_6: 'DD.MM.YYYY HH:mm:ss',
  DATE_TIME_GET_RATE: 'YYYY-MM-DD HH:mm:00',
})

module.exports.resCheck = Object.freeze({
  ERROR: 'error',
  OK: 'OK',
})

module.exports.financeInfo = Object.freeze({
  OCCUPATIONS: 'occupations',
  FUNDING_SOURCES: 'funding_sources',
  INDUSTRIES: 'industries',
  MONEY_RANGE_PERSON_FXT: 'money_range_person_fxt',
  MONEY_RANGE_COMPANY_FXT: 'money_range_company_fxt',
  MONEY_RANGE_COMPANY_ICPAY: 'money_range_company_icpay',
  INVESTMENT_PURPOSE: 'investment_purpose',
  USING_PURPOSE: 'using_purpose',
  OCCUPATIONS_FXS_XEM: 'occupations_fxs_xem',
  FUNDING_SOURCES_FXS_XEM: 'funding_sources_fxs_xem',
  INDUSTRIES_FXS_XEM: 'industries_fxs_xem',
  ESTIMATED_ANNUAL_INCOME_FXS_XEM: 'estimated_annual_income_fxs_xem',
  NET_ASSETS_FXS_XEM: 'net_assets_fxs_xem',
  PLANNED_ANNUAL_INVESTMENT_FXS_XEM: 'planned_annual_investment_fxs_xem',
  PURPOSE_OPENING_ACCOUNT_FXS_XEM: 'purpose_opening_account_fxs_xem',
})

module.exports.category = Object.freeze({
  EMAIL_RECEPTION_SETTING: 1,
  DISPLAY_SETTING: 2,
  SECURITY_INFORMATION: 3,
  SOCIAL_LOGIN_SETTING: 4,
  BASIC_INFORMATION_PERSON_OR_CORPORATE: 5,
  INFORMATION_OCCUPATIONS_AND_TRANSACTIONS: 6,
  INVESTOR_INFORMATION: 7,
  REPRESENTATIVE_INFORMATION: 8,
  TRANSACTION_INFORMATION: 9,
  BENEFICIAL_OWNER_INFORMATION: 10,
  TRADING_ACCOUNT_INFORMATION: 11,
  MANAGE_TRANGDING_ACCOUNT: 12,
  WALLET_MANAGEMENT: 13,
  PORTFOLIO: 14,
  IDENTITY_VERIFICATION: 15,
})

module.exports.contentUpdate = Object.freeze({
  // EMAIL_RECEPTION_SETTING
  NOTIFICATION_FROM_SITE: 1,
  MONTHLY_USAGE_REPORT: 2,
  MARKET_ANALYSIS_FUTURE_FORECAST: 3,
  DAILY_CONFIRMATION_MONTHLY_STATEMENT: 4,

  // DISPLAY_SETTING
  DISPLAY_LANGUAGE: 1,
  DISPLAY_LANGUAGE_MAIL: 2,
  DISPLAY_DATE_TIME_FORMAT: 3,
  DISPLAY_TIMEZONE: 4,

  // SECURITY_INFORMATION
  PHONE_NUMBER: 1,
  LOGIN_PASSWORD: 2,
  EMAIL_ADDRESS: 3,
  NOTIFICATION_UNUSUAL_LOGIN: 4,
  TWO_FA_METHOD: 5,
  RECEIVER_NAME: 6,

  // SOCIAL_LOGIN_SETTING
  GOOGLE_SSO_LOGIN: 1,
  TWITTER_ID_LOGIN: 2,
  FACEBOOK_ID_LOGIN: 3,

  // BASIC_INFORMATION_PERSON_OR_CORPORATE
  CHANGE_PROFILE_PICTURE: 1,
  PROFILE_REGISTRATION: 2,
  CHANGE_NATIONALITY: 3,
  CHANGE_COUNTRY_RESIDENCE_CORPORATE: 4,
  CHANGE_FIRST_NAME_ROMAJI: 5,
  CHANGE_LAST_NAME_ROMAJI: 6,
  CHANGE_FIRST_NAME_KANJI: 7,
  CHANGE_LAST_NAME_KANJI: 8,
  CHANGE_FIRST_NAME_KATAKANA: 9,
  CHANGE_LAST_NAME_KATAKANA: 10,
  CHANGE_CORPORATE_NAME_REGISTERED: 11,
  CHANGE_CORPORATE_NAME_ENGLISH: 12,
  CHANGE_CORPORATE_NAME_KATAKANA: 13,
  CHANGE_GENDER: 14,
  CHANGE_DATE_OF_BIRTH: 15,
  CHANGE_DATE_OF_ESTABLISHMENT: 16,
  CHANGE_COUNTRY_RESIDENCE_PERSONAL: 17,
  CHANGE_ZIP_POSTAL_CODE_JA: 18,
  CHANGE_PREFECTURE_JA: 19,
  CHANGE_CITY_JA: 20,
  CHANGE_ADDRESS_JA: 21,
  CHANGE_BUILDING: 22,
  CHANGE_ZIP_POSTAL_CODE: 23,
  CHANGE_STATE_PROVINCE: 24,
  CHANGE_CITY: 25,
  CHANGE_ADDRESS_LINE1: 26,
  CHANGE_ADDRESS_LINE2: 27,
  CHANGE_CORPORATE_PHONE_NUMBER: 28,
  CHANGE_WEBSITE_URL: 29,
  CHANGE_INDUSTRY_CORPOTATE: 30,
  CHANGE_BUSINESS_CONTENT: 31,
  CHANGE_US_TAX_OBLIGATIONS: 32,
  CHANGE_US_TAXPAYER: 33,
  CHANGE_USER_NAME: 34,

  // INFORMATION_OCCUPATIONS_AND_TRANSACTIONS
  CHANGE_OCCUPATIONAL_FORM_ICPAY: 1,
  CHANGE_FUNDING_SOURCE_ICPAY: 2,
  CHANGE_INDUSTRY_ICPAY: 3,
  CHANGE_PURPOSE_OF_USE_ICPAY: 4,
  CHANGE_ESTIMATED_ANNUAL_USAGE_AMOUNT_ICPAY: 5,

  // INVESTOR_INFORMATION
  CHANGE_OCCUPATIONAL_FORM_FXT: 1,
  CHANGE_FUNDING_SOURCE_FXT: 2,
  CHANGE_INDUSTRY_FXT: 3,
  CHANGE_ANNUAL_INCOME_FXT: 4,
  CHANGE_COMPANY_ANNUAL_SALES_FXT: 5,
  CHANGE_NET_WORTH_FXT: 6,
  CHANGE_PLANNED_ANNUAL_INVESTMENT_FXT: 7,
  CHANGE_PURPOSE_OF_INVESTMENT_FXT: 8,

  // REPRESENTATIVE_INFORMATION
  CHANGE_NATIONALITY_REPRESENTATIVE: 1,
  CHANGE_FIRST_NAME_ROMAJI_REPRESENTATIVE: 2,
  CHANGE_LAST_NAME_ROMAJI_REPRESENTATIVE: 3,
  CHANGE_FIRST_NAME_KANJI_REPRESENTATIVE: 4,
  CHANGE_LAST_NAME_KANJI_REPRESENTATIVE: 5,
  CHANGE_FIRST_NAME_KATAKANA_REPRESENTATIVE: 6,
  CHANGE_LAST_NAME_KATAKANA_REPRESENTATIVE: 7,
  CHANGE_GENDER_REPRESENTATIVE: 8,
  CHANGE_DATE_OF_BIRTH_REPRESENTATIVE: 9,
  CHANGE_COUNTRY_RESIDENCE_REPRESENTATIVE: 10,
  CHANGE_ZIP_POSTAL_CODE_JA_REPRESENTATIVE: 11,
  CHANGE_PREFECTURE_JA_REPRESENTATIVE: 12,
  CHANGE_CITY_JA_REPRESENTATIVE: 13,
  CHANGE_ADDRESS_JA_REPRESENTATIVE: 14,
  CHANGE_BUILDING_REPRESENTATIVE: 15,
  CHANGE_ZIP_POSTAL_CODE_REPRESENTATIVE: 16,
  CHANGE_STATE_PROVINCE_REPRESENTATIVE: 17,
  CHANGE_CITY_REPRESENTATIVE: 18,
  CHANGE_ADDRESS_LINE1_REPRESENTATIVE: 19,
  CHANGE_ADDRESS_LINE2_REPRESENTATIVE: 20,
  CHANGE_CONTACT_PHONE_NUMBER_REPRESENTATIVE: 21,
  CHANGE_US_TAX_OBLIGATIONS_REPRESENTATIVE: 22,
  CHANGE_US_TAXPAYER_REPRESENTATIVE: 23,

  // TRANSACTION_INFORMATION
  CHANGE_NATIONALITY_TRANSACTION: 1,
  CHANGE_FIRST_NAME_ROMAJI_TRANSACTION: 2,
  CHANGE_LAST_NAME_ROMAJI_TRANSACTION: 3,
  CHANGE_FIRST_NAME_KANJI_TRANSACTION: 4,
  CHANGE_LAST_NAME_KANJI_TRANSACTION: 5,
  CHANGE_FIRST_NAME_KATAKANA_TRANSACTION: 6,
  CHANGE_LAST_NAME_KATAKANA_TRANSACTION: 7,
  CHANGE_GENDER_TRANSACTION: 8,
  CHANGE_DATE_OF_BIRTH_TRANSACTION: 9,
  CHANGE_COUNTRY_RESIDENCE_TRANSACTION: 10,
  CHANGE_ZIP_POSTAL_CODE_JA_TRANSACTION: 11,
  CHANGE_PREFECTURE_JA_TRANSACTION: 12,
  CHANGE_CITY_JA_TRANSACTION: 13,
  CHANGE_ADDRESS_JA_TRANSACTION: 14,
  CHANGE_BUILDING_TRANSACTION: 15,
  CHANGE_ZIP_POSTAL_CODE_TRANSACTION: 16,
  CHANGE_STATE_PROVINCE_TRANSACTION: 17,
  CHANGE_CITY_TRANSACTION: 18,
  CHANGE_ADDRESS_LINE1_TRANSACTION: 19,
  CHANGE_ADDRESS_LINE2_TRANSACTION: 20,
  CHANGE_US_TAX_OBLIGATIONS_TRANSACTION: 21,
  CHANGE_US_TAXPAYER_TRANSACTION: 22,

  // BENEFICIAL_OWNER_INFORMATION
  CHANGE_CORPORATE_FORM_BENEFICIAL_OWNER: 1,
  CHANGE_NUMBER_BENEFICIAL_OWNER_PERSONAL: 2,
  CHANGE_NUMBER_BENEFICIAL_OWNER_CORPORATE: 3,
  CHANGE_NATIONALITY_BENEFICIAL_OWNER: 4,
  CHANGE_COUNTRY_RESIDENCE_CORPORATE_BENEFICIAL_OWNER: 5,
  CHANGE_FIRST_NAME_ROMAJI_BENEFICIAL_OWNER: 6,
  CHANGE_LAST_NAME_ROMAJI_BENEFICIAL_OWNER: 7,
  CHANGE_FIRST_NAME_KANJI_BENEFICIAL_OWNER: 8,
  CHANGE_LAST_NAME_KANJI_BENEFICIAL_OWNER: 9,
  CHANGE_FIRST_NAME_KATAKANA_BENEFICIAL_OWNER: 10,
  CHANGE_LAST_NAME_KATAKANA_BENEFICIAL_OWNER: 11,
  CHANGE_CORPORATE_NAME_REGISTERED_BENEFICIAL_OWNER: 12,
  CHANGE_CORPORATE_NAME_ENGLISH_BENEFICIAL_OWNER: 13,
  CHANGE_CORPORATE_NAME_KATAKANA_BENEFICIAL_OWNER: 14,
  CHANGE_GENDER_BENEFICIAL_OWNER: 15,
  CHANGE_DATE_OF_BIRTH_BENEFICIAL_OWNER: 16,
  CHANGE_DATE_OF_ESTABLISHMENT_BENEFICIAL_OWNER: 17,
  CHANGE_COUNTRY_RESIDENCE_PERSONAL_BENEFICIAL_OWNER: 18,
  CHANGE_ZIP_POSTAL_CODE_JA_BENEFICIAL_OWNER: 19,
  CHANGE_PREFECTURE_JA_BENEFICIAL_OWNER: 20,
  CHANGE_CITY_JA_BENEFICIAL_OWNER: 21,
  CHANGE_ADDRESS_JA_BENEFICIAL_OWNER: 22,
  CHANGE_BUILDING_BENEFICIAL_OWNER: 23,
  CHANGE_ZIP_POSTAL_CODE_BENEFICIAL_OWNER: 24,
  CHANGE_STATE_PROVINCE_BENEFICIAL_OWNER: 25,
  CHANGE_CITY_BENEFICIAL_OWNER: 26,
  CHANGE_ADDRESS_LINE1_BENEFICIAL_OWNER: 27,
  CHANGE_ADDRESS_LINE2_BENEFICIAL_OWNER: 28,
  CHANGE_CONTACT_PESONAL_PHONE_NUMBER_BENEFICIAL_OWNER: 29,
  CHANGE_CONTACT_CORPORATE_PHONE_NUMBER_BENEFICIAL_OWNER: 30,
  CHANGE_INDUSTRY_BENEFICIAL_OWNER: 31,
  CHANGE_BUSINESS_CONTENT_BENEFICIAL_OWNER: 32,
  CHANGE_WEBSITE_URL_BENEFICIAL_OWNER: 33,
  CHANGE_VOTING_RIGHTS_RATIO_BENEFICIAL_OWNER: 34,

  // TRADING_ACCOUNT_INFORMATION
  APPLICATION_OPEN_ACCOUNT: 1,
  CHANGE_STATUS: 2,
  APPLICATION_CANCEL: 3,
  CHANGE_PASSWORD: 4,
  CHANGE_LEVERAGE: 5,
  READ_ONLY_SETTING: 6,

  // RANGE_USE_SETTING
  ENABLE_RULE_UPDATE: 'enable_rule_update',
  UPDATE_PRIORITY: 'update_priotity',
  DELETE_RULE: 'delete_rule',
  CREATE_RULE: 'create_rule',
  SITE_ID: 'site_update',
  PRIORITY: 'update_priotity',
  RULE_NAME: 'rule_name_update',
  RULE_DESCRIPTION: 'rule_description_update',

  // WALLET_MANAGEMENT
  OPEN_WALLET: 1,
  SEND_BANK_INFORMATION: 2,
  DEPOSIT_FUNDS: 3,
  WITHDRAWAL_OF_FUNDS: 4,
  TRANSFER_OF_FUNDS: 5,
  CHANGE_BANK: 7,
  CHANGE_BANK_BRANCH_INFORMATION: 9,
  CHANGE_ACCOUNT_TYPE: 10,
  CHANGE_ACCOUNT_NUMBER: 11,
  CHANGE_BANK_COUNTRY: 12,
  CHANGE_ACCOUNT_CURRENCY: 13,
  CHANGE_BENEFICIARY_BANK_NAME: 14,
  CHANGE_SWIFT_CODE: 15,
  CHANGE_BRANCH_NAME: 16,
  CHANGE_BANK_ADDRESS: 17,
  CHANGE_IBAN_CODE: 18,
  CHANGE_CLEARING_CODE: 19,
  CHANGE_INTERMEDIARY_BANK_NAME: 20,
  CHANGE_INTERMEDIARY_BANK_SWIFT_CODE: 21,

  // MANAGE_TRANGDING_ACCOUNT
  CLOSE_POSITION: 1,

  // PORTFOLIO
  PORTFOLIO_NAME: 1,
  PORTFOLIO_DESCRIPTION: 2,
  PUBLISH_TARGET: 3,
  PUBLISH_RANGE: 4,
  DELETE_PORTFOLIO: 5,
  SYNC_SETTING: 6,
  ACCOUNT_TYPE: 7,
  TRADING_METHOD: 8,
  CHANGE_ACCOUNT: 9,

  // IDENTITY_VERIFICATION
  ID_VERIFICATION: 1,
  MNC_VERIFICATION: 2,
  ADDRESS_VERIFICATION: 3,
  CORPORATE_INFORMATION_VERIFICATION: 4,
  CORPORATE_SHAREHOLDERS_VERIFICATION: 5,
  CORPORATE_ADDRESS_VERIFICATION: 6,
  CHANGE_DOCUMENT_STATUS: 7,
  CHANGE_ACCOUNT_STATUS: 8,

})

module.exports.twoFactorAuthentication = Object.freeze({
  PASSWORD: 1,
  SMS: 2,
  APP: 3,
  EMAIL: 4,
})

module.exports.notifyUnusualLogin = Object.freeze({
  SMS: 1,
  EMAIL: 2,
})

module.exports.passwordDisplay = '*********'
module.exports.commonSiteId = Object.freeze({
  P2TECH: 0,
  MY_FOREX: 1,
  FX_PLUS: 2,
  ICPAY: 3,
  ICPAY_PASS: 4,
  FXT: 5,
  FXS_XEM: 6,
  FXS_TFX: 7,
  FXS_EXN: 8,
})

module.exports.typeData = Object.freeze({
  COUNTRIES: 'countries',
  PREFECTURES: 'prefectures',
  NATIONALITIES: 'nationalities',
  OCCUPATIONS: 'occupations',
  FUNDINGSOURCES: 'fundingSources',
  INDUSTRIES: 'industries',
  USING_PURPOSE_ICPAY: 'usingPurposeICPAY',
  INVESTMENT_PURPOSE_FXT: 'investmentPurposeFXT',
  MONEY_RANGE_PERSON_FXT: 'moneyRangePersonFXT',
  MONEY_RANGE_COMPANY_ICPAY: 'moneyRangeCompanyICPAY',
  MONEY_RANGE_COMPANY_FXT: 'moneyRangeCompanyFXT',
  STATUS: 'status',
})

module.exports.profileStatus = Object.freeze({
  UNREGISTER: 1,
  REGISTER: 2,
})

module.exports.splitContentUpdate = '/$/'

module.exports.country = Object.freeze({
  CHINA: 46,
  JAPAN: 113,
  KOREA: 120,
  UK: 235,
})

module.exports.documentType_02 = ['PoA_A', 'PoA_B', 'MND_A', 'MND_B']

module.exports.tradingAccountType = Object.freeze({
  DEMO: 'Demo',
  REAL: 'Real',
})

module.exports.portfolioAccountMode = Object.freeze({
  DEMO: 0,
  REAL: 2,
})

module.exports.platformCode = Object.freeze({
  MT4: 4,
  MT5: 5,
})

module.exports.platform = Object.freeze({
  MT4: 'mt4',
  MT5: 'mt5',
})

module.exports.accountType = Object.freeze({
  ELITE: 'Elite',
  STANDARD: 'Standard',
})

module.exports.accountTypeShort = {
  ELITE: 'elt',
  STANDARD: 'std',
}

module.exports.baseCurrency = Object.freeze({
  USD: 'USD',
  JPY: 'JPY',
  EUR: 'EUR',
  BTC: 'BTC',
  PT: 'PT',
})

module.exports.openingResonId = Object.freeze({
  OTHER: 4,
})

module.exports.reasonType = Object.freeze({
  OPEN_ACCOUNT: 1,
  REJECT_ACCOUNT: 2,
  REJECT_MATCHING: 4,
  PENDING_MATCHING: 5,
  CLOSE_MATCHING: 6,
  DEFICIENCY_EKYC_ID: 8,
  DEFICIENCY_EKYC_MNC: 9,
  DEFICIENCY_EKYC_POA: 10,
  PENDING_PAYMENT: 11,
  REJECT_PAYMENT: 12,
  CLOSE_PAYMENT: 13,
})

module.exports.apiInfo = Object.freeze({
  ACCOUNT_ADD: 'AccountAdd',
  GET_ACCOUNT_INFO: 'GetAccountInfo',
  CHANGE_BALANCE: 'ChangeBalance',
  CHANGE_CREDIT: 'ChangeCredit',
  CHANGE_PASS: 'ChangePass',
  GET_CLOSED_POSITIONS: 'GetClosedPositions',
  GET_OPEN_POSITIONS: 'GetOpenPositions',
  GET_PENDING_POSITIONS: 'GetPendingPositions',
  CHANGE_LEVERAGE: 'ChangeLeverage',
  CLOSE_OPEN_POSITIONS: 'CloseOpenPosition',
  CHANGE_NAME: 'ChangeName',
  CHANGE_PHONE: 'ChangePhone',
  CHANGE_EMAIL: 'ChangeEmail',
  CHANGE_AGENT: 'ChangeAgent',
  CHANGE_COMMENT: 'ChangeComment',
  CHANGE_COUNTRY: 'ChangeCountry',
  CHANGE_REPORTS: 'ChangeReports',
  CHANGE_ENABLE: 'ChangeEnable',
  CHANGE_READ_ONLY: 'ChangeReadonly',
  GET_RATE: 'GetRate',
  CHANGE_GROUP: 'ChangeGroup',
})

module.exports.leverageAccept = [1000, 500, 400, 300, 200, 100, 75, 50, 25, 10, 2, 1]

module.exports.closeAccount = Object.freeze({
  DISABLE: 0,
  ENABLE: 1,
})

module.exports.enable = Object.freeze({
  ON: 1,
  OFF: 0,
})

module.exports.distributionService = Object.freeze({
  NOTIFICATION_FROM_SITE: 1,
  MARKET_ANALYSIS_FUTURE_FORECAST: 2,
  DAILY_CONFIRMATION_MONTHLY_STATEMENT: 3,
})

module.exports.rateType = Object.freeze({
  LATEST: 0,
  PREVIOUS: 1,
  TODAY_HIGH: 2,
  TODAY_LOW: 3,
  YEAR_HIGH: 4,
  YEAR_LOW: 5,
})

module.exports.ekycFlow = Object.freeze({
  FLOW_A: 'Flow A',
  FLOW_B: 'Flow B',
  FLOW_C: 'Flow C',
  FLOW_D: 'Flow D',
  FLOW_E: 'Flow E',
})

module.exports.ekycType = Object.freeze({
  EKYC: 'eKYC',
  DOC_CHECK: 'Doc. check',
})

module.exports.ekycAuthenticationType = Object.freeze({
  Identification_Auth: 'Identification Auth',
  Face_Auth: 'Face Auth',
  PoA_Auth: 'PoA Auth',
  MNC_Auth: 'MNC Auth',
  Col_Auth: 'CoI Auth',
  PoO_Auth: 'PoO Auth',
  SC_Auth: 'SC Auth',
})

module.exports.ekycMethod = Object.freeze({
  ID_Fact: 'ID Fact check',
  PoA: 'PoA check',
  MNC: 'MNC check',
  DOC_ID_CHECK: 'Doc. ID check',
  DOC_POA_CHECK: 'Doc. PoA check',
  DOC_MNC_CHECK: 'Doc. MNC check',
  DOC_COL_CHECK: 'Doc. CoI check',
  DOC_SC_CHECK: 'Doc. SC check',
  DOC_POO_CHECK: 'Doc. PoO check',
})

module.exports.ekycDocumentType = Object.freeze({
  'Identification_A': 'Identification A',
  'Identification_B': 'Identification B',
  'Identification_C': 'Identification C',
  'Identification_D': 'Identification D',
  'Identification_E': 'Identification E',
  'Identification_F': 'Identification F',
  '3-way_Auth': '3-way auth',
  'PoA_A': 'PoA_A',
  'PoA_B': 'PoA_B',
  'MNC_A': 'MNC_A',
  'MNC_B': 'MNC_B',
  'Col': 'CoI',
  'SC': 'SC',
  'PoO': 'PoO',
})

module.exports.ekycSymbol = Object.freeze({
  ADL: 'ADL',
  ADH: 'ADH',
  PAS: 'PAS',
  MNU: 'MNU',
  FRE: 'FRE',
  PRC: 'PRC',
  BRE: 'BRE',
  OTH: 'OTH',

  F3A: 'F3A',
  RES: 'RES',

  HIN: 'HIN',
  UTI: 'UTI',
  TAX: 'TAX',
  COM: 'COM',
  INS: 'INS',
  CAD: 'CAD',
  BAN: 'BAN',
  MNN: 'MNN',

  UNDEFINED: 'UNDEFINED',
})

module.exports.kycProcessStep = Object.freeze({
  STEP_ALIGN: '1.0',
  STEP_2_0: '2.0',
  STEP_2_1: '2.1',
  STEP_2_2: '2.2',
  STEP_2_3: '2.3',
  STEP_2_4: '2.4',
  STEP_2_5: '2.5',
  STEP_2_6: '2.6',
  STEP_2_7: '2.7',
  STEP_3_0: '3.0',
  STEP_TRIMMING: '3.1',
  STEP_STATUS: '3.2',
  STEP_COMPLETED: '999',
})

module.exports.KYC_DOCUMENT_ID_UNDEFINED = -1

module.exports.kycProcessAngle = Object.freeze({
  ['Identification A']: ['front', 'diagonal_65', 'thickness', 'back'],
  ['Identification B']: ['front', 'diagonal_65', 'thickness', 'back'],
  ['Identification C']: ['front', 'diagonal_65', 'thickness', 'back'],
  ['Identification D']: ['front', 'diagonal_65', 'thickness', 'back'],
  ['Identification E']: ['front', 'diagonal_65', 'thickness', 'back'],
  ['Identification F']: ['front', 'diagonal_65', 'thickness', 'back'],
  ['3-way auth']: ['front', 'right_30', 'left_30'],
  ['PoA_A']: ['front', 'back'],
  ['PoA_B']: ['front', 'address', 'publisher', 'date_of_issue'],
  ['MNC_A']: ['front', 'back'],
  ['MNC_B']: ['front', 'name', 'publisher', 'date_of_issue', 'my_number'],
})

module.exports.aiStatus = Object.freeze({
  ANALYZING: -1,
  SUCCESS: 0,
  MISSING_FRONT_SIDE: 1,
  MISSING_DIAGONAL_65: 2,
  MISSING_BACK_SIDE: 3,
  DOCUMENTS_NOT_SAME_CLASS: 4,
  FRONT_SIDE_MISSING_CORNER: 5,
  BACK_SIDE_MISSING_CORNER: 6,
  IMAGE_NOT_CONTAIN_ID_DOCUMENT: 7,
  DOCUMENT_IS_MISMATCH: 8,
  CODE_SERVER_CLASSIFY_ERROR: 9,
  INVALID_DOCUMENT: 10,
  DIAGONAL_65_MISSING_CORNER: 11,
  CODE_SERVER_FIELD_EXTRACT_ERROR: 12,
})

module.exports.apiSettingTab = Object.freeze({
  TAB_1: 1,
  TAB_2: 2,
  TAB_3: 3,
  TAB_4: 4,
})

module.exports.paymentMethod = Object.freeze({
  ACCOUNT_FXT: 5,
})

module.exports.typeSearch = Object.freeze({
  METHOD: 'method',
  PRIORITY: 'priority',
  CATEGORY: 'category',
  DETAIL: 'detail',
  COMPANY_ACC: 'company_acc',
  SERVICE: 'service',
  UPDATE_RULE: 'update_rule',
})

module.exports.statusRule = Object.freeze({
  ENABLE: 'enable_rule',
  DISABLE: 'disable_rule',
})

module.exports.conditionValue = Object.freeze({
  OR: 'OR',
  AND: 'AND',
})

module.exports.keyValue = Object.freeze({
  USER_ID: 'user_id',
  EMAIL: 'email',
  PHONE: 'phone',
  AMOUNT: 'amount',
  MEMBER_ID: 'member_id',
})

module.exports.timezone = Object.freeze({
  JAPAN: 65,
})

module.exports.defaultApiSetting = Object.freeze({
  DEPEND_DEPOSIT_AMOUNT: '(0 <= 9999) "00001" , (10000 <= 999999) "00002" , (100000 <= 999999) "00003"',
  COMPARE_SPECIFIC_USER: '1234SD,3465As,1274HD',
  MATCHING_CONDITIONS_MAXCONNECT: '[{"key":"user_id","condition":"OR"}, {"key":"email","condition":"AND"}, {"key":"phone","condition":null}]',
  MATCHING_CONDITIONS_INFINITAS: '[{"key":"member_id","condition":null}]',
})

module.exports.passwordStrength = Object.freeze({
  LOW: 1,
  MIDDLE: 2,
  HIGH: 3,
})

module.exports.userMatchingStatus = Object.freeze({
  ACTION_REQUIRED: 1,
  PROCESSING: 2,
  PENDING: 3,
  SUCCESS: 4,
  REJECT: 5,
  CLOSE: 6,
})

module.exports.paymentTransactionStatus = Object.freeze({
  ACTION_REQUIRED: 1,
  PROCESSING: 2,
  PENDING: 3,
  APPROVED: 4,
  REJECT: 5,
  CLOSE: 6,
})

module.exports.paymentType = Object.freeze({
  PAY_IN: 1,
  PAY_OUT: 2,
})

module.exports.decisionMethod = Object.freeze({
  AUTOMATIC: 1,
  MANUAL: 2,
})

module.exports.supportStatus = Object.freeze({
  NO_WORKING: 0,
  WORKING: 1,
  COMPLETION: 2,
})

module.exports.postRequest = Object.freeze({
  BANK_REQUEST: 1,
  PAYMENT_NOTIFICATION: 2,
})

module.exports.paymentMethodFXON = Object.freeze({
  BANK: 1,
  CARD: 2,
  ONLINE_WALLET: 3,
  CRYPTO: 4,
  ACCOUNT: 5,
})

module.exports.paymentMethodICPAY = Object.freeze({
  BANK: 6,
  CARD: 7,
  CV: 8,
  ACCOUNT: 9,
})

module.exports.paymentMethodMYFOREX = Object.freeze({
  BANK: 10,
})

module.exports.paymentCategoryFXON = Object.freeze({
  OVERSEAS_BANK: 1,
  LOCAL_BANK: 2,
  CREDIT_CARD: 3,
  DEBIT_CARD: 4,
  IC_PAY: 5,
  BITWALLET: 6,
  STICPAY: 7,
  CRYPTO_CASH: 8,
  CRYPTO_EXCHANGE: 9,
  ACCOUNT_TRANSFER: 10,
})

module.exports.paymentCategoryICPAY = Object.freeze({
  OVERSEAS_BANK: 11,
  LOCAL_BANK: 12,
  CREDIT_CARD: 13,
  DEBIT_CARD: 14,
  COUNTER: 15,
  KIOSUKU_TERMINAL: 16,
  ACCOUNT_TRANSFER: 17,
})

module.exports.paymentCategoryMYFOREX = Object.freeze({
  OVERSEAS_BANK: 20,
  LOCAL_BANK: 21,
})

module.exports.paymentDetailFXON = Object.freeze({
  BANK_TRANSFER_OVERSEAS_BANK: 1,
  BANK_TRANSFER_LOCAL_BANK: 2,
  VISA_CREDIT_CARD: 3,
  MASTER_CREDIT_CARD: 4,
  JCB_CREDIT_CARD: 5,
  AMEX_CREDIT_CARD: 6,
  DINERS_CREDIT_CARD: 7,
  VISA_DEBIT_CARD: 8,
  MASTER_DEBIT_CARD: 9,
  JCB_DEBIT_CARD: 10,
  WALLET_BALANCE_ICPAY: 11,
  LINKAGE_BANK_ICPAY: 12,
  WALLET_BALANCE_BITWALLET: 13,
  WALLET_BALANCE_STICPAY: 14,
  BITCOIN_CRYPTO_CASH: 15,
  BITCOIN_CRYPTO_EXCHANGE: 16,
  RIPPLE_CRYPTO_EXCHANGE: 17,
  LITECOIN_CRYPTO_EXCHANGE: 18,
  BITCOIN_CASH_CRYPTO_EXCHANGE: 19,
  TETHER_CRYPTO_EXCHANGE: 20,
  TRANSFER_OF_FUNDS_ACCOUNT_TRANSFER: 21,
  TRANSFER_OF_INCENTIVE_ACCOUNT_TRANSFER: 22,
})

module.exports.paymentCompanyAccountFXON = Object.freeze({
  DEPOSIT: {
    BANK_TRANSFER: {
      DIRECT: 1,
      MAX_CONNECT: 2,
      INFINITAS: 3,
    },
    CREDIT_CARD: {
      GO_LIVE_WEB_VISA: 4,
      GO_LIVE_WEB_MASTER: 5,
      GO_LIVE_WEB_JCB: 6,
      GO_LIVE_WEB_AMEX: 7,
      GO_LIVE_WEB_DINERS: 8,
    },
    TRANSFER_FUNDS: {
      WALLET: {
        USD_WALLET: 22,
        JPY_WALLET: 23,
        EUR_WALLET: 24,
        BTC_WALLET: 25,
      },
      TRADING: {
        MT4_USD: 26,
        MT4_JPY: 27,
        MT4_EUR: 28,
        MT4_BTC: 29,
        MT5_USD: 30,
        MT5_JPY: 31,
        MT5_EUR: 32,
        MT5_BTC: 33,
      },
    },
  },
  WITHDRAW: {
    LOCAL_BANK: {
      PAYPAY: 4,
    },
  },
})

module.exports.paymentServiceAccountFXON = Object.freeze({
  DEPOSIT: {
    BANK_TRANSFER: {
      DBS_BANK: 1,
      LOCAL_BANK_TRANSFER_MAX_CONNECT: 2,
      LOCAL_BANK_INFINITAS: 3,
    },
    CREDIT_CARD: {
      CREDIT_CARD_PAYMENT_VISA: 4,
      CREDIT_CARD_PAYMENT_MASTER: 5,
      CREDIT_CARD_PAYMENT_JCB: 6,
      CREDIT_CARD_PAYMENT_AMEX: 7,
      CREDIT_CARD_PAYMENT_DINERS: 8,
    },
  },
  WITHDRAW: {
    BANK_TRANSFER: {
      DBS_BANK: 44,
      TRANSFER_AGENT: 45,
    },
  },
})

module.exports.localBankTimeType = Object.freeze({
  RESPONSE: 'response_date',
  ALLOTTED: 'allotted_date',
  PROCESSING: 'processing_date',
  LAST_DEPT: 'last_dept_date',
})

module.exports.depositAmountType = Object.freeze({
  OR_MORE: 'or_more',
  OR_LESS: 'or_less',
  EQUAL: 'equal',
  TO: 'to',
})

module.exports.modeAPI = Object.freeze({
  CSV_EXPORT: 'csv_export',
})

module.exports.csvFileName = Object.freeze({
  LOCAL_BANK: 'Local_bank_api1_',
  CREDIT_CARD: 'Credit_card_api1_',
  LOCAL_BANK_API_2: 'Local_bank_api2_',
  SYMBOLS_MASTER: 'Symbols_master_',
  PAYPAY_API: 'Paypaybank_api_',
  REBATE_HISTORY: 'Rebate_history_',
  MT_ACCOUNTS: 'MT_accounts_',
  USER_ACCOUNTS_XEM: 'User_accounts_XEM_',
  USER_ACCOUNTS_FXON: 'User_accounts_FXON_',
  USER_ACCOUNTS: 'User_accounts_',
  INDUCED_TRADERS: 'Induced_traders_',
})

module.exports.regCategory = Object.freeze({
  PERSONAL: 0,
  CORPORATE: 1,
})

module.exports.countryId = Object.freeze({
  JAPAN: 113,
})

module.exports.bankApi = Object.freeze({
  FXT_MAXCONNECT: 1,
  FXT_INFINITAS: 2,
  FXT_CREDIT_CARD: 3,
})

module.exports.transactionStatus = Object.freeze({
  ACCEPTED: 1,
  PROCESSING: 2,
  PENDING: 3,
  SUCCESSFULLY: 4,
  REJECTED: 5,
  CLOSED: 6,
})

module.exports.matchingMethod = Object.freeze({
  AUTOMATIC: 1,
  MANUAL: 2,
})

module.exports.typeWallet = Object.freeze({
  USD_WALLET: 1,
  JPY_WALLET: 2,
  EUR_WALLET: 3,
  PARTNER_WALLET: 4,
  BTC_WALLET: 5,
  POINT_WALLET: 6,
})

module.exports.transactionType = Object.freeze({
  DEPOSIT: 1,
  WITHDRAW: 2,
  REDEEM: 3,
  REFUND: 4,
  DEPOSIT_FEE: 5,
  WITHDRAW_FEE: 6,
})

module.exports.transactionObjectType = Object.freeze({
  USD_WALLET: 1,
  JPY_WALLET: 2,
  EUR_WALLET: 3,
  PARTNER_WALLET: 4,
  BTC_WALLET: 5,
  POINT_WALLET: 6,
  TRADING_ACCOUNT: 7,
})

module.exports.characterKatakana = {
  'ァ': 'ｧ',
  'ア': 'ｱ',
  'ィ': 'ｨ',
  'イ': 'ｲ',
  'ゥ': 'ｩ',
  'ウ': 'ｳ',
  'ェ': 'ｪ',
  'エ': 'ｴ',
  'ォ': 'ｫ',
  'オ': 'ｵ',
  'カ': 'ｶ',
  'ガ': 'ｶﾞ',
  'キ': 'ｷ',
  'ギ': 'ｷﾞ',
  'ク': 'ｸ',
  'グ': 'ｸﾞ',
  'ケ': 'ｹ',
  'ゲ': 'ｹﾞ',
  'コ': 'ｺ',
  'ゴ': 'ｺﾞ',
  'サ': 'ｻ',
  'ザ': 'ｻﾞ',
  'シ': 'ｼ',
  'ジ': 'ｼﾞ',
  'ス': 'ｽ',
  'ズ': 'ｽﾞ',
  'セ': 'ｾ',
  'ゼ': 'ｾﾞ',
  'ソ': 'ｿ',
  'ゾ': 'ｿﾞ',
  'タ': 'ﾀ',
  'ダ': 'ﾀﾞ',
  'チ': 'ﾁ',
  'ヂ': 'ﾁﾞ',
  'ッ': 'ｯ',
  'ツ': 'ﾂ',
  'ヅ': 'ﾂﾞ',
  'テ': 'ﾃ',
  'デ': 'ﾃﾞ',
  'ト': 'ﾄ',
  'ド': 'ﾄﾞ',
  'ナ': 'ﾅ',
  'ニ': 'ﾆ',
  'ヌ': 'ﾇ',
  'ネ': 'ﾈ',
  'ノ': 'ﾉ',
  'ハ': 'ﾊ',
  'バ': 'ﾊﾞ',
  'パ': 'ﾊﾟ',
  'ヒ': 'ﾋ',
  'ビ': 'ﾋﾞ',
  'ピ': 'ﾋﾟ',
  'フ': 'ﾌ',
  'ブ': 'ﾌﾞ',
  'プ': 'ﾌﾟ',
  'ヘ': 'ﾍ',
  'ベ': 'ﾍﾞ',
  'ペ': 'ﾍﾟ',
  'ホ': 'ﾎ',
  'ボ': 'ﾎﾞ',
  'ポ': 'ﾎﾟ',
  'マ': 'ﾏ',
  'ミ': 'ﾐ',
  'ム': 'ﾑ',
  'メ': 'ﾒ',
  'モ': 'ﾓ',
  'ャ': 'ｬ',
  'ヤ': 'ﾔ',
  'ュ': 'ｭ',
  'ユ': 'ﾕ',
  'ョ': 'ｮ',
  'ヨ': 'ﾖ',
  'ラ': 'ﾗ',
  'リ': 'ﾘ',
  'ル': 'ﾙ',
  'レ': 'ﾚ',
  'ロ': 'ﾛ',
  'ヮ': '',
  'ワ': 'ﾜ',
  'ヲ': 'ｦ',
  'ン': 'ﾝ',
  'ヴ': 'ｳﾞ',
  '・': '･',
  'ー': 'ｰ',
}

module.exports.amountDeposit = {
  LOCAL_BANK: {
    MINIMUM: 5000,
    FEE: 1000,
  },
  CREDIT_CARD: {
    MINIMUM: {
      JPY: 1000,
      USD: 10,
      EUR: 10,
    },
  },
}

module.exports.regCategory = Object.freeze({
  PERSONAL: 0,
  CORPORATE: 1,
})

module.exports.countryId = Object.freeze({
  JAPAN: 113,
})

module.exports.commonSiteName = Object.freeze({
  MY_FOREX: 'Myforex',
  FX_PLUS: 'FXplus',
  ICPAY: 'IC Pay',
  ICPAY_PASS: 'IC PASS',
  FXT: 'FXON',
})

module.exports.groupMetatrader = Object.freeze({
  EUR_2: 'MI\\E\\E\\1Kh',
  EUR_3: 'MI\\E\\S\\1Kh',
  EUR_5: 'demo\\E\\E\\1Kh',
  EUR_6: 'demo\\E\\S\\1Kh',
  EUR_1: 'MI-E-Ex1Kh',
  EUR_4: 'demo-E-Ex1Kh',

  JPY_2: 'MI\\J\\E\\1Kh',
  JPY_3: 'MI\\J\\S\\1Kh',
  JPY_5: 'demo\\J\\E\\1Kh',
  JPY_6: 'demo\\J\\S\\1Kh',
  JPY_1: 'MI-J-Ex1Kh',
  JPY_4: 'demo-J-Ex1Kh',

  USD_2: 'MI\\U\\E\\1Kh',
  USD_3: 'MI\\U\\S\\1Kh',
  USD_5: 'demo\\U\\E\\1Kh',
  USD_6: 'demo\\U\\S\\1Kh',
  USD_1: 'MI-U-Ex1Kh',
  USD_4: 'demo-U-Ex1Kh',
})

module.exports.typeTransactionProcess = Object.freeze({
  POSTING: 'Posting',
  MATCHING_STATUS: 'Matching status',
  PAYMENT_STATUS: 'Payment status',
  EXCHANGE: 'Exchange',
  CHARGE: 'Charge',
  PAY_IN: 'Payin',
  PAY_OUT: 'Payout',
  PO_STATUS: 'P.O status',
  CASHBACK_STATUS: 'Cashback status',
  PAYOUT_REVERSE: 'Payout(Reverse)',
})

module.exports.sourceTransactionProcess = Object.freeze({
  SYSTEM_MATCHING: 'System matching',
  MATCHING_FAILURE: 'Matching failure',
  MATCHING_APPROVED: 'Matching approved',
  SYSTEM_PAYMENT: 'System payment',
  ACTION_REQUIRED: 'Action required',
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  APPROVED: 'Approved',
  CURRENCY_EXCHANGE: 'Currency exchange',
  DEPOSIT_FEE: 'Deposit fee',
  WITHDRAWAL_FEE: 'Withdrawal fee',
  IMPOSSIBLE: 'Impossible',
  REJECT: 'Reject',
  REJECT_CLOSE: 'Reject close',
  CLOSE: 'Close',
})

module.exports.actionGroupTransactionProcess = Object.freeze({
  OPERATOR_ACTION: 1,
  USER_ACTION: 2,
  SYSTEM_ACTION: 3,
})

module.exports.ruleTemplate = Object.freeze({
  SETTING_AVAILABILITY: 2,
  SETTING_PAYMENT_COMPANY: 1,
})

module.exports.dateType = Object.freeze({
  PER_TIME: 'per_time',
  LAST_30_DAYS: 'last_30_days',
  LAST_90_DAYS: 'last_90_days',
  LAST_120_DAYS: 'last_120_days',
})

module.exports.publishTargetPortfolio = Object.freeze({
  PUBLISH: 1,
  PRIVATE: 0,
})

module.exports.publishRangePortfolio = Object.freeze({
  ONLY: 0,
  ALL: 1,
  MEMBER: 2,
})

module.exports.tradingMethodPortfolio = Object.freeze({
  DT: 'DT',
  EA: 'EA',
})

module.exports.maxLength = Object.freeze({
  PORTFOLIO_NAME_FULL_WIDTH: 12,
  PORTFOLIO_NAME_HALF_WIDTH: 25,
  PORTFOLIO_DESC_FULL_WIDTH: 35,
  PORTFOLIO_DESC_HALF_WIDTH: 70,
  PORTFOLIO_NAME_MAX_BYTE: 24,
  PORTFOLIO_DESC_MAX_BYTE: 70,
})

module.exports.portfolioFlag = Object.freeze({
  DEFAULT: 1,
  CUSTOM: 0,
})

module.exports.creditCardPostRequest = Object.freeze({
  CREDIT_CARD_REQUEST: 1,
  PAYMENT_NOTIFICATION: 2,
})

module.exports.creditCardStatus = Object.freeze({
  FAIL: 0,
  SUCCESS: 1,
})

module.exports.creditCardResult = Object.freeze({
  SUCCESS: 'Success',
  FAIL: 'Failed',
})

module.exports.creditCardBrandMapping = Object.freeze({
  VISA: 'VISA',
  JCB: 'JCB',
  MASTER: 'MASTERCARD',
  AMEX: 'AMEX',
  DINERS: 'DINERSCLUB',
})

module.exports.creditCardBrand = Object.freeze({
  VISA: 'VISA',
  JCB: 'JCB',
  MASTER: 'MASTER',
  AMEX: 'AMEX',
  DINERS: 'DINERS',
})

module.exports.approvedStatusItems = Object.freeze({
  icpay: {
    personal: `{"nationality_id":3,"name_romaji":3,"name_kanji":3,"name_katakana":3,"gender":3,"date_of_birth":3,"country_id":3
        ,"zip_postal_code":2,"state_province":2,"city":2,"address_line_1":2,"address_line_2":2,"occupation_id":3,"funding_source_id":3
        ,"industry_id":3,"purpose_of_investment":3}`,
    representPerson: `{"nationality_id":3,"name_romaji":3,"name_kanji":3,"name_katakana":3,"gender":3,"date_of_birth":3
        ,"country_id":3,"zip_postal_code":2,"state_province":2,"city":2,"address_line_1":2,"address_line_2":2,"contact_phone_number":2}`,
    transactionPerson: `{"nationality_id":3,"name_romaji":3,"name_kanji":3,"name_katakana":3,"gender":3,"date_of_birth":3
        ,"country_id":3,"zip_postal_code":2,"state_province":2
        ,"city":2,"address_line_1":2,"address_line_2":2,"phone_number":2,"email":2}`,

    shareholderPerson: `{"nationality_id":3,"name_romaji":3,"name_kanji":3
        ,"name_katakana":3,"gender":3,"date_of_birth":3,"country_id":3
        ,"zip_postal_code":2,"state_province":2,"city":2,"address_line_1":2
        ,"address_line_2":2,"contact_phone_number":2,"voting_ratio":3}`,

    shareholderCorporate: `{"country_id":3,"corporate_name_registered":3,"corporate_name_english":3,
        "corporate_name_katakana":3,"date_of_establish":3,"zip_postal_code":2,
        "state_province":2,"city":2,"address_line_1":2,"address_line_2":2,
        "corporate_phone_number":2,"industry_id":3,"business_content":3,"website_url":2,"voting_ratio":3}`,
    corporate: `{"country_id":3,"corporate_name_registered":3,"corporate_name_english":3,"corporate_name_katakana":3,
        "date_of_establish":3,"zip_postal_code":2,"state_province":2,"city":2,"address_line_1":2,
        "address_line_2":2,"corporate_phone_number":2,"industry_id":3,"business_content":3,
        "website_url":2,"estimated_annual_usage_amount":3,"purpose_of_use":3}`,

  },
  fxt: {
    personal: `{"nationality_id":3,"name_romaji":3,"name_kanji":3,"name_katakana":3,"gender":3,"date_of_birth":3
        ,"us_tax_obligations":3,"us_taxpayer_number":3,"country_id":3,"zip_postal_code":2,"state_province":2,"city":2
        ,"address_line_1":2,"address_line_2":2,"occupation_id":3,"funding_source_id":3,"industry_id":3,"annual_income":3
        ,"net_worth":3,"planned_annual_investment":3,"purpose_of_investment":3,"user_name":2}`,
    representPerson: `{"nationality_id":3,"name_romaji":3,"name_kanji":3,"name_katakana":3
        ,"gender":3,"date_of_birth":3,"us_tax_obligations":3,"us_taxpayer_number":3
        ,"country_id":3,"zip_postal_code":2,"state_province":2,"city":2,"address_line_1":2
        ,"address_line_2":2,"contact_phone_number":2}`,
    transactionPerson: `{"nationality_id":3,"name_romaji":3,"name_kanji":3,"name_katakana":3,"gender":3,"date_of_birth":3
      ,"us_tax_obligations":3,"us_taxpayer_number":3,"country_id":3,"zip_postal_code":2
      ,"state_province":2,"city":2,"address_line_1":2,"address_line_2":2,"phone_number":2,"email":2,"user_name":2}`,
    corporate: `{"country_id":3,"corporate_name_registered":3,
      "corporate_name_english":3,"corporate_name_katakana":3,"us_tax_obligations":3,
      "us_taxpayer_number":3,"date_of_establish":3,"zip_postal_code":2,"state_province":2
      ,"city":2,"address_line_1":2,"address_line_2":2,"corporate_phone_number":2,"industry_id":3
      ,"business_content":3,"website_url":2,"company_annual_sales":3,"net_asset_amount":3
      ,"estimated_annual_usage_amount":3,"purpose_of_use":3}`,
  },
  myforex: {
    personal: `{"nationality_id":3,"name_romaji":3,"name_kanji":3,"name_katakana":3
      ,"gender":3,"date_of_birth":3,"country_id":3,"zip_postal_code":2,"state_province":2,"city":2,"address_line_1":2
      ,"address_line_2":2,"user_name":2}`,

  },
})

module.exports.authorizationName = {
  SYSTEM_ADMINISTRATOR: 1,
  ADMINISTRATOR: 2,
  OPERATIONS_MANAGER: 3,
  OPERATIONS_STAFF: 4,
  EKYC_STAFF: 5,
  FINANCE_MANAGER: 6,
}

module.exports.errorLogType = Object.freeze({
  MAIN_ERROR: 0,
  WRITE_FROM_FE: 1,
  WRITE_FROM_BE: 2,
})

module.exports.pathPayment = Object.freeze({
  MAX_CONNECT: '/matching-deposit-localbank',
  GO_LIVE_WEB: '/auto-payment-credit-card',
})

module.exports.language = Object.freeze({
  EN: 'en',
  JA: 'ja',
  CN: 'cn',
  KR: 'kr',
})

module.exports.multilingualismType = Object.freeze({
  item_on_screen: 'item_on_screen',
  validate: 'validate',
  email: 'email',
  csv_pdf: 'csv_pdf',
  master_data: 'master_data',
})

module.exports.brokerCrawl = Object.freeze({
  EXN: 'exness',
  MIL: 'milton-market',
  THT: 'three-trader',
  GTD: 'generate-trade',
  FXG: 'fxgt',
  HOT: 'hfm',
  IS6: 'is6com',
  LAN: 'land-fx',
  MYF: 'myfx-market',
})

module.exports.bankType = Object.freeze({
  LOCAL_BANK: 'local_bank',
  OVERSEA_BANK: 'oversea_bank',
})

module.exports.accountLocalBankType = Object.freeze({
  ORDINARY: 1,
  CURRENT: 2,
})

module.exports.processingCashback = Object.freeze({
  UNPROCESSED: 0,
  IMPORTED: 1,
  NOT_APPLY: 2,
  ERROR: 8,
  DELETED: 9,
})

module.exports.cashbackStatus = Object.freeze({
  ACTION_REQUIRED: 1,
  PENDING: 2,
  SUCCESS: 3,
  PAID: 4,
})

module.exports.messageId = Object.freeze({
  MY_FOREX: {
    UNREGISTER: 21,
    WAITING_APPROVED: 22,
    REGIST_APPROVED: 23,
    EKYC_UNSUBMITTED: 12,
    EKYC_CHECKING: 13,
    EKYC_APPROVED: 14,
  },
  ICPAY: {
    UNREGISTER: 5,
    WAITING_APPROVED: 6,
    REGIST_APPROVED: 7,
    UPDATE_APPROVED: 8,
    EKYC_UNSUBMITTED: 15,
    EKYC_CHECKING: 16,
    EKYC_APPROVED: 17,
  },
  FXT: {
    UNREGISTER: 1,
    WAITING_APPROVED: 2,
    REGIST_APPROVED: 3,
    UPDATE_APPROVED: 4,
    CANNOT_OPEN_REAL_ACCOUNT: 9,
    ACCOUNT_SIMILAR: 10,
    EKYC_UNSUBMITTED: 18,
    EKYC_CHECKING: 19,
    EKYC_APPROVED: 20,
  },
})

module.exports.brokersLinkMasterType = Object.freeze({
  BROKER: 'broker',
  PRODUCT_TYPE: 'product_type',
  ACCOUNT_TYPE: 'account_type',
})

module.exports.sequenceAction = Object.freeze({
  UP: 'up',
  DOWN: 'down',
})

module.exports.categoryChangeProfile = Object.freeze({
  JA_NAME: '基本情報',
  EN_NAME: 'Basic information',
  CN_NAME: '基本信息',
  KR_NAME: '기본 정보',
})

module.exports.lotRebateCurrency = Object.freeze({
  SPP: 'SPP',
  USD: 'USD',
  JPY: 'JPY',
  EUR: 'EUR',
  PIPS: 'Pips',
  POINTS: 'Points',
})

module.exports.cbRebateCurrency = Object.freeze({
  SPP: 'SPP',
  P: 'P',
  USD: 'USD',
  JPY: 'JPY',
  EUR: 'EUR',
  PIPS: 'Pips',
  POINTS: 'Points',
})

module.exports.constantKey = Object.freeze({
  LEVERAGE_UNLIMITED: 'Unlimited',
})

module.exports.walletStatus = Object.freeze({
  SUSPENDED: 1,
  INACTIVATED: 2,
  ACTIVATED: 3,
})

module.exports.rebateStatus = Object.freeze({
  DURING_VERIFICATION: 1,
  SURE: 2,
  NOT_APPLICABLE: 3,
})

module.exports.withdrawalAmountType = Object.freeze({
  OR_MORE: 'or_more',
  OR_LESS: 'or_less',
})


module.exports.symbolCurrency = Object.freeze({
  USD: '$',
  JPY: '¥',
  EUR: '€',
  PT: 'PT',
  BTC: 'BTC',
})

module.exports.toggleStatus = Object.freeze({
  ON: 1,
  OFF: 0,
})

module.exports.paypayBankApiStatus = Object.freeze({
  FAIL: 0,
  SUCCESS: 1,
})

module.exports.postRequestPaypay = Object.freeze({
  PAYMENT_REQUEST: 1,
  NON_PAYMENT_REQUEST: 2,
})

module.exports.typeAccountLocalBank = Object.freeze({
  ORDINARY: '普通',
  CURRENT: '当座',
})

module.exports.gender = Object.freeze({
  MALE: 1,
  FEMALE: 2,
  OTHER: 3,
  NO_ANSWER: 4,
})

module.exports.twoFAMethod = Object.freeze({
  NOT_SELECTED: -1,
  SMS: 1,
  EMAIL: 2,
})

module.exports.displayDateTime = Object.freeze({
  YYYY_MM_DD: 1,
  MM_DD_YYYY: 2,
  DD_MM_YYYY: 3,
})

module.exports.loginBase = Object.freeze({
  PASS: 1,
  NOT_PASS: 0,
})

module.exports.arrayIBRank = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

module.exports.crawlUpdateMode = Object.freeze({
  IB_RANK: 'ib-rank',
  BIG_ACCOUNT_NAME: 'big-account-name',
  MIL_ACCOUNT_NAME: 'mil-account-name',
})

module.exports.logTypes = Object.freeze({
  START: 0,
  PROCESS: 1,
  PROCESS_RESULT: 2,
  END: 9,
})

module.exports.batchTypes = Object.freeze({
  XMG: 1,
  MIL: 2,
  EXN: 3,
  TFX: 4,
  BIG: 5,
  ACC_BIG: 6,
  MANAGER_API: 7,
  UPD_IB_ACT: 8,
  RBT_HIST: 9,
  CALC_RBT_HIST_BIG: 10,
  CALC_RBT_HIST_EXN: 11,
  CALC_RBT_HIST_MIL: 12,
  CALC_RBT_HIST_TFX: 13,
  CALC_RBT_HIST_XEM: 14,
  CALC_RBT_HIST_XMG: 15,
  PUSH_SQS_TFX: 16,
  PUSH_SQS_BIG: 17,
  GET_SQS_TFX: 18,
  GET_SQS_BIG: 19,
  DEL_BL: 20,
  INSERT_REBATE_STATISTICS: 22,
  INDUCED_TRADERS: 26,
  INDUCED_TRADERS_STATISTICS: 27,
  GET_EXCHANGE_RATE: 28,
  CLEAR_ERROR_LOG: 30,
})

module.exports.jobNames = Object.freeze({
  1: 'スクレイピングXM Trading_Global取得JOB',
  2: 'スクレイピングMilton取得JOB',
  3: 'スクレイピングExnessAPI取得JOB',
  4: 'スクレイピングEA(Titan)取得JOB',
  5: 'スクレイピングEA(Bigboss)取得JOB',
  6: 'スクレイピングBigbossアカウント名取得JOB',
  7: 'ManagerAPIデータ取得JOB',
  8: 'スクレイピング内部処理JOB',
  9: 'リベートヒストリJOB',
  10: 'リベートヒストリ計算JOB(BIG)',
  11: 'リベートヒストリ計算JOB(EXN)',
  12: 'リベートヒストリ計算JOB(MIL)',
  13: 'リベートヒストリ計算JOB(TFX)',
  14: 'リベートヒストリ計算JOB(XEM)',
  15: 'リベートヒストリ計算JOB(XMG)',
  16: 'スクレイピングEA(Nodejs)保存SQS登録処理(TFX)',
  17: 'スクレイピングEA(Nodejs)保存SQS登録処理(BIG)',
  18: 'スクレイピングEA(Nodejs)SQS取込処理(TFX)',
  19: 'スクレイピングEA(Nodejs)SQS取込処理(BIG)',
  20: 'Batchログ削除JOB',
  22: 'リベートヒストリスタァティスティックスJOB',
  26: 'InducedTradersデータ登録JOB',
  27: 'InducedTradersStatisticsデータ登録JOB',
  28: '為替レート取得JOB',
  30: 'Errorログ削除JOB',
})

module.exports.resultTypes = Object.freeze({
  ERROR: 0,
  SUCCESS: 1,
})

const _resultIds = Object.freeze({
  START_RESULT_ID: 9000001,
  END_RESULT_ID: 9000002,
  SUCCESS_RESULT_ID: 9000003,
  FAIL_RESULT_ID: 9000005,
})

module.exports.resultIds = _resultIds

module.exports.resultMessages = Object.freeze({
  9000001: (bathType, jobName) => {
    return `${bathType}:${jobName}を実行開始します`
  },
  9000002: (bathType, jobName) => {
    return `${bathType}:${jobName}を実行終了します`
  },
  9000003: (batchType, jobName, resultCount) => {
    return `${batchType}:${jobName}は${resultCount}件正常に処理しました`
  },
  9000005: (batchType, jobName) => {
    return `${batchType}:${jobName}ではエラーが発生したため、処理を中断しました。詳細なエラーについては処理結果詳細をご確認ください。`
  },
})

module.exports.brokerID = Object.freeze({
  DEFAULT: 0,
  XEM: 1,
  TFX: 2,
  BIG: 3,
  EXN: 4,
  MIL: 5,
  THT: 6,
  GTD: 7,
  FXG: 8,
  HOT: 9,
  IS6: 10,
  LAN: 11,
  MYF: 12,
  FXON: 13,
  XMG: 14,
})

module.exports.tokenAuthorityClass = Object.freeze({
  CREATE_ACCOUNT: 'create-account',
  RESET_PASSWORD: 'reset-password',
  FRAUD_ALERT: 'fraud-alert',
  EKYC_AI: 'ekyc-ai',
  KYC_SUMMARY: 'kyc-summary',
})

module.exports.onetimeAuthorityClass = Object.freeze({
  LOGIN_2FA_SMS: 'login-2fa-sms',
  LOGIN_2FA_EMAIL: 'login-2fa-email',
})

module.exports.statusCode = Object.freeze({
  UNSUBMITTED: 10,
  INACTIVATED: 20,
  REGISTERED: 30,
  ACTIVATED: 40,
  REQUIRED: 50,
  PROCESSING: 60,
  WORKING: 70,
  APPROVED: 80,
  COMPLETED: 90,
  MATCHING: 100,
  PENDING: 110,
  REJECTED: 120,
  UNMATCHED: 130,
  CLOSED: 140,
  IMPOSSIBLE: 150,
  EXPIRED: 160,
})

module.exports.userBasicClass = Object.freeze({
  USER: 0,
  ADMIN: 1,
  MASTER_ADMIN: 2,
})

module.exports.queryTime = Object.freeze({
  USER_TIME: 'user_time',
  BROKER_TIME: 'broker_time',
})

module.exports.processingStatusCrawl = Object.freeze({
  SCRAPING_EXECUTED: 0,
  SCRAPING_PROCESS_COMPLETED: 1,
  SCRAPING_INTERNALLY_PROCESSED: 2,
  REBATE_HISTORY_IMPORTED: 3,
})

module.exports.mgrapiUpdateStatus = Object.freeze({
  NOT_IMPORTED: 0,
  IMPORTED: 1,
  NOT_APPLICABLE: 2,
})

// XM trading, Exness, Titan, BigBoss, Miltion
module.exports.configBroker = Object.freeze({
  LIST_BROKER_CODE_REBATE: ['XEM', 'TFX', 'BIG', 'MIL', 'EXN', 'XMG'],
  LIST_BROKER_CODE_NORMAL: ['XEM', 'TFX', 'BIG', 'MIL', 'XMG'],
  XM_TRADING: {
    ID: 1,
    CODE: 'XEM',
  },
  TITAN_FX: {
    ID: 2,
    CODE: 'TFX',
  },
  BIG_BOSS: {
    ID: 3,
    CODE: 'BIG',
  },
  EXNESS: {
    ID: 4,
    CODE: 'EXN',
  },
  MILTON_MARKETS: {
    ID: 5,
    CODE: 'MIL',
  },
  XM_GLOBAL: {
    ID: 14,
    CODE: 'XMG',
  },
})

module.exports.calculatedFlagConstant = Object.freeze({
  UNPROCESSED: 0,
  PROCESSED: 1,
})

module.exports.basePathLogo = 'images/logo/'

module.exports.accountMode = Object.freeze({
  DEMO: 'Demo',
  REAL: 'Real',
})

module.exports.brokerCode = Object.freeze({
  FXO: 'FXO',
})

module.exports.brokerName = Object.freeze({
  FXON: 'FXON',
})

module.exports.currencyAccountType = Object.freeze({
  USD: 'USD',
  JPY: 'JPY',
  EUR: 'EUR',
  SGD: 'SGD',
  AUD: 'AUD',
  GBP: 'GBP',
  NZD: 'NZD',
  ZAR: 'ZAR',
  HUF: 'HUF',
  CHF: 'CHF',
})

module.exports.server = Object.freeze({
  Prod: 'Prod',
  Dev: 'Dev',
})

module.exports.ENVParamName = Object.freeze({
  Dev: 'MGR_API_DEV',
  Prod: 'MGR_API_PROD',
})

module.exports.firstMTServerName = Object.freeze({
  Dev: 'FXONTest-',
  Prod: 'FXON-',
})

module.exports.LastFQDNName = Object.freeze({
  Dev: '.p2t.sg',
  Prod: '.fxon.com',
})

module.exports.accountTypeID = Object.freeze({
  ELITE: 41,
  STANDARD: 40,
})


module.exports.resultDetailIds = Object.freeze({
  E_1008001: 1008001,
  E_1008002: 1008002,
  E_1008003: 1008003,
  E_1008004: 1008004,
  E_1008005: 1008005,
  E_1009001: 1009001,
  E_1009002: 1009002,
  E_1010001: 1010001,
  E_1010002: 1010002,
  E_1010003: 1010003,
  E_1010004: 1010004,
  E_1010005: 1010005,
  E_1011001: 1011001,
  E_1011002: 1011002,
  E_1011003: 1011003,
  E_1011004: 1011004,
  E_1011005: 1011005,
  E_1012001: 1012001,
  E_1012002: 1012002,
  E_1012003: 1012003,
  E_1012004: 1012004,
  E_1012005: 1012005,
  E_1013001: 1013001,
  E_1013002: 1013002,
  E_1013003: 1013003,
  E_1013004: 1013004,
  E_1013005: 1013005,
  E_1014001: 1014001,
  E_1014002: 1014002,
  E_1014003: 1014003,
  E_1014004: 1014004,
  E_1014005: 1014005,
  E_1015001: 1015001,
  E_1015002: 1015002,
  E_1015003: 1015003,
  E_1015004: 1015004,
  E_1015005: 1015005,
  E_1022001: 1022001,
  E_1022002: 1022002,
  E_1026001: 1026001,
  E_1026002: 1026002,
  E_1027001: 1027001,
  E_1027002: 1027002,
  E_1028001: 1028001,
  E_1028002: 1028002,
  E_1030001: 1030001,
  E_1030002: 1030002,
})

module.exports.resultDetailMessages = Object.freeze({
  E_1008001: (tableName) => {
    return `${tableName}テーブルからデータを取得できませんでした。`
  },
  E_1008002: (tableName) => {
    return `${tableName}テーブルにデータを更新できませんでした。`
  },
  E_1008003: (exceptionMessage) => {
    return `不明なエラー(${exceptionMessage})`
  },
  E_1008004: 'タイムアウトが発生しました。',
  E_1008005: (number) => {
    return `${number}件の重複があり、job_status=4に更新されました。`
  },
  E_1009001: (exceptionMessage) => {
    return `不明なエラー(${exceptionMessage})`
  },
  E_1009002: 'タイムアウトが発生しました。',
  E_1010001: `('${process.env.URL_API_SYNC_RATE_REBATE}/rates/getMultipleBrokerRate')の呼び出しに失敗しました。`,
  E_1010002: (quantity) => {
    return `rebate_historyテーブルへの${quantity}件のレコードの更新に失敗しました。`
  },
  E_1010003: (exceptionMessage) => {
    return `不明なエラー(${exceptionMessage})`
  },
  E_1010004: '対象の更新が存在しませんでした。',
  E_1010005: 'タイムアウトが発生しました。',
  E_1011001: `('${process.env.URL_API_SYNC_RATE_REBATE}/rates/getMultipleBrokerRate')の呼び出しに失敗しました。`,
  E_1011002: (quantity) => {
    return `rebate_historyテーブルへの${quantity}件のレコードの更新に失敗しました。`
  },
  E_1011003: (exceptionMessage) => {
    return `不明なエラー(${exceptionMessage})`
  },
  E_1011004: '対象の更新が存在しませんでした。',
  E_1011005: 'タイムアウトが発生しました。',
  E_1012001: `('${process.env.URL_API_SYNC_RATE_REBATE}/rates/getMultipleBrokerRate')の呼び出しに失敗しました。`,
  E_1012002: (quantity) => {
    return `rebate_historyテーブルへの${quantity}件のレコードの更新に失敗しました。`
  },
  E_1012003: (exceptionMessage) => {
    return `不明なエラー(${exceptionMessage})`
  },
  E_1012004: '対象の更新が存在しませんでした。',
  E_1012005: 'タイムアウトが発生しました。',
  E_1013001: `('${process.env.URL_API_SYNC_RATE_REBATE}/rates/getMultipleBrokerRate')の呼び出しに失敗しました。`,
  E_1013002: (quantity) => {
    return `rebate_historyテーブルへの${quantity}件のレコードの更新に失敗しました。`
  },
  E_1013003: (exceptionMessage) => {
    return `不明なエラー(${exceptionMessage})`
  },
  E_1013004: '対象の更新が存在しませんでした。',
  E_1013005: 'タイムアウトが発生しました。',
  E_1014001: `('${process.env.URL_API_SYNC_RATE_REBATE}/rates/getMultipleBrokerRate')の呼び出しに失敗しました。`,
  E_1014002: (quantity) => {
    return `rebate_historyテーブルへの${quantity}件のレコードの更新に失敗しました。`
  },
  E_1014003: (exceptionMessage) => {
    return `不明なエラー(${exceptionMessage})`
  },
  E_1014004: '対象の更新が存在しませんでした。',
  E_1014005: 'タイムアウトが発生しました。',
  E_1015001: `('${process.env.URL_API_SYNC_RATE_REBATE}/rates/getMultipleBrokerRate')の呼び出しに失敗しました。`,
  E_1015002: (quantity) => {
    return `rebate_historyテーブルへの${quantity}件のレコードの更新に失敗しました。`
  },
  E_1015003: (exceptionMessage) => {
    return `不明なエラー(${exceptionMessage})`
  },
  E_1015004: '対象の更新が存在しませんでした。',
  E_1015005: 'タイムアウトが発生しました。',
  E_1022001: (exceptionMessage) => {
    return `不明なエラー(${exceptionMessage})`
  },
  E_1022002: 'タイムアウトが発生しました。',
  E_1026001: (exceptionMessage) => {
    return `不明なエラー(${exceptionMessage})`
  },
  E_1026002: 'タイムアウトが発生しました。',
  E_1027001: (exceptionMessage) => {
    return `不明なエラー(${exceptionMessage})`
  },
  E_1027002: 'タイムアウトが発生しました。',
  E_1028001: (exceptionMessage) => {
    return `不明なエラー(${exceptionMessage})`
  },
  E_1028002: 'タイムアウトが発生しました。',
  E_1030001: (exceptionMessage) => {
    return `不明なエラー(${exceptionMessage})`
  },
  E_1030002: 'タイムアウトが発生しました。',
})

module.exports.triggerConditionClass = Object.freeze({
  ALL_USERS: 'all-users',
  BALANCE_IN_WALLET_USERS: 'balance-in-wallet-users',
})

module.exports.statusTarget = Object.freeze({
  OBJECT: [10, 20, 30, 40, 50, 60, 80, 110, 120, 140, 160],
  ACTION: [50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150],
})

module.exports.statusMasterFlag = Object.freeze({
  STATUS_MASTER: 1,
  STATUS_LABEL: 0,
})

module.exports.uncheckALL = -1

module.exports.xemBrokerConstant = Object.freeze({
  CODE: 'XEM',
  ID: 1,
})

module.exports.accountBaseCurrencies = Object.freeze([
  {
    name: 'base_currency_usd',
    value: 'USD',
  },
  {
    name: 'base_currency_jpy',
    value: 'JPY',
  },
  {
    name: 'base_currency_eur',
    value: 'EUR',
  },
  {
    name: 'base_currency_sgd',
    value: 'SGD',
  },
  {
    name: 'base_currency_aud',
    value: 'AUD',
  },
  {
    name: 'base_currency_nzd',
    value: 'NZD',
  },
  {
    name: 'base_currency_gbp',
    value: 'GBP',
  },
  {
    name: 'base_currency_zar',
    value: 'ZAR',
  },
  {
    name: 'base_currency_huf',
    value: 'HUF',
  },
  {
    name: 'base_currency_chf',
    value: 'CHF',
  },
])

module.exports.customerRankConstant = Object.freeze({
  FIRST: 1,
  SECOND: 2,
  THIRD: 3,
  FOURTH: 4,
})

module.exports.groupType = Object.freeze({
  A_GROUP: 1,
  B_GROUP: 2,
})

module.exports.envCommon = Object.freeze({
  APIKEY_MT_ACCOUNT_ADD: 'APIKEY_MT_ACCOUNT_ADD',
  APIKEY_MT_GET_ACCOUNT_INFO: 'APIKEY_MT_GET_ACCOUNT_INFO',
  APIKEY_MT_CHANGE_BALANCE: 'APIKEY_MT_CHANGE_BALANCE',
  APIKEY_MT_CHANGE_CREDIT: 'APIKEY_MT_CHANGE_CREDIT',
  APIKEY_MT_CHANGE_PASS: 'APIKEY_MT_CHANGE_PASS',
  APIKEY_MT_GET_CLOSED_POSITIONS: 'APIKEY_MT_GET_CLOSED_POSITIONS',
  APIKEY_MT_GET_OPEN_POSITIONS: 'APIKEY_MT_GET_OPEN_POSITIONS',
  APIKEY_MT_GET_PENDING_POSITIONS: 'APIKEY_MT_GET_PENDING_POSITIONS',
  APIKEY_MT_CHANGE_LEVERAGE: 'APIKEY_MT_CHANGE_LEVERAGE',
  APIKEY_MT_CLOSE_OPEN_POSITIONS: 'APIKEY_MT_CLOSE_OPEN_POSITIONS',
  APIKEY_MT_CHANGE_NAME: 'APIKEY_MT_CHANGE_NAME',
  APIKEY_MT_CHANGE_PHONE: 'APIKEY_MT_CHANGE_PHONE',
  APIKEY_MT_CHANGE_EMAIL: 'APIKEY_MT_CHANGE_EMAIL',
  APIKEY_MT_CHANGE_AGENT: 'APIKEY_MT_CHANGE_AGENT',
  APIKEY_MT_CHANGE_COMMENT: 'APIKEY_MT_CHANGE_COMMENT',
  APIKEY_MT_CHANGE_COUNTRY: 'APIKEY_MT_CHANGE_COUNTRY',
  APIKEY_MT_CHANGE_REPORTS: 'APIKEY_MT_CHANGE_REPORTS',
  APIKEY_MT_CHANGE_ENABLE: 'APIKEY_MT_CHANGE_ENABLE',
  APIKEY_MT_CHANGE_READ_ONLY: 'APIKEY_MT_CHANGE_READ_ONLY',
  APIKEY_MT_GET_PAYMENT_HISTORY: 'APIKEY_MT_GET_PAYMENT_HISTORY',
  APIKEY_MT_GET_ORDER_HISTORY: 'APIKEY_MT_GET_ORDER_HISTORY',
  APIKEY_MT_GET_DEAL_HISTORY: 'APIKEY_MT_GET_DEAL_HISTORY',
  APIKEY_MT_CHANGE_GROUP: 'APIKEY_MT_CHANGE_GROUP',
  EMAIL: 'EMAIL',
  PASSWORD_EMAIL: 'PASSWORD_EMAIL',
  MAIL_HOST: 'MAIL_HOST',
  MAIL_PORT: 'MAIL_PORT',
  EMAIL_BCC: 'EMAIL_BCC',
  BATCH_LOG_ALERT_MAIL_HOST: 'BATCH_LOG_ALERT_MAIL_HOST',
  BATCH_LOG_ALERT_MAIL_PORT: 'BATCH_LOG_ALERT_MAIL_PORT',
  BATCH_LOG_ALERT_MAIL_FROM: 'BATCH_LOG_ALERT_MAIL_FROM',
  BATCH_LOG_ALERT_PASSWORD_MAIL: 'BATCH_LOG_ALERT_PASSWORD_MAIL',
  BATCH_LOG_ALERT_MAIL_TO: 'BATCH_LOG_ALERT_MAIL_TO',
  BATCH_LOG_ALERT_MAIL_SUBJECT: 'BATCH_LOG_ALERT_MAIL_SUBJECT',
  BATCH_LOG_TIME_OUT_QUEUE: 'BATCH_LOG_TIME_OUT_QUEUE',
  REBATE_STATISTICS_QUEUE_URL: 'REBATE_STATISTICS_QUEUE_URL',
  WC1_API_KEY: 'WC1_API_KEY',
  WC1_API_SECRET: 'WC1_API_SECRET',
  WC1_URL: 'WC1_URL',
  WC1_GROUP_ID: 'WC1_GROUP_ID',
})

module.exports.metaTraderPlatform = Object.freeze({
  MT4: '4',
  MT5: '5',
})

module.exports.jobStatus = Object.freeze({
  VALUE_0: 0,
  VALUE_1: 1,
  VALUE_2: 2,
  VALUE_3: 3,
  VALUE_4: 4,
})

module.exports.mgrUpdateStatus = Object.freeze({
  VALUE_0: 0,
  VALUE_1: 1,
  VALUE_2: 2,
})

module.exports.slackEnv = Object.freeze({
  Prod: '本番環境',
  Dev: '開発環境',
  Stg: 'ステージング環境',
  IB: 'IB環境',
})
module.exports.alertEnableStatus = Object.freeze({
  ON: 1,
  OFF: 0,
})

module.exports.decisionIdSiftApi = Object.freeze({
  SESSION_LOOKS_BAD: 'session_looks_bad_account_takeover',
  SESSION_LOOKS_OK: 'session_looks_ok_account_takeover',
  WATCH_SESSION: 'warning_account_takeover_1',
})

module.exports.failureLoginReasonSiftApi = Object.freeze({
  ACCOUNT_UNKNOWN: '$account_unknown',
  ACCOUNT_SUSPENDED: '$account_suspended',
  ACCOUNT_DISABLED: '$account_disabled',
  WRONG_PASSWORD: '$wrong_password',
})

module.exports.verificationStatusSiftApi = Object.freeze({
  PENDING: '$pending',
  SUCCESS: '$success',
  FAILURE: '$failure',
})

module.exports.eventTypeSiftApi = Object.freeze({
  LOGIN: '$login',
  VERIFICATION: '$verification',
})

module.exports.registrationType = Object.freeze({
  DIRECT: 'direct',
  NON_DIRECT: 'non_direct',
  ABUSER: 'abuser',
})

module.exports.timeExpires = Object.freeze({
  JWT_FRAUD_ALERT: '1h',
  JWT: '1h',
  JWT_STAY_SIGN_IN: '30d',
  SMS: '10',
  SIGNED_URL: 3600,
  TIME_FRAUD_ALERT: '60',
  KYC_PROCESS_SESSION: 30,
  KYC_ACTIVATION_KEY: 24,
})

module.exports.urlImageBase = Object.freeze({
  MAIL_P2T: 'https://p2t.sg/mail/common/images',
  MAIL_FXT: 'https://fxon.com/mail/common/images',
  MAIL_MYFOREX: 'https://myforex.com/common/images/mail',
  MAIL_ICPAY: 'https://icpay.com/mail/common/images',
})

module.exports.version = '2012-10-17'

module.exports.statusClassConstant = Object.freeze({
  ACCOUNT_STATUS: 1,
  MT_STATUS: 2,
  DOCUMENT_STATUS: 3,
  PAYMENT_MATCHING_STATUS: 4,
  PAYMENT_STATUS: 5,
  PAYMENT_OPERATION_STATUS: 6,
  USER_MATCHING_PROCESS_STATUS: 7,
  WALLET_STATUS: 8,
  SUPPORT_STATUS: 9,
  IT_STATUS: 10,
  REBATE_HISTORY_STATUS: 11,
})

module.exports.apiVersion = Object.freeze({
  V2: 'v2',
})

// empty will get all
// have not property will be remove
module.exports.fxsXemFinanceInfoRels = Object.freeze({
  81: {
    industries_fxs_xem: [],
    estimated_annual_income_fxs_xem: [],
    net_assets_fxs_xem: [],
    planned_annual_investment_fxs_xem: [],
    purpose_opening_account_fxs_xem: [],
  },
  82: {
    industries_fxs_xem: [],
    estimated_annual_income_fxs_xem: [],
    net_assets_fxs_xem: [],
    planned_annual_investment_fxs_xem: [],
    purpose_opening_account_fxs_xem: [],
  },
  83: {
    funding_sources_fxs_xem: [],
    estimated_annual_income_fxs_xem: [],
    net_assets_fxs_xem: [],
    planned_annual_investment_fxs_xem: [],
    purpose_opening_account_fxs_xem: [],
  },
  84: {
    occupations_id: 84,
    funding_sources_fxs_xem: [],
    estimated_annual_income_fxs_xem: [131, 132],
    net_assets_fxs_xem: [],
    planned_annual_investment_fxs_xem: [],
    purpose_opening_account_fxs_xem: [],
  },
  85: {
    occupations_id: 85,
    funding_sources_fxs_xem: [],
    estimated_annual_income_fxs_xem: [131, 132],
    net_assets_fxs_xem: [],
    planned_annual_investment_fxs_xem: [],
    purpose_opening_account_fxs_xem: [],
  },
})

module.exports.statusItemsConstant = Object.freeze({
  NOT_REGISTERED: 0,
  UNCONFIRMED: 1,
  CONFIRMED: 2,
  CONFIRMED_CANNOT_BE_CHANGED: 3,
})


// -- IB Activity phase 1.03 BEGIN --
module.exports.inducedTradersDateType = Object.freeze({
  IMPORTED_DATE: 'imported_date',
  OPENING_DATE: 'opening_date',
  DECISION_DATE: 'decision_date',
})

module.exports.actionMethod = Object.freeze({
  USER_ACTION: 1,
  SYSTEM_ACTION: 2,
  OPERATOR_ACTION: 3,
})

module.exports.summaryFlag = Object.freeze({
  NOT_COUNTED: 0,
  COUNTED: 1,
  NOT_INCLUDED_COUNT: 9,
})

module.exports.registrationSiteConstant = Object.freeze({
  BROKER_SITE: 1,
  FXS_SITE: 2,
  OTHERS: 9,
})
// -- IB Activity phase 1.03 END --

module.exports.emailDetailContentId = {
  EMAIL_ACTIVE_ACCOUNT: 5003,
  EMAIL_CLOSE_ACCOUNT: 5004,
  URL_FOR_PASSWORD_RESET: 5007,
  EMAIL_ACCEPT_EKYC: 5023,
  EMAIL_DOCUMENT_DEFICIENCY: 5024,
  CHANGE_MT_STATUS_APPROVED: 5029,
  CHANGE_MT_STATUS_APPROVED_ADDITIONAL: 5030,
  CHANGE_MT_STATUS_REJECTED: 5031,
  CHANGE_MT_STATUS_REJECTED_ADDITIONAL: 5032,
  EMAIL_CLOSE_TRADING_ACCOUNT: 5033,
  EMAIL_DEPOSIT_COMPLETED: 5039,
  EMAIL_APPROVED_ACCOUNT_MF: 1002,
  EMAIL_CLOSE_USER_MF: 1003,
  EMAIL_FORGOT_PASSWORD_MF: 1006,
  EMAIL_ACCEPT_EKYC_MF: 1017,
  EMAIL_DOCUMENT_DEFICIENCY_MF: 1018,
  EMAIL_APPROVED_ACCOUNT_ICPAY: 3003,
  EMAIL_CLOSE_USER_ICPAY: 3004,
  EMAIL_FORGOT_PASSWORD_ICPAY: 3007,
  EMAIL_ACCEPT_EKYC_ICPAY: 3023,
  EMAIL_DOCUMENT_DEFICIENCY_ICPAY: 3024,
  EMAIL_ACCEPT_EKYC_XEM: 6025,
}

// -- IB Activity phase 1.02 BEGIN --
module.exports.statusLableConstant = Object.freeze({
  LABLE_OF_STATUS_MASTER: 0,
  REQUIRED: {
    REBATES_DIFFERENCE: 4,
    NO_SYMBOL_MASTER: 5,
    NO_REBATE_MASTER: 6,
    NO_RATE: 7,
    NO_AC_TYPE: 8,
    NOT_CALCULATED: 9,
    MISSING_DATA: 10,
  },
})
// -- IB Activity phase 1.02 END --

// -- Setting Phase 1.03 BEGIN --
module.exports.settingPermissionClass = Object.freeze({
  NONE: 0,
  OPTIONAL: 1,
  READ_WRITE: 2,
})

module.exports.siteMenu = Object.freeze({
  HOME: 'home',
  DASHBOARD: 'dashboard',
  KYC: 'kyc',
  KYC_TRANSACTION: 'kyc_transaction',
  DOCUMENT_ACCEPT: 'document_accept',
  LIVE_VIEW: 'live_view',
  AUTHENTICATION_HISTORY: 'authentication_history',
  ACCOUNT: 'account',
  USER_ACCOUNT: 'user_account',
  OPERATOR: 'operator',
  MT4_5_ACCOUNTS: 'mt4_5_accounts',
  PAYMENT: 'payment',
  PAYMENT_TRANSACTION: 'payment_transaction',
  API_HISTORY: 'api_history',
  LOCAL_BANK_API_1: 'local_bank_api_1',
  LOCAL_BANK_API_2: 'local_bank_api_2',
  CREDIT_CARD_API_1: 'credit_card_api_1',
  PAYPAY_BANK_API: 'paypay_bank_api',
  SETTINGS_RULE: 'settings_rule',
  RANGE_OF_USE: 'range_of_use',
  API_ADVANCED_SETTINGS: 'api_advanced_settings',
  STATISTICS: 'statistics',
  ACCOUNT_RECORDS: 'account_records',
  TRADINGVOLUME_RECORDS: 'tradingvolume_records',
  PAYMENT_RECORDS: 'payment_records',
  INTRODUCTION_RECORDS: 'introduction_records',
  STATISTICS_USER_ACCOUNTS: 'statistics_user_accounts',
  REBATES: 'rebates',
  FOREX: 'forex',
  CFD: 'cfd',
  IB_ACTIVITY: 'ib_activity',
  INDUCED_TRADERS: 'induced_traders',
  REBATE_HISTORY: 'rebate_history',
  CONFIGURATIONS: 'configurations',
  MT_SERVER_MASTER: 'mt_server_master',
  SITE_LINK_MASTER: 'site_link_master',
  SYMBOL_LINK_MASTER: 'symbol_link_master',
  BROKER_LINK_MASTER: 'broker_link_master',
  CB_LINK_MASTER: 'cb_link_master',
  REBATES_MASTER: 'rebates_master',
  FCRM_SYSTEM_MASTER: 'fcrm_system_master',
  SETTINGS: 'settings',
  MANAGE_ACCOUNTS: 'manage_accounts',
  PERMISSION_SETTINGS: 'permission_settings',
  LANGUAGE: 'language',
  LANGUAGE_PARAMETERS: 'language_parameters',
  USER_ACCOUNT_FXON: 'user_account_fxon',
  OPERATOR_FXON: 'operator_fxon',
  USER_ACCOUNT_XEM: 'user_account_xem',
  OPERATOR_XEM: 'operator_xem',
  KYC_TRANSACTION_FXON: 'kyc_transaction_fxon',
  PAYMENT_TRANSACTION_FXON: 'payment_transaction_fxon',
})
// -- Setting Phase 1.03 END --

module.exports.typeProfile = {
  PERSONAL: 'personal',
  CORPORATE: 'corporate',
  TRANSACTION_PERSON: 'transaction_person',
  REPRESENTATIVE_PERSON: 'representative_person',
}

// -- IB Activity phase 1.03 BEGIN --
module.exports.siteGroupConstant = Object.freeze({
  FX_PLUS: {
    KEY: 'fx_plus',
    SITE_IDS: [2],
    BROKER_IDS: null,
  },
  FXS: {
    KEY: 'fxs',
    SITE_IDS: [6, 7, 8],
    BROKER_IDS: [1, 2, 4],
  },
  MY_FOREX: {
    KEY: 'my_forex',
    SITE_IDS: [1],
    BROKER_IDS: null,
  },
})
// -- IB Activity phase 1.03 END --

// -- Phase 6.3.1 BEGIN --
module.exports.serviceType = Object.freeze({
  PORTAL_TYPE: 'portal-type',
  FORM_TYPE: 'form-type',
  DATA_IMPORT_ONLY: 'data-import-only',
  ADMIN: 'admin',
})
// -- Phase 6.3.1 END --

// -- KYC 2.0.1  BEGIN--
module.exports.kycTarget = Object.freeze({
  PERSON_APPLICANT: 'trans.ekyc_target.person_applicant',
  PERSON_TRANSACTION: 'trans.ekyc_target.person_transaction',
  PERSON_REPRESENTATIVE: 'trans.ekyc_target.person_representative',
  CORPORATE_APPLICANT: 'trans.ekyc_target.corporate_applicant',
  BENEFICIAL_OWNER: 'trans.ekyc_target.beneficial_owner',
})

module.exports.listTypeGeneralAccessList = Object.freeze({
  KYC_SUMMARY: 1,
  ALL_SCREEN: 2,
})

module.exports.accessTypeGeneralAccessList = Object.freeze({
  EMAIL: 1,
  IP: 2,
})
// -- KYC 2.0.1  END--


// -- KYC 2.0.2  BEGIN--
module.exports.settingClass = Object.freeze({
  SEND_MAIL_SETTING: 1,
})

module.exports.displayFlagSiteSetting = Object.freeze({
  OFF: 0,
  ON: 1,
})

module.exports.enableFlagSiteSetting = Object.freeze({
  OFF: 0,
  ON: 1,
})


// -- KYC 2.0.2  END--


// -- CONTROLL IP ACCOUNT ADMIN --

module.exports.classiFication = Object.freeze({
  DENY_LIST: 0,
  ALLOW_LIST: 1,
})

// -- CONTROLL IP ACCOUNT ADMIN END --
