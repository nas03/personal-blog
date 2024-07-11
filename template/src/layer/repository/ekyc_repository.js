/* eslint-disable no-invalid-this */
/* db */
const db = require('db').helper
const {
  ekycAuthenticationType,
  statusClassConstant,
  statusCode,
  actionMethod,
  tokenAuthorityClass,
  ekycFlow,
  ekycDocumentType,
  kycProcessStep,
  countryId,
  timeExpires,
  commonSiteId,
  messageId,
} = require('constant')

/* func */
const utility = require('utility')
const { commonQueryGetStatusHistory, commonInsertRollbackStatusHistory } = require('./status_history_repository')
const { commonCreateTokenAuthority } = require('./token_authority_repository')

/* constant */
const { dateFormat, flag } = require('constant')

/* library */
const moment = require('moment')
const { createKycApproveMessage } = require('./user_message_repository')
const { getRelatePerson } = require('./users_personal_repository')
const sleep = require('util').promisify(setTimeout)

const commonKycTransaction = db('kyc_transaction')
  .leftJoin('m_kyc_documents as mkd', 'kyc_transaction.user_selected_document_id', 'mkd.id').as('ekyc')
  .select(
    'kyc_transaction.*',
    'mkd.check_method',
    'mkd.authentication_type',
    'mkd.document_type',
    'mkd.document_symbol',
  )


const updateEkyc = async (ekycId, data) => {
  await db('kyc_transaction').update(data).where({ id: ekycId })
}

const getListEkyc = async (payload) => {
  return await db.from('kyc_transaction')
    .leftJoin('m_kyc_flows as mkf', 'kyc_transaction.kyc_flow_id', 'mkf.id')
    .leftJoin('token_authority as ta', function() {
      this
        .on('kyc_transaction.id', 'ta.target_id')
        .on('ta.action_class', db.raw(`"${tokenAuthorityClass.EKYC_AI}"`))
        .on('ta.delete_flag', flag.FALSE)
    })
    .leftJoin('users_basic_data', 'kyc_transaction.user_basic_data_id', 'users_basic_data.id')
    .innerJoin(commonQueryGetStatusHistory(statusClassConstant.DOCUMENT_STATUS), 'gsh.target_id', 'kyc_transaction.id')
    .leftJoin('m_kyc_documents as mkd', 'kyc_transaction.user_selected_document_id', 'mkd.id')
    .select(
      'kyc_transaction.id',
      'gsh.status_code as status',
      'kyc_transaction.user_basic_data_id as user_basic_data_id',
      'kyc_transaction.user_personal_id as personal_id',
      'mkf.flow_name as flow',
      'mkd.authentication_type',
      'mkd.document_type',
      'kyc_transaction.last_completed_flag as is_lastest_completed',
      'kyc_transaction.completed_flag as is_completed',
      'gsh.ts_regist as update_status_datetime',
      'kyc_transaction.access_start',
      'kyc_transaction.access_end',
      'kyc_transaction.directory_path',
      'ta.activation_key as request_ai_key',
      'ta.activation_key_expire_datetime as request_ai_expired',
      'kyc_transaction.ts_regist',
      'kyc_transaction.ts_update',
    )
    .where(payload)
    .orderBy('id', 'desc')
}

const getLastTimeEkyc = async (payload) => {
  const lastTimeEkyc = await db.from('kyc_transaction')
    .innerJoin(commonQueryGetStatusHistory(statusClassConstant.DOCUMENT_STATUS), 'gsh.target_id', 'kyc_transaction.id')
    .leftJoin('m_kyc_documents as mkd', 'kyc_transaction.user_selected_document_id', 'mkd.id')
    .where({
      ...payload,
      'kyc_transaction.delete_flag': 0,
    })
    .select(
      'kyc_transaction.id',
      'mkd.authentication_type',
      'mkd.document_type',
      'gsh.status_code as status',
      'kyc_transaction.completed_flag',
      'kyc_transaction.directory_path',
    )
    .orderBy('kyc_transaction.id', 'desc')

  // First time ekyc ==> Have no record in DB
  if (!lastTimeEkyc.length) {
    return {
      ekyc: null,
      isMyNumberFlowC: false,
    }
  }

  // Last time ekyc is Face_Auth and Identification_C is before it (has same directory_path)
  const myNumber = await db.from('kyc_transaction')
    .leftJoin('m_kyc_flows as mkf', 'kyc_transaction.kyc_flow_id', 'mkf.id')
    .leftJoin('m_kyc_documents as mkd', 'kyc_transaction.user_selected_document_id', 'mkd.id')
    .where({
      ...payload,
      'mkf.flow_name': db.raw(`"${ekycFlow.FLOW_C}"`),
      'mkd.document_type': db.raw(`"${ekycDocumentType.Identification_C}"`),
      'kyc_transaction.completed_flag': flag.TRUE,
      'kyc_transaction.directory_path': lastTimeEkyc[0].directory_path,
      'kyc_transaction.delete_flag': 0,
    })
    .select('kyc_transaction.id')
  return {
    ekyc: lastTimeEkyc[0],
    isMyNumberFlowC: myNumber.length !== 0,
  }
}

const getEkycFace = async (id) => {
  try {
    const ekyc = await db('kyc_transaction as ekyc')
      .select('directory_path')
      .where({ id: id })
      .first()

    if (!ekyc) {
      return false
    }

    return await db('kyc_transaction as ekyc')
      .leftJoin('m_kyc_documents as mkd', 'ekyc.user_selected_document_id', 'mkd.id')
      .select(
        'ekyc.id',
        'ekyc.directory_path',
        'mkd.authentication_type',
        'ekyc.completed_flag as is_completed',
        'ekyc.last_completed_flag as is_lastest_completed',
        'ekyc.ts_regist',
        'ekyc.ts_update',
      )
      .where({
        'ekyc.directory_path': ekyc.directory_path,
        'mkd.authentication_type': ekycAuthenticationType.Face_Auth,
      })
      .first()
  } catch (error) {
    console.log(error)
    return false
  }
}

const getTimeCreateEkyc = async () => {
  return db('kyc_transaction as ekyc')
    .min('access_start as ts_regist')
    .where({
      last_completed_flag: 1,
      delete_flag: flag.FALSE,
    })
    .first()
}

