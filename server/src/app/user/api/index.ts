// Library
import { Router } from "express";
// Router
import authRouter from "@/app/user/api/authRoute";
import adminRouter from "./adminRoute";

const userRoute = Router();

userRoute.use("/user/auth", authRouter);
userRoute.use('/user/admin', adminRouter)
export default userRoute;
