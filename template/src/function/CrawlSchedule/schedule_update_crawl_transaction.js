const utility = require('utility')

const { axios } = require('helper')
const moment = require('moment')

const _ = require('lodash')

const aws = require('helper').aws

/* constant */
const {
  resCheck, code, message, crawlUpdateMode, brokerID, metaTraderPlatform, jobStatus, batchTypes, resultDetailIds,
  resultDetailMessages, resultTypes, dateFormat,
} = require('constant')

const {
  siteRepository, crawlTransactionRepository, accountTypeRepository, rebatesMasterRepository, sequenceRepository,
  batchLogRepository,
} = require('repository')


const CRAWL_TRANSACTION_LIMIT = 5000
const SIZE_CHUNK_TRANSACTION = 1000
const DEFAULT_TOTAL_COUNT = 0


const scheduleUpdateCrawlTransaction = async (event) => {
  try {
    const mode = event.queryStringParameters.mode
    console.log(`Begin running process update crawl transaction - ${mode}.`)

    const apiSecretKey = process.env.CRAWL_DATA_ACCESS_TOKEN

    // Make API call
    const apiUrl = `${process.env.URL_CRAWL_DATA_API}/api/update-transaction/${crawlUpdateMode[mode]}`
    const response = await axios.get(apiUrl, {
      headers: { 'API_SECRET_KEY': apiSecretKey },
    })

    return utility.createResponse(true, response)
  } catch (error) {
    console.error(error)
    return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
  }
}

