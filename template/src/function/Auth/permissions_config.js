const { siteMenu } = require('constant')

const userAccount = [
  // USER ACCOUNT
  {
    'path': '/csv-export',
    'method': 'GET',
    'menu_key': [siteMenu.USER_ACCOUNT, siteMenu.OPERATOR],
  },
  {
    'path': '/profile/corporate-person/{userId}',
    'method': 'GET',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/profile/beneficial-owner/{userId}',
    'method': 'GET',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/beneficial-owner/update-national/{id}',
    'method': 'PUT',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/beneficial-owner/update-corporate/{id}',
    'method': 'PUT',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/beneficial-owner/update-personal/{id}',
    'method': 'PUT',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/beneficial-owner/delete/{id}',
    'method': 'DELETE',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/operation-history-by-userId/{userId}',
    'method': 'GET',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/operation-history-by-id/{id}',
    'method': 'GET',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/access-history/{userId}',
    'method': 'GET',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/custom-list-data',
    'method': 'GET',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/shareholder/personal/{userId}',
    'method': 'POST',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/shareholder/company/{userId}',
    'method': 'POST',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/shareholder/{id}',
    'method': 'PUT',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/list-trading-account/{userId}',
    'method': 'GET',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/mt-server',
    'method': 'GET',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/update-supporting-comment/{accountId}',
    'method': 'PUT',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/update-account-status/{accountId}',
    'method': 'PUT',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/change-partner-code/{id}',
    'method': 'POST',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/check-partner-code',
    'method': 'POST',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/change-password-trading-account/{id}',
    'method': 'PUT',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/change-trading-account/{id}',
    'method': 'POST',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/upload-avatar',
    'method': 'POST',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/confirm-upload',
    'method': 'POST',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/change-username/{userId}',
    'method': 'POST',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/change-status',
    'method': 'POST',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/get-list-payment-transaction',
    'method': 'GET',
    'menu_key': [siteMenu.USER_ACCOUNT, siteMenu.PAYMENT_TRANSACTION],
  },
  {
    'path': '/time-create-login-user',
    'method': 'GET',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/mt-account-setting/update-portfolio',
    'method': 'PUT',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/account-status',
    'method': 'POST',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/list-portfolio/{userId}',
    'method': 'GET',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/payment/get-detail-transaction/{id}',
    'method': 'GET',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/payment/change-status',
    'method': 'POST',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/payment/change-support-status',
    'method': 'POST',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/account-banks/{userId}',
    'method': 'GET',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/get-financial-institution',
    'method': 'GET',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/get-banks-by-country',
    'method': 'GET',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/get-all-branch-bank',
    'method': 'GET',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/get-status-iban',
    'method': 'GET',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/check-iban',
    'method': 'GET',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/update-overseas-bank/{user_id}',
    'method': 'PUT',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/search-local-bank-info',
    'method': 'GET',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/update-local-bank-account/{user_id}',
    'method': 'PUT',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/check-account-number/{user_id}',
    'method': 'GET',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/check-existed-account-overseas',
    'method': 'POST',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/profile/update-personal/{id}',
    'method': 'PUT',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/profile/{userId}',
    'method': 'GET',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/corporate-person/update/{id}',
    'method': 'PUT',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/update-corporate/{id}',
    'method': 'PUT',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/users',
    'method': 'GET',
    'menu_key': [siteMenu.OPERATOR, siteMenu.USER_ACCOUNT, siteMenu.KYC_TRANSACTION],
  },
  {
    'path': '/update-user-setting/{user_id}',
    'method': 'POST',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/check-duplicate-field/{user_id}',
    'method': 'POST',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/authentication_history',
    'method': 'GET',
    'menu_key': [siteMenu.AUTHENTICATION_HISTORY, siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/detail-user/{id}',
    'method': 'GET',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/user-setting/{user_id}',
    'method': 'GET',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/user/{id}',
    'method': 'PUT',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/beneficial-owner/delete/{id}',
    'method': 'DELETE',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/change-account-status-code/{accountId}',
    'method': 'PUT',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/profile/support-history/{id}',
    'method': 'POST',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/profile/support-history/{id}',
    'method': 'PUT',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/update-profile/finance/{userFinanceId}',
    'method': 'PUT',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/update-profile/trading-account/{accountId}',
    'method': 'PUT',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/get-rates',
    'method': 'GET',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/email/email-template',
    'method': 'GET',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/user/send-reset-password-mail/{userId}',
    'method': 'POST',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/email/email-template/',
    'method': 'GET',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/email/email-detail/{id}',
    'method': 'GET',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/email/email-template-send/{id}',
    'method': 'GET',
    'menu_key': [siteMenu.USER_ACCOUNT],
  },
  {
    path: '/email/send-mail',
    method: 'POST',
    menu_key: [siteMenu.OPERATOR, siteMenu.USER_ACCOUNT, siteMenu.KYC_TRANSACTION],
  },
]

const liveView = [
  // LIVE VIEW
  {
    'path': '/list-streaming',
    'method': 'GET',
    'menu_key': [siteMenu.LIVE_VIEW],
  },
  {
    'path': '/signed-url-ekyc',
    'method': 'POST',
    'menu_key': [siteMenu.LIVE_VIEW, siteMenu.USER_ACCOUNT],
  },
]

const kycTransaction = [
  // KYC TRANSACTION
  {
    'path': '/ekyc-transaction',
    'method': 'POST',
    'menu_key': [siteMenu.KYC_TRANSACTION],
  },
  {
    'path': '/export-csv-ekyc',
    'method': 'GET',
    'menu_key': [siteMenu.KYC_TRANSACTION],
  },
  {
    'path': '/time-create-ekyc',
    'method': 'GET',
    'menu_key': [siteMenu.KYC_TRANSACTION],
  },
  {
    'path': '/kyc/process',
    'method': 'GET',
    'menu_key': [siteMenu.KYC_TRANSACTION, siteMenu.KYC_TRANSACTION_FXON],
  },
  {
    'path': '/kyc/process',
    'method': 'PUT',
    'menu_key': [siteMenu.KYC_TRANSACTION, siteMenu.KYC_TRANSACTION_FXON],
  },

  {
    'path': '/kyc/upload-document',
    'method': 'post',
    'menu_key': [siteMenu.KYC_TRANSACTION, siteMenu.KYC_TRANSACTION_FXON],
  },
  {
    'path': '/kyc/confirm-upload-document',
    'method': 'post',
    'menu_key': [siteMenu.KYC_TRANSACTION, siteMenu.KYC_TRANSACTION_FXON],
  },
  {
    'path': '/kyc/duplicate-error',
    'method': 'get',
    'menu_key': [siteMenu.KYC_TRANSACTION, siteMenu.KYC_TRANSACTION_FXON],
  },
  {
    'path': '/kyc/world-check-detail/{ref_id}',
    'method': 'get',
    'menu_key': [siteMenu.KYC_TRANSACTION, siteMenu.KYC_TRANSACTION_FXON],
  },
]

const rangeOfUse = [
  {
    'path': '/add-range-use',
    'method': 'POST',
    'menu_key': [siteMenu.RANGE_OF_USE],
  },
  {
    'path': '/get-default-range-of-use',
    'method': 'GET',
    'menu_key': [siteMenu.RANGE_OF_USE],
  },
  {
    'path': '/detail_rule/{id}',
    'method': 'GET',
    'menu_key': [siteMenu.RANGE_OF_USE],
  },
  {
    'path': '/get-list-range-of-use',
    'method': 'GET',
    'menu_key': [siteMenu.RANGE_OF_USE],
  },
  {
    'path': '/update-range-use/{id}',
    'method': 'PUT',
    'menu_key': [siteMenu.RANGE_OF_USE],
  },
  {
    'path': '/export-range-use-setting/{id}',
    'method': 'GET',
    'menu_key': [siteMenu.RANGE_OF_USE],
  },
  {
    'path': '/update-rule/{range_use_id}',
    'method': 'PUT',
    'menu_key': [siteMenu.RANGE_OF_USE],
  },
  {
    'path': '/check-container-name',
    'method': 'PUT',
    'menu_key': [siteMenu.RANGE_OF_USE],
  },
  {
    'path': '/update-rule-container-name',
    'method': 'POST',
    'menu_key': [siteMenu.RANGE_OF_USE],
  },
]

const apiAdvancedSettings = [
  // API ADVANCED SETTINGS
  {
    'path': '/api-setting/auto-status-change-rule',
    'method': 'PUT',
    'menu_key': [siteMenu.API_ADVANCED_SETTINGS],
  },
  {
    'path': '/api-setting/bank-api/{siteId}',
    'method': 'GET',
    'menu_key': [siteMenu.API_ADVANCED_SETTINGS],
  },
  {
    'path': '/api-setting/detail',
    'method': 'GET',
    'menu_key': [siteMenu.API_ADVANCED_SETTINGS],
  },
  {
    'path': '/api-setting/merchant',
    'method': 'POST',
    'menu_key': [siteMenu.API_ADVANCED_SETTINGS],
  },
  {
    'path': '/api-setting/merchant/{id}',
    'method': 'DELETE',
    'menu_key': [siteMenu.API_ADVANCED_SETTINGS],
  },
  {
    'path': '/api-setting/merchant/{id}',
    'method': 'PUT',
    'menu_key': [siteMenu.API_ADVANCED_SETTINGS],
  },
  {
    'path': '/api-setting/user-matching-rule',
    'method': 'POST',
    'menu_key': [siteMenu.API_ADVANCED_SETTINGS],
  },
  {
    'path': '/api-setting/merchant-assign',
    'method': 'PUT',
    'menu_key': [siteMenu.API_ADVANCED_SETTINGS],
  },

]

const apiLocalBank = [
  // LOCAL BANK API 1
  // LOCAL BANK API 2
  {
    'path': '/get-deposit-local-bank-api-by-id',
    'method': 'GET',
    'menu_key': [siteMenu.LOCAL_BANK_API_1, siteMenu.LOCAL_BANK_API_2],
  },
  {
    'path': '/local-bank/all',
    'method': 'GET',
    'menu_key': [siteMenu.LOCAL_BANK_API_1],
  },
  {
    'path': '/user-payment/all',
    'method': 'GET',
    'menu_key': [siteMenu.LOCAL_BANK_API_1, siteMenu.LOCAL_BANK_API_2],
  },
  {
    'path': '/user-matching/update-status',
    'method': 'PUT',
    'menu_key': [siteMenu.LOCAL_BANK_API_1, siteMenu.LOCAL_BANK_API_2],
  },
  {
    'path': '/user-matching/update-working',
    'method': 'PUT',
    'menu_key': [siteMenu.LOCAL_BANK_API_1, siteMenu.LOCAL_BANK_API_2],
  },
  {
    'path': '/local-bank/merchant-id-selections',
    'method': 'GET',
    'menu_key': [siteMenu.LOCAL_BANK_API_1, siteMenu.API_ADVANCED_SETTINGS],
  },
  {
    'path': '/local-bank-api-2/all',
    'method': 'GET',
    'menu_key': [siteMenu.LOCAL_BANK_API_2],
  },
]

const creditCardAPI = [
  // CREDIT CARD API 1
  {
    'path': '/credit-card/all',
    'method': 'GET',
    'menu_key': [siteMenu.CREDIT_CARD_API_1],
  },
]

const languageParameters = [
  // LANGUAGE PARAMETERS
  {
    'path': '/multilingualism/index',
    'method': 'GET',
    'menu_key': [siteMenu.LANGUAGE_PARAMETERS, siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/multilingualism/create-temp',
    'method': 'POST',
    'menu_key': [siteMenu.LANGUAGE_PARAMETERS, siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/multilingualism/apply',
    'method': 'POST',
    'menu_key': [siteMenu.LANGUAGE_PARAMETERS],
  },
  {
    'path': '/multilingualism/export',
    'method': 'GET',
    'menu_key': [siteMenu.LANGUAGE_PARAMETERS],
  },
]

const symbolLinkMaster = [
  // SYMBOL LINK MASTER
  {
    'path': '/symbols-master',
    'method': 'GET',
    'menu_key': [siteMenu.SYMBOL_LINK_MASTER],
  },
  {
    'path': '/symbols-master/change-enable-flag/{id}',
    'method': 'PUT',
    'menu_key': [siteMenu.SYMBOL_LINK_MASTER],
  },
  {
    'path': '/import-symbols-master',
    'method': 'POST',
    'menu_key': [siteMenu.SYMBOL_LINK_MASTER],
  },
  {
    'path': '/symbol-name/get-all',
    'method': 'GET',
    'menu_key': [siteMenu.SYMBOL_LINK_MASTER],
  },
  {
    'path': '/symbol-name/update-flag/{symbol_name_id}',
    'method': 'PUT',
    'menu_key': [siteMenu.SYMBOL_LINK_MASTER],
  },
  {
    'path': '/symbol-name/create-symbol-name',
    'method': 'POST',
    'menu_key': [siteMenu.SYMBOL_LINK_MASTER],
  },
  {
    'path': '/symbol-name/update-symbol-name/{symbol_name_id}',
    'method': 'PUT',
    'menu_key': [siteMenu.SYMBOL_LINK_MASTER],
  },
]

const mt45Accounts = [
  // MT4/5 ACCOUNT
  {
    'path': '/get-token-user/{userId}',
    'method': 'GET',
    'menu_key': [siteMenu.MT4_5_ACCOUNTS, siteMenu.USER_ACCOUNT],
  },
  {
    'path': '/list-all-trading-account',
    'method': 'GET',
    'menu_key': [siteMenu.MT4_5_ACCOUNTS],
  },
]

const brokerLinkMaster = [
  {
    'path': '/broker/update-broker-index/{broker_id}',
    'method': 'PUT',
    'menu_key': [siteMenu.BROKER_LINK_MASTER],
  },
  {
    'path': '/broker/create-broker',
    'method': 'POST',
    'menu_key': [siteMenu.BROKER_LINK_MASTER],
  },
  {
    'path': '/product-type/get-product-type-list',
    'method': 'GET',
    'menu_key': [siteMenu.BROKER_LINK_MASTER],
  },
  {
    'path': '/product-type/update-product-type-index/{id}',
    'method': 'PUT',
    'menu_key': [siteMenu.BROKER_LINK_MASTER],
  },
  {
    'path': '/ib-rank/get-ib-rank-list',
    'method': 'GET',
    'menu_key': [siteMenu.BROKER_LINK_MASTER],
  },
  {
    'path': '/ib-rank/update-ib-rank-index/{id}',
    'method': 'PUT',
    'menu_key': [siteMenu.BROKER_LINK_MASTER],
  },
  {
    'path': '/account_type/get-list-account-type',
    'method': 'GET',
    'menu_key': [siteMenu.BROKER_LINK_MASTER],
  },
  {
    'path': '/account_type/update-account-type-index/{id}',
    'method': 'PUT',
    'menu_key': [siteMenu.BROKER_LINK_MASTER],
  },
  {
    'path': '/ib-rank/create-new-ib-rank',
    'method': 'POST',
    'menu_key': [siteMenu.BROKER_LINK_MASTER],
  },
  {
    'path': '/account-type/create-account-type',
    'method': 'POST',
    'menu_key': [siteMenu.BROKER_LINK_MASTER],
  },
  {
    'path': '/broker/update-broker/{broker_id}',
    'method': 'PUT',
    'menu_key': [siteMenu.BROKER_LINK_MASTER],
  },
  {
    'path': '/account-leverage/create-account-leverage',
    'method': 'POST',
    'menu_key': [siteMenu.BROKER_LINK_MASTER],
  },
  {
    'path': '/ib-rank/update-ib-rank/{id}',
    'method': 'PUT',
    'menu_key': [siteMenu.BROKER_LINK_MASTER],
  },
  {
    'path': '/product-type/create-new-product-type',
    'method': 'POST',
    'menu_key': [siteMenu.BROKER_LINK_MASTER],
  },
  {
    'path': '/product-type/update-product-type/{id}',
    'method': 'PUT',
    'menu_key': [siteMenu.BROKER_LINK_MASTER],
  },
  {
    'path': '/account-leverage/get-list',
    'method': 'GET',
    'menu_key': [siteMenu.BROKER_LINK_MASTER],
  },
  {
    'path': '/account-leverage/update-account-leverage-index/{id}',
    'method': 'PUT',
    'menu_key': [siteMenu.BROKER_LINK_MASTER],
  },
  {
    'path': '/account-type/get-account-type-detail/{account_type_id}',
    'method': 'GET',
    'menu_key': [siteMenu.BROKER_LINK_MASTER],
  },
  {
    'path': '/account-type/update-account/{account_type_id}',
    'method': 'PUT',
    'menu_key': [siteMenu.BROKER_LINK_MASTER],
  },
  {
    'path': '/account-leverage/update-account-leverage/{id}',
    'method': 'PUT',
    'menu_key': [siteMenu.BROKER_LINK_MASTER],
  },
  {
    'path': '/ib-rank/get-ib-rank-available',
    'method': 'GET',
    'menu_key': [siteMenu.BROKER_LINK_MASTER],
  },
  {
    'path': '/broker/get-broker-list',
    'method': 'GET',
    'menu_key': [siteMenu.BROKER_LINK_MASTER],
  },
]

const rebatesMaster = [
  // REBATES MASTER
  {
    'path': '/rebate-master/create',
    'method': 'POST',
    'menu_key': [siteMenu.REBATES_MASTER],
  },
  {
    'path': '/rebate-master/default-master',
    'method': 'GET',
    'menu_key': [siteMenu.REBATES_MASTER],
  },
  {
    'path': '/rebate-master/list',
    'method': 'GET',
    'menu_key': [siteMenu.REBATES_MASTER],
  },
  {
    'path': '/rebate-master/{rebate_id}',
    'method': 'GET',
    'menu_key': [siteMenu.REBATES_MASTER],
  },
  {
    'path': '/rebate-master/{rebate_id}',
    'method': 'PUT',
    'menu_key': [siteMenu.REBATES_MASTER],
  },
  {
    'path': '/rebate-master/validate-input-rebate',
    'method': 'POST',
    'menu_key': [siteMenu.REBATES_MASTER],
  },
]

const payPayAPI = [
  // PAY PAY API
  {
    'path': '/paypay/all',
    'method': 'GET',
    'menu_key': [siteMenu.PAYPAY_BANK_API],
  },
]

const rebateHistory = [
  // REBATE HISTORY
  {
    'path': '/rebate-history',
    'method': 'GET',
    'menu_key': [siteMenu.REBATE_HISTORY],
  },
  {
    'path': '/rebate-history/recalculate',
    'method': 'POST',
    'menu_key': [siteMenu.REBATE_HISTORY],
  },
]

const siteLinkMaster = [
  // SITE LINK MASTER
  {
    'path': '/site-master/list',
    'method': 'GET',
    'menu_key': [siteMenu.SITE_LINK_MASTER],
  },
  {
    'path': '/site-master/create',
    'method': 'POST',
    'menu_key': [siteMenu.SITE_LINK_MASTER],
  },
  {
    'path': '/site-master/check-input',
    'method': 'POST',
    'menu_key': [siteMenu.SITE_LINK_MASTER],
  },
  {
    'path': '/site-master/update/{id}',
    'method': 'PUT',
    'menu_key': [siteMenu.SITE_LINK_MASTER],
  },
  {
    'path': '/site-master/update-index/{id}',
    'method': 'PUT',
    'menu_key': [siteMenu.SITE_LINK_MASTER],
  },
  {
    'path': '/sla/account-status/{site_id}',
    'method': 'GET',
    'menu_key': [siteMenu.SITE_LINK_MASTER],
  },
  {
    'path': '/sla/account-status',
    'method': 'PUT',
    'menu_key': [siteMenu.SITE_LINK_MASTER],
  },

  {
    'path': '/site-menu/layout',
    'method': 'GET',
    'menu_key': [siteMenu.SITE_LINK_MASTER],
  },
  {
    'path': '/site-menu/layout',
    'method': 'PUT',
    'menu_key': [siteMenu.SITE_LINK_MASTER],
  },
]

const mtServerMaster = [
  // MT SERVER MASTER
  {
    'path': '/mt-group-master/list',
    'method': 'GET',
    'menu_key': [siteMenu.MT_SERVER_MASTER],
  },
  {
    'path': '/mt-group-master/create',
    'method': 'POST',
    'menu_key': [siteMenu.MT_SERVER_MASTER],
  },
  {
    'path': '/mt-group-master/update/{id}',
    'method': 'PUT',
    'menu_key': [siteMenu.MT_SERVER_MASTER],
  },
  {
    'path': '/mt-server-master/list',
    'method': 'GET',
    'menu_key': [siteMenu.MT_SERVER_MASTER],
  },
  {
    'path': '/mt-server-master/create',
    'method': 'POST',
    'menu_key': [siteMenu.MT_SERVER_MASTER],
  },
  {
    'path': '/mt-server-master/update/{id}',
    'method': 'PUT',
    'menu_key': [siteMenu.MT_SERVER_MASTER],
  },
]

const manageAccount = [
  // MANAGE ACCOUNT
  {
    'path': '/staff-account/list-users',
    'method': 'GET',
    'menu_key': [siteMenu.MANAGE_ACCOUNTS],
  },
  {
    'path': '/staff-account/resend-invite-user/{staff_id}',
    'method': 'POST',
    'menu_key': [siteMenu.MANAGE_ACCOUNTS],
  },
  {
    'path': '/staff-account/check-mail-exists',
    'method': 'POST',
    'menu_key': [siteMenu.MANAGE_ACCOUNTS],
  },
  {
    'path': '/staff-account/access-history/{staff_id}',
    'method': 'GET',
    'menu_key': [siteMenu.MANAGE_ACCOUNTS],
  },
  {
    'path': '/staff-account/info/{staff_id}',
    'method': 'PUT',
    'menu_key': [siteMenu.MANAGE_ACCOUNTS],
  },
  {
    'path': '/staff-account/info/{staff_id}',
    'method': 'GET',
    'menu_key': [siteMenu.MANAGE_ACCOUNTS],
  },
  {
    'path': '/staff-account/delete-avatar/{staff_id}',
    'method': 'PUT',
    'menu_key': [siteMenu.MANAGE_ACCOUNTS],
  },
]

const fcmSystemMaster = [
// FCM SYSTEM MASTER
  {
    'path': '/status-master/list',
    'method': 'GET',
    'menu_key': [siteMenu.FCRM_SYSTEM_MASTER],
  },
  {
    'path': '/status-master/detail/{status_code}',
    'method': 'GET',
    'menu_key': [siteMenu.FCRM_SYSTEM_MASTER],
  },
  {
    'path': '/status-master/update/{id}',
    'method': 'PUT',
    'menu_key': [siteMenu.FCRM_SYSTEM_MASTER],
  },
  {
    'path': '/status-master/definition',
    'method': 'GET',
    'menu_key': [siteMenu.FCRM_SYSTEM_MASTER],
  },
]

const permissionSetting = [
  // PERMISSION SETTING
  {
    'path': '/site-menu/permission',
    'method': 'GET',
    'menu_key': [siteMenu.PERMISSION_SETTINGS],
  },
  {
    'path': '/site-menu/permission',
    'method': 'PUT',
    'menu_key': [siteMenu.PERMISSION_SETTINGS],
  },
]

const forexCFD = [
  {
    path: '/rebate-statistics',
    method: 'GET',
    menu_key: [siteMenu.FOREX, siteMenu.CFD],
  },
]

module.exports = [
  ...userAccount,
  ...liveView,
  ...kycTransaction,
  ...rangeOfUse,
  ...apiAdvancedSettings,
  ...apiLocalBank,
  ...creditCardAPI,
  ...languageParameters,
  ...symbolLinkMaster,
  ...mt45Accounts,
  ...brokerLinkMaster,
  ...rebatesMaster,
  ...payPayAPI,
  ...rebateHistory,
  ...siteLinkMaster,
  ...mtServerMaster,
  ...manageAccount,
  ...fcmSystemMaster,
  ...permissionSetting,
  ...forexCFD,
]
