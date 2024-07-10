import { PostgreSQLSettings } from "aws-sdk/clients/dms";
import { Knex } from "knex";

import dotenv from "dotenv";
dotenv.config();
const knexConfig: { [key: string]: Knex.Config } = {
  development: {
    client: "pg",
    connection: {
      host: String(process.env.DB_HOST),
      user: String(process.env.DB_USER),
      password: String(process.env.DB_PASSWORD),
      database: String(process.env.DB_NAME),
      port: Number(process.env.DB_PORT),
      debug: true,
    },
    searchPath: "public",
    pool: {
      min: 0,
      max: 10,
    },
  },
  production: {
    client: "pg",
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT),
    },
  },
};

export default knexConfig;