const scheduleUpdateIbActivity = async (event) => {
  let parentBatchLogId
  let tableName = ''
  const batchType = batchTypes.UPD_IB_ACT
  const processStartTime = moment().utc().format(dateFormat.DATE_TIME_ZONE)
  try {
    console.log('Begin running process update crawl transaction IB Activity')
    // Get parent batch log id
    parentBatchLogId = await sequenceRepository.updateAndGetBatchId()
    // Save batch_log start
    parentBatchLogId && await batchLogRepository.createNewBatchLogBegin(parentBatchLogId, batchTypes.UPD_IB_ACT)
    // Send sqs message
    const sqsMessage = utility.generateSqsMessage(parentBatchLogId, resultDetailIds.E_1008004)

    parentBatchLogId && await aws.sendSqsMessage(sqsMessage)

    // Convert to list broker Id
    const { brokerIds } = event || {}
    const brokerIdsToCheck = brokerIds.split(',').map(Number)

    // Get list rebates
    let listRebates = await rebatesMasterRepository.getListRebatesByBrokersId(brokerIdsToCheck)
    if (!listRebates) {
      // Save batch_log process
      tableName = 'm_rebates'
      parentBatchLogId && await batchLogRepository.createNewBatchLogProcessResult(
        parentBatchLogId,
        batchType,
        resultTypes.ERROR,
        {
          total_count: DEFAULT_TOTAL_COUNT,
          result_count: DEFAULT_TOTAL_COUNT,
          process_start_time: processStartTime,
          process_end_time: moment().utc().format(dateFormat.DATE_TIME_ZONE),
          result_detail: {
            // eslint-disable-next-line new-cap
            result_detail_message: resultDetailMessages.E_1008001(tableName),
          },
        },
        resultDetailIds.E_1008001,
      )

      // Cannot get data from m_rebate table
      return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
    }

    const listData = []
    const listRebatesFilter = listRebates.reduce((pre, cur) => {
      const result = brokerIdsToCheck.find((i) => Number(i) === Number(cur.broker_id) && cur.platform.includes(metaTraderPlatform.MT4))
      if (result) {
        listData.push(cur)
      } else if (Number(pre[pre.length - 1]?.broker_id) !== Number(cur.broker_id)) {
        listData.push(cur)
      } else if (Number(pre[pre.length - 1]?.broker_id) === Number(cur.broker_id) &&
        pre[pre.length - 1].platform === cur.platform && cur.platform.includes(metaTraderPlatform.MT5)) {
        listData.push(cur)
      }
      return [...listData]
    }, [])

    listRebatesFilter.length > 0 ? listRebates = [...listRebatesFilter] : listRebates

    // get list sites
    const listSites = await siteRepository.getListSites()
    if (!listSites) {
      // Save batch_log process
      tableName = 'm_site'
      parentBatchLogId && await batchLogRepository.createNewBatchLogProcessResult(
        parentBatchLogId,
        batchType,
        resultTypes.ERROR,
        {
          total_count: DEFAULT_TOTAL_COUNT,
          result_count: DEFAULT_TOTAL_COUNT,
          process_start_time: processStartTime,
          process_end_time: moment().utc().format(dateFormat.DATE_TIME_ZONE),
          result_detail: {
            // eslint-disable-next-line new-cap
            result_detail_message: resultDetailMessages.E_1008001(tableName),
          },
        },
        resultDetailIds.E_1008001,
      )

      // Cannot get data from m_site table
      return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
    }

    // get list account type of list Broker
    const listAccountType = await accountTypeRepository.getAccountTypeByBrokerIds(brokerIdsToCheck)
    if (!listAccountType) {
      // Save batch_log process
      tableName = 'm_account_type'
      parentBatchLogId && await batchLogRepository.createNewBatchLogProcessResult(
        parentBatchLogId,
        batchType,
        resultTypes.ERROR,
        {
          total_count: DEFAULT_TOTAL_COUNT,
          result_count: DEFAULT_TOTAL_COUNT,
          process_start_time: processStartTime,
          process_end_time: moment().utc().format(dateFormat.DATE_TIME_ZONE),
          result_detail: {
            // eslint-disable-next-line new-cap
            result_detail_message: resultDetailMessages.E_1008001(tableName),
          },
        },
        resultDetailIds.E_1008001,
      )

      // Cannot get data from m_account_type table
      return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
    }

    let listTransactions = []

    let totalDataNeedCheck = 0
    let totalDataUpdated = 0
    for (const brokerId of brokerIdsToCheck) {
      // filter ticket or deal_id by broker id
      if (Number(brokerId) === brokerID.TFX || Number(brokerId) === brokerID.BIG) {
        listTransactions = await crawlTransactionRepository.getTransactionTfxBig(brokerId, CRAWL_TRANSACTION_LIMIT)
      } else {
        listTransactions = await crawlTransactionRepository.getTransactionWithoutTfxBig(brokerId, CRAWL_TRANSACTION_LIMIT)
      }

      if (!listTransactions) {
        // Save batch_log process
        tableName = 'crawl_transaction'
        parentBatchLogId && await batchLogRepository.createNewBatchLogProcessResult(
          parentBatchLogId,
          batchType,
          resultTypes.ERROR,
          {
            total_count: DEFAULT_TOTAL_COUNT,
            result_count: DEFAULT_TOTAL_COUNT,
            process_start_time: processStartTime,
            process_end_time: moment().utc().format(dateFormat.DATE_TIME_ZONE),
            result_detail: {
              // eslint-disable-next-line new-cap
              result_detail_message: resultDetailMessages.E_1008001(tableName),
            },
          },
          resultDetailIds.E_1008001,
        )

        // Cannot get data from crawl_transaction table
        return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
      }

      if (listTransactions.length === 0) {
        continue
      }
      totalDataNeedCheck += listTransactions.length

      const dealIds = listTransactions.reduce((pre, cur)=>{
        if (cur.deal_id && cur.broker_id === brokerId) {
          pre.push(cur.deal_id)
          return pre
        } else {
          return pre
        }
      }, [])

      const ticket = listTransactions.reduce((pre, cur)=>{
        if (cur.ticket && cur.broker_id === brokerId) {
          pre.push(cur.ticket)
          return pre
        } else {
          return pre
        }
      }, [])

      let listDealIdExist = []
      if (dealIds.length > 0) {
        listDealIdExist = await crawlTransactionRepository.getDataDealIdExisted(dealIds, brokerId)
      }

      let listTicketExist = []
      if (ticket.length > 0) {
        listTicketExist = await crawlTransactionRepository.getDataTicketExisted(ticket, brokerId)
      }

      if (!listDealIdExist || !listTicketExist) {
        // Save batch_log process
        tableName = 'crawl_transaction'
        parentBatchLogId && await batchLogRepository.createNewBatchLogProcessResult(
          parentBatchLogId,
          batchType,
          resultTypes.ERROR,
          {
            total_count: totalDataNeedCheck,
            result_count: DEFAULT_TOTAL_COUNT,
            process_start_time: processStartTime,
            process_end_time: moment().utc().format(dateFormat.DATE_TIME_ZONE),
            result_detail: {
              // eslint-disable-next-line new-cap
              result_detail_message: resultDetailMessages.E_1008001(tableName),
            },
          },
          resultDetailIds.E_1008001,
        )

        // Cannot get data from crawl_transaction table
        return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
      }

      const existedTransactions = [...listDealIdExist, ...listTicketExist]


      const filterTransaction = existedTransactions.length > 0 && _filterExistedTransaction(listTransactions, existedTransactions, brokerId)
      const resultAfterCheck = _selfFilterTransaction( filterTransaction ? filterTransaction : listTransactions, brokerId)

      const dataDuplicate = _.difference(listTransactions, resultAfterCheck)

      if (dataDuplicate.length > 0) {
        const duplicatedTransactionIds = dataDuplicate.map((item)=> item.id)

        const updateDuplicateResult = await crawlTransactionRepository.updateJobStatusByIdIn(jobStatus.VALUE_4, duplicatedTransactionIds)

        if (!updateDuplicateResult && dataDuplicate.length > 0) {
          // Save batch_log process
          tableName = 'crawl_transaction'
          parentBatchLogId && await batchLogRepository.createNewBatchLogProcessResult(
            parentBatchLogId,
            batchType,
            resultTypes.ERROR,
            {
              total_count: listTransactions.length,
              result_count: DEFAULT_TOTAL_COUNT,
              process_start_time: processStartTime,
              process_end_time: moment().utc().format(dateFormat.DATE_TIME_ZONE),
              result_detail: {
                // eslint-disable-next-line new-cap
                result_detail_message: resultDetailMessages.E_1008002(tableName),
              },
            },
            resultDetailIds.E_1008002,
          )

          // Cannot update data to crawl_transaction table
          return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
        }
      }

      totalDataUpdated += resultAfterCheck.length
      // Process logic and convert to query
      const listQueryUpdate = _processLogicAndConvertToQueryUpdate(
        resultAfterCheck,
        listSites,
        listRebates,
        listAccountType,
        brokerIdsToCheck,
      )

      const isSuccess = await crawlTransactionRepository.updateBatchTransaction(listQueryUpdate)
      if (!isSuccess) {
      // Save batch_log process
        tableName = 'crawl_transaction'
        parentBatchLogId && await batchLogRepository.createNewBatchLogProcessResult(
          parentBatchLogId,
          batchType,
          resultTypes.ERROR,
          {
            total_count: totalDataNeedCheck,
            result_count: DEFAULT_TOTAL_COUNT,
            process_start_time: processStartTime,
            process_end_time: moment().utc().format(dateFormat.DATE_TIME_ZONE),
            result_detail: {
            // eslint-disable-next-line new-cap
              result_detail_message: resultDetailMessages.E_1008002(tableName),
            },
          },
          resultDetailIds.E_1008002,
        )

        // Cannot update data to crawl_transaction table
        return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
      }
    }

    // Save batch_log process result
    parentBatchLogId && await batchLogRepository.createNewBatchLogProcessResult(
      parentBatchLogId,
      batchType,
      resultTypes.SUCCESS,
      {
        total_count: totalDataNeedCheck,
        result_count: totalDataUpdated,
        process_start_time: processStartTime,
        process_end_time: moment().utc().format(dateFormat.DATE_TIME_ZONE),
        result_detail: totalDataNeedCheck !== totalDataUpdated ?
          { // eslint-disable-next-line new-cap
            result_detail_message: resultDetailMessages.E_1008005(totalDataNeedCheck - totalDataUpdated),
          } : {},
      },
      totalDataNeedCheck !== totalDataUpdated ? resultDetailIds.E_1008005 : null,
    )

    console.log('Update crawl transaction IB Activity success')
    return utility.createResponse(true)
  } catch (error) {
    console.log(error)

    // Save batch_log process
    parentBatchLogId && await batchLogRepository.createNewBatchLogProcessResult(
      parentBatchLogId,
      batchType,
      resultTypes.ERROR,
      {
        total_count: DEFAULT_TOTAL_COUNT,
        result_count: DEFAULT_TOTAL_COUNT,
        process_start_time: processStartTime,
        process_end_time: moment().utc().format(dateFormat.DATE_TIME_ZONE),
        result_detail: {
          // eslint-disable-next-line new-cap
          result_detail_message: resultDetailMessages.E_1008003(error.message),
        },
      },
      resultDetailIds.E_1008003,
    )

    return utility.createResponse(resCheck.ERROR, null, code.ERROR, message.server_error)
  } finally {
    parentBatchLogId && await batchLogRepository.createNewBatchLogEnd(parentBatchLogId, batchType)
  }
}

