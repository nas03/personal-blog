import { code, message, redisPath, zodError } from "@/constants/consts";
import redis from "@/helpers/redis";
import { posts_repository } from "@/repositories";
import { createRedisKey, createResponse, getErrorMsg, getUserIdByToken, zodValidate } from "@/utilities";
import { Request, Response } from "express";
import { z } from "zod";

//! TODO: Must join with category table

export const getPostById = async (req: Request, res: Response) => {
  try {
    const user_id = getUserIdByToken(req);

    // VALIDATE DATA
    const ValidateSchema = z.number(zodError).nonnegative(zodError.invalid_type_error);
    const post_id = Number(req.params["post_id"] || -1);
    const validate = zodValidate(post_id, ValidateSchema);

    // GET DATA FROM REDIS IF EXISTED
    const redisKey = createRedisKey(redisPath.posts.post, post_id);
    const getRedisCache = await redis.getCache(redisKey);
    if (getRedisCache) {
      return createResponse(res, true, getRedisCache);
    }

    // GET DATA FROM DB
    const responseGetPost = await posts_repository.getPostById(post_id);
    if (!responseGetPost) {
      return createResponse(res, false, null, code.ERROR, message.system_error);
    }
    const categories = responseGetPost.categories;
    // SAVE DATA TO REDIS
    const setRedisCache = await redis.setCache(redisKey, responseGetPost);
    return createResponse(res, true, responseGetPost);
  } catch (error) {
    console.log(error);
    const { responseCode, responseMessage } = getErrorMsg(error as Error);
    return createResponse(res, false, null, responseCode, responseMessage);
  }
};

export const getPostsByUserId = async (req: Request, res: Response) => {
  try {
    const user_id = getUserIdByToken(req);

    // GET DATA FROM REDIS
    const redisKey = createRedisKey(redisPath.posts.user, user_id);
    const getRedisCache = await redis.getCache(redisKey);
    if (getRedisCache) {
    }

    // GET DATA FROM DB
    const responseGetPosts = await posts_repository.getPostsByUser(user_id);
    if (!responseGetPosts) {
      return createResponse(res, false, null, code.ERROR, message.system_error);
    }
    return createResponse(res, true, responseGetPosts);
  } catch (error) {
    const { responseCode, responseMessage } = getErrorMsg(error as Error);

    return createResponse(res, false, null, responseCode, responseMessage);
  }
};

export const getPostsByAuthor = async (req: Request, res: Response) => {
  try {
    const data = zodValidate(req.params, z.object({ author_id: z.string(zodError) }));
    const responseGetPosts = await posts_repository.getPostsByUser(data.author_id);
    return createResponse(res, true, { responseGetPosts });
  } catch (error) {
    const { responseCode, responseMessage } = getErrorMsg(error as Error);

    return createResponse(res, false, null, responseCode, responseMessage);
  }
};
