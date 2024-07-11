'use strict'
const utility = require('utility')
const {
  publishTargetPortfolio,
  publishRangePortfolio,
  tradingMethodPortfolio,
  maxLength, commonSiteId,
  portfolioFlag, category, contentUpdate, errorMessageCodeConstant } = require('constant')
const { portfoliosRepository, tradingAccountRepository,
  errorLogRepository, usersBasicDataRepository } = require('repository')
const { regex } = require('helper')
const { createListOperationHistory } = require('../History/operation_history')

const _validateCharInStr = (str, maxLengthHalfWidthChars, maxByteSize) => {
  const { length, isContainsFullWidth } = regex.countStrBytes(str)
  if (!isContainsFullWidth) {
    if (length > maxLengthHalfWidthChars) return false
  } else {
    if (length > maxByteSize) return false
  }

  return true
}

const _validateTargetField = (field) => {
  if (field === null || field === undefined) {
    return false
  } else {
    return true
  }
}

const _validatePortfolioName = async (portfolio_name, user_id, site_id) => {
  // Validate name
  // eslint-disable-next-line max-len
  if (!_validateCharInStr(portfolio_name, maxLength.PORTFOLIO_NAME_HALF_WIDTH, maxLength.PORTFOLIO_NAME_MAX_BYTE)) {
    return false
  }

  // Get list portfolio name with pre portfolio_name
  let listPortfolio = []
  if (site_id === commonSiteId.MY_FOREX) {
    listPortfolio = await portfoliosRepository.getListPortfolioByOriginName(portfolio_name, user_id)
  } else if (site_id === commonSiteId.FXT) {
    listPortfolio = await tradingAccountRepository.getListPortfolioByOriginName(user_id)
  }

  const listPortfolioName = listPortfolio.map((portfolio) => portfolio.name)
  let suffixNumber = 1
  let portfolio_name_updated = portfolio_name

  // Handle insert number after name
  while (listPortfolioName.includes(portfolio_name_updated)) {
    portfolio_name_updated = `${portfolio_name}${suffixNumber}`
    suffixNumber++
  }

  // Validate name after updated
  if (!_validateCharInStr(portfolio_name_updated, maxLength.PORTFOLIO_NAME_HALF_WIDTH, maxLength.PORTFOLIO_NAME_MAX_BYTE)) {
    return false
  }

  return portfolio_name_updated
}

