import { Router } from "express";
import community from "@/app/category/domain/community";

const communityRouter = Router();

communityRouter.get("/category", community.getCategoryInfo);

export default communityRouter;
