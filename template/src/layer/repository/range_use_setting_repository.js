const db = require('db').helper
const { flag, commonSiteId } = require('constant')

async function detailRangeUseSetting(settingRuleId) {
  return await db('range_use_setting as rus')
    .leftJoin('rule_container as rc', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('rus.id', 'rc.range_use_setting_id')
        .on('rc.delete_flag', flag.FALSE)
    })
    .leftJoin('payment_method_setting as pms', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('rc.id', 'pms.rule_container_id')
        .on('pms.delete_flag', flag.FALSE)
    })
    .leftJoin('m_site', 'm_site.id', 'rus.site_id')
    .select(
      'rus.id',
      'rus.site_id',
      'rus.rule_template_id',
      'rus.priority',
      'rus.rule_name',
      'rus.rule_description',
      'rus.priority',
      'rc.id AS rule_container_id',
      'rc.enable_rule_container',
      'rc.rule_container_name',
      'rc.rank',
      'rc.display_segment_country',
      'rc.segment_country',
      'rc.enable_segment_country',
      'rc.display_segment_user',
      'rc.enable_segment_user',
      'rc.segment_user',
      'rc.enable_attention_flag',
      'rc.message_unavailable_id',
      'rc.rank_attention_flag',
      'rc.rank_segment_country',
      'rc.rank_segment_user',
      'rc.enable_payment_terms',
      'rc.payment_terms',
      'rc.rank_payment_terms',
      'pms.id AS payment_id',
      'pms.payment_type',
      'pms.enable_payment',
      'pms.payment_method_id AS payment_method_setting_id',
      'pms.payment_category_id',
      'pms.payment_detail_id',
      'pms.payment_company_account_id',
      'pms.payment_service_account_id',
      'pms.display_order',

      'm_site.site_name',
      'm_site.media_name',
      'm_site.symbol_logo_path',
      'm_site.symbol_logo_name',
      'm_site.side_logo_path',
      'm_site.side_logo_name',
    )
    .where('rus.id', settingRuleId)
    .where('rus.delete_flag', flag.FALSE)
    .orderBy([
      { column: 'rus.priority', order: 'ASC' },
      { column: 'rc.rank', order: 'ASC' },
      { column: 'pms.id', order: 'ASC' },
    ])
}

async function countRangeUseSetting(siteId) {
  const result = await db('range_use_setting')
    .count('id as count')
    .where('delete_flag', flag.FALSE)
    .where('site_id', siteId)

  return result
}

async function addRangeUseSetting(objRangeUseSetting, lstContainerRule) {
  try {
    return db.transaction(async (trx) => {
      const listItemUpdate = await trx('range_use_setting')
        .select('id', 'priority')
        .where('delete_flag', flag.FALSE)
        .where('priority', '>=', objRangeUseSetting.priority)
        .where('site_id', objRangeUseSetting.site_id)

      // update Priority
      if (listItemUpdate && listItemUpdate.length > 0) {
        const listIdUpdate = []

        for (let i = 0; i < listItemUpdate.length; i++) {
          listIdUpdate.push(listItemUpdate[i].id)
        }

        const resultUpdate = await trx('range_use_setting')
          .whereIn('id', listIdUpdate)
          .increment('priority', 1)

        if (!resultUpdate) {
          throw Object.assign(new Error('update range_use_setting failed'), { isCustomError: true })
        }
      }

      // insert range use setting
      const resultCreateRange = await trx('range_use_setting').insert(objRangeUseSetting)

      if (!resultCreateRange || !resultCreateRange[0]) {
        throw Object.assign(new Error('insert range_use_setting failed'), { isCustomError: true })
      }
      const listRuleContainerId = []

      for (let i = 0; i < lstContainerRule.length; i++) {
        const itemRule = lstContainerRule[i].objContainerRule

        itemRule.range_use_setting_id = resultCreateRange[0]
        // insert rule container
        const resultCreateRule = await trx('rule_container').insert(itemRule)

        listRuleContainerId.push(resultCreateRule[0])
        if (!resultCreateRule || !resultCreateRule[0]) {
          throw Object.assign(new Error('insert rule_container failed'), { isCustomError: true })
        }

        const lstPaymentMethod = lstContainerRule[i].lstPaymentMethod

        // insert payment method setting
        for (let j = 0; j < lstPaymentMethod.length; j++) {
          lstPaymentMethod[j].rule_container_id = resultCreateRule[0]
        }
        const isCreatedPayment = await trx('payment_method_setting').insert(lstPaymentMethod)

        if (!isCreatedPayment || !isCreatedPayment[0]) {
          throw Object.assign(new Error('insert payment_method_setting failed'), { isCustomError: true })
        }
      }

      const result = {
        rangeUseSettingId: resultCreateRange[0],
        ruleContainerId: listRuleContainerId,
        listItemUpdate: listItemUpdate,
      }

      return { isError: false, data: result }
    })
  } catch (error) {
    console.log(error)
    if (error.isCustomError) {
      return { isError: true, error }
    }
    throw error
  }
}

