import { createCategory } from "./create_category";
import { deleteCategory } from "./delete_category";
import { getAllCategories } from "./get_all_categories";

const manage = {
  deleteCategory,
  createCategory,
  getAllCategories,
};

export default manage;
