import { code, message, zodError } from "@/constants/consts";
import { posts_repository } from "@/repositories";
import { createResponse, getUserIdByToken } from "@/utilities";
import { Request, Response } from "express";
import { z } from "zod";

const DataSchema = z.number(zodError).nonnegative(zodError.invalid_type_error);
export const getPostById = async (req: Request, res: Response) => {
  try {
    const user_id = getUserIdByToken(req);
    if (user_id) {
      return createResponse(res, false, null, code.UNAUTHORIZED, message.not_authorized);
    }

    const queryParams = req.params;
    const validate = DataSchema.safeParse(queryParams);
    if (!validate.success) {
      return createResponse(res, false, null, code.BAD_REQUEST, validate.error.issues[0].message);
    }
    const post_id = validate.data;
    const responseGetPost = await posts_repository.getPostById(post_id);
    if (!responseGetPost) {
      return createResponse(res, false, null, code.ERROR, message.system_error);
    }

    return createResponse(res, true, { ...responseGetPost });
  } catch (error) {
    console.log(error);
    return createResponse(res, false, null, code.ERROR, message.system_error);
  }
};