const getListRangeUseSetting = async (pagination, queryString) => {
  const query = db('range_use_setting as rus')
    .leftJoin('users_basic_data as admin', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('rus.staff_id', 'admin.id')
        .on('admin.delete_flag', flag.FALSE)
        .on('admin.site_id', '=', commonSiteId.P2TECH)
    })
    .leftJoin('m_site', 'rus.site_id', 'm_site.id')
    .select(
      'rus.id',
      'rus.site_id',
      'rus.rule_name',
      'rus.rule_description',
      'rus.enable',
      'rus.priority',
      'rus.ts_regist',
      db.raw('CONCAT(LEFT(admin.last_name_romaji,1),".",admin.first_name_romaji) as staff_name'),
      'm_site.site_name',
      'm_site.symbol_logo_path',
      'm_site.symbol_logo_name',
      'm_site.side_logo_path',
      'm_site.side_logo_name',
      'm_site.media_name',
      db.raw(
        // eslint-disable-next-line max-len
        'CASE WHEN rus.site_id = rus.site_id AND rus.priority = (select max(`priority`) from `range_use_setting` where `site_id` = rus.site_id and `delete_flag` = 0) THEN 1 ' +
        'ELSE  0 ' +
        'END AS arrow_disable',
      ),
    )
    .where('rus.delete_flag', flag.FALSE)
    .where('m_site.enable_flag', flag.TRUE)
    .orderBy('priority', 'asc')

  if (queryString.siteIds) {
    query.whereIn('rus.site_id', queryString.siteIds)
  }

  return await query.clone().paginate(pagination)
}

const updateRangeUseSetting = async (id, payload) => {
  try {
    const result = await db.transaction(async (trx) => {
      const userIdUpdate = await trx('range_use_setting').update(payload).where({
        id: id,
        delete_flag: flag.FALSE,
      })
      if (!userIdUpdate) {
        throw Object.assign(new Error('update range_use_setting failed'), { isCustomError: true })
      }
    })
    return { isError: false, data: result }
  } catch (error) {
    console.log(error)
    if (error.isCustomError) {
      return { isError: true, error }
    }
    throw error
  }
}

const checkPriorityById = async (type, id, site_id) => {
  return await db('range_use_setting').where({
    'priority': function() {
      if (type === 'max') {
        this.max('priority').from('range_use_setting').where({ site_id, delete_flag: flag.FALSE })
      } else {
        this.min('priority').from('range_use_setting').where({ site_id, delete_flag: flag.FALSE })
      }
    },
  })
    .where({
      id,
      delete_flag: flag.FALSE,
      site_id,
    })
    .first()
}

const updatePriority = async (type, rangeOfUse) => {
  const trx = await db.transaction()
  try {
    let priority
    if (type === 'up') {
      priority = rangeOfUse.priority - 1
    } else {
      priority = rangeOfUse.priority + 1
    }

    // get record swapped
    const rangeOfUseInverted = await trx('range_use_setting')
      .where({
        priority,
        delete_flag: flag.FALSE,
        site_id: rangeOfUse.site_id,
      })
      .first()

    if (!rangeOfUseInverted) {
      throw Object.assign(new Error('get range_use_setting_swapped failed'), { isCustomError: true })
    }

    // update swapped record
    const recordInverted = await trx('range_use_setting')
      .where({
        id: rangeOfUseInverted.id,
        delete_flag: flag.FALSE,
        site_id: rangeOfUse.site_id,
      })
      .update({
        priority: rangeOfUse.priority,
      })


    if (!recordInverted) {
      throw Object.assign(new Error('update range_use_setting_swapped failed'), { isCustomError: true })
    }

    // update record current
    const recordCurrent = await trx('range_use_setting')
      .where({
        id: rangeOfUse.id,
        delete_flag: flag.FALSE,
      })
      .update({
        priority: rangeOfUseInverted.priority,
      })

    if (!recordCurrent) {
      throw Object.assign(new Error('update range_use_setting_current failed'), { isCustomError: true })
    }

    await trx.commit()
    return { isError: false, data: [
      {
        range_use_setting_id: rangeOfUse.id,
        before_update: rangeOfUse.priority,
        after_update: rangeOfUseInverted.priority,
      },
      {
        range_use_setting_id: rangeOfUseInverted.id,
        before_update: rangeOfUseInverted.priority,
        after_update: rangeOfUse.priority,
      },
    ] }
  } catch (error) {
    console.log(error)
    await trx.rollback()
    if (error.isCustomError) {
      return { isError: true, error }
    }
    throw error
  }
}

