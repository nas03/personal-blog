import { Knex } from "knex";

import dotenv from "dotenv";
dotenv.config();
const platform = String(process.env.DEV_PLATFORM) || "macOS";
const knexConfig: { [key: string]: Knex.Config } = {
  local: {
    client: "pg",
    connection: {
      host: "localhost",
      user: process.env.LOCAL_DB_USERNAME,
      password: process.env.LOCAL_DB_PASSWORD,
      database: process.env.LOCAL_DB_NAME,
      port: 5432,
      ssl: {
        requestCert: false,
        rejectUnauthorized: false,
      },
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