const createSessionAI = async (id, payload) => {
  try {
    await commonCreateTokenAuthority(db('token_authority'), payload)

    const ekyc = await db('kyc_transaction')
      .innerJoin('m_kyc_documents', 'kyc_transaction.user_selected_document_id', 'm_kyc_documents.id')
      .leftJoin('token_authority', function() {
        this.on('token_authority.target_id', 'kyc_transaction.id')
          .andOn('token_authority.action_class', '=', db.raw(`"${tokenAuthorityClass.EKYC_AI}"`))
      })
      .where({ 'kyc_transaction.id': id })
      .select(
        'm_kyc_documents.document_type',
        'kyc_transaction.directory_path',
        'kyc_transaction.aspect_ratio',
        'kyc_transaction.ai_specification',
        'token_authority.activation_key as request_ai_key',
      )
      .first()

    const ekycDocuments = await db('archived_documents as ad')
      .leftJoin('m_kyc_photo_angle as mkpa', 'mkpa.id', 'ad.kyc_photo_angle_id')
      .where({
        'ad.kyc_transaction_id': id,
        'ad.is_preview': 0,
        'ad.original_flag': 1,
      })
      // NOTE: FIX DTO
      .select(
        'ad.file_name',
        'ad.file_url',
        'ad.photo_process',
        'mkpa.key as photo_process_name',
        'ad.is_video',
        'ad.is_preview',
        'ad.ts_regist',
      )

    return {
      ekyc: ekyc,
      ekycDocuments: ekycDocuments,
    }
  } catch (error) {
    console.log(error)
    return false
  }
}

const getEkycByUserId = (userBasicId, table) => {
  return table('users_basic_data')
    .leftJoin('users_personal', 'users_basic_data.id', 'users_personal.user_basic_data_id')
    .leftJoin(commonKycTransaction.as('ekyc'), function() {
      this.on('users_personal.id', '=', 'ekyc.user_personal_id')
        .andOn('users_personal.user_basic_data_id', '=', 'ekyc.user_basic_data_id')
        .andOn('ekyc.last_completed_flag', '=', flag.TRUE)
        .andOn('ekyc.authentication_type', '<>', db.raw(`"${ekycAuthenticationType.Face_Auth}"`))
    })
    .leftJoin('m_kyc_flows as mkf', 'ekyc.kyc_flow_id', 'mkf.id')
    .innerJoin(commonQueryGetStatusHistory(statusClassConstant.DOCUMENT_STATUS), 'gsh.target_id', 'ekyc.id')
    .select(
      'ekyc.id as ekyc_id',
      'users_basic_data.id as users_id',
      'users_personal.id as personal_id',
      'gsh.status_code as status',
      'mkf.flow_name as flow',
      'ekyc.document_type',
    )
    .where('users_basic_data.id', userBasicId)
    .orderBy([{ column: 'users_personal.id', order: 'ASC' }, { column: 'ekyc.authentication_type', order: 'ASC' }])
}

const updateEkycStatus = async (kycTransaction, payload) => {
  // SLEEP RANDOM 0s - 3s
  await sleep(Math.floor(Math.random() * 3001))

  const trx = await db.transaction()
  try {
    const { staff_id, status_code, status_label_number, status_label_message, percent } = payload
    const { kyc_id, kyc_face_id, user_basic_data_id, user_personal_id, site_id } = kycTransaction
    const kycIds = [kyc_id, kyc_face_id].filter((el) => el).map(Number)

    // INSERT EKYC STATUS HISTORY (REQUIRED TO INSERT FINALLY)
    const payloadKycStatusHistory = kycIds.map((kycId) => {
      return {
        target_id: kycId,
        status_code: status_code,
        status_label_message: status_code === statusCode.REJECTED ? status_label_message : null,
        status_label_number: status_code === statusCode.REJECTED ? status_label_number : 0,
        status_class_id: statusClassConstant.DOCUMENT_STATUS,
        action_method: actionMethod.OPERATOR_ACTION,
        updated_by_user_id: staff_id,
      }
    })

    const insertHistory = await commonInsertRollbackStatusHistory(trx, payloadKycStatusHistory, timeExpires.KYC_PROCESS_SESSION)
    if (!insertHistory.status) {
      await trx.rollback()
      return { status: false, message: insertHistory.message }
    }

    if (status_code === statusCode.PROCESSING) {
      // INSERT EKYC EVALUATION
      const ekycEvaluation = await trx('ekyc_evaluation')
        .where({ kyc_transaction_id: kyc_id })
        .first()

      if (!ekycEvaluation) {
        await trx('ekyc_evaluation').insert({
          kyc_transaction_id: kyc_id,
          step_check: kycProcessStep.STEP_ALIGN,
        })
      } else {
        await trx('ekyc_evaluation')
          .update({ step_check: kycProcessStep.STEP_ALIGN })
          .where({ id: ekycEvaluation.id })
      }
    } else if ([statusCode.REJECTED, statusCode.APPROVED, statusCode.CLOSED].includes(status_code)) {
      await trx('ekyc_evaluation')
        .update({ step_check: kycProcessStep.STEP_COMPLETED })
        .where({
          kyc_transaction_id: kyc_id,
          delete_flag: flag.FALSE,
        })

      // UPDATE KYC TRANSACTION
      await trx('kyc_transaction')
        .update({ 'ekyc_level': status_code === statusCode.APPROVED ? percent : 0 })
        .where('id', kyc_id)

      // UPDATE USER KYC LEVEL
      const userEkyc = await trx('kyc_transaction')
        .innerJoin(commonQueryGetStatusHistory(statusClassConstant.DOCUMENT_STATUS), 'gsh.target_id', 'kyc_transaction.id')
        .where({
          'kyc_transaction.user_basic_data_id': user_basic_data_id,
          'gsh.status_code': statusCode.APPROVED,
          'kyc_transaction.completed_flag': flag.TRUE,
          'kyc_transaction.last_completed_flag': flag.TRUE,
          'kyc_transaction.delete_flag': flag.FALSE,
        })
        .select(
          'kyc_transaction.id',
          'kyc_transaction.ekyc_level',
        )

      const newLevel = userEkyc.reduce((sum, el) => sum + el.ekyc_level, 0)

      await trx('users_management_data').update('ekyc_level', newLevel).where('user_basic_data_id', user_basic_data_id)

      if (statusCode.APPROVED === status_code && commonSiteId.FXS_XEM !== Number(site_id)) {
        const payloadPersonalMessage = await createPersonalMessagePayload(user_basic_data_id, user_personal_id, site_id, trx)
        let payloadUserMessage = null
        if (newLevel === 100) {
          payloadUserMessage = {
            user_basic_data_id: user_basic_data_id,
            user_personal_id: null,
            message_id: _renderKycApprovedMessage(site_id),
          }
        }

        await createKycApproveMessage(trx, payloadUserMessage, payloadPersonalMessage)
      }
    }

    await trx.commit()
    return { status: true }
  } catch (error) {
    console.error(error)
    await trx.rollback()
    throw error
  }
}

