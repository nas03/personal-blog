import manage from "@/app/category/domain/manage";
import { Router } from "express";

const manageRouter = Router();

manageRouter.delete("/delete/:category_id", manage.deleteCategory);
manageRouter.post("/create", manage.createCategory);
export default manageRouter;
