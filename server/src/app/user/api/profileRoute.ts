//Library
import { Router } from "express";
//Domain functions
import profile from "@/app/user/domain/profile";
import { verifyToken } from "@/middlewares/auth";
const profileRouter = Router();

profileRouter.get("/", verifyToken, profile.getUserProfile);
profileRouter.post("/update", verifyToken, profile.updateProfile);
export default profileRouter;
