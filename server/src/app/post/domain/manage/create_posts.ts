import { code, message, zodError } from "@/constants/consts";
import { posts_repository } from "@/repositories";
import { createResponse, getErrorMsg, getUserIdByToken, zodValidate } from "@/utilities";
import { Request, Response } from "express";
import { z } from "zod";

const ValidateSchema = z.object({
  post: z.object({
    user_id: z.string(zodError),
    title: z.string(zodError),
    content: z.string(zodError),
    thumbnail_url: z.string(zodError).optional(),
  }),
  categories: z.array(z.number(zodError), zodError).optional(),
});

export const createPost = async (req: Request, res: Response) => {
  try {
    const user_id = getUserIdByToken(req);

    const payload = zodValidate(req.body, ValidateSchema);
    const responseCreatePost = await posts_repository.createPost(payload);
    if (!responseCreatePost) {
      return createResponse(res, false, null, code.ERROR, message.update_failed);
    }
    return createResponse(res, true);
  } catch (error) {
    const { responseCode, responseMessage } = getErrorMsg(error as Error);
    return createResponse(res, false, null, responseCode, responseMessage);
  }
};
