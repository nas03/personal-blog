import { authorization, code, message, redisPath } from "@/constants/consts";
import redis from "@/helpers/redis";
import { users_basic_data_repository } from "@/repositories";
import { createRedisKey, createResponse, getErrorMsg, getUserIdByToken } from "@/utilities";
import { Request, Response } from "express";

export const getAllUser = async (req: Request, res: Response) => {
  try {
    const admin_id = getUserIdByToken(req);

    const adminData = await users_basic_data_repository.getUserData({ user_id: admin_id });
    if (!adminData || adminData.authorization_id !== authorization.SYSTEM_ADMINISTRATOR) {
      return createResponse(res, false, null, code.FORBIDDEN, message.user_forbidden);
    }

    const redisKey = createRedisKey(redisPath.users_basic_data.user);
    // GET DATA FROM REDIS
    const getRedisCache = await redis.getCache(redisKey);
    if (getRedisCache) {
      return createResponse(res, true, getRedisCache);
    }

    // GET DATA FROM DB
    const responseAllUserData = await users_basic_data_repository.findAll();

    // SAVE DATA TO REDIS
    const setRedisCache = await redis.setCache(redisKey, responseAllUserData);
    return createResponse(res, true, { ...responseAllUserData });
  } catch (error) {
    console.log(error);
    const { responseCode, responseMessage } = getErrorMsg(error as Error);
    return createResponse(res, false, null, responseCode, responseMessage);
  }
};