const getEkycTransaction = async (filter, pagination, isCsv, isDefaultSort = true) => {
  const utc = (filter.utc || '0').replace('(', '').replace('UTC', '').replace(')', '')
  const sort = pagination?.sort[0]

  const queryFilterKycTransaction = db('kyc_transaction as kt')
  // JOIN KYC EVALUATION
    .innerJoin(commonQueryGetStatusHistory(statusClassConstant.DOCUMENT_STATUS), 'gsh.target_id', 'kt.id')
    .leftJoin('ekyc_evaluation', function() {
      this
        .on('ekyc_evaluation.kyc_transaction_id', 'kt.id')
        .on('ekyc_evaluation.delete_flag', flag.FALSE)
    })
  // JOIN KYC TRANSACTION FACE
    .leftJoin('kyc_transaction as kt_face', function() {
      this
        .on('kt.directory_path', 'kt_face.directory_path')
        .on('kt_face.user_selected_document_id', 9)
    })

  // JOIN USER + PERSON + CORPORATE DATA
    .leftJoin('users_basic_data as users', 'kt.user_basic_data_id', 'users.id')
    .leftJoin('users_personal as up', 'kt.user_personal_id', 'up.id')
    .leftJoin('users_corporate as uc', function() {
      this
        .on('kt.user_basic_data_id', 'uc.user_basic_data_id')
        .on('uc.beneficial_owner', flag.FALSE)
    })

  // JOIN ADMIN DATA
    .leftJoin('users_basic_data as admin_change_status', 'gsh.updated_by_user_id', 'admin_change_status.id')

  // JOIN MASTER DATA
    .leftJoin('m_kyc_documents as mkd', 'kt.user_selected_document_id', 'mkd.id')
    .leftJoin('m_kyc_documents as mkd_face', 'kt_face.user_selected_document_id', 'mkd_face.id')
    .leftJoin('m_kyc_flows as mkf', 'kt.kyc_flow_id', 'mkf.id')
    .leftJoin('m_site', 'users.site_id', 'm_site.id')
    .leftJoin('m_status', function() {
      this
        .on('gsh.status_code', 'm_status.status_code')
        .on('m_status.status_label_number', flag.FALSE)
    })
    .leftJoin('m_status as status_label', function() {
      this
        .on('gsh.status_code', 'status_label.status_code')
        .on('gsh.status_label_number', 'status_label.status_label_number')
        .on('status_label.status_label_number', '<>', flag.FALSE)
    })

  // COMMON CONDITION
    .whereNull('kt.user_corporate_id')
    .where('m_site.enable_flag', flag.TRUE)
    .where(function() {
      this.where(function() {
        this
          .where('mkd.authentication_type', db.raw(`"${ekycAuthenticationType.Identification_Auth}"`))
      })
        .orWhereIn('mkd.authentication_type', [db.raw(`"${ekycAuthenticationType.PoA_Auth}"`), db.raw(`"${ekycAuthenticationType.MNC_Auth}"`)])
    })

  // --BEGIN FILTER--
    .where(function() {
      if (filter.site_id) {
        this.whereIn('m_site.id', filter.site_id)
      }

      if (filter.method) {
        this.whereIn('mkd.check_method', filter.method)
      }

      if (filter.flow) {
        this.whereIn('mkf.flow_name', filter.flow)
      }

      if (filter.status) {
        this.whereIn('gsh.status_code', filter.status)
      }

      if (filter.document_type) {
        this.where((function() {
          this.whereIn('mkd.document_type', filter.document_type)
          this.orWhereIn('mkd_face.document_type', filter.document_type)
        }))
      }

      if (filter.access_from && filter.access_to) {
        const access_from = moment(filter.access_from)
          .startOf('day')
          .subtract(utc, 'hours')
          .format(dateFormat.DATE_TIME_ZONE)
          .toString()
        const access_to = moment(filter.access_to)
          .endOf('day')
          .subtract(utc, 'hours')
          .format(dateFormat.DATE_TIME_ZONE)
          .toString()
        this.where(function() {
          this
            .whereBetween('kt.access_start', [access_from, access_to])
            .orWhereBetween('kt_face.access_start', [access_from, access_to])
        })
      }

      if (filter.update_from && filter.update_to) {
        const update_from = moment(filter.update_from)
          .startOf('day')
          .subtract(utc, 'hours')
          .format(dateFormat.DATE_TIME_ZONE)
          .toString()
        const update_to = moment(filter.update_to)
          .endOf('day')
          .subtract(utc, 'hours')
          .format(dateFormat.DATE_TIME_ZONE)
          .toString()
        this.whereBetween('gsh.ts_update', [update_from, update_to])
      }

      if (filter.name) {
        filter.name = utility.escapeSql(filter.name)
        this.where((function() {
          this.where(cmGetUserNameRomaji('personal', 'users', 'up', 'uc'), 'like', `%${filter.name.toUpperCase()}%`)
          this.orWhere(cmGetUserNameRomaji('corporate', 'users', 'up', 'uc'), 'like', `%${filter.name.toUpperCase()}%`)
        }))
      }

      if (filter.email) {
        filter.email = utility.escapeSql(filter.email)
        this.whereILike('users.email', `%${filter.email}%`)
      }

      if (filter.action_method) {
        this.whereIn('gsh.action_method', filter.action_method)
      }

      if (!filter.display_unsubmitted_docs) {
        this.whereNot('gsh.status_code', statusCode.UNSUBMITTED)
      }

      if (filter.keyword) {
        filter.keyword = utility.escapeSql(filter.keyword)
        this.where(function() {
          this.whereILike('mkd.check_method', `%${filter.keyword}%`)
            .orWhereILike('mkd.authentication_type', `%${filter.keyword}%`)
            .orWhereILike('mkd.document_type', `%${filter.keyword}%`)
            .orWhereILike('mkf.flow_name', `%${filter.keyword}%`)
            .orWhereILike('m_status.en_name', `%${filter.keyword}%`)
            .orWhereILike('m_status.ja_name', `%${filter.keyword}%`)
            .orWhereILike('m_status.cn_name', `%${filter.keyword}%`)
            .orWhereILike('m_status.kr_name', `%${filter.keyword}%`)
            .orWhereILike('status_label.ja_name', `%${filter.keyword}%`)
            .orWhereILike('status_label.en_name', `%${filter.keyword}%`)
            .orWhereILike('status_label.cn_name', `%${filter.keyword}%`)
            .orWhereILike('status_label.kr_name', `%${filter.keyword}%`)
            .orWhereILike(db.raw(`DATE_FORMAT(CONVERT_TZ(kt.access_start, '+00:00', '${utc}'), '%Y.%m.%d %H:%i:%s')`), `%${filter.keyword}%`)
            .orWhereILike('kt.id', `%${filter.keyword}%`)
            .orWhereILike(db.raw(`DATE_FORMAT(CONVERT_TZ(kt_face.access_start, '+00:00', '${utc}'), '%Y.%m.%d %H:%i:%s')`), `%${filter.keyword}%`)
            .orWhereILike('kt_face.id', `%${filter.keyword}%`)
            .orWhereILike('mkd_face.authentication_type', `%${filter.keyword}%`)
            .orWhereILike('mkd_face.document_type', `%${filter.keyword}%`)
            .orWhere(cmGetUserNameRomaji('personal', 'users', 'up', 'uc'), 'like', `%${filter.keyword}%`)
            .orWhere(cmGetUserNameRomaji('corporate', 'users', 'up', 'uc'), 'like', `%${filter.keyword}%`)
            .orWhereILike('users.email', `%${filter.keyword}%`)
            .orWhereILike(db.raw(`DATE_FORMAT(CONVERT_TZ(gsh.ts_update, '+00:00', '${utc}'), '%Y.%m.%d %H:%i:%s')`), `%${filter.keyword}%`)
            .orWhere(cmGetActionMethodOrStaff('gsh', 'admin_change_status'), 'like', `%${filter.keyword}%`)
        })
      }
    })

    .where(function() {
      if (filter.ekyc_id) {
        filter.ekyc_id = utility.escapeSql(filter.ekyc_id?.toString())
        this.where((function() {
          this.whereILike('kt.id', `%${filter.ekyc_id}%`)
          this.orWhereILike('kt_face.id', `%${filter.ekyc_id}%`)
        }))
      }
    })

    .where(function() {
      if (filter.authentication_type) {
        this.where((function() {
          this.whereIn('mkd.authentication_type', filter.authentication_type)
          this.orWhereIn('mkd_face.authentication_type', filter.authentication_type)
        }))
      }
    })
    // --END FILTER--

  if (!isCsv) {
    const queryKycTransaction = queryFilterKycTransaction
      .select(
        'users.site_id',
        'users.email',
        'kt.user_basic_data_id as user_id',
        'kt.user_personal_id as personal_id',
        'gsh.status_code as ekyc_status',
        'kt.access_start as access_data',
        'kt.id as id',
        'kt.id as ekyc_id',
        'mkd.check_method',
        'mkd.authentication_type as auth_type',
        'mkd.document_type',
        'mkf.flow_name as flow',
        'mkd.document_symbol as symbol',
        'mkd.ja_document_name',
        'mkd.en_document_name',
        'mkd.cn_document_name',
        'mkd.kr_document_name',
        'mkd.photo_type',
        'gsh.status_label_message as deficiency_reason',
        'm_site.site_name',
        'm_site.media_name',
        'm_site.symbol_logo_path',
        'm_site.symbol_logo_name',
        'm_site.side_logo_path',
        'm_site.side_logo_name',
        'm_site.display_order as site_display_order',

        // GET REASON
        'status_label.ja_name as ja_short_reason',
        'status_label.en_name as en_short_reason',
        'status_label.cn_name as cn_short_reason',
        'status_label.kr_name as kr_short_reason',
        'status_label.frame_color as status_label_frame_color',
        'status_label.paint_color as status_label_paint_color',
        'status_label.text_color as status_label_text_color',
        'gsh.status_label_message as status_label_message',
        'status_label.ja_status_label_detail as ja_status_label_detail',
        'status_label.en_status_label_detail as en_status_label_detail',
        'status_label.cn_status_label_detail as cn_status_label_detail',
        'status_label.kr_status_label_detail as kr_status_label_detail',
        // GET STATUS NAME
        'm_status.en_name as status_en_name',
        'm_status.ja_name as status_ja_name',
        'm_status.cn_name as status_cn_name',
        'm_status.kr_name as status_kr_name',
        'm_status.frame_color as status_frame_color',
        'm_status.paint_color as status_paint_color',
        'm_status.text_color as status_text_color',
        'gsh.ts_update as response_date',
        'kt_face.access_start as access_data_face',
        'kt_face.id as ekyc_id_face',
        'ekyc_evaluation.step_check',
        'mkd_face.authentication_type as auth_type_face',
        'mkd_face.document_type as document_type_face',
        db.raw(`(${cmGetUserNameRomaji(filter.display_name, 'users', 'up', 'uc')}) AS name`),
        db.raw(`(${cmGetActionMethodOrStaff('gsh', 'admin_change_status')}) AS action_method_or_staff`),
        db.raw(`CASE 
          WHEN m_status.status_code = ${statusCode.UNSUBMITTED} 
          OR m_status.status_code = ${statusCode.EXPIRED}
          THEN FALSE
          ELSE TRUE 
          END as active_item`),
      )


    if (isDefaultSort) {
      return await queryKycTransaction
        .orderBy('id', 'desc')
        .orderBy('ekyc_id_face', 'desc')
        .paginate(pagination)
    }
    if (sort.column !== 'check_method') {
      return await queryKycTransaction
        .orderBy([pagination.sort[0], { column: 'id', order: 'DESC' }])
        .orderBy('ekyc_id_face', 'desc')
        .paginate(pagination)
    } else {
      let checkMethods = await db('m_kyc_documents')
        .distinct('check_method')
        .orderBy('id', 'asc')
      checkMethods = checkMethods.map((item) => item.check_method)
      const orderDirection = sort.order === 'asc' ? 'ASC' : 'DESC'
      return await queryKycTransaction
        .orderByRaw(`FIELD(mkd.check_method, ${checkMethods.map((item) => `'${item}'`).join(', ')}) ${orderDirection}`)
        .paginate(pagination)
    }
  } else {
    const queryKycTransactionCSV = queryFilterKycTransaction
      .select(
        'mkf.flow_name as flow',
        'm_site.site_name',
        db.raw(`(${cmGetUserNameRomaji(filter.display_name, 'users', 'up', 'uc')}) AS name`),
        'status_label.ja_name as ja_short_reason',
        'status_label.en_name as en_short_reason',
        'status_label.cn_name as cn_short_reason',
        'status_label.kr_name as kr_short_reason',
        'm_status.en_name as status_en_name',
        'm_status.ja_name as status_ja_name',
        'm_status.cn_name as status_cn_name',
        'm_status.kr_name as status_kr_name',
        db.raw('CASE WHEN kt.access_start IS NULL THEN "-" ELSE kt.access_start END as access_data'),
        db.raw('CASE WHEN mkd.authentication_type IS NULL THEN "-" ELSE mkd.authentication_type END as auth_type'),
        db.raw(`(${cmGetActionMethodOrStaff('gsh', 'admin_change_status')}) AS action_method_or_staff`),
        db.raw('CASE WHEN mkd.document_type IS NULL THEN "-" ELSE mkd.document_type END as document_type'),
        'mkd.check_method',
        db.raw('CASE WHEN kt_face.access_start IS NULL THEN "-" ELSE kt_face.access_start END as  access_data_face'),
        db.raw('CASE WHEN gsh.ts_update IS NULL THEN "-" ELSE gsh.ts_update END as response_date'),
        db.raw('CASE WHEN mkd_face.document_type IS NULL THEN "-" ELSE mkd_face.document_type END as document_type_face'),
        db.raw('CASE WHEN mkd_face.authentication_type IS NULL THEN "-" ELSE mkd_face.authentication_type END as auth_type_face'),
        db.raw('CASE WHEN kt_face.id IS NULL then "-" ELSE kt_face.id END AS ekyc_id_face'),
        'kt.id as ekyc_id',
        'kt.id as id',
        'users.email',
        'm_site.display_order as site_display_order',
        // GET REASON
        db.raw('CASE WHEN status_label.ja_name IS NULL THEN "-" ELSE status_label.ja_name END as short_reason_ja'),
        db.raw('CASE WHEN status_label.en_name IS NULL THEN "-" ELSE status_label.en_name END as short_reason_en'),
        db.raw('CASE WHEN status_label.cn_name IS NULL THEN "-" ELSE status_label.cn_name END as short_reason_cn'),
        db.raw('CASE WHEN status_label.kr_name IS NULL THEN "-" ELSE status_label.kr_name END as short_reason_kr'),
        db.raw('CASE WHEN m_status.en_name IS NULL THEN "-" ELSE m_status.en_name END as status_name_en'),
        db.raw('CASE WHEN m_status.ja_name IS NULL THEN "-" ELSE m_status.ja_name END as status_name_ja'),
        db.raw('CASE WHEN m_status.cn_name IS NULL THEN "-" ELSE m_status.cn_name END as status_name_cn'),
        db.raw('CASE WHEN m_status.kr_name IS NULL THEN "-" ELSE m_status.kr_name END as status_name_kr'),
      )


    if (isDefaultSort) {
      return await queryKycTransactionCSV
        .orderBy('id', 'desc')
        .orderBy('ekyc_id_face', 'desc')
    }
    if (sort.column !== 'check_method') {
      return await queryKycTransactionCSV
        .orderBy([pagination.sort[0], { column: 'id', order: 'DESC' }])
        .orderBy('ekyc_id_face', 'desc')
    } else {
      let checkMethods = await db('m_kyc_documents')
        .distinct('check_method')
        .orderBy('id', 'asc')
      checkMethods = checkMethods.map((item) => item.check_method)
      const orderDirection = sort.order === 'asc' ? 'ASC' : 'DESC'
      return await queryKycTransactionCSV
        .orderByRaw(`FIELD(mkd.check_method, ${checkMethods.map((item) => `'${item}'`).join(', ')}) ${orderDirection}`)
    }
  }
}
const getEkycCheckInfo = async (payload) => {
  try {
    return await db('kyc_transaction as ekyc')
      .leftJoin('m_kyc_documents as mkd', 'ekyc.user_selected_document_id', 'mkd.id')
      .leftJoin('ekyc_evaluation', 'ekyc.id', 'ekyc_evaluation.kyc_transaction_id')
      .where('ekyc.id', payload.id)
      .select(
        'ekyc.id as ekyc_id',
        'ekyc.completed_flag',
        'ekyc.access_ip',
        'ekyc.access_agent',
        'ekyc.access_cookie',
        'ekyc.access_start',
        'ekyc.access_end',
        'mkd.check_method',
        'mkd.authentication_type',
        'mkd.document_type',
        'mkd.document_symbol',
        'ekyc.ai_status',
        'ekyc.ai_message',
        'ekyc.ai_specification',
        'ekyc_evaluation.align',
        'ekyc.last_completed_flag',
      )
      .first()
  } catch (error) {
    console.log(error)
    return false
  }
}

