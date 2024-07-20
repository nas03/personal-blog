import { code, message, zodError } from "@/constants/consts";
import { users_profile_repository } from "@/repositories";
import { createResponse, getErrorMsg, getUserIdByToken, zodValidate } from "@/utilities";
import { Request, Response } from "express";
import { z } from "zod";

const DataSchema = z.object({
  user_id: z.string(zodError),
  profile_image_url: z.string(zodError).optional(),
  country: z.string(zodError).optional(),
  address: z.string(zodError).optional(),
});
export const createProfile = async (req: Request, res: Response) => {
  try {
    const user_id = getUserIdByToken(req);

    const payload = zodValidate({ user_id: user_id, ...req.body }, DataSchema);
    const responseCreateProfile = await users_profile_repository.createUserProfile(payload);
    if (!responseCreateProfile) {
      return createResponse(res, false, null, code.ERROR, message.update_failed);
    }

    return createResponse(res, true);
  } catch (error) {
    const { responseCode, responseMessage } = getErrorMsg(error as Error);
    return createResponse(res, false, null, responseCode, responseMessage);
  }
};
