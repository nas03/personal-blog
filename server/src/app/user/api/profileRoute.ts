//Library
import { Router } from "express";
//Domain functions
import profile from "@/app/user/domain/profile";
const profileRouter = Router();

profileRouter.get("/", profile.getUserProfile);
profileRouter.post("/update", profile.updateProfile);
profileRouter.post("/create", profile.createProfile);
export default profileRouter;
