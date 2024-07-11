/* library */
const moment = require('moment')
const parser = require('ua-parser-js')

const db = require('db').helper

/* constant */
const { dataStatus, flag, dateFormat, commonSiteId } = require('constant')


async function createOperationHistory(obj) {
  const result = await db('operation_history').insert(obj)
  return { status: dataStatus.COMPLETE, data: result }
}

async function findById(id) {
  try {
    const operationHistory = await db('operation_history as oh')
      .select(
        'oh.id',
        'oh.user_basic_data_id as user_id',
        'oh.category_id',
        'oh.content',
        'oh.before_update',
        'oh.after_update',
        'oh.ip_address',
        'oh.access_country',
        'oh.device_browser',
        'oh.authorized_person',
        'oh.admin_flag',
        'oh.target',
        'oh.ts_regist',
        'mc.ja_category_name',
        'mc.en_category_name',
        'mc.cn_category_name',
        'mc.kr_category_name',
        'mc.ts_regist as category_ts_regist',
        'users.site_id',
        db.raw('case\n' +
          'when oh.category_id = 1 then dmcu.ja_content_name\n' +
          'else mcu.ja_content_name\n' +
          'end as ja_content_name\n',
        ),
        db.raw('case\n' +
          'when oh.category_id = 1 then dmcu.en_content_name\n' +
          'else mcu.en_content_name\n' +
          'end as en_content_name\n',
        ),
        db.raw('case\n' +
          'when oh.category_id = 1 then dmcu.cn_content_name\n' +
          'else mcu.cn_content_name\n' +
          'end as cn_content_name\n',
        ),
        db.raw('case\n' +
          'when oh.category_id = 1 then dmcu.kr_content_name\n' +
          'else mcu.kr_content_name\n' +
          'end as kr_content_name\n',
        ),
        db.raw('CONCAT(LEFT(admin.last_name_romaji,1),".",admin.first_name_romaji) as staff_name'),
        'm_authorization.authorization_name',
      )
      .leftJoin('m_category as mc', (builder) => {
        builder.on('mc.id', '=', 'oh.category_id')
      })
      .leftJoin('m_content_update as mcu', (builder) => {
        builder.on('mcu.category_id', '=', 'oh.category_id')
          .andOn('mcu.type', '=', 'oh.content')
      })
      .leftJoin('m_content_update as dmcu', (builder) => {
        builder.on('dmcu.category_id', '=', 'oh.category_id')
          .andOn('dmcu.id', '=', 'oh.content')
      })
      .leftJoin('users_basic_data as users', (builder) => {
        builder.on('users.id', '=', 'oh.user_basic_data_id')
      })
      .leftJoin('users_basic_data as admin', function() {
        /* eslint-disable no-invalid-this */
        this
          .on('oh.authorized_person', 'admin.id')
          .on('admin.delete_flag', flag.FALSE)
          .on('admin.site_id', '=', commonSiteId.P2TECH)
      })
      .leftJoin('m_authorization', 'admin.authorization_id', 'm_authorization.id')
      .where({
        'oh.id': id,
        'oh.delete_flag': flag.FALSE,
      })
      .groupBy('oh.id')
      .first()
      .asCallback(function(err, rows) {
        if (err) {
          console.log(err)
        }
      })

    if (operationHistory) {
      if (operationHistory.device_browser) {
        const { browser, os, device } = parser(operationHistory.device_browser)
        const isIpad = (operationHistory.device_browser.indexOf('iPad') > -1 || operationHistory.device_browser.indexOf('Macintosh') > -1)
        const deviceType = (isIpad ? 'tablet' : device.type) || (os.name ? 'desktop' : null)
        const osType = deviceType === 'desktop' ? 'PC' : (isIpad ? 'iPad' : os.name)
        const model = device.model === 'K' ? osType : device.model
        const deviceBrower = operationHistory.device_browser === '-' ? '-' :
          [[model, osType].find(Boolean), browser.name.replace(/Mobile /g, '')].filter(Boolean).join('/') || null

        operationHistory.device_browser = deviceBrower
        return {
          status: dataStatus.COMPLETE,
          data: operationHistory,
        }
      }
    }
    return { status: dataStatus.FAIL }
  } catch (error) {
    console.log(error)
    return { status: dataStatus.FAIL, errorMessage: error.message }
  }
}

