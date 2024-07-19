// Library
import { Router } from "express";
// Router
import authRouter from "@/app/user/api/authRoute";
import profileRouter from "@/app/user/api/profileRoute";

const userRoute = Router();

userRoute.use("/user/auth", authRouter);
userRoute.use("/user/profile", profileRouter);
// userRoute.use("/user/manage");
export default userRoute;