const updatePortfolioSetting = async (event) => {
  try {
    const { user_id, portfolio_id, publish_target, portfolio_description,
      publish_range, trading_method, portfolio_name, portfolio_description_default } = JSON.parse(event.body) || {}

    event.user_id = user_id

    // check user_id, portfolio_id
    if (!user_id || !portfolio_id) {
      return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
    }

    // get user info
    const userInfo = await usersBasicDataRepository.getUserInfo(user_id)
    let objUpdate = {}

    // check trading method
    if (trading_method) {
      if (!Object.values(tradingMethodPortfolio).includes(trading_method)) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
      }

      objUpdate = {
        ...objUpdate,
        trading_method: trading_method,
      }
    }

    // check publish_target
    if (_validateTargetField(publish_target)) {
      if (!Object.values(publishTargetPortfolio).includes(publish_target)) {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
      }

      // check publish_range
      if (_validateTargetField(publish_range)) {
        if (!Object.values(publishRangePortfolio).includes(publish_range)) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        // check status is valid
        if ((publish_target === publishTargetPortfolio.PUBLISH &&
          publish_range === publishRangePortfolio.ONLY) ||
          (publish_target === publishTargetPortfolio.PRIVATE &&
          publish_range !== publishRangePortfolio.ONLY)) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        // update object
        objUpdate = {
          ...objUpdate,
          publish_target: publish_target,
          publish_range: publish_range,
        }
      } else {
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
      }
    }

    // check portfolio description
    if (portfolio_description) {
      if (portfolio_description_default !== portfolioFlag.DEFAULT &&
        !_validateCharInStr(portfolio_description, maxLength.PORTFOLIO_DESC_HALF_WIDTH, maxLength.PORTFOLIO_DESC_MAX_BYTE)
      ) {
        return await errorLogRepository.createResponseAndLog(event, null, null,
          [errorMessageCodeConstant.UPDATE_PORTFOLIO_SETTING.DESCRIPTION_EXCEEDS_CHARACTERS])
      }

      // if update description, change portfolio_description_default to custom
      objUpdate = {
        ...objUpdate,
        portfolio_description: portfolio_description,
        portfolio_description_default: portfolio_description_default === portfolioFlag.DEFAULT ? portfolioFlag.DEFAULT : portfolioFlag.CUSTOM,
      }
    }

    let update
    let portfolio_name_validate
    let target
    let trading_account_id
    let commonSite
    const categoryId = category.PORTFOLIO
    let oldObject = {}

    switch (Number(userInfo.site_id)) {
      case commonSiteId.MY_FOREX:
        const checkPortfilio = await portfoliosRepository.checkPortfolioIsExist(portfolio_id, user_id)
        if (!checkPortfilio) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        // get portfolio detail
        const portfolioInfo = await portfoliosRepository.getPortfolioDetail(portfolio_id)

        if (!portfolioInfo) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        oldObject = {
          portfolio_name: portfolioInfo.portfolio_name,
          portfolio_description: portfolioInfo.portfolio_description,
          trading_method: portfolioInfo.trading_method,
          publish_target: portfolioInfo.publish_target,
          publish_range: portfolioInfo.publish_range,
        }

        trading_account_id = null
        target = portfolio_id
        commonSite = commonSiteId.MY_FOREX

        if (portfolio_name) {
          if (!portfolio_name.length) {
            return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
          }

          // validate portfolio name
          portfolio_name_validate = await _validatePortfolioName(portfolio_name, user_id, userInfo.site_id)

          if (!portfolio_name_validate) {
            return await errorLogRepository.createResponseAndLog(event, null, null,
              [errorMessageCodeConstant.UPDATE_PORTFOLIO_SETTING.CHARS_NAME_EXCEED.MY_FOREX])
          }

          // add portfolio name to obj update and change portfolio_name_default to custom
          objUpdate = {
            ...objUpdate,
            portfolio_name: portfolio_name_validate,
            portfolio_name_default: portfolioFlag.CUSTOM,
          }
        }

        // update db
        update = await portfoliosRepository.updatePortfolioSetting(objUpdate, portfolio_id)
        if (!update) {
          return await errorLogRepository.createResponseAndLog(event, null, null,
            [errorMessageCodeConstant.UPDATE_PORTFOLIO_SETTING.UPDATE_FAILED_DB_MY_FOREX])
        }
        break

      case commonSiteId.FXT:
        const checkTradingAccount = await tradingAccountRepository.checkPortfolioExist(portfolio_id, user_id)
        if (!checkTradingAccount) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        // get trading account detail
        const tradingAccountInfo = await tradingAccountRepository.getTradingAccountDetail(portfolio_id)

        if (!tradingAccountInfo) {
          return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
        }

        oldObject = {
          portfolio_name: tradingAccountInfo.portfolio_name,
          portfolio_description: tradingAccountInfo.portfolio_description,
          trading_method: tradingAccountInfo.trading_method,
          publish_target: tradingAccountInfo.publish_target,
          publish_range: tradingAccountInfo.publish_range,
        }

        trading_account_id = tradingAccountInfo.id
        target = portfolio_id
        commonSite = commonSiteId.FXT

        if (portfolio_name) {
          if (!portfolio_name.length) {
            return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_CANNOT_BLANK])
          }

          portfolio_name_validate = await _validatePortfolioName(portfolio_name, user_id, userInfo.site_id)

          if (!portfolio_name_validate) {
            return await errorLogRepository.createResponseAndLog(event, null, null,
              [errorMessageCodeConstant.UPDATE_PORTFOLIO_SETTING.CHARS_NAME_EXCEED.FXT])
          }

          // add portfolio name to obj update
          objUpdate = {
            ...objUpdate,
            portfolio_name: portfolio_name_validate,
          }
        }

        // update db
        update = await tradingAccountRepository.updatePortfolioOfTradingAccount(objUpdate, portfolio_id, userInfo, event)

        break

      default:
        return await errorLogRepository.createResponseAndLog(event, null, null, [errorMessageCodeConstant.P2T_COMMON.FIELDS_INVALID])
    }


    const authorizedPerson = utility.getUserIdByToken(event)

    const keyUpdate = [
      { index: 1, key: 'portfolio_name', content: contentUpdate.PORTFOLIO_NAME },
      { index: 2, key: 'portfolio_description', content: contentUpdate.PORTFOLIO_DESCRIPTION },
      { index: 3, key: 'trading_method', content: contentUpdate.TRADING_METHOD },
      { index: 4, key: 'publish_target', content: contentUpdate.PUBLISH_TARGET },
      { index: 5, key: 'publish_range', content: contentUpdate.PUBLISH_RANGE },
    ]

    const listOperationHistory = []

    for (const item of keyUpdate) {
      if (objUpdate.hasOwnProperty(item.key)) {
        if (oldObject[item.key] !== objUpdate[item.key]) {
          if (item.key === 'publish_range') {
            if (publish_target === publishTargetPortfolio.PUBLISH) {
              const data = {
                site_id: commonSite,
                category_id: categoryId,
                content_update: item.content,
                before_update: _renderDataUpdate(item.key, oldObject[item.key]),
                after_update: _renderDataUpdate(item.key, objUpdate[item.key]),
                target,
                trading_account_id,
              }

              listOperationHistory.push(data)
            }
          } else {
            const data = {
              site_id: commonSite,
              category_id: categoryId,
              content_update: item.content,
              before_update: _renderDataUpdate(item.key, oldObject[item.key]),
              after_update: _renderDataUpdate(item.key, objUpdate[item.key]),
              target,
              trading_account_id,
            }

            listOperationHistory.push(data)
          }
        }
      }
    }

    await createListOperationHistory(user_id, listOperationHistory, event, authorizedPerson)

    return utility.createResponse(true)
  } catch (error) {
    console.log(error)
    return await errorLogRepository.createResponseAndLog(event, error, null, [
      error.isAxiosError ?
        errorMessageCodeConstant.UPDATE_PORTFOLIO_SETTING.UPDATE_TO_MT_SERVER_ERROR :
        errorMessageCodeConstant.P2T_COMMON.SYSTEM_ERROR,
    ])
  }
}

const _renderDataUpdate = (fieldName, data) => {
  switch (fieldName) {
    case 'trading_method':
      if (tradingMethodPortfolio.EA === data) {
        return 'trans.update_portfolio.trading_method.ea'
      } else if (tradingMethodPortfolio.DT === data) {
        return 'trans.update_portfolio.trading_method.dt'
      }
      return `trans.update_portfolio.trading_method.${data}`
    case 'portfolio_name':
      return data
    case 'portfolio_description':
      return data
    case 'publish_target':
      if (data === publishTargetPortfolio.PUBLISH) {
        return 'trans.update_portfolio.publish_target.publish'
      } else if (data === publishTargetPortfolio.PRIVATE) {
        return 'trans.update_portfolio.publish_target.private'
      }
    case 'publish_range':
      if (data === publishRangePortfolio.ONLY) {
        return '-'
      } else if (data === publishRangePortfolio.ALL) {
        return 'trans.update_portfolio.publish_range.all'
      } else if (data === publishRangePortfolio.MEMBER) {
        return 'trans.update_portfolio.publish_range.member'
      }

    default:
      break
  }
}

module.exports = {
  updatePortfolioSetting,
}
