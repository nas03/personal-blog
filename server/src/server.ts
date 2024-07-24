/* Library */
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";

/* Router */
import { route } from "@/app";
/* Services */
import redis from "@/helpers/redis";
import { printRoute } from "@/tools/log_routes";
import { testDBConnection } from "./helpers/db/db";
/* Config library */
dotenv.config();

/* Settings */
const PORT = process.env.PORT || 5500;
const HOST = process.env.HOST || "::";
/* Config server */
const server = express();
// Enable Cross-Origin Resource Sharing (CORS)
server.use(cors());

// Parse URL-encoded request bodies (form submissions)
server.use(bodyParser.urlencoded({ extended: true }));

// Parse JSON request bodies
server.use(bodyParser.json());

// Parse and manage cookies
server.use(cookieParser());

// Logging HTTP Request
server.use(morgan("dev"));

server.use("/api/v1", route);

const startup = async () => {
  server.listen(Number(PORT), HOST, () => {
    console.log(`⚡️[server]: Started at port ${PORT}`);
  });
  await Promise.all([await redis.redisStart(), await testDBConnection()]);
  if (["development", "local"].includes(String(process.env.NODE_ENV))) {
    server._router.stack.forEach(printRoute.bind(null, []));
  }
};

startup();
