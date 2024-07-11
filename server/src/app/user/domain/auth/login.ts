// Library
import bcryptjs from "bcryptjs";
import { Request, Response } from "express";
import moment from "moment";
// Repository
import { users_repository } from "@/repositories";
// Constants
import { code, message } from "@/constants/consts";
// Utility
import { createAccessToken, createRefreshToken, createResponse } from "@/utilities";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, staySignedIn } = req.body;

    const userData = await users_repository.getUserData({
      email: email,
    });

    if (!userData) {
      return createResponse(res, false, null, code.UNAUTHORIZED, message.user_not_exists);
    }

    const validate = bcryptjs.compare(password, userData.hashed_password);
    if (!validate) {
      return createResponse(res, false, null, code.UNAUTHORIZED, message.not_authorized);
    }

    const accessToken = createAccessToken({
      user_id: userData.user_id,
      email: userData.email,
    });

    if (staySignedIn) {
      const refreshToken = createRefreshToken({
        user_id: userData.user_id,
        email: userData.email,
        exp: Math.floor(Date.now() / 1000 + moment.duration("1d").asSeconds()),
      });

      res.cookie(String(process.env.REFRESH_COOKIE_NAME), refreshToken, {
        httpOnly: true,
        maxAge: moment.duration("1d").asSeconds(),
        sameSite: "strict",
        secure: true,
      });

      return createResponse(res, true, {
        accessToken,
        refreshToken,
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
