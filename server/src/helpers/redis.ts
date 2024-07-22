import { ErrorLog } from "@/constants/common";
import { code, message } from "@/constants/consts";
import { isJSON } from "@/utilities";
import { createClient } from "redis";
// Create a new Redis client
const redisClient = createClient(
  process.env.NODE_ENV === "development"
    ? {
        password: process.env.REDIS_CLOUD_PASSWORD,
        socket: {
          host: process.env.REDIS_CLOUD_HOST,
          port: Number(process.env.REDIS_CLOUD_PORT),
        },
      }
    : {}
);

redisClient.on("connect", () => {
  console.log("⚡️[server]: Connected to Redis");
});
redisClient.on("error", async (err) => {
  console.error("⚡️[server]: Error connecting to Redis:", err);
});

const redisStart = async () => {
  await redisClient.connect();
};

const createObjectIndex = async <T>(data: T) => {
  // TODO
};

const setCache = async <T>(key: string, values: T | T[], exp = Number(process.env.REDIS_DEFAULT_TTL)): Promise<boolean> => {
  try {
    let setValues = null;

    switch (typeof values) {
      case "object":
        await redisClient.set(key, JSON.stringify(values));
        break;
      default:
        await redisClient.set(key, String(values));
    }
    redisClient.expire(key, exp);
    return true;
  } catch (error) {
    throw new ErrorLog(code.ERROR, message.redis_error);
  }
};

const getCache = async (key: string): Promise<object | string | null> => {
  try {
    const data = await redisClient.get(key);
    if (!data) return null;
    if (isJSON(data)) {
      return JSON.parse(data);
    }
    return data;
  } catch (error) {
    console.log(error);
    throw new ErrorLog(code.ERROR, message.redis_error);
  }
};

const deleteCache = async (key: string) => {
  try {
    const delData = await redisClient.del(key);
    if (!delData) return false;
    return true;
  } catch (error) {
    console.log(error);
    throw new ErrorLog(code.ERROR, message.redis_error);
  }
};

const updateCache = async <T>(key: object | string, values: object | string | T[]) => {
  try {
    const updateKey = JSON.stringify(key);
    const updateValues = JSON.stringify(values);
    const updateData = await redisClient.set(updateKey, updateValues, { KEEPTTL: true });
    if (updateData !== "OK") return false;
    return true;
  } catch (error) {
    console.log(error);
    throw new ErrorLog(code.ERROR, message.redis_error);
  }
};

const redis = { redisStart, deleteCache, getCache, setCache, updateCache };
export default redis;
