import { code, message, redisPath, zodError } from "@/constants/consts";
import redis from "@/helpers/redis";
import { categories_repository, posts_repository } from "@/repositories";
import { createRedisKey, createResponse, getErrorMsg, zodValidate } from "@/utilities";
import { Request, Response } from "express";
import { z } from "zod";

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const category_id = zodValidate(Number(req.params["category_id"] || -1), z.number(zodError).nonnegative());
    const responseDeleteCategory = await categories_repository.deleteCategory(category_id);
    if (!responseDeleteCategory) {
      return createResponse(res, false, null, code.ERROR, message.update_failed);
    }

    // DELETE CATEGORY FROM POST
    const responsePostByCategory = await posts_repository.getPostsByCategory(category_id);
    // DELETE REDIS CACHE
    const delRedisCache = await redis.deleteCache(createRedisKey(redisPath.categories.category, category_id));
    return createResponse(res, true);
  } catch (error) {
    const { responseCode, responseMessage } = getErrorMsg(error as Error);
    return createResponse(res, false, null, responseCode, responseMessage);
  }
};
