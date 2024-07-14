// Library
import bcryptjs from "bcryptjs";
import { Request, Response } from "express";
// Utilities
import { createResponse, emailValidator, phoneNumberValidator } from "@/utilities";
// Constants
import { authorization, code, message } from "@/constants/consts";
// Interfaces
import { UserBasicDataRepo } from "@/constants/interfaces";
// Repository
import { users_basic_data_repository } from "@/repositories";
// library
import { z } from "zod";

const DataSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  password: z.string(),
  phone_number: z.string(),
});

export const signup = async (req: Request, res: Response) => {
  try {
    const validate = DataSchema.safeParse(req.body);
    if (!validate.success) {
      return createResponse(res, false, null, code.BAD_REQUEST, message.fields_cannot_blank);
    }
    const data = validate.data;

    if (!emailValidator(data.email) || !phoneNumberValidator(data.phone_number)) {
      return createResponse(res, false, null, code.BAD_REQUEST, message.fields_invalid);
    }

    const hashed_password = await bcryptjs.hash(data.password, 10);

    const payload: Omit<UserBasicDataRepo, "user_id"> = {
      first_name: data.first_name,
      last_name: data.last_name,
      hashed_password: hashed_password,
      email: data.email,
      authorization_id: authorization.USER,
      phone_number: data.phone_number,
    };
    const newUser = await users_basic_data_repository.createUserData(payload);

    if (!newUser) {
      return createResponse(res, false, null, code.ERROR, message.system_error);
    }

    return createResponse(res, true);
  } catch (error) {
    return createResponse(res, false, null, code.ERROR, message.system_error);
  }
};

// SSO
