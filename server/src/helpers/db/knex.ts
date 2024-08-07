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
      port: 5433,
      ssl: {
        rejectUnauthorized: false,
      },
    },
  },
  production: {
    client: "pg",
    connection: {
      host: process.env.RDS_AWS_ENDPOINT,
      user: process.env.RDS_AWS_USERNAME,
      password: process.env.RDS_AWS_PASSWORD,
      database: process.env.RDS_AWS_DB_NAME,
      port: Number(process.env.RDS_AWS_PORT),
      ssl: {
        rejectUnauthorized: false,
      },
    },
  },
};

export default knexConfig;
