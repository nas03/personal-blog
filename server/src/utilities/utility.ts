import { ErrorLog } from "@/constants/common";
import { code, message } from "@/constants/consts";
import { Token } from "@/constants/interfaces";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import _ from "lodash";
import { z, ZodSchema } from "zod";

export const createResponse = (res: Response, isSuccess: boolean, data?: any, code: number = 500, message: string = "") => {
  let resData = data ? data : {};
  if (isSuccess) {
    return res.status(200).json({
      status: "success",
      data: resData,
      message: message,
    });
  }

  return res.status(code).json({
    status: "error",
    data: resData,
    message: message,
  });
};

export const createAccessToken = (payload: { user_id: string; email: string; authorization_id?: number }) => {
  return jwt.sign(
    {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
    },
    `${process.env.JWT_SECRET}`,
    {
      expiresIn: `${process.env.JWT_ACCESS_EXP}`,
    }
  );
};

export const createRefreshToken = (payload: { user_id: string; email: string; exp: number; iat: number; role?: string }) => {
  return jwt.sign({ ...payload }, String(process.env.JWT_SECRET));
};

export const verifyToken = (token: string) => {
  const decodedToken = jwt.verify(token, `${process.env.JWT_SECRET}`) as Token;
  if (!decodedToken) {
    return false;
  }
  if (Date.now() / 1000 > decodedToken.exp) {
    return false;
  }
  return true;
};

export const getUserIdByToken = (req: Request) => {
  const token = req.headers?.authorization || "";
  if (!token) {
    throw new ErrorLog(code.UNAUTHORIZED, message.not_authorized);
  }
  const verify = jwt.verify(token, `${process.env.JWT_SECRET}`) as Token;
  if (!verify) throw new ErrorLog(code.UNAUTHORIZED, message.not_authorized);
  return verify.user_id;
};

export const zodValidate = <T>(data: any, schema: ZodSchema<T>, options?: Partial<z.ParseParams>): T => {
  const validate = _.isEmpty(options) ? schema.safeParse(data) : schema.safeParse(data, options);
  if (!validate.success) {
    throw new ErrorLog(code.BAD_REQUEST, validate.error.issues[0].message);
  }
  return validate.data;
};
