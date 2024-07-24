// @ts-nocheck
import dotenv from "dotenv";
import knex from "knex";

import { flag } from "@/constants/consts";
import { attachPaginate } from "knex-paginate";
import knexConfig from "./knex";
dotenv.config();

attachPaginate();

function attachSoftDelete() {
  knex.QueryBuilder.extend("softDelete", function (): any {
    const postProcessResponse =
      typeof this.client.config.postProcessResponse === "function"
        ? this.client.config.postProcessResponse
        : function (key) {
            return key;
          };

    this.update({ delete_flag: flag.TRUE });

    return this.client.transaction(async (trx) => {
      const result = await this.transacting(trx);
      const delResult = postProcessResponse({
        ...result,
      });
      return { data: result, delResult };
    });
  });
}

attachSoftDelete();

declare module "knex" {
  namespace Knex {
    interface QueryBuilder<TRecord extends {} = any, TResult = any> {
      softDelete(): Knex.QueryBuilder<TRecord, TResult>;
    }
  }
}

export function attachSoftDelete(): void;

const environment = process.env.NODE_ENV || "development";
const config = knexConfig[environment];
const db = knex(config);
export const testDBConnection = async () => {
  try {
    await db.raw("SELECT 1");
    console.log(`⚡️[server]: Database is connected at ${config.connection.host}:${config.connection.port}:${config.connection.database}`);
  } catch (error) {
    console.log("⚡️[server]: PostgreSQL not connected");
    console.error(error);
  }
};
export default db;
