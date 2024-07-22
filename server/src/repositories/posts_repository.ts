import { PostRepo } from "@/constants/types";
import { db } from "@/helpers";

export const getPostById = async (post_id: number) => {
  const query = await db<PostRepo>("posts")
    .leftJoin("categories", function () {
      this.on(db.raw("categories.category_id = ANY(posts.categories)"));
    })
    .select("posts.post_id", "posts.title", "posts.user_id", "posts.thumbnail_url", "posts.content", db.raw("ARRAY_AGG(categories.title) AS categories"))
    .where("post_id", post_id)
    .groupBy("posts.post_id", "posts.title", "posts.user_id", "posts.thumbnail_url", "posts.content")
    .first();
  return query;
};

export const getPostsByUser = async (user_id: string) => {
  const query = await db<PostRepo>("posts")
    .leftJoin("categories", function () {
      this.on(db.raw("categories.category_id = ANY(posts.categories)"));
    })
    .select("posts.post_id", "posts.title", "posts.user_id", "posts.thumbnail_url", "posts.content", db.raw("ARRAY_AGG(categories.title) AS categories"))
    .where("user_id", user_id)
    .groupBy("posts.post_id", "posts.title", "posts.user_id", "posts.thumbnail_url", "posts.content");
  return query;
};

export const getPostsByCategory = async (category_id: number) => {
  const query = await db<PostRepo>("posts")
    .select("post_id", "user_id", "thumbnail_url", "title", "categories", "content")
    .whereRaw(`? = ANY(categories)`, category_id);
  return query;
};

export const createPost = async (payload: Partial<Omit<PostRepo, "post_id">>) => {
  try {
    const transaction = await db.transaction(async (trx) => {
      const insertPost = await trx<PostRepo>("posts").insert(payload);
      return insertPost;
    });
    return transaction;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const updatePost = async (payload: { post_id: number; data: Partial<Omit<PostRepo, "post_id">> }) => {
  try {
    const transaction = await db.transaction(async (trx) => {
      const query = await trx<PostRepo>("posts").update(payload.data).where("post_id", payload.post_id).returning("*");
      return query;
    });
    return transaction;
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
      return query;
    });
    return transaction;
  } catch (error) {
    console.log(error);
    return false;
  }
};
``;
