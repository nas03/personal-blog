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
import { printRoute } from "@/helpers/logRoutes";
import redis from "@/helpers/redis";
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
  server.listen(PORT, () => {
    console.log(`⚡️[server]: Started at port ${PORT}`);
  });
  await redis.redisStart();
  console.log();
  if (process.env.DEBUG_ROUTE == "true") {
    server._router.stack.forEach(printRoute.bind(null, []));
  }
};

startup();
