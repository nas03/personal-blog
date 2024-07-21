// Library
import { Router } from "express";
// Router
import authRouter from "@/app/user/api/authRoute";
import manageRouter from "@/app/user/api/manageRoute";
import profileRouter from "@/app/user/api/profileRoute";
import { verifyToken } from "@/middlewares/auth";

const userRoute = Router();

userRoute.use("/user/auth", authRouter);
userRoute.use("/user/profile", verifyToken, profileRouter);
userRoute.use("/user/manage", verifyToken, manageRouter);
export default userRoute;
