// Library
import bcryptjs from "bcryptjs";
import { Request, Response } from "express";
// Utilities
import { createResponse, validateFields, emailValidator, phoneNumberValidator } from "@/utilities";
// Constants
import { authorization, code, message } from "@/constants/consts";
// Interfaces
import { User } from "@/constants/interfaces";
// Repository
import { users_basic_data_repository } from "@/repositories";

type SignUpData = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone_number: string;
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { first_name, last_name, email, password, phone_number }: SignUpData = req.body;

    const fields: string[] = ["first_name", "last_name", "email", "password", "phone_number"];
    const validate = validateFields(req.body, fields);

    if (!validate) {
      return createResponse(res, false, null, code.BAD_REQUEST, message.fields_cannot_blank);
    }

    if (!emailValidator(email) || !phoneNumberValidator(phone_number)) {
      return createResponse(res, false, null, code.BAD_REQUEST, message.fields_invalid);
    }

    const hashed_password = await bcryptjs.hash(password, 10);

    const payload: Omit<User, "user_id" | "ts_updated" | "ts_registered"> = {
      first_name: first_name,
      last_name: last_name,
      hashed_password: hashed_password,
      email: email,
      authorization_id: authorization.USER,
      phone_number: phone_number,
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
