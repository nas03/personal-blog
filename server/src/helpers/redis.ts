import { ErrorLog } from "@/constants/common";
import { code, message } from "@/constants/consts";
import { createClient, RedisClientType } from "redis";

// Create a new Redis client
const redisClient: RedisClientType = createClient();

const redisStart = async () => {
  await redisClient.connect();
  redisClient.on("connect", () => {
    console.log("Connected to Redis");
  });
  redisClient.on("error", async (err) => {
    console.error("Error connecting to Redis:", err);
  });
};

// ! TODO: Fix Error
const setCache = async <T>(key: string, values: string, exp?: number): Promise<boolean> => {
  try {
    const 
    if (exp) {
      await redisClient.setEx(setKey, exp, setValues);
    } else {
      await redisClient.set(setKey, setValues);
    }

    return true;
  } catch (error) {
    throw new ErrorLog(code.ERROR, message.redis_error);
  }
};

const getCache = async (key: string) => {
  try {
    const data = await redisClient.get(key);
    if (!data) return null;
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
