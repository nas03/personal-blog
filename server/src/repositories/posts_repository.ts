import { PostRepo } from "@/constants/interfaces";
import { db } from "@/helpers";

export const getPostById = async (post_id: number) => {
  const query = await db<PostRepo>("posts")
  .leftJoin("post_category", )
  .select("post_id", "title", "user_id", "thumbnail_url", "content")
  .where("post_id", post_id);
  return query;
};

export const getPostByUser = async (user_id: string) => {
  const query = await db<PostRepo>("posts").select("post_id", "title", "user_id", "thumbnail_url", "content").where("user_id", user_id);
  return query;
};

export const createPost = async (payload: Omit<PostRepo, "post_id">) => {
  try {
    const transaction = await db.transaction(async (trx) => {
      const query = await db<PostRepo>("posts").insert(payload);
      if (!query) return false;
      return query;
    });
    return transaction;
  } catch (error) {
    console.log(error);
    return false;
  }
};
