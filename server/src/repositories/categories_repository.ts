import { CategoryRepo, PostRepo } from "@/constants/interfaces";
import { db } from "@/helpers";

export const createCategory = async (payload: Omit<CategoryRepo, "category_id">) => {
  try {
    const transaction = await db.transaction(async (trx) => {
      const query = await trx<CategoryRepo>("categories").insert(payload).returning("*").first();
      return query;
    });
    return transaction;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const getCategory = async (category_id: number) => {
  const query = await db<CategoryRepo>("categories").select("category_id", "description", "title").where("category_id", category_id);
  return query;
};

export const updateCategory = async (payload: { category_id: number; data: Partial<Omit<CategoryRepo, "category_id">> }) => {
  try {
    const transaction = await db.transaction(async (trx) => {
      const update = await trx<CategoryRepo>("categories").update(payload.data).where("category_id", payload.category_id);
      return update;
    });
    return transaction;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const deleteCategory = async (category_id: number) => {
  try {
    const transaction = await db.transaction(async (trx) => {
      const result = await Promise.all([
        await trx<CategoryRepo>("categories").where("category_id", category_id).delete(),
        await trx<PostRepo>("posts")
          .whereRaw(`? = ANY(categories)`, category_id)
          .update({ categories: db.raw("array_remove(categories,?)", category_id) }),
      ]);
      return result;
    });
    return transaction;
  } catch (error) {
    console.log(error);
    return false;
  }
};
