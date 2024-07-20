import { code, message } from "@/constants/consts";
import redis from "@/helpers/redis";
import { users_profile_repository } from "@/repositories";
import { createResponse, getErrorMsg, getUserIdByToken } from "@/utilities";
import { Request, Response } from "express";
import _ from "lodash";

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const user_id = getUserIdByToken(req);
    const redisKey = `users_profile:${user_id}`;
    const responseRedisCache = await redis.getCache(redisKey);

    if (!_.isNil(responseRedisCache) && !_.isEmpty(responseRedisCache)) {
      return createResponse(res, true, { ...responseRedisCache });
    }
    const userData = await users_profile_repository.getUserProfile(user_id);
    if (!userData) {
      return createResponse(res, false, null, code.ERROR, message.system_error);
    }
    const setRedisCache = await redis.setCache(redisKey, { ...userData }, Number(process.env.REDIS_DEFAULT_TTL));

    return createResponse(res, true, { ...userData });
  } catch (error) {
    const { responseCode, responseMessage } = getErrorMsg(error as Error);

    return createResponse(res, false, null, responseCode, responseMessage);
  }
};