const getKycProcess = async (payload) => {
  return await db('kyc_transaction as kt')
    .leftJoin('m_kyc_documents as mkdu', 'kt.user_selected_document_id', 'mkdu.id')
    .leftJoin('m_kyc_documents as mkdai', 'kt.ai_detected_document_id', 'mkdai.id')
    .leftJoin('ekyc_evaluation as ee', function() {
      this
        .on('ee.kyc_transaction_id', 'kt.id')
        .on('ee.delete_flag', flag.FALSE)
    })
    .leftJoin('users_basic_data', 'kt.user_basic_data_id', 'users_basic_data.id')
    .where('kt.id', payload.id)
    .select(
      'kt.id as ekyc_id',
      'kt.user_personal_id',
      'kt.completed_flag',
      'kt.access_start',
      'kt.access_end',
      'kt.directory_path',
      'users_basic_data.site_id',
      'users_basic_data.id as user_id',

      'kt.user_selected_document_id',
      'mkdu.check_method as user_check_method',
      'mkdu.authentication_type as user_authentication_type',
      'mkdu.document_type as user_document_type',
      'mkdu.document_symbol as user_document_symbol',

      'kt.ai_detected_document_id',
      'mkdai.check_method as ai_check_method',
      'mkdai.authentication_type as ai_authentication_type',
      'mkdai.document_type as ai_document_type',
      'mkdai.document_symbol as ai_document_symbol',

      'ee.id as ekyc_evaluation_id',
      'ee.admin_selected_document_id',
      'ee.align',

      'kt.ai_status',
      'kt.ai_message',
      'kt.ai_specification',

      'kt.confidence_aws_face',
      'kt.confidence_kairos_face',

      'kt.access_ip',
      'kt.access_agent',
      'kt.access_cookie',
      'kt.valid_shape_flag',
      'kt.valid_material_flag',
      'kt.valid_expiry_flag',
      'kt.valid_id_flag',
      'kt.match_blacklist_flag',
      'kt.match_refinitiv_criminal_flag',
      'kt.last_completed_flag',
      'kt.summary_key',
      'kt.enable_summary_url_flag',

      'ee.shape_verified',
      'ee.info_verified',
      'ee.validity_verified',
      'ee.consistency_verified',
      'ee.face_verified',
      'ee.identity_verified',
      'ee.address_verified',
      'ee.internal_verified',
      'ee.third_party_verified',
      'ee.date_of_expiry',
      'ee.date_of_issue',
      'ee.identifier_number',
      'ee.first_name',
      'ee.last_name',
      'ee.date_of_birth',
      'ee.post_code',
      'ee.address',
      'ee.step_check',
    )
    .first()
}

