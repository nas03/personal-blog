import { code, message, zodError } from "@/constants/consts";
import { PostSchema } from "@/constants/interfaces";
import { posts_repository } from "@/repositories";
import { createResponse, getErrorMsg, getUserIdByToken, zodValidate } from "@/utilities";
import { Request, Response } from "express";
import { z } from "zod";

const ValidateSchema = z.object({
  post: PostSchema.partial().merge(
    z.object({
      post_id: z.number(zodError),
    })
  ),
  categories: z.array(z.number(zodError), zodError).optional(),
});

export const updatePost = async (req: Request, res: Response) => {
  try {
    const user_id = getUserIdByToken(req);

    const payload = zodValidate(req, ValidateSchema);
    const responseUpdatePost = await posts_repository.updatePost(payload);
    if (!responseUpdatePost) return createResponse(res, false, null, code.ERROR, message.update_failed);
    return createResponse(res, true);
  } catch (error) {
    const { responseCode, responseMessage } = getErrorMsg(error as Error);
    return createResponse(res, false, null, responseCode, responseMessage);
  }
};
