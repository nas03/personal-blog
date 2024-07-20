// constants
import { code, message, zodError } from "@/constants/consts";
import redis from "@/helpers/redis";
// helpers
// repository
import { users_profile_repository } from "@/repositories";
// utilities
import { createResponse, getErrorMsg, getUserIdByToken, zodValidate } from "@/utilities";
// library
import { Request, Response } from "express";
import { z } from "zod";

const ValidateSchema = z.object({
  profile_image_url: z.string(zodError).optional(),
  country: z.string(zodError).optional(),
  address: z.string(zodError).optional(),
});

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user_id = getUserIdByToken(req);

    const data = zodValidate(req.body, ValidateSchema);
    const payload = {
      user_id: user_id,
      profile_image_url: data.profile_image_url,
      country: data.country,
      address: data.address,
    };

    const responseUpdateUserProfile = await users_profile_repository.updateUserProfile(payload);

    if (!responseUpdateUserProfile) {
      return createResponse(res, false, null, code.ERROR, message.system_error);
    }
    const delPrevCache = await redis.deleteCacheObject({ user_id: user_id });
    return createResponse(res, true);
  } catch (error) {
    const { responseCode, responseMessage } = getErrorMsg(error as Error);
    return createResponse(res, false, null, responseCode, responseMessage);
  }
};