const getKycProcessInfo = (ekyc_id, ekyc_id_face) => {
  return db('kyc_transaction as ekyc')
    .leftJoin('m_kyc_documents as mkd', 'ekyc.user_selected_document_id', 'mkd.id')
    .leftJoin('users_basic_data as ubd', 'ekyc.user_basic_data_id', 'ubd.id')
    .leftJoin('m_site', 'ubd.site_id', 'm_site.id')
    .leftJoin('ekyc_evaluation as ee', 'ee.kyc_transaction_id', 'ekyc.id')
    .leftJoin('users_personal as up', 'ekyc.user_personal_id', 'up.id')
    .leftJoin('m_countries as user_countries', 'ubd.country_id', 'user_countries.id')
    .leftJoin('m_countries as personal_countries', 'up.country_id', 'personal_countries.id')
    .leftJoin('m_countries as nationality_countries', 'up.nationality_id', 'nationality_countries.id')
    .leftJoin('m_prefectures', 'up.state_province', 'm_prefectures.id')
    .leftJoin('kyc_transaction as ekyc_face', 'ekyc_face.id', db.raw(`"${ekyc_id_face}"`))
    .leftJoin('users_management_data as umd', 'umd.user_basic_data_id', 'ubd.id')
    .innerJoin(commonQueryGetStatusHistory(statusClassConstant.DOCUMENT_STATUS), 'ekyc.id', 'gsh.target_id')
    .select(
      'mkd.check_method',
      'ekyc.access_start',
      db.raw('CASE WHEN ekyc_face.access_end IS NULL THEN ekyc.access_end ELSE ekyc_face.access_end END as access_end'),
      'ubd.id as user_id',
      'ubd.member_id',
      'm_site.site_name',
      'm_site.id as site_id',
      'umd.ekyc_level',
      'up.date_of_birth',
      'up.zip_postal_code',
      'gsh.status_code',
      'gsh.status_label_number',

      // PERSONAL NAME
      db.raw(`CONCAT(CASE WHEN up.first_name_romaji IS NULL THEN ubd.first_name_romaji
        ELSE up.first_name_romaji END, " ", CASE WHEN up.last_name_romaji IS NULL THEN ubd.last_name_romaji
        ELSE up.last_name_romaji END) as name_romaji`),
      db.raw(`
      CASE
        WHEN up.first_name_katakana IS NULL OR up.last_name_katakana IS NULL THEN NULL
        ELSE CONCAT(up.first_name_katakana, ' ', up.last_name_katakana)
      END as name_katakana
        `),
      db.raw(`
      case
        WHEN up.first_name_kanji IS NULL OR up.last_name_kanji IS NULL THEN NULL
        ELSE CONCAT(up.first_name_kanji, ' ', up.last_name_kanji)
      END as name_kanji
        `),

      // COUNTRY NAME
      db.raw(`CASE WHEN personal_countries.country_name IS NULL THEN user_countries.country_name
        ELSE personal_countries.country_name END as country_name`),
      db.raw(`CASE WHEN personal_countries.japanese_notation IS NULL THEN user_countries.japanese_notation
        ELSE personal_countries.japanese_notation END as japanese_notation`),
      db.raw(`CASE WHEN personal_countries.english_notation IS NULL THEN user_countries.english_notation
        ELSE personal_countries.english_notation END as english_notation`),
      db.raw(`CASE WHEN personal_countries.korean_notation IS NULL THEN user_countries.korean_notation
        ELSE personal_countries.korean_notation END as korean_notation`),
      db.raw(`CASE WHEN personal_countries.chinese_notation IS NULL THEN user_countries.chinese_notation
        ELSE personal_countries.chinese_notation END as chinese_notation`),

      db.raw(`CASE WHEN up.nationality_id = ${countryId.JAPAN} THEN true
        ELSE false END as japanese_nationality_flag`),
      db.raw(`CASE 
        WHEN up.country_id = ${countryId.JAPAN} THEN true
        WHEN (up.country_id IS NULL AND ubd.country_id = ${countryId.JAPAN}) THEN true
        ELSE false END as japanese_country_flag`),

      // STATE PROVINCE
      'up.state_province',
      'm_prefectures.ja_name as prefectures_ja',
      'm_prefectures.en_name as prefectures_en',
      'm_prefectures.cn_name as prefectures_cn',
      'm_prefectures.kr_name as prefectures_kr',
      'up.city',
      'up.address_line_1',
      'up.address_line_2',
      'ee.step_check',
      // NATIONALITY
      'nationality_countries.english_notation as english_nationality',
      'nationality_countries.japanese_notation as japanese_nationality',
      'nationality_countries.korean_notation as korean_nationality',
      'nationality_countries.chinese_notation as chinese_nationality',
      // GENDER
      'up.gender',
    )
    .where('ekyc.id', ekyc_id)
    .where({
      'm_site.enable_flag': flag.TRUE,
    })
    .first()
}