const _processLogicAndConvertToQueryUpdate = (transactions, listSites, listRebates, listAccountType, brokerIds) => {
  const listChunkTransactions = _.chunk(transactions, SIZE_CHUNK_TRANSACTION)
  const listQueryUpdate = []

  for (const listTransaction of listChunkTransactions) {
    let queryUpdate = 'UPDATE crawl_transaction SET'
    let setIbRank = ''
    let setSiteId = ''
    let setAccountTypeId = ''
    let setRewardCurrency = ''
    let setJobStatus = ''
    let listIds = ''

    listTransaction.map((obj) => {
      const siteId = _getTransactionSiteId(obj, listSites)
      const ibRankId = _getTransactionIbRank(obj, listRebates, listAccountType, brokerIds)
      const accountTypeId = obj.account_type_id
      const rewardCurrency = obj.reward_currency

      if (ibRankId) {
        setIbRank = setIbRank + `WHEN ${obj.id} THEN ${ibRankId} `
      }

      if (siteId) {
        setSiteId = setSiteId + `WHEN ${obj.id} THEN ${siteId} `
      }

      setAccountTypeId = setAccountTypeId + `WHEN ${obj.id} THEN ${accountTypeId ? accountTypeId : null} `
      setRewardCurrency = setRewardCurrency + `WHEN ${obj.id} THEN ${rewardCurrency ? `'${rewardCurrency}'` : null} `
      setJobStatus = setJobStatus + `WHEN ${obj.id} THEN ${jobStatus.VALUE_2} `

      listIds = listIds + `${obj.id}, `
    })

    if (setIbRank) {
      queryUpdate = queryUpdate + ` ib_rank_id = CASE id ${setIbRank}END,`
    }

    if (setSiteId) {
      queryUpdate = queryUpdate + ` site_id = CASE id ${setSiteId}END,`
    }

    if (setAccountTypeId) {
      queryUpdate = queryUpdate + ` account_type_id = CASE id ${setAccountTypeId}END,`
    }

    if (setRewardCurrency) {
      queryUpdate = queryUpdate + ` reward_currency = CASE id ${setRewardCurrency}END,`
    }

    listIds = listIds.trim().slice(0, -1)

    queryUpdate = queryUpdate + ` job_status = CASE id ${setJobStatus}END where id in (${listIds});`
    listQueryUpdate.push(queryUpdate)
  }

  return listQueryUpdate
}

