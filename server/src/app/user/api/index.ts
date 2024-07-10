// Library
import { Application, Router } from "express";
// Router
import authRouter from "@/app/user/api/authRoute";


const userRoute = Router();

userRoute.use('/user', authRouter);

export default userRoute;