const getKycStatusHistory = (kycId) => {
  return db.from('kyc_transaction as kt')
    .leftJoin('general_status_history as gsh', function() {
      this
        .on('gsh.target_id', 'kt.id')
        .on('gsh.status_class_id', statusClassConstant.DOCUMENT_STATUS)
    })
    .leftJoin('m_status', function() {
      this
        .on('gsh.status_code', 'm_status.status_code')
        .on('m_status.status_label_number', flag.FALSE)
    })
    .leftJoin('m_status as status_label', function() {
      this
        .on('gsh.status_code', 'status_label.status_code')
        .on('status_label.status_label_number', 'gsh.status_label_number')
        .on('status_label.status_label_number', '<>', 0)
    })
    .leftJoin('users_basic_data as admin', function() {
      this
        .on('gsh.updated_by_user_id', 'admin.id')
        .on('admin.admin_flag', flag.TRUE)
    })
    .where('kt.id', kycId)
    .select(
      // GET STATUS LABEL
      'status_label.ja_name as ja_short_reason',
      'status_label.en_name as en_short_reason',
      'status_label.cn_name as cn_short_reason',
      'status_label.kr_name as kr_short_reason',
      'status_label.frame_color as status_label_frame_color',
      'status_label.paint_color as status_label_paint_color',
      'status_label.text_color as status_label_text_color',
      // GET STATUS NAME
      'gsh.status_code',
      'gsh.status_code as document_status',
      'm_status.en_name as status_en_name',
      'm_status.ja_name as status_ja_name',
      'm_status.cn_name as status_cn_name',
      'm_status.kr_name as status_kr_name',
      'm_status.frame_color as status_frame_color',
      'm_status.paint_color as status_paint_color',
      'm_status.text_color as status_text_color',

      'gsh.updated_by_user_id',
      'gsh.ts_regist as update_status_datetime',
      'gsh.action_method',
      db.raw('CONCAT(LEFT(admin.last_name_romaji,1),".",admin.first_name_romaji) as staff_name'),
    )
    .orderBy('gsh.ts_regist', 'desc')
}