const deleteRangeUseSetting = async (rangeOfUse) => {
  const trx = await db.transaction()
  try {
    // soft delete (update delete_flag)
    const isUpdate = await trx('range_use_setting')
      .update({ delete_flag: flag.TRUE })
      .where({
        id: rangeOfUse.id,
        delete_flag: flag.FALSE,
      })

    if (!isUpdate) {
      throw Object.assign(new Error('update delete_flag failed'), { isCustomError: true })
    }

    const rangeOfUses = await trx('range_use_setting')
      .where('delete_flag', flag.FALSE)
      .where('priority', '>', rangeOfUse.priority)
      .where('site_id', rangeOfUse.site_id)

    const histories = [{
      range_use_setting_id: rangeOfUse.id,
      before_update: '-',
      after_update: '-',
    }]

    // update priority other
    if (rangeOfUses.length > 0) {
      const updateMultiple = await trx('range_use_setting')
        .where('delete_flag', flag.FALSE)
        .where('priority', '>', rangeOfUse.priority)
        .decrement('priority', 1)
        .where('site_id', rangeOfUse.site_id)

      if (!updateMultiple) {
        throw Object.assign(new Error('update priority failed'), { isCustomError: true })
      }

      // create array obj to save history
      rangeOfUses.forEach((el) => {
        histories.push({
          range_use_setting_id: el.id,
          before_update: el.priority,
          after_update: el.priority - 1,
        })
      })
    }

    await trx.commit()
    return { isError: false, data: histories }
  } catch (error) {
    console.log(error)
    await trx.rollback()
    if (error.isCustomError) {
      return { isError: true, error }
    }
    throw error
  }
}

async function getRangeUseSetting(settingRuleId) {
  try {
    const result = await db('range_use_setting')
      .select(
        'id',
        'site_id',
        'rule_template_id',
        'priority',
        'rule_name',
        'rule_description',
        'enable',
        'staff_id',
      )
      .where('id', settingRuleId)
      .where('delete_flag', flag.FALSE).first()
    return result
  } catch (error) {
    throw error
  }
}

async function getRuleContainerById(containerId) {
  return await db('rule_container')
    .select(
      'id',
      'rule_container_name',
      'rank',
      'range_use_setting_id',
    )
    .where('id', containerId)
    .where('delete_flag', flag.FALSE).first()
}

async function updateContainerById(containerId, container) {
  return await db('rule_container')
    .update(container)
    .where('id', containerId)
    .where('delete_flag', flag.FALSE)
}

async function checkContainerNameExist(containerId, containerName, siteId) {
  const query = db('rule_container as rc')
    .leftJoin('range_use_setting as rus', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('rus.id', 'rc.range_use_setting_id')
        .on('rus.delete_flag', flag.FALSE)
    })
    .select(
      'rc.rule_container_name',
    )
    .whereIn('rc.rule_container_name', containerName)
    .where('rc.delete_flag', flag.FALSE)
    .where('rus.site_id', siteId)

  if (containerId !== 0) {
    query.where('rc.id', '!=', containerId)
  }
  return await query
}

async function checkContainerName(rangeUseId, containerName, siteId) {
  return await db('rule_container as rc')
    .leftJoin('range_use_setting as rus', function() {
      /* eslint-disable no-invalid-this */
      this
        .on('rus.id', 'rc.range_use_setting_id')
        .on('rus.delete_flag', flag.FALSE)
    })
    .select(
      'rc.rule_container_name',
    )
    .whereIn('rc.rule_container_name', containerName)
    .where('rc.delete_flag', flag.FALSE)
    .where('rus.site_id', siteId)
    .where('rc.range_use_setting_id', '!=', rangeUseId)
}

