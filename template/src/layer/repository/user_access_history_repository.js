const db = require('db').helper
const utility = require('utility')
const { dataStatus, flag, dateFormat, suspiciousLevel, commonSiteId, displayDateTime } = require('constant')
const moment = require('moment')
const parser = require('ua-parser-js')
async function findAll(pagination, objParam = {}) {
  const orderArr = pagination.sort
  const language = objParam.language
  let columnSearch
  let columnOrderNotation
  switch (language) {
    case 'en':
      columnSearch = 'english_notation'
      columnOrderNotation = 'english_display_order'
      break
    case 'ja':
      columnSearch = 'japanese_notation'
      columnOrderNotation = 'japanese_display_order'
      break
    case 'kr':
      columnSearch = 'korean_notation'
      columnOrderNotation = 'korean_display_order'
      break
    case 'cn':
      columnSearch = 'chinese_notation'
      columnOrderNotation = 'chinese_display_order'
      break
    default:
      columnSearch = 'english_notation'
      columnOrderNotation = 'english_display_order'
      break
  }

  if (orderArr[0] && orderArr[0].column === 'access_country') {
    orderArr[0].column = columnOrderNotation
  }

  const userAccessHistories = await db('user_access_history')
    .leftJoin('m_countries', 'user_access_history.access_country', 'm_countries.country_code')
    .select(
      'user_access_history.id',
      'user_access_history.access_time',
      'user_access_history.access_ip',
      'user_access_history.access_country',
      'user_access_history.access_agent',
      'user_access_history.access_device_brower',
      'user_access_history.access_device_type',
      'user_access_history.suspicious_level',
    )
    .where({
      'user_access_history.user_basic_data_id': objParam.userId,
      'user_access_history.delete_flag': flag.FALSE,
      'user_access_history.is_success': flag.TRUE,
    })
    .andWhere((builder) => {
      if (objParam.term) {
        const term = utility.escapeSql(objParam.term)
        let levelArr = [-1]
        for (const prop in suspiciousLevel) {
          if (prop.toLowerCase().includes(objParam.term.toLowerCase())) {
            levelArr = suspiciousLevel[prop]
            break
          }
        }

        let formatDisplay
        switch (objParam.display_date_time) {
          case displayDateTime.MM_DD_YYYY:
            formatDisplay = '%m.%d.%Y'
            break
          case displayDateTime.DD_MM_YYYY:
            formatDisplay = '%d.%m.%Y'
            break
          default:
            formatDisplay = '%Y.%m.%d'
            break
        }

        // handle timezone
        const utc = (objParam.utc || '').replace(/[()UTC]/g, '') || '+00:00'

        builder.whereILike('user_access_history.access_ip', `%${term}%`)
          .orWhereILike('user_access_history.access_device_brower', `%${term}%`)
          .orWhereRaw(`LOWER(m_countries.${columnSearch}) LIKE BINARY ?`, [`%${term.toLowerCase()}%`])
          .orWhereIn('user_access_history.suspicious_level', levelArr)
          .orWhere(
            db.raw(
              `DATE_FORMAT(CONVERT_TZ(user_access_history.access_time, "+00:00", "${utc}"),'${formatDisplay} %H:%i:%s') like "%${term}%"`,
            ),
          )
      }
    })
    .andWhere((builder) => {
      const utc = (objParam.utc || '0').replace('(', '').replace('UTC', '').replace(')', '')
      if (objParam.accessTimeFrom && objParam.accessTimeTo) {
        const accessTimeFrom = moment(objParam.accessTimeFrom).startOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
        const accessTimeTo = moment(objParam.accessTimeTo).endOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
        builder.whereBetween('user_access_history.access_time', [accessTimeFrom, accessTimeTo])
      } else if (objParam.accessTimeFrom) {
        const accessTimeFrom = moment(objParam.accessTimeFrom).startOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
        builder.where('user_access_history.access_time', '>=', [accessTimeFrom])
      } else if (objParam.accessTimeTo) {
        const accessTimeTo = moment(objParam.accessTimeTo).endOf('day').subtract(utc, 'hours').format(dateFormat.DATE_TIME_ZONE).toString()
        builder.where('user_access_history.access_time', '<=', [accessTimeTo])
      }
    })
    .orderBy(orderArr)
    .paginate(pagination)
    .asCallback(function(err, rows) {
      if (err) {
        console.log(err)
      }
    })

  return {
    status: dataStatus.COMPLETE,
    data: userAccessHistories,
  }
}

