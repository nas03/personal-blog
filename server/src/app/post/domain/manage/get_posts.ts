import { code, message, zodError } from "@/constants/consts";
import { posts_repository } from "@/repositories";
import { createResponse, getErrorMsg, getUserIdByToken, zodValidate } from "@/utilities";
import { Request, Response } from "express";
import { z } from "zod";

//! Must join with category table

const ValidateSchema = z.object({
  post_id: z.number(zodError).nonnegative(zodError.invalid_type_error),
});

export const getPostById = async (req: Request, res: Response) => {
  try {
    const user_id = getUserIdByToken(req);

    const data = zodValidate(req.params, ValidateSchema);
    const post_id = data.post_id;
    const responseGetPost = await posts_repository.getPostById(post_id);
    if (!responseGetPost) {
      return createResponse(res, false, null, code.ERROR, message.system_error);
    }

    return createResponse(res, true, { responseGetPost });
  } catch (error) {
    console.log(error);
    const { responseCode, responseMessage } = getErrorMsg(error as Error);
    return createResponse(res, false, null, responseCode, responseMessage);
  }
};

export const getPostsByUserId = async (req: Request, res: Response) => {
  try {
    const user_id = getUserIdByToken(req);

    const responseGetPosts = await posts_repository.getPostByUser(user_id);
    if (!responseGetPosts) {
      return createResponse(res, false, null, code.ERROR, message.system_error);
    }
    return createResponse(res, true, { responseGetPosts });
  } catch (error) {
    const { responseCode, responseMessage } = getErrorMsg(error as Error);

    return createResponse(res, false, null, responseCode, responseMessage);
  }
};

export const getPostsByAuthor = async (req: Request, res: Response) => {
  try {
    const data = zodValidate(req.params, z.object({ user_id: z.string(zodError) }));
    const responseGetPosts = await posts_repository.getPostByUser(data.user_id);
    return createResponse(res, true, { responseGetPosts });
  } catch (error) {
    const { responseCode, responseMessage } = getErrorMsg(error as Error);

    return createResponse(res, false, null, responseCode, responseMessage);
  }
};
