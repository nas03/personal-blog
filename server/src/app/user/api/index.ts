// Library
import { Router } from "express";
// Router
import authRouter from "@/app/user/api/authRoute";

const userRoute = Router();

userRoute.use("/user/auth", authRouter);
export default userRoute;