const _getTransactionSiteId = (transaction, listSites) => {
  if (!transaction.site_name) {
    return null
  }

  // get site id by site name
  const site = listSites.find((item) => item.site_name.toUpperCase() === transaction.site_name.toUpperCase())
  return site ? site.site_id : null
}

const _getTransactionIbRank = (transaction, listRebates, listAccountType, brokerIdsToCheck) => {
  // get account type id
  const matchingBrokerId = Number(transaction.broker_id)

  if (brokerIdsToCheck.includes(matchingBrokerId)) {
    const accountTypeOfBroker = listAccountType.filter((i)=>Number(i.broker_id) === matchingBrokerId)

    if (accountTypeOfBroker.length <= 0) {
      transaction.account_type_id = null
      transaction.reward_currency = null
    } else {
      const matchingAccountType = accountTypeOfBroker.find((item) =>
        item.account_type_name?.toUpperCase() === transaction.account_type?.toUpperCase(),
      )

      transaction.account_type_id = matchingAccountType ? matchingAccountType.id : accountTypeOfBroker[0].id
      transaction.reward_currency = matchingAccountType ? matchingAccountType.rebates_currency : accountTypeOfBroker[0].rebates_currency
    }
  }

  // filter by broker_id, account_type_id, close_time
  let listRebateFiltered = listRebates.filter((rebate) => {
    return (
      Number(rebate.broker_id) === matchingBrokerId &&
      Number(rebate.account_type_id) === Number(transaction.account_type_id) &&
      Number(moment(transaction.close_time)) >= Number(moment(rebate.ts_start)) &&
      Number(moment(transaction.close_time)) <= Number(moment(rebate.ts_end))
    )
  })

  if (listRebateFiltered.length === 0) {
    return null
  }

  listRebateFiltered = listRebateFiltered.map((rebate) => {
    // Convert to array id
    const listProductId = JSON.stringify(rebate.product_type_id).includes(',') ?
      rebate?.product_type_id.split(',').map((id) => Number(id)) :
      Number(rebate?.product_type_id)

    // set min id
    rebate.product_type_id = Array.isArray(listProductId) ? Math.min(...listProductId) : listProductId
    return rebate
  })

  listRebateFiltered = listRebateFiltered.sort((a, b) => a.product_type_id - b.product_type_id || Number(b.ts_regist) - Number(a.ts_regist))
  return listRebateFiltered[0].ib_rank_id
}