const getKycTransaction = (payload) => {
  return db('kyc_transaction')
    .leftJoin('m_kyc_flows as fl', 'fl.id', 'kyc_transaction.kyc_flow_id')
    .leftJoin('m_kyc_documents as mkd', 'kyc_transaction.user_selected_document_id', 'mkd.id')
    .innerJoin(commonQueryGetStatusHistory(statusClassConstant.DOCUMENT_STATUS), 'gsh.target_id', 'kyc_transaction.id')
    .leftJoin('users_basic_data', 'users_basic_data.id', 'kyc_transaction.user_basic_data_id')
    .select(
      'kyc_transaction.*',
      'mkd.authentication_type',
      'mkd.document_type',
      'mkd.document_symbol',
      'mkd.ja_document_name',
      'mkd.en_document_name',
      'mkd.cn_document_name',
      'mkd.kr_document_name',
      'mkd.photo_type',
      'fl.flow_name',
      'gsh.status_code',
      'fl.flow_name as flow',
      'users_basic_data.site_id',
    ).where(payload).first()
}

const cmGetUserNameRomaji = (displayName, ubdTable = 'users', upTable = 'users_personal', ucTable = 'users_corporate') => {
  return db.raw(`CASE
    WHEN ("${displayName}" = "corporate" AND ${ubdTable}.corporate_flag = 1) THEN ${ucTable}.corporate_name_english
    ELSE (CASE WHEN 
      (${ubdTable}.corporate_flag = 0 OR 
      (${ubdTable}.corporate_flag = 1 AND 
        ${upTable}.transaction_person = 1 AND 
        ${upTable}.representative_person = 0 AND 
        ${upTable}.beneficial_owner = 0))
      THEN CONCAT(${ubdTable}.first_name_romaji, " ", ${ubdTable}.last_name_romaji)
      ELSE CONCAT(${upTable}.first_name_romaji, " ", ${upTable}.last_name_romaji)
    END)
  END`)
}

const cmGetActionMethodOrStaff = (gshTable = 'gsh', ubdTable = 'users') => {
  return db.raw(`
    CASE
      WHEN ${gshTable}.action_method = '${actionMethod.SYSTEM_ACTION}' THEN 'System Action'
      WHEN ${gshTable}.action_method = '${actionMethod.OPERATOR_ACTION}' THEN
        COALESCE(CONCAT(LEFT(${ubdTable}.last_name_romaji, 1), '.', ${ubdTable}.first_name_romaji), 'Operator Action', null)
      ELSE NULL
    END
  `)
}

const resetKycProcess = async (kycTransactionIds, kycTransactionPayload, ekycEvaluationPayload) => {
  try {
    return await db.transaction(async (trx) => {
      // REST KYC TRANSACTION AI
      await trx('kyc_transaction')
        .update(kycTransactionPayload)
        .where('id', kycTransactionIds[0])

      // DELETE EKYC DOCUMENT ANALYSIS
      await trx('ekyc_document_analysis')
        .where('kyc_transaction_id', kycTransactionIds[0])
        .del()

      // REST KYC EVALUATION
      await trx('ekyc_evaluation')
        .update(ekycEvaluationPayload)
        .where('kyc_transaction_id', kycTransactionIds[0])

      // DELETE EKYC DOCUMENT
      await trx('archived_documents')
        .where('original_flag', 0)
        .whereIn('kyc_transaction_id', kycTransactionIds)
        .del()

      return true
    })
  } catch (error) {
    console.error(error)
    return false
  }
}

const createPersonalMessagePayload = async (userId, personalId, siteId, trx) => {
  const relatedPerson = await getRelatePerson(userId)
  // CHECK RELATED PERSONAL
  const relatedPersonIds = relatedPerson.map((el) => el.id)
  if (!relatedPersonIds.includes(Number(personalId))) return false

  const isCompleted = await checkCompleteKycByStatus(userId, personalId, [statusCode.APPROVED], trx)
  if (!isCompleted) return false

  const messageId = _renderKycApprovedMessage(siteId)
  const messageKycApproved = {
    user_basic_data_id: userId,
    user_personal_id: personalId,
    message_id: messageId,
  }

  return messageKycApproved
}

const checkCompleteKycByStatus = async (user_id, personal_id, listStatus, trx = false) => {
  // CHECK IS EXISTED KYC INCOMPLETE
  let personalKycInfo
  if (trx) {
    personalKycInfo = await getEkycByUserId(user_id, trx)
  } else {
    personalKycInfo = await getEkycByUserId(user_id, db)
  }

  if (personal_id) {
    personalKycInfo = personalKycInfo.filter((el) => el.personal_id === Number(personal_id))
  }

  const isNotComplete = personalKycInfo.some((el) => !listStatus.includes(el.status))

  if (isNotComplete || !personalKycInfo.length) {
    return false
  }

  // CHECK THE NUMBER OF USER OR PERSONAL SUBMITTED KYC DOCUMENT
  // AND THE NUMBER OF SYSTEM REQUIRED SUBMITTED KYC DOCUMENT

  const getGroupPersonEkyc = personalKycInfo.reduce((result, ekyc) => {
    const isIdentifyCFlowC = ekyc.flow === ekycFlow.FLOW_C && ekyc.document_type === ekycDocumentType.Identification_C
    const isFlowDE = ekyc.flow === ekycFlow.FLOW_D || ekyc.flow === ekycFlow.FLOW_E

    const personData = {
      personal_id: ekyc.personal_id,
      required_ekyc: isIdentifyCFlowC || isFlowDE ? 1 : 2,
      submitted_valid_ekyc: listStatus.includes(ekyc.status) ? 1 : 0,
    }

    const existPerson = result.find((el) => el.personal_id === ekyc.personal_id)
    if (!existPerson) {
      result.push(personData)
    } else {
      if (ekyc.ekyc_id) {
        existPerson.submitted_valid_ekyc = listStatus.includes(ekyc.status) ?
          existPerson.submitted_valid_ekyc + 1 :
          existPerson.submitted_valid_ekyc
      }
    }
    return result
  }, [])

  const totalValidEkyc = getGroupPersonEkyc.reduce((sum, el) => sum + el.submitted_valid_ekyc, 0)
  const totalRequiredEkyc = getGroupPersonEkyc.reduce((sum, el) => sum + el.required_ekyc, 0)
  const isCompleted = totalValidEkyc === totalRequiredEkyc ? true : false

  return isCompleted
}

