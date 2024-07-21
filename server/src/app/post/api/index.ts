import manageRouter from "@/app/post/api/manageRoute";
import { Router } from "express";

const postRoute = Router();

postRoute.use("/post/manage", manageRouter);

export default postRoute;
