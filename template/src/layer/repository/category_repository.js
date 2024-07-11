/* library */
const db = require('db').helper

/* constant */
const { flag, dataStatus } = require('constant')

async function findAll() {
  try {
    const categories = await db('m_category')
      .where({
        delete_flag: flag.FALSE,
      })
      .select(
        'id',
        'ja_category_name',
        'en_category_name',
        'cn_category_name',
        'kr_category_name',
        'delete_flag',
        'ts_regist',
        'ts_update',
      ).asCallback(function(err, rows) {
        if (err) {
          console.log(err)
        }
      })

    return {
      status: dataStatus.COMPLETE,
      data: categories,
    }
  } catch (error) {
    return {
      status: dataStatus.FAIL,
      errorMessage: error.message,
    }
  }
}

module.exports = {
  findAll,
}
