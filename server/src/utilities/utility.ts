import jwt from "jsonwebtoken";
import { Request, Response, Application, Router } from "express";
import { Token } from "@/constants/interfaces";

export const createResponse = (res: Response, isSuccess: boolean, data?: any, code: number = 500, message: string = "") => {
  if (isSuccess) {
    return res.status(200).json({
      status: "success",
      data: {
        ...data,
      },
      message: message,
    });
  }

  return res.status(code).json({
    status: "error",
    data: data,
    message: message,
  });
};

export const createAccessToken = (payload: { user_id: string; email: string; authorization_id?: number }) => {
  return jwt.sign(
    {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
    },
    `${process.env.JWT_SECRET_KEY}`,
    {
      expiresIn: `${process.env.JWT_ACCESS_EXP}`,
    }
  );
};

export const createRefreshToken = (payload: { user_id: string; email: string; exp: number; iat: number; role?: string }) => {
  return jwt.sign({ ...payload }, String(process.env.JWT_SECRET_KEY));
};

export const validateFields = (data: any, fields: string[]) => {
  for (let field of fields) {
    if (!data[field]) {
      return false;
    }
  }

  return true;
};

export const verifyToken = (token: string) => {
  const decodedToken = jwt.verify(token, `${process.env.JWT_SECRET_KEY}`) as Token;
  if (!decodedToken) {
    return false;
  }
  if (Date.now() / 1000 > decodedToken.exp) {
    return false;
  }
  return true;
};
