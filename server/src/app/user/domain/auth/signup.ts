// Library
import bcryptjs from "bcryptjs";
import { Request, Response } from "express";
// Utilities
import { createResponse, emailValidator, phoneNumberValidator } from "@/utilities";
// Constants
import { authorization, code, message, zodError } from "@/constants/consts";
// Interfaces
import { UserBasicDataRepo } from "@/constants/interfaces";
// Repository
import { users_basic_data_repository } from "@/repositories";
// library
import { z } from "zod";
// helper
import { ErrorLog } from "@/constants/common";

const DataSchema = z.object({
  first_name: z.string(zodError),
  last_name: z.string(zodError),
  email: z.string(zodError).email({ message: zodError.invalid_type_error }),
  password: z.string(zodError),
  phone_number: z.string(zodError),
});

export const signup = async (req: Request, res: Response) => {
  try {
    const validate = DataSchema.safeParse(req.body);
    if (!validate.success) {
      return createResponse(res, false, null, code.BAD_REQUEST, validate.error.issues[0].message);
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
    const { message: errMessage, code: errCode } = error as ErrorLog;
    const responseCode = message.hasOwnProperty(errMessage) ? errCode : code.ERROR;
    const responseMessage = message.hasOwnProperty(errMessage) ? errMessage : message.system_error;

    return createResponse(res, false, null, responseCode, responseMessage);
  }
};

// SSO
