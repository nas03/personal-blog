// constants
import { ErrorLog } from "@/constants/common";
import { code, message, zodError } from "@/constants/consts";
// helpers
// repository
import { users_profile_repository } from "@/repositories";
// utilities
import { createResponse, getUserIdByToken } from "@/utilities";
import { DataSchema } from "aws-sdk/clients/machinelearning";
// library
import { Request, Response } from "express";
import { z } from "zod";

const DataSchema = z.object({
  profile_image_url: z.string(zodError),
  country: z.string(zodError),
  address: z.string(zodError),
});

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user_id = getUserIdByToken(req);
    const validate = DataSchema.safeParse(req.body);

    if (!validate.success) {
      return createResponse(res, false, null, code.BAD_REQUEST, message.fields_cannot_blank);
    }

    const data = validate.data;
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
    return createResponse(res, true);
  } catch (error) {
    const { message: errMessage, code: errCode } = error as ErrorLog;
    const responseCode = message.hasOwnProperty(errMessage) ? errCode : code.ERROR;
    const responseMessage = message.hasOwnProperty(errMessage) ? errMessage : message.system_error;

    return createResponse(res, false, null, responseCode, responseMessage);
  }
};
