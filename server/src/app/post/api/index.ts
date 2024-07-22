import manageRouter from "@/app/post/api/manageRoute";
import { verifyToken } from "@/utilities";
import { Router } from "express";

const postRoute = Router();

postRoute.use("/post/manage", verifyToken, manageRouter);

export default postRoute;
