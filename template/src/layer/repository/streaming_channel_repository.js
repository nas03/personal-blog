const db = require('db').helper

const getListStreaming = async (sort) => {
  return await db('m_channels')
    .leftJoin('streaming', 'm_channels.id', 'streaming.channel_id')
    .leftJoin('users_basic_data', 'users_basic_data.id', 'streaming.user_basic_data_id')
    .leftJoin('m_countries as mc', 'users_basic_data.country_id', 'mc.id')
    .leftJoin('kyc_transaction', 'kyc_transaction.id', 'streaming.kyc_transaction_id')
    .select(
      'm_channels.id as channel_id',
      'm_channels.url_playback',

      'users_basic_data.site_id',
      'users_basic_data.corporate_flag as reg_category',
      'users_basic_data.first_name_romaji',
      'users_basic_data.last_name_romaji',
      'users_basic_data.country_id',

      'mc.file_name',
      'mc.japanese_notation',
      'mc.english_notation',
      'mc.korean_notation',
      'mc.chinese_notation',

      'streaming.id as streaming_id',
      'streaming.user_basic_data_id as user_id',
      'streaming.user_personal_id as personal_id',
      'streaming.kyc_transaction_id as ekyc_id',
      'streaming.status',
      'streaming.url_playback_active',
      'streaming.document_live_streaming',
      'streaming.access_ip',
      'streaming.ts_update',
      'streaming.ts_live_stream',
      'kyc_transaction.access_start',
      'kyc_transaction.access_end',
    )
    .orderBy([
      sort === 'newest' ?
        { column: 'streaming.id', order: 'desc' } :
        { column: 'm_channels.id', order: 'asc' },
    ])
}

const getStreamingInfo = async (payload) => {
  return await db('streaming')
    .leftJoin('kyc_transaction', 'kyc_transaction.id', 'streaming.kyc_transaction_id')
    .where(payload)
    .where('streaming.delete_flag', 0)

    .select(
      'streaming.id',
      'streaming.channel_id',
      'streaming.kyc_transaction_id',
      'kyc_transaction.directory_path',
    )
    .orderBy('streaming.id', 'desc')
    .first()
}

module.exports = {
  getListStreaming,
  getStreamingInfo,
}
