import { code, message, redisPath, zodError } from "@/constants/consts";
import { PostSchema } from "@/constants/types";
import redis from "@/helpers/redis";
import { posts_repository } from "@/repositories";
import { createRedisKey, createResponse, getErrorMsg, getUserIdByToken, zodValidate } from "@/utilities";
import { Request, Response } from "express";
import { z } from "zod";

const ValidateSchema = z.object({
  post_id: z.number(zodError),
  data: PostSchema.omit({ post_id: true }).partial(),
});

export const updatePost = async (req: Request, res: Response) => {
  try {
    const user_id = getUserIdByToken(req);
    const post_id = Number(req.params["post_id"]) || -1;
    console.log({ user_id, post_id, ...req.body });
    const payload = zodValidate({ post_id, data: { user_id, ...req.body } }, ValidateSchema);
    const responseUpdatePost = await posts_repository.updatePost(payload);
    if (!responseUpdatePost) return createResponse(res, false, null, code.ERROR, message.update_failed);

    // DELETE REDIS DATA
    const deleteRedisCache = await redis.deleteCache(createRedisKey(redisPath.posts.user, user_id));
    return createResponse(res, true);
  } catch (error) {
    const { responseCode, responseMessage } = getErrorMsg(error as Error);
    return createResponse(res, false, null, responseCode, responseMessage);
  }
};
