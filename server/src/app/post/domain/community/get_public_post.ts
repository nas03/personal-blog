import { createResponse, getErrorMsg } from "@/utilities";
import { Request, Response } from "express";

export const getPublicPosts = async (req:Request, res: Response) => {
    try {
        
    } catch (error) {
        const {responseCode, responseMessage} = getErrorMsg(error as Error)
        return createResponse(res, false, null, responseCode, responseMessage)
    }
}