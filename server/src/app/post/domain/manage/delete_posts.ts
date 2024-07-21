import { code, message, redisPath, zodError } from "@/constants/consts";
import redis from "@/helpers/redis";
import { posts_repository } from "@/repositories";
import { createRedisKey, createResponse, getErrorMsg, getUserIdByToken, zodValidate } from "@/utilities";
import { Request, Response } from "express";
import { z } from "zod";

export const deletePostById = async (req: Request, res: Response) => {
  try {
    const user_id = getUserIdByToken(req);

    const ValidateSchema = z.object({
      post_id: z.number(zodError),
    });
    const { post_id } = zodValidate(req.params, ValidateSchema);
    const responseDeletePost = await posts_repository.deletePostById(post_id);
    if (!responseDeletePost) {
      return createResponse(res, false, null, code.ERROR, message.update_failed);
    }

    // DELETE DATA FROM REDIS
    const delRedisCache = await redis.deleteCache(createRedisKey(redisPath.posts.post, post_id));

    return createResponse(res, true);
  } catch (error) {
    const { responseCode, responseMessage } = getErrorMsg(error as Error);
    return createResponse(res, false, null, responseCode, responseMessage);
  }
};
