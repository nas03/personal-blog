// constants
import { code, message } from "@/constants/consts";
import { UserProfileRepo } from "@/constants/interfaces";
// helpers
import { logger } from "@/helpers";
// repository
import { users_profile_repository } from "@/repositories";
// utilities
import { createResponse, getUserIdByToken } from "@/utilities";
import { DataSchema } from "aws-sdk/clients/machinelearning";
// library
import { Request, Response } from "express";
import { z } from "zod";

const DataSchema = z.object({
  profile_image_url: z.string(),
  country: z.string(),
  address: z.string(),
});

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user_id = getUserIdByToken(req);
    if (!user_id) {
      createResponse(res, false, null, code.UNAUTHORIZED, message.not_authorized);
    }

    const validate = DataSchema.safeParse(req.body);

    if (!validate.success) {
      return createResponse(res, false, null, code.BAD_REQUEST, message.fields_cannot_blank);
    }

    const data = validate.data;
    const payload = {
      user_id: String(user_id),
      profile_image_url: data.profile_image_url,
      country: data.country,
      address: data.address,
    };

    const responseUpdateUserProfile = await users_profile_repository.updateUserProfile(payload);
    if (!responseUpdateUserProfile) {
      return createResponse(res, false, null, code.ERROR, message.system_error);
    }
    return createResponse(res, true);
  } catch (error) {
    logger.error(error);
    return createResponse(res, false, null, code.ERROR, message.system_error);
  }
};
