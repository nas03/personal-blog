/* eslint-disable no-invalid-this */
/* eslint-disable require-jsdoc */
const knex = require('knex')
const config = require('./knexfile.js')
const { attachPaginate } = require('knex-paginate')
attachPaginate()
attachSoftDelete()

function attachSoftDelete() {
  function softDelete(currentUserId) {
    const postProcessResponse =
      typeof this.client.config.postProcessResponse === 'function' ?
        this.client.config.postProcessResponse :
        function(key) {
          return key
        }
    this.update({
      'delete_flag': true,
    })
    return this.client.transaction(async (trx) => {
      const result = await this.transacting(trx)
      const delResult = postProcessResponse({
        ...result,
      })
      return { data: result, delResult }
    })
  }

  knex.QueryBuilder.extend('softDelete', softDelete)
};


const dbMaster = knex(config.db_master)
const dbReader = knex(config.db_reader)

module.exports.dbMaster = dbMaster
module.exports.dbReader = dbReader

module.exports.now = () => dbMaster.fn.now()
