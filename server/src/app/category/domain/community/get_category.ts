import { code, message, redisPath, zodError } from "@/constants/consts";
import { CategorySchema } from "@/constants/types";
import redis from "@/helpers/redis";
import { categories_repository } from "@/repositories";
import { createRedisKey, createResponse, getErrorMsg, zodValidate } from "@/utilities";
import { Request, response, Response } from "express";
import _ from "lodash";
import { z } from "zod";

export const getCategoryInfo = async (req: Request, res: Response) => {
  try {
    const validate = zodValidate(
      req.query,
      CategorySchema.partial().omit({
        ts_created: true,
        ts_updated: true,
        description: true,
      }),
    );

    const title = validate.title;
    const category_id = validate.category_id;

    let responsePayload = {};

    if (!_.isNil(title)) {
      const redisKey = createRedisKey(redisPath.categories.title, title);
      // GET DATA FROM REDIS CACHE
      const getRedisCache = await redis.getCache(redisKey);
      if (getRedisCache) return createResponse(res, true, getRedisCache);

      // GET DATA FROM DB
      const category = await categories_repository.getCategoryByTitle(title);

      if (!category) {
        return createResponse(res, false, null, code.NOT_FOUND, message.data_not_exists);
      }

      // SAVE DATA TO REDIS CACHE
      const setRedisCache = await redis.setCache(redisKey, category);
      responsePayload = category;
    } else if (!_.isNil(category_id)) {
      const redisKey = createRedisKey(redisPath.categories.category, category_id);
      // GET DATA FROM REDIS CACHE
      const getRedisCache = await redis.getCache(redisKey);
      if (getRedisCache) return createResponse(res, true, getRedisCache);

      // GET DATA FROM DB
      const category = await categories_repository.getCategoryById(category_id);

      if (!category) {
        return createResponse(res, false, null, code.NOT_FOUND, message.data_not_exists);
      }

      // SAVE DATA TO REDIS CACHE
      const setRedisCache = await redis.setCache(redisKey, category);
      responsePayload = category;
    }

    return createResponse(res, true, responsePayload);
  } catch (error) {
    const { responseCode, responseMessage } = getErrorMsg(error as Error);
    return createResponse(res, false, null, responseCode, responseMessage);
  }
};
