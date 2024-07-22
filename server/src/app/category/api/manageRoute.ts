import manage from "@/app/category/domain/manage";
import { Router } from "express";

const manageRouter = Router();

manageRouter.delete("/manage/delete/:category_id", manage.deleteCategory);
manageRouter.post("/manage/create", manage.createCategory);
export default manageRouter;
