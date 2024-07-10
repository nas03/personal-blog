// Library
import { Application } from "express";
// Router
import authRouter from "@/app/user/api/authRoute";

const userRoute = [authRouter];
export default userRoute;