const _filterExistedTransaction = (listTransactions, existedTransactions, brokerId) => {
  const isBrokerTfxBig = [brokerID.BIG, brokerID.TFX].includes(Number(brokerId))
  const isBrokerMil = Number(brokerId) === brokerID.MIL
  const isBrokerExn = Number(brokerId) === brokerID.EXN
  const isBrokerXemXmg = [brokerID.XMG, brokerID.XEM].includes(Number(brokerId))

  let listDataNotUpdated

  if (isBrokerTfxBig ) {
    listDataNotUpdated = _.differenceWith(listTransactions, existedTransactions, (itemA, itemB)=>{
      return (
        itemA?.ticket === itemB?.ticket &&
        itemA.mq_server === itemB.mq_server &&
        itemA.broker_account === itemB.broker_account &&
        itemA?.deal_id === itemB?.deal_id &&
        itemA.mq_index === itemB.mq_index &&
        itemA.mq_account === itemB.mq_account &&
        itemA.platform === itemB.platform)
    })
  } else if (isBrokerMil) {
    listDataNotUpdated = _.differenceWith(listTransactions, existedTransactions, (itemA, itemB)=>{
      return (itemA?.ticket === itemB?.ticket && itemA.account === itemB.account && itemA.broker_account === itemB.broker_account)
    })
  } else if (isBrokerXemXmg) {
    listDataNotUpdated = _.differenceWith(listTransactions, existedTransactions, (itemA, itemB)=>{
      return (
        itemA.broker_id === itemB.broker_id &&
        itemA?.ticket === itemB?.ticket &&
        itemA?.deal_id === itemB?.deal_id &&
        itemA.account === itemB.account )
    })
  } else if ( isBrokerExn) {
    listDataNotUpdated = _.differenceWith(listTransactions, existedTransactions, (itemA, itemB)=>{
      return (
        itemA?.ticket === itemB?.ticket &&
        itemA.account === itemB.account &&
        itemA.broker_account === itemB.broker_account &&
        itemA?.deal_id === itemB?.deal_id &&
        itemA.platform === itemB.platform)
    })
  }
  return listDataNotUpdated || []
}


const _selfFilterTransaction = (listTransaction, brokerId) => {
  let filterTransaction

  if (brokerId === brokerID.BIG || brokerId === brokerID.TFX ) {
    filterTransaction = _.uniqWith(listTransaction, (obj1, obj2)=>{
      return obj1?.ticket === obj2?.ticket &&
      obj1.mq_account === obj2.mq_account &&
      obj1?.deal_id === obj2?.deal_id &&
      obj1.mq_index === obj2.mq_index &&
      obj1.mq_server === obj2.mq_server &&
      obj1.platform === obj2.platform
    } )
  }

  if (brokerId === brokerID.MIL || brokerId === brokerID.EXN) {
    filterTransaction = _.uniqWith(listTransaction, (obj1, obj2) => {
      return obj1?.ticket === obj2?.ticket &&
             obj1.broker_account === obj2.broker_account &&
             obj1?.deal_id === obj2?.deal_id &&
             obj1.account === obj2.account
    })
  }
  if ( brokerId === brokerID.XEM || brokerId === brokerID.XMG ) {
    filterTransaction = _.uniqWith(listTransaction, (obj1, obj2) => {
      return obj1?.ticket === obj2?.ticket &&
             obj1.deal_id === obj2.deal_id &&
             obj1.account === obj2.account
    })
  }


  return filterTransaction || []
}

module.exports = {
  scheduleUpdateCrawlTransaction,
  scheduleUpdateIbActivity,
}
