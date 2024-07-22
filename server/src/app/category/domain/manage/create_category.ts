import { code, message, redisPath } from "@/constants/consts";
import { CategorySchema } from "@/constants/types";
import redis from "@/helpers/redis";
import { categories_repository } from "@/repositories";
import { createRedisKey, createResponse, getErrorMsg, getUserIdByToken, zodValidate } from "@/utilities";
import { Request, Response } from "express";

const ValidateSchema = CategorySchema.omit({ category_id: true });

export const createCategory = async (req: Request, res: Response) => {
  try {
    const user_id = getUserIdByToken(req);

    const payload = zodValidate(req.body, ValidateSchema);
    const responseCreateCategory = await categories_repository.createCategory(payload);
    if (!responseCreateCategory) {
      return createResponse(res, false, null, code.ERROR, message.create_failed);
    }

    // SAVE DATA TO REDIS
    const setRedisCache = await redis.setCache(
      createRedisKey(redisPath.categories.category, responseCreateCategory.category_id),
      responseCreateCategory
    );
    return createResponse(res, true);
  } catch (error) {
    const { responseCode, responseMessage } = getErrorMsg(error as Error);
    return createResponse(res, false, null, responseCode, responseMessage);
  }
};