const _renderKycApprovedMessage = (site_id) => {
  switch (site_id) {
    case commonSiteId.FXT:
      return messageId.FXT.EKYC_APPROVED
    case commonSiteId.MY_FOREX:
      return messageId.MY_FOREX.EKYC_APPROVED
    case commonSiteId.ICPAY:
      return messageId.ICPAY.EKYC_APPROVED
    default:
      return null
  }
}

const getKycConfirmed = (userId) => {
  return db('kyc_transaction as kt')
    .leftJoin(commonKycTransaction.as('kycTransactionFace'), function() {
      this
        .on('kt.directory_path', 'kycTransactionFace.directory_path')
        .on('kycTransactionFace.authentication_type', db.raw(`"${ekycAuthenticationType.Face_Auth}"`))
    })
    .innerJoin('ekyc_evaluation', 'ekyc_evaluation.kyc_transaction_id', 'kt.id')
    .leftJoin('m_kyc_documents as mkd', 'kt.user_selected_document_id', 'mkd.id')
    .innerJoin(commonQueryGetStatusHistory(statusClassConstant.DOCUMENT_STATUS), 'gsh.target_id', 'kt.id')
    .leftJoin('users_basic_data as admin', 'admin.id', 'gsh.updated_by_user_id')
    .leftJoin('m_status', function() {
      this.on('m_status.status_code', 'gsh.status_code')
        .on('m_status.status_label_number', flag.FALSE)
    })
    .leftJoin('m_status as status_label', function() {
      this
        .on('gsh.status_code', 'status_label.status_code')
        .on('gsh.status_label_number', 'status_label.status_label_number')
        .on('status_label.status_label_number', '<>', flag.FALSE)
    })
    .where({
      'kt.user_basic_data_id': userId,
      'kt.completed_flag': flag.TRUE,
    })
    .whereNull('kt.user_corporate_id')
    .whereIn('gsh.status_code', [statusCode.APPROVED, statusCode.REJECTED, statusCode.CLOSED])
    .where(function() {
      this.where(function() {
        this
          .where('mkd.authentication_type', db.raw(`"${ekycAuthenticationType.Identification_Auth}"`))
          .where('kycTransactionFace.completed_flag', 1)
      })
        .orWhereIn('mkd.authentication_type', [db.raw(`"${ekycAuthenticationType.PoA_Auth}"`), db.raw(`"${ekycAuthenticationType.MNC_Auth}"`)])
    })
    .select(
      'kt.id as kyc_id',
      'kycTransactionFace.id as kyc_id_face',
      'kt.user_basic_data_id as user_id',
      'kt.user_personal_id as personal_id',
      'kt.access_start',
      db.raw('CASE WHEN kycTransactionFace.access_end IS NULL THEN kt.access_end ELSE kycTransactionFace.access_end END as access_end'),
      'kt.user_personal_id as personal_id',
      'mkd.authentication_type',
      'mkd.document_type',
      'mkd.check_method',
      'm_status.status_code',
      'm_status.en_name as en_status_name',
      'm_status.ja_name as ja_status_name',
      'm_status.cn_name as cn_status_name',
      'm_status.kr_name as kr_status_name',
      // GET STATUS LABEL
      'status_label.ja_name as ja_status_label_name',
      'status_label.en_name as en_status_label_name',
      'status_label.cn_name as cn_status_label_name',
      'status_label.kr_name as kr_status_label_name',
      'status_label.frame_color as status_label_frame_color',
      'status_label.paint_color as status_label_paint_color',
      'status_label.text_color as status_label_text_color',
      'gsh.status_label_message',
      'm_status.frame_color',
      'm_status.paint_color',
      'm_status.text_color',
      'gsh.ts_update',
      'kt.completed_flag',
      'kt.last_completed_flag',
      db.raw('CONCAT(LEFT(admin.last_name_romaji,1),".",admin.first_name_romaji) as staff_name'),
    )
    .orderBy('gsh.ts_update', 'DESC')
}

const getSummaryKey = async (payload) => {
  return db('kyc_transaction as ekyc')
    .select(
      'ekyc.id',
      'summary_key',
      'enable_summary_url_flag',
      'users_basic_data.site_id',
      'users_basic_data.id as user_id',
    )
    .leftJoin('users_basic_data', 'ekyc.user_basic_data_id', 'users_basic_data.id')
    .where(payload)
    .where('ekyc.delete_flag', flag.FALSE)
    .first()
}

const getEKyc = async (payload) => {
  return db('kyc_transaction as ekyc')
    .leftJoin(commonKycTransaction.as('kycTransactionFace'), function() {
      this
        .on('ekyc.directory_path', 'kycTransactionFace.directory_path')
        .on('kycTransactionFace.authentication_type', db.raw(`"${ekycAuthenticationType.Face_Auth}"`))
    })
    .leftJoin('m_kyc_documents as mkd', 'ekyc.user_selected_document_id', 'mkd.id')
    .where(function() {
      this.where(function() {
        this
          .where('mkd.authentication_type', db.raw(`"${ekycAuthenticationType.Identification_Auth}"`))
          .where('kycTransactionFace.completed_flag', 1)
      })
        .orWhereIn('mkd.authentication_type', [db.raw(`"${ekycAuthenticationType.PoA_Auth}"`), db.raw(`"${ekycAuthenticationType.MNC_Auth}"`)])
    })
    .where(payload)
    .where('ekyc.delete_flag', flag.FALSE)
    .select(
      'ekyc.id as ekyc_id',
      'ekyc.user_basic_data_id as user_basic_data_id',
      'ekyc.user_personal_id as user_personal_id',
      'kycTransactionFace.id as ekyc_id_face',
    )
    .first()
}

const getUserInfoByEkycId = async (ekyc_id) =>{
  return db('kyc_transaction as ekyc')
    .leftJoin('users_basic_data', 'ekyc.user_basic_data_id', 'users_basic_data.id')
    .where('ekyc.id', ekyc_id)
    .where('ekyc.delete_flag', flag.FALSE)
    .where('users_basic_data.delete_flag', flag.FALSE)
    .select(
      'users_basic_data.id as user_id',
    )
    .first()
}

module.exports = {
  getLastTimeEkyc,
  getListEkyc,
  getEkycFace,
  getTimeCreateEkyc,
  createSessionAI,
  updateEkyc,
  getEkycByUserId,
  updateEkycStatus,
  getEkycTransaction,
  getEkycCheckInfo,
  getKycProcessInfo,
  getKycProcess,
  getKycStatusHistory,
  getKycTransaction,
  resetKycProcess,
  checkCompleteKycByStatus,
  getKycConfirmed,
  getSummaryKey,
  getEKyc,
  getUserInfoByEkycId,
}