async function createAccessHistory(obj) {
  const location = await utility.getLocationByIp(obj.accessIp)
  const mapDeviceType = {
    console: 'console',
    desktop: 'desktop',
    mobile: 'smartphone',
    tablet: 'phablet',
    smarttv: 'smarttv',
    wearable: 'wearable',
    embedded: 'embedded',
    undefined: null,
  }

  let deviceType
  let deviceBrower
  if (obj.accessAgent.mobileDeviceType && obj.accessAgent.mobileDeviceName) {
    deviceType = obj.accessAgent.mobileDeviceType
    deviceBrower = obj.accessAgent.mobileDeviceName
  } else {
    const { browser, os, device } = parser(obj.accessAgent.userAgent)
    const isIpad = (obj.accessAgent.userAgent.indexOf('iPad') > -1 || obj.accessAgent.userAgent.indexOf('Macintosh') > -1)
    deviceType = (isIpad ? 'tablet' : device.type) || (os.name ? 'desktop' : null)
    const osType = deviceType === 'desktop' ? 'PC' : (isIpad ? 'iPad' : os.name)
    const model = device.model === 'K' ? osType : device.model
    deviceBrower = [[model, osType].find(Boolean), browser.name?.replace(/Mobile /g, '')].filter(Boolean).join('/') || null
  }

  const accessHistory = {
    related_access_id: obj.relatedAccessId,
    user_basic_data_id: obj.userBasicDataId,
    site_id: commonSiteId.P2TECH,
    access_ip: obj.accessIp,
    access_country: location ? location.countryCode : null,
    access_agent: obj.accessAgent,
    access_device_brower: deviceBrower,
    access_device_type: obj.accessAgent.mobileDeviceType ? deviceType : mapDeviceType[deviceType] || null,
    access_time: obj.accessTime,
    suspicious_level: obj.suspiciousLevel,
    fraud_alert_json: obj.fraudAlertJson ? JSON.stringify(obj.fraudAlertJson) : '',
    is_success: obj.isSuccess,
  }

  try {
    const result = await db('user_access_history').insert(accessHistory)
    return { status: true, data: result[0], deviceBrower, deviceType }
  } catch (error) {
    console.error(error)
    return { status: false }
  }
}

async function getStaffAccessHistories(queryString, pagination) {
  const query = db('user_access_history')
    .leftJoin('m_countries', 'm_countries.country_code', 'user_access_history.access_country')
    .select(
      'user_access_history.id',
      'user_access_history.access_time',
      'user_access_history.access_ip',
      'user_access_history.access_country',
      'user_access_history.access_device_brower',
      'user_access_history.access_device_type',
      'user_access_history.suspicious_level',
    )
    .where({
      'user_access_history.user_basic_data_id': queryString.staffId,
      'user_access_history.site_id': commonSiteId.P2TECH,
      'user_access_history.delete_flag': flag.FALSE,
      'user_access_history.is_success': flag.TRUE,
    })

  if (queryString.search) {
    const textSearch = utility.escapeSql(queryString.search)

    // handle display datetime
    let formatDisplay
    switch (queryString.display_date_time) {
      case displayDateTime.MM_DD_YYYY:
        formatDisplay = '%m.%d.%Y'
        break
      case displayDateTime.DD_MM_YYYY:
        formatDisplay = '%d.%m.%Y'
        break
      default:
        formatDisplay = '%Y.%m.%d'
        break
    }

    // handle timezone
    const utc = (queryString.utc || '').replace(/[()UTC]/g, '') || '+00:00'

    query.where(function() {
      // eslint-disable-next-line no-invalid-this
      this
        .whereILike(
          db.raw(
            `DATE_FORMAT(CONVERT_TZ(user_access_history.access_time, "+00:00","${utc}"),"${formatDisplay} %H:%i:%S")`,
          ),
          `%${textSearch}%`,
        )
        .orWhereILike('user_access_history.access_ip', `%${textSearch}%`)
        .orWhereRaw('LOWER(m_countries.japanese_notation) LIKE BINARY ?', [`%${textSearch.toLowerCase()}%`])
        .orWhereRaw('LOWER(m_countries.english_notation) LIKE BINARY ?', [`%${textSearch.toLowerCase()}%`])
        .orWhereRaw('LOWER(m_countries.korean_notation) LIKE BINARY ?', [`%${textSearch.toLowerCase()}%`])
        .orWhereRaw('LOWER(m_countries.chinese_notation) LIKE BINARY ?', [`%${textSearch.toLowerCase()}%`])
        .orWhereILike('user_access_history.access_device_brower', `%${textSearch}%`)
        .orWhereILike(
          db.raw(
            `(CASE WHEN user_access_history.suspicious_level IN (${suspiciousLevel.HIGH.join(', ')}) THEN 'safety of high level.'
              WHEN user_access_history.suspicious_level IN (${suspiciousLevel.MIDDLE.join(', ')}) THEN 'safety of middle level.'
              WHEN user_access_history.suspicious_level IN (${suspiciousLevel.LOW.join(', ')}) THEN 'safety of low level.' END)`,
          ),
          `%${textSearch}%`,
        )
    })
  }

  const orderArr = [...pagination.sort, { column: 'id', order: 'DESC' }]

  return await query.orderBy(orderArr).paginate(pagination)
}

module.exports = {
  findAll,
  createAccessHistory,
  getStaffAccessHistories,
}
