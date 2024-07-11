const axios = require('axios')
const { jobNames, slackEnv } = require('constant')

const sendMessageBatchLogAlert = async (obj) => {
  try {
    const text = _getBatchLogEmailContent(obj)
    for (const slackWebHookUrl of obj.slackWebHookUrls) {
      await axios.post(slackWebHookUrl, {
        text,
      })
    }

    return true
  } catch (error) {
    console.error(obj.batch_type ? `---Error send slack batch_type = ${obj.batch_type} - Error: ${error}` : error)
    return false
  }
}

const _getBatchLogEmailContent = (obj) => {
  const resultDetail = obj.result_detail ? JSON.parse(obj.result_detail) : {}
  const content = `<!channel>
*【${slackEnv[process.env.NODE_ENV]}】バッチアラート${jobNames[obj.batch_type]}*

システムのバッチ処理において、連続して三回失敗が発生いたしましたので、お知らせいたします。

＊＊対象バッチ＊＊
  ・JOB TYPE: ${obj.batch_type}
  ・JOB名: ${obj.jobName}

＊＊初回失敗エラー＊＊ 
  ・初回失敗日時: "${obj.batch_error_time}"

＊＊連続失敗回数＊＊
  ・連続失敗回数: ${obj.batch_error_count}

＊＊最終失敗のエラー概要＊＊
  ・バッチログID：${obj.id}
  ・処理結果詳細ID：${obj.result_detail_id}
  ・処理結果メッセージ: ${obj.result_message}

＊＊最終失敗の処理結果詳細＊＊ 
  ${JSON.stringify(resultDetail, null, 2)}
`

  return content
}

module.exports = {
  sendMessageBatchLogAlert,
}
