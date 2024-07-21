import { code, message, redisPath } from "@/constants/consts";
import redis from "@/helpers/redis";
import { users_profile_repository } from "@/repositories";
import { createRedisKey, createResponse, getErrorMsg, getUserIdByToken } from "@/utilities";
import { Request, Response } from "express";
import _ from "lodash";

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const user_id = getUserIdByToken(req);
    const redisKey = createRedisKey(redisPath.users_profile.user, user_id);
    const getRedisCache = await redis.getCache(redisKey);

    // GET DATA FROM REDIS
    if (!_.isNil(getRedisCache) && !_.isEmpty(getRedisCache)) {
      return createResponse(res, true, getRedisCache);
    }

    // GET DATA FROM DB
    const userData = await users_profile_repository.getUserProfile(user_id);
    if (!userData) {
      return createResponse(res, false, null, code.ERROR, message.system_error);
    }

    // SAVE DATA TO REDIS
    const setRedisCache = await redis.setCache(redisKey, userData, Number(process.env.REDIS_DEFAULT_TTL));

    return createResponse(res, true, userData);
  } catch (error) {
    const { responseCode, responseMessage } = getErrorMsg(error as Error);
    return createResponse(res, false, null, responseCode, responseMessage);
  }
};
