import { MCountriesRepo } from "@/constants/schema";
import dotenv from "dotenv";
import fs from "fs";
import knex, { Knex } from "knex";
import argv from "minimist";
import readLine from "readline";
dotenv.config()
;
const knexConfig: Knex.Config = {
  client: "pg",
  connection: {
    host: "localhost",
    user: "postgres",
    password: String(process.env.DB_LOCAL_PASSWORD),
    database: "personal_blog",
    port: 5432,
  },
};

const db = knex(knexConfig);
const testDBConnection = async () => {
  try {
    await db.raw("SELECT 1");
    console.log(`⚡️[server]: Database is connected `);
  } catch (error) {
    console.log("⚡️[server]: PostgreSQL not connected");
    console.error(error);
  }
};

const bulkInsert = async () => {
  try {
    const args = argv(process.argv.slice(2));
    const file: string = args["f"] || args["file"];
    const table: string = args["t"] || args["table"];
    const columns = args._;
    if (!file || !table || !columns) {
      console.log("bun run insert:bulkInsert [-f|--file] ${file_path} [-t|--table] ${table} column1 column2 .... ");
      return;
    }

    await testDBConnection();
    const fileStream = fs.createReadStream(file);
    const rl = readLine.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    const payload = [];
    for await (const line of rl) {
      const data = line.trim().split(",");
      const dummyObj: { [key: string]: any } = {};
      columns.forEach((col) => {
        dummyObj[`${col}`] = data[columns.findIndex((el) => el === col)];
      });
      console.log({
        ...dummyObj,
      });
      payload.push({
        ...dummyObj,
      });
      await db<MCountriesRepo>(table).insert({
        ...dummyObj,
      });
    }
    console.log("⚡️[server]: Finished");
    return process.exit();
  } catch (error) {
    if ((error as Error).message.includes("ENOENT")) {
      console.log('file path must use "\\ instead of "\"');
    }

    return process.exit();
  }
};

bulkInsert();
