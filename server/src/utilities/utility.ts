import { ErrorLog } from "@/constants/common";
import { code, message } from "@/constants/consts";
import { Token } from "@/constants/schema";
import { logger, r2 } from "@/helpers";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import _ from "lodash";
import { z, ZodSchema } from "zod";
export const createResponse = (res: Response, isSuccess: boolean, data?: any, code: number = 200, message: string = "") => {
  type Response = {
    status: string | null;
    message: string;
    data: any | null;
  };
  const response: Response = {
    status: null,
    message: "",
    data: null,
  };

  isSuccess ? (response["status"] = "success") : (response["status"] = "error");

  response["message"] = message;
  response["data"] = data || null;
  res.set("Access-Control-Allow-Origin", "http://localhost:5173");
  res.set("Access-Control-Allow-Credentials", "true");
  return res.status(code).json(response);
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
  const authHeader = req.headers["authorization"] || "";
  if (!authHeader) {
    throw new ErrorLog(code.UNAUTHORIZED, message.not_authorized);
  }
  const token = authHeader.split(" ")[1];
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

export const getErrorMsg = (error: Error) => {
  const { message: errMessage, code: errCode } = error as ErrorLog;
  const responseCode = message.hasOwnProperty(errMessage) ? errCode : code.ERROR;
  const responseMessage = message.hasOwnProperty(errMessage) ? errMessage : message.system_error;
  return { responseCode, responseMessage };
};

// TODO: Finish upload file function
export const uploadFile = async (fileName: string, content: any, path: string, contentType?: string) => {
  try {
    const upload = await r2.putObject(path, fileName, content, contentType);
    if (!upload) throw new ErrorLog(code.ERROR, message.system_error);
    return upload;
  } catch (error) {
    logger.error(error);
    throw new ErrorLog(code.ERROR, message.system_error);
  }
};

export const isJSON = (data: string) => {
  try {
    const parse = JSON.parse(data);
    return true;
  } catch (error) {
    return false;
  }
};

export const createRedisKey = <T>(path: string, id?: T) => {
  return id ? `${path}:${id}` : `${path}:*`;
};

export const getOsData = (req: Request) => {
  try {
    // User-Agent: Mozilla/5.0 (<system-information>) <platform> (<platform-details>) <extensions>
    // Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59

    const userAgent = req.headers["user-agent"];
    if (!userAgent) throw Error();
    if (userAgent.includes("Postman")) return "Postman";
    return userAgent.slice(userAgent.indexOf("("), userAgent.indexOf(")") + 1);
  } catch (error) {
    logger.error(error);
    return null;
  }
};
