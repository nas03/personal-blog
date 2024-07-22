import { authorization, code, message, redisPath } from "@/constants/consts";
import redis from "@/helpers/redis";
import { categories_repository, users_basic_data_repository } from "@/repositories";
import { createRedisKey, createResponse, getErrorMsg, getUserIdByToken } from "@/utilities";
import { Request, Response } from "express";
import _ from "lodash";

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const user_id = getUserIdByToken(req);
    const userData = await users_basic_data_repository.getUserData({ user_id: user_id });

    // CHECK USER PERMISSION
    if (!userData || userData.authorization_id !== authorization.SYSTEM_ADMINISTRATOR) {
      return createResponse(res, false, null, code.FORBIDDEN, message.user_forbidden);
    }

    const redisKey = createRedisKey(redisPath.categories.category);
    // GET REDIS CACHE
    const getRedisCache = await redis.getCache(redisKey);
    if (getRedisCache && !_.isEmpty(getRedisCache)) {
      return createResponse(res, true, getRedisCache);
    }

    const categories = await categories_repository.getAllCategories();
    if (!categories) {
      return createResponse(res, false, null, code.ERROR, message.system_error);
    }

    // SET REDIS CACHE
    const setRedisCache = await redis.setCache(redisKey, categories);
    return createResponse(res, true, categories)

  } catch (error) {
    const { responseCode, responseMessage } = getErrorMsg(error as Error);
    return createResponse(res, false, null, responseCode, responseMessage);
  }
};
