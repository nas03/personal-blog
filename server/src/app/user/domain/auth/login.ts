// Library
import bcryptjs from "bcryptjs";
import { Request, Response } from "express";
import moment from "moment";
import { z } from "zod";
// Repository
import { user_refresh_tokens_repository, users_basic_data_repository } from "@/repositories";
// Constants
import { code, message } from "@/constants/consts";
// Utility
import { createAccessToken, createRefreshToken, createResponse } from "@/utilities";

const DataSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  staySignedIn: z.boolean(),
});

export const login = async (req: Request, res: Response) => {
  try {
    const validate = DataSchema.safeParse(req.body);
    if (!validate.success) {
      return createResponse(res, false, null, code.BAD_REQUEST, message.fields_invalid);
    }
    const data = validate.data;

    const userData = await users_basic_data_repository.getUserData({
      email: data.email,
    });
    if (!userData) {
      return createResponse(res, false, null, code.UNAUTHORIZED, message.user_not_exists);
    }

    const validatePassword = bcryptjs.compare(data.password, userData.hashed_password);
    if (!validatePassword) {
      return createResponse(res, false, null, code.UNAUTHORIZED, message.not_authorized);
    }

    const accessToken = createAccessToken({
      user_id: userData.user_id,
      email: userData.email,
    });

    if (data.staySignedIn) {
      const exp = Math.floor(Date.now() / 1000 + moment.duration("1d").asSeconds());
      const iat = Math.floor(Date.now() / 1000);

      const refreshToken = createRefreshToken({
        user_id: userData.user_id,
        email: userData.email,
        exp: exp,
        iat: iat,
      });

      res.cookie(String(process.env.REFRESH_COOKIE_NAME), refreshToken, {
        httpOnly: true,
        maxAge: moment.duration(1, "d").asSeconds(),
        sameSite: "strict",
        secure: true,
      });

      await user_refresh_tokens_repository.addRefreshToken({
        user_id: userData.user_id,
        refresh_token: refreshToken,
        exp: exp,
        iat: iat,
      });
    }
    return createResponse(res, true, { accessToken });
  } catch (error) {
    console.log(error);
    return createResponse(res, false, null, code.ERROR, message.system_error);
  }
};

// SSO
// Authenticator