async function updateRangeUseSettingById(rangeUseSettingId, rangeSetting, rangeSettingDB, lstRuleContainer) {
  return await db.transaction(async (trx) => {
    // clear ruleConatainer
    const containerDB = await trx('rule_container')
      .select('id')
      .where('delete_flag', flag.FALSE)
      .where('range_use_setting_id', rangeUseSettingId)

    const containerIds = containerDB.map((item) => item.id)

    await trx('payment_method_setting')
      .delete()
      .where('delete_flag', flag.FALSE)
      .whereIn('rule_container_id', containerIds)

    await trx('rule_container')
      .delete()
      .where('delete_flag', flag.FALSE)
      .where('range_use_setting_id', rangeUseSettingId)

    // update priority range_use_setting
    const itemUpdate = []
    if (rangeSetting.priority !== rangeSettingDB.priority) {
      const priorityDB = rangeSettingDB.priority
      const priorityUpdate = rangeSetting.priority
      const rangeOfUse = priorityDB > priorityUpdate ?
        await trx('range_use_setting')
          .select('id', 'priority')
          .where('delete_flag', flag.FALSE)
          .where('priority', '>=', priorityUpdate)
          .where('priority', '<', priorityDB)
          .where('site_id', rangeSettingDB.site_id) :
        await trx('range_use_setting')
          .select('id', 'priority')
          .where('delete_flag', flag.FALSE)
          .where('priority', '>', priorityDB)
          .where('priority', '<=', priorityUpdate)
          .where('site_id', rangeSettingDB.site_id)

      const listIdUpdate = []
      if (rangeOfUse && rangeOfUse.length > 0) {
        for (let i = 0; i < rangeOfUse.length; i++) {
          const item = {
            id: rangeOfUse[i].id,
            priority: rangeOfUse[i].priority,
            priorityUpdate: priorityDB > priorityUpdate ? rangeOfUse[i].priority + 1 : rangeOfUse[i].priority - 1,
          }
          itemUpdate.push(item)
          listIdUpdate.push(rangeOfUse[i].id)
        }
      }

      priorityDB > priorityUpdate ?
        await trx('range_use_setting')
          .where('delete_flag', flag.FALSE)
          .whereIn('id', listIdUpdate)
          .increment('priority', 1)
          .where('site_id', rangeSettingDB.site_id) :
        await trx('range_use_setting')
          .where('delete_flag', flag.FALSE)
          .whereIn('id', listIdUpdate)
          .decrement('priority', 1)
          .where('site_id', rangeSettingDB.site_id)
    }

    // update rangeUseSetting
    await trx('range_use_setting').update(rangeSetting).where({
      id: rangeUseSettingId,
      delete_flag: flag.FALSE,
    })

    // insert rule container
    for (let r = 0; r < lstRuleContainer.length; r++) {
      const ruleContainer = lstRuleContainer[r]
      const itemContainer = ruleContainer.objContainerRule
      const itemRule = {
        range_use_setting_id: rangeUseSettingId,
        enable_rule_container: itemContainer.enable_rule_container,
        rule_container_name: itemContainer.rule_container_name,
        rank: itemContainer.rank,
        display_segment_country: itemContainer.display_segment_country,
        segment_country: itemContainer.segment_country,
        enable_segment_country: itemContainer.enable_segment_country,
        display_segment_user: itemContainer.display_segment_user,
        enable_segment_user: itemContainer.enable_segment_user,
        segment_user: itemContainer.segment_user,
        enable_attention_flag: itemContainer.enable_attention_flag,
        message_unavailable_id: itemContainer.message_unavailable_id,
        rank_segment_country: itemContainer.rank_segment_country,
        rank_segment_user: itemContainer.rank_segment_user,
        rank_attention_flag: itemContainer.rank_attention_flag,
        rank_payment_terms: itemContainer.rank_payment_terms,
        enable_payment_terms: itemContainer.enable_payment_terms,
        payment_terms: itemContainer.payment_terms,
        delete_flag: flag.FALSE,
      }
      // insert rule container
      const resultUpdateRule = await trx('rule_container').insert(itemRule)

      // insert payment method setting
      const lstPaymentMethod = ruleContainer.lstPaymentMethod
      for (let j = 0; j < lstPaymentMethod.length; j++) {
        lstPaymentMethod[j].rule_container_id = resultUpdateRule[0]
        lstPaymentMethod[j].delete_flag = flag.FALSE
      }
      lstPaymentMethod.length > 0 ? await trx('payment_method_setting').insert(lstPaymentMethod) : null
    }
    const result = {
      rangeUseSettingId: rangeUseSettingId,
      priorityUpdate: itemUpdate,
    }
    return result
  })
}

const getRangeUseSettingById = async (id) => {
  return await db('range_use_setting')
    .where({
      id,
      delete_flag: flag.FALSE,
    })
    .first()
}

async function countContainer(rangeUseSettingId) {
  const result = await db('rule_container')
    .count('id as count')
    .where('delete_flag', flag.FALSE)
    .where('range_use_setting_id', rangeUseSettingId)
  return result
}

async function updateRuleContainerById(id, containerName) {
  return await db('rule_container')
    .update({ rule_container_name: containerName })
    .where('id', id)
    .where('delete_flag', flag.FALSE)
}

module.exports = {
  detailRangeUseSetting,
  countRangeUseSetting,
  addRangeUseSetting,
  getListRangeUseSetting,
  updateRangeUseSetting,
  checkPriorityById,
  updatePriority,
  deleteRangeUseSetting,
  getRangeUseSettingById,
  getRangeUseSetting,
  checkContainerNameExist,
  updateRangeUseSettingById,
  getRuleContainerById,
  updateContainerById,
  countContainer,
  checkContainerName,
  updateRuleContainerById,
}
