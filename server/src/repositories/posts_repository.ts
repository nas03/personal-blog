import { Post_CategoryRepo, PostRepo } from "@/constants/interfaces";
import { db } from "@/helpers";
import { default as _ } from "lodash";
export const getPostById = async (post_id: number) => {
  const query = await db<PostRepo>("posts")
    // .leftJoin("post_category", )
    .select("post_id", "title", "user_id", "thumbnail_url", "content")
    .where("post_id", post_id);
  return query;
};

export const getPostByUser = async (user_id: string) => {
  const query = await db<PostRepo>("posts")
    .leftJoin("post_category as pc", "posts.post_id", "post_category.post_id")
    .leftJoin("categories as cat", "cat.category_id", "pc.category_id")
    .select("posts.post_id", "posts.title", "posts.user_id", "posts.thumbnail_url", "posts.content", "cat.title")
    .where("user_id", user_id);
  return query;
};

export const createPost = async (payload: { post: Omit<PostRepo, "post_id">; categories?: number[] }) => {
  try {
    const transaction = await db.transaction(async (trx) => {
      const insertPost: Awaited<PostRepo> = await trx<PostRepo>("posts").insert(payload.post);
      if (payload.categories && !_.isEmpty(payload.categories)) {
        const categoryPayload = payload.categories && payload.categories.map((catId: number) => ({ category_id: catId, post_id: insertPost.post_id }));
        const insertPostCategory = await trx<Post_CategoryRepo>("post_category").insert(categoryPayload);
      }
      return true;
    });
    return transaction;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const updatePost = async (payload: { post: Partial<PostRepo> & { post_id: number }; categories?: number[] }) => {
  try {
    const transaction = await db.transaction(async (trx) => {
      // const query = await
    });
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const deletePostById = async (post_id: number) => {
  try {
    const transaction = await db.transaction(async (trx) => {
      const query = await trx<PostRepo>("posts").delete().where("post_id", post_id);
      return query;
    });
    return transaction;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const deletePostByAuthor = async (user_id: number) => {
  try {
    const transaction = await db.transaction(async (trx) => {
      const query = await trx<PostRepo>("posts").delete().where("user_id", user_id);
      return query
    });
    return transaction;
  } catch (error) {
    console.log(error);
    return false;
  }
};``
