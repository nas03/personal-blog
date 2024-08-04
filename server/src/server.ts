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
import { awsStartUp } from "@/helpers/aws";
import redis from "@/helpers/redis";
import { printRoute } from "@/tools/debug/log_routes";
/* Config library */
dotenv.config();

/* Settings */
const PORT = process.env.PORT || 5500;
const HOST = process.env.HOST || "::";
/* Config server */
const server = express();
// Enable Cross-Origin Resource Sharing (CORS)
server.use(
  cors({
    origin: "http://localhost:5173", // Client origin
    credentials: true, // Allow credentials (cookies) to be sent
  })
);
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
  // STARTUP SERVER
  server.listen(Number(PORT), () => {
    console.log(`⚡️[server]: Started at port ${PORT}`);
  });

  // VERIFY CONNECTIONS
  await Promise.all([redis.redisStart(), awsStartUp()]);
  if (["development", "local"].includes(String(process.env.NODE_ENV))) {
    server._router.stack.forEach(printRoute.bind(null, []));
  }
};

startup();
