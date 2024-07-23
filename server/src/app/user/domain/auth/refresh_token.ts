import { code, message } from "@/constants/consts";
import { RefreshToken } from "@/constants/schema";
import { users_basic_data_repository, users_refresh_token_repository } from "@/repositories";
import { createAccessToken, createRefreshToken, createResponse, getErrorMsg, verifyToken } from "@/utilities";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import moment from "moment";

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies[`${process.env.REFRESH_COOKIE_NAME}`];
    if (!token) {
      return createResponse(res, false, null, code.UNAUTHORIZED, message.not_authorized);
    }
    const { user_id, email, exp } = jwt.decode(token, { json: true }) as RefreshToken;

    const dbToken = await users_refresh_token_repository.getRefreshToken(user_id);
    if (!dbToken || dbToken.refresh_token !== token) {
      return createResponse(res, false, null, code.ERROR, message.system_error);
    }

    const verify = verifyToken(token);
    if (!verify) {
      return createResponse(res, false, null, code.UNAUTHORIZED, message.not_authorized);
    }

    const userData = await users_basic_data_repository.getUserData({ user_id: user_id });

    const accessToken = createAccessToken({
      user_id: user_id,
      email: email,
      authorization_id: userData?.authorization_id,
    });

    const newRefreshToken = createRefreshToken({
      user_id: user_id,
      email: email,
      exp: exp,
      iat: Math.floor(Date.now() / 1000),
    });

    res.cookie(String(process.env.REFRESH_COOKIE_NAME), newRefreshToken, {
      httpOnly: true,
      maxAge: moment.duration(1, "day").asSeconds(),
      sameSite: "strict",
      secure: true,
    });

    return createResponse(res, true, { accessToken });
  } catch (error) {
    const { responseCode, responseMessage } = getErrorMsg(error as Error);
    return createResponse(res, false, null, responseCode, responseMessage);
  }
};
