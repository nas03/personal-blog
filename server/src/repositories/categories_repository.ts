import { CategoryRepo } from "@/constants/interfaces";
import { db } from "@/helpers";

export const createCategory = async (payload: Omit<CategoryRepo, "category_id">) => {
  try {
    const transaction = await db.transaction(async (trx) => {
      const query = await trx<CategoryRepo>("categories").insert(payload);
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
      const query = await trx<CategoryRepo>("categories").delete().where("category_id", category_id);
      return query;
    });
    return transaction;
  } catch (error) {
    console.log(error);
    return false;
  }
};
