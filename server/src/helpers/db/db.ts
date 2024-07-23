import dotenv from "dotenv";
import knex from "knex";
import { attachPaginate } from "knex-paginate";
import knexConfig from "./knex";
dotenv.config();

attachPaginate();
attachSoftDelete();


function attachSoftDelete() {
  function softDelete(this: any, currentUserId: any) {
    const postProcessResponse =
      typeof this.config.postProcessResponse === 'function' ?
        this.client.config.postProcessResponse :
        function(key: any) {
          return key
        }
    this.update({
      'delete_flag': true,
    })
    return this.client.transaction(async (trx: any) => {
      const result = await this.transacting(trx)
      const delResult = postProcessResponse({
        ...result,
      })
      return { data: result, delResult }
    })
  }

  knex.QueryBuilder.extend('softDelete', softDelete)
};


const environment = process.env.NODE_ENV || "development";
const db = knex(knexConfig[environment]);
db.fn.now();

export const now = () => db.fn.now();

export default db;
