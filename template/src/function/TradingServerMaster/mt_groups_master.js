
const utility = require('utility')

const { mtGroupsRepository, errorLogRepository, accountTypeRepository, accountLeverageRepository, usersBasicDataRepository } = require('repository')
const { flag, accountMode, platform, server, currencyAccountType, commonSiteId,
  errorMessageCodeConstant } = require('constant')

const getListMTGroupMaster = async (event) =>{
  try {
    const { search, show_valid, sort, size, page } = event.queryStringParameters || {}
    const pagination = utility.getPagination({ sort, size, page })

    // Get staff display date time and handle timezone
    const staffId = await utility.getUserIdByToken(event)
    const staffInfo = await usersBasicDataRepository.getStaffUserData({ 'users_basic_data.id': staffId })

    const filter = {
      search,
      show_valid,
      utc: staffInfo.timezone || null,
      display_date_time: staffInfo.display_date_time,
    }

    const getListMTGroup = await mtGroupsRepository.getListMTGroup(filter, pagination)

    // get list mt group from database
    if (!getListMTGroup) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
    }

    return utility.createResponse(true, getListMTGroup)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null,
      [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}


const createMTGroupMaster = async (event) =>{
  try {
    const body = JSON.parse(event.body)

    // validate field
    const checkRequired = utility.checkFieldRequired(body,
      [
        'site_id',
        'server',
        'platform',
        'account_mode',
        'currency',
        'account_leverage_id',
        'b_book_group_name',
        'b_api_params',
        ...(body.account_mode === accountMode.REAL ? ['a_book_group_name', 'a_api_params'] : []),
      ],
    )

    if (!checkRequired) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    if (!Object.values(accountMode).includes(body.account_mode) ||
        !Object.values(platform).includes(body.platform) ||
        (body.account_mode === accountMode.DEMO &&
        (Object.keys(body).includes('a_book_group_name') || Object.keys(body).includes('a_api_params'))) ||
        !Object.values(server).includes(body.server) ||
        !Object.values(currencyAccountType).includes(body.currency) ||
        !Object.values(commonSiteId).includes(body.site_id)
    ) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // payload data for create mt group
    const payload = {
      'site_id': body.site_id || null,
      'server': body.server || null,
      'platform': body.platform || null,
      'account_mode': body.account_mode || null,
      'currency': body.currency || null,
      'account_leverage_id': body.account_leverage_id || null,
      'a_book_group_name': body?.a_book_group_name || null,
      'a_api_params': body?.a_api_params || null,
      'b_book_group_name': body.b_book_group_name || null,
      'b_api_params': body.b_api_params || null,
    }

    // create
    const isExisted = await mtGroupsRepository.checkExisted(payload)
    if (isExisted) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.CREATE_MT_GROUP_MASTER.MT_GROUP_DUPLICATED])
    }

    const createMtGroup = await mtGroupsRepository.createMTGroup(payload)

    if (!createMtGroup) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.CREATE_MT_GROUP_MASTER.UPDATE_FAIL])
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null,
      [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const updateMTGroupMaster = async (event) =>{
  try {
    const id = event.pathParameters.id
    const { data, field_update } = JSON.parse(event.body)
    let payload = {}

    switch (field_update) {
      // update toggle
      case 'enable_flag':

        // validate field
        if (!Object.keys(data).includes('enable_flag')) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
        }

        if (![flag.TRUE, flag.FALSE].includes(data.enable_flag)) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        payload = {
          enable_flag: data.enable_flag,
        }
        break
      case 'update_mt_group':
        // validate field
        const checkRequired = utility.checkFieldRequired(data,
          [
            'site_id',
            'server',
            'platform',
            'account_mode',
            'currency',
            'account_leverage_id',
            'b_book_group_name',
            'b_api_params',
            ...(data.account_mode === accountMode.REAL ? ['a_book_group_name', 'a_api_params'] : []),
          ],
        )

        if (!checkRequired) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
        }

        if (!Object.values(accountMode).includes(data.account_mode) ||
        !Object.values(platform).includes(data.platform) ||
        (data.account_mode === accountMode.DEMO &&
        (Object.keys(data).includes('a_book_group_name') || Object.keys(data).includes('a_api_params'))) ||
        !Object.values(server).includes(data.server) ||
        !Object.values(currencyAccountType).includes(data.currency) ||
        !Object.values(commonSiteId).includes(data.site_id)
        ) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        payload = {
          'site_id': data.site_id || null,
          'server': data.server || null,
          'platform': data.platform || null,
          'account_mode': data.account_mode || null,
          'currency': data.currency || null,
          'account_leverage_id': data.account_leverage_id || null,
          'a_book_group_name': data?.a_book_group_name || null,
          'a_api_params': data?.a_api_params || null,
          'b_book_group_name': data.b_book_group_name || null,
          'b_api_params': data.b_api_params || null,
        }

        const isExisted = await mtGroupsRepository.checkExisted(payload, id)

        if (isExisted) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.UPDATE_MT_GROUP_MASTER.MT_GROUP_DUPLICATED])
        }
        break

      default:
        return await errorLogRepository.createResponseAndLog(event, null, null,
          [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }

    // update databse
    const updateMtGroup = await mtGroupsRepository.updateMTGroup(payload, id)

    if (!updateMtGroup) {
      return await errorLogRepository.createResponseAndLog(event, null, null,
        [errorMessageCodeConstant.UPDATE_MT_GROUP_MASTER.UPDATE_FAIL])
    }

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null,
      [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}

const getMtGroupsDropDown = async (event) =>{
  try {
    const response = {
      accountType: [],
    }

    // get list account type master
    const listAccountType = await accountTypeRepository.getAccountType()

    // get list leverage master data by account type
    let leverageByAccountType = []
    const accountTypeIds = listAccountType.map((el) => el.id)
    if (accountTypeIds.length > 0) {
      leverageByAccountType = await accountLeverageRepository.getLeverageByAccountType(accountTypeIds)
    }

    listAccountType.forEach((obj) => {
      response.accountType.push(
        {
          id: obj.id,
          account_type_name: obj.account_type_name,
          platform_mt4: obj.platform_mt4,
          platform_mt5: obj.platform_mt5,
          currency: [
            obj.base_currency_usd === flag.TRUE ? currencyAccountType.USD : null,
            obj.base_currency_jpy === flag.TRUE ? currencyAccountType.JPY : null,
            obj.base_currency_eur === flag.TRUE ? currencyAccountType.EUR : null,
            obj.base_currency_sgd === flag.TRUE ? currencyAccountType.SGD : null,
            obj.base_currency_aud === flag.TRUE ? currencyAccountType.AUD : null,
            obj.base_currency_gbp === flag.TRUE ? currencyAccountType.GBP : null,
            obj.base_currency_nzd === flag.TRUE ? currencyAccountType.NZD : null,
            obj.base_currency_zar === flag.TRUE ? currencyAccountType.ZAR : null,
            obj.base_currency_huf === flag.TRUE ? currencyAccountType.HUF : null,
            obj.base_currency_chf === flag.TRUE ? currencyAccountType.CHF : null,
          ].filter((el) => el !== null),
          leverage: leverageByAccountType.filter((el) => el.account_type_id === obj.id),
        },
      )
    })

    return utility.createResponse(true, response)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null,
      [errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR])
  }
}


module.exports = {
  createMTGroupMaster,
  getListMTGroupMaster,
  updateMTGroupMaster,
  getMtGroupsDropDown,
}