async function findAll(pagination, objParam = {}) {
  try {
    let orderArr
    if (objParam.sort) {
      orderArr = [...pagination.sort, { column: 'oh.ts_regist', order: 'DESC' }]
    } else {
      orderArr = [{ column: 'oh.ts_regist', order: 'DESC' }]
    }
    const operationHistories = await db('operation_history as oh')
      .select(
        'oh.id',
        'oh.user_basic_data_id as user_id',
        'oh.category_id',
        'oh.content',
        'oh.ts_regist',
        'mc.ja_category_name',
        'mc.en_category_name',
        'mc.cn_category_name',
        'mc.kr_category_name',
        'users.site_id',
        db.raw('case\n' +
          'when oh.category_id = 1 then dmcu.ja_content_name\n' +
          'else mcu.ja_content_name\n' +
          'end as ja_content_name\n',
        ),
        db.raw('case\n' +
          'when oh.category_id = 1 then dmcu.en_content_name\n' +
          'else mcu.en_content_name\n' +
          'end as en_content_name\n',
        ),
        db.raw('case\n' +
          'when oh.category_id = 1 then dmcu.cn_content_name\n' +
          'else mcu.cn_content_name\n' +
          'end as cn_content_name\n',
        ),
        db.raw('case\n' +
          'when oh.category_id = 1 then dmcu.kr_content_name\n' +
          'else mcu.kr_content_name\n' +
          'end as kr_content_name\n',
        ),
      )
      .leftJoin('m_category as mc', 'oh.category_id', 'mc.id')
      .leftJoin('m_content_update as mcu', (builder) => {
        builder.on('oh.category_id', '=', 'mcu.category_id')
          .andOn('oh.content', '=', 'mcu.type')
      })
      .leftJoin('m_content_update as dmcu', (builder) => {
        builder.on('oh.category_id', '=', 'dmcu.category_id')
          .andOn('oh.content', '=', 'dmcu.id')
      })
      .leftJoin( 'users_basic_data as users', (builder) => {
        builder.on('users.id', '=', 'oh.user_basic_data_id')
      })
      .where({
        'oh.user_basic_data_id': objParam.userId,
        'oh.delete_flag': flag.FALSE,
      })
      .andWhere((builder) => {
        const utc = (objParam.utc || '0').replace('(', '').replace('UTC', '').replace(')', '')
        if (objParam.tsRegistFrom && objParam.tsRegistTo) {
          const tsRegistFrom = moment(objParam.tsRegistFrom).startOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
          const tsRegistTo = moment(objParam.tsRegistTo).endOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
          builder.whereBetween('oh.ts_regist', [tsRegistFrom, tsRegistTo])
        } else if (objParam.accessTimeFrom) {
          const tsRegistFrom = moment(objParam.tsRegistFrom).startOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
          builder.where('oh.ts_regist', '>=', [tsRegistFrom])
        } else if (objParam.tsRegistTo) {
          const tsRegistTo = moment(objParam.tsRegistTo).endOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
          builder.where('oh.ts_regist', '<=', [tsRegistTo])
        }
      })
      .andWhere((builder) => {
        if (objParam.categoryId) {
          builder.whereIn('oh.category_id', objParam.categoryId.split(','))
        }
      })
      .andWhere((builder) => {
        if (objParam.tradingAccountId) {
          builder.where('oh.trading_account_id', [objParam.tradingAccountId])
        }
      })
      .andWhere((builder) => {
        if (objParam.target) {
          builder.whereIn('oh.target', objParam.target.split(','))
        }
      })
      .groupBy('oh.id')

      .orderBy(orderArr)
      .paginate(pagination)
      .asCallback(function(err, rows) {
        if (err) {
          console.log(err)
        }
      })

    return {
      status: dataStatus.COMPLETE,
      data: operationHistories,
    }
  } catch (error) {
    console.log(error)
    return { status: dataStatus.FAIL, errorMessage: error.message }
  }
}


module.exports = {
  findAll,
  findById,
  createOperationHistory,
}
