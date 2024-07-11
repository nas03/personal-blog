/* funciton */
const utility = require('utility')
const { accountLocalBankType, category, contentUpdate, statusCode,
  errorMessageCodeConstant,
} = require('constant')
const {
  accountLocalBankRepository,
  errorLogRepository,
  usersBasicDataRepository,
} = require('repository')
const { createListOperationHistory } = require('../History/operation_history.js')

const { axios } = require('helper')

const _ = require('lodash')

const searchLocalBankInfo = async (event) =>{
  try {
    const { search_keyword, type_search, bank_code, field_search } = event.queryStringParameters || {}
    if (!type_search || (type_search === 'branch' && !bank_code) || (type_search === 'bank' && !field_search)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }
    if (type_search !== 'bank' && type_search !== 'branch') {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    if (field_search && field_search !== 'name' && field_search !== 'hiragana') {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    const filter = search_keyword ? (field_search === 'name' ? `${field_search}==${search_keyword}` : `${field_search}==${search_keyword}*`) : null
    const urlSearchBranch = type_search === 'bank' ? '' : `/${bank_code}/branches`

    const response = await axios({
      method: 'GET',
      url: `${process.env.URL_LOCAL_BANK}/v2/banks${urlSearchBranch}`,
      headers: {
        'apikey': process.env.API_KEY_LOCAL_BANK,
      },
      params: {
        limit: 2000,
        filter: filter, sort: '+hiragana',
      },
    })

    return utility.createResponse(true, response)
  } catch (error) {
    console.error(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const updateLocalBankAccount = async (event) => {
  try {
    const user_id = event.pathParameters.user_id
    event.user_id = user_id
    const staff_id = utility.getUserIdByToken(event)
    const eventBody = JSON.parse(event.body)
    const { account_id, data } = eventBody
    if (!account_id) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    if (data.account_type && ![accountLocalBankType.ORDINARY, accountLocalBankType.CURRENT].includes(data.account_type)) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    const [userSettingInfor, accountLocalBank] =
      await Promise.all([
        usersBasicDataRepository.getUserInfo(user_id),
        accountLocalBankRepository.getDetailAccountLocalBank(account_id, user_id),
      ])

    if (!accountLocalBank || !userSettingInfor) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }
    // check account status
    if ( userSettingInfor.account_status_code === statusCode.CLOSED ) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.UPDATE_LOCALBANK_ACCOUNT.ACCOUNT_CLOSE])
    }

    // check existed account local bank
    if (data.account_number) {
      const isExistedAccount = await accountLocalBankRepository.checkAccountNumberExist({
        account_number: data.account_number,
        bank_code: data.bank_code,
        user_id: user_id,
        account_id: account_id,
      })

      if (isExistedAccount) {
        return await errorLogRepository.createResponseAndLog(event, null, null,
          [errorMessageCodeConstant.UPDATE_LOCALBANK_ACCOUNT.ACCOUNT_NUMBER_EXISTED])
      }
    }

    const accountBankAfter = _.omit(
      {
        ...accountLocalBank,
        ...data,
      }, [
        'id',
        'ts_update',
      ],
    )

    // soft delete & create new account bank
    const isUpdate = await accountLocalBankRepository.updateLocalBankAccount(user_id, account_id, accountBankAfter)

    if (!isUpdate) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_LOCALBANK_ACCOUNT.UPDATE_DB])
    }

    const fieldUpdate = _.pickBy(accountBankAfter, (value, key) => accountLocalBank[key] !== value)

    const listHistory = []
    // create data history
    if (fieldUpdate.bank_name || fieldUpdate.branch_name || fieldUpdate.bank_code || fieldUpdate.branch_code) {
      listHistory.push({
        site_id: userSettingInfor.site_id,
        category_id: category.WALLET_MANAGEMENT,
        content_update: _renderContentUpdate('bank_name'),
        before_update: _renderDataUpdate('bank_name', accountLocalBank),
        after_update: _renderDataUpdate('bank_name', accountBankAfter),
      })
    }
    if ( fieldUpdate.account_type ) {
      listHistory.push({
        site_id: userSettingInfor.site_id,
        category_id: category.WALLET_MANAGEMENT,
        content_update: _renderContentUpdate('account_type'),
        before_update: _renderDataUpdate('account_type', accountLocalBank),
        after_update: _renderDataUpdate('account_type', accountBankAfter),
      })
    }
    if ( fieldUpdate.account_number ) {
      listHistory.push({
        site_id: userSettingInfor.site_id,
        category_id: category.WALLET_MANAGEMENT,
        content_update: _renderContentUpdate('account_number'),
        before_update: _renderDataUpdate('account_number', accountLocalBank),
        after_update: _renderDataUpdate('account_number', accountBankAfter),
      })
    }

    // create operation history
    await createListOperationHistory(
      user_id,
      listHistory,
      event,
      staff_id,
    )

    return utility.createResponse(true)
  } catch (error) {
    console.error(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const checkAccountNumberExist = async (event) => {
  try {
    const userId = event.pathParameters.user_id
    event.user_id = userId
    const { account_id, account_number, bank_code } = event.queryStringParameters || {}
    if (!account_number) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    const result = await accountLocalBankRepository.checkAccountNumberExist({
      account_number: account_number,
      bank_code: bank_code,
      user_id: userId,
      account_id: account_id,
    })

    if (result) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.CHECK_ACCOUNT_NUMBER.ACCOUNT_NUMBER_EXISTED])
    }
    return utility.createResponse(true)
  } catch (err) {
    console.log(err)
    return await errorLogRepository.createResponseAndLog(event, err, null, [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const _renderDataAccType = (data) => {
  switch (data) {
    case 1:
      return 'trans.update_history.local_bank.ordinary'
    case 2:
      return 'trans.update_history.local_bank.current'
    default:
      return '-'
  }
}

const _renderContentUpdate = (item) => {
  switch (item) {
    case 'bank_name':
      return contentUpdate.CHANGE_BANK_BRANCH_INFORMATION
    case 'account_type':
      return contentUpdate.CHANGE_ACCOUNT_TYPE
    case 'account_number':
      return contentUpdate.CHANGE_ACCOUNT_NUMBER
    default:
      break
  }
}

const _renderDataUpdate = (item, data) => {
  if (item === 'bank_name' && data[item]) {
    return `${data[item]}/${data['branch_name']}`
  } else if ( item === 'account_type' && data[item]) {
    return _renderDataAccType(data[item])
  } else if (data[item]) {
    return data[item]
  } else {
    return '-'
  }
}

module.exports = {
  searchLocalBankInfo,
  checkAccountNumberExist,
  updateLocalBankAccount,
}
