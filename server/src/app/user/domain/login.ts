// Library
import bcryptjs from "bcryptjs";
import { Request, Response } from "express";
// Repository
import { user_repository } from "@/repositories";
// Constants
import { code, message } from "@/constants";
// Utility
import { createAccessToken, createResponse } from "@/utilities";

export const login = async (req: Request, res: Response) => {
  const { email, password, staySignedIn } = req.body;

  const userData = await user_repository.getUserData({
    email: "sonna@gmail.com",
  });

  if (!userData) {
    return createResponse(res, false, null, code.AUTHORIZATION, message.user_not_exists);
  }

  const validate = bcryptjs.compare(password, userData.hashed_password);
  if (!validate) {
    return createResponse(res, false, null, code.AUTHORIZATION, message.not_authorized);
  }

  const accessToken = createAccessToken({
    user_id: userData.user_id,
    email: userData.email,
  });

  return createResponse(res, true, accessToken);
};

