import { createPost } from "./create_posts";
import { deletePostById } from "./delete_posts";
import { getPostById, getPostsByAuthor, getPostsByUserId } from "./get_posts";
import { updatePost } from "./update_posts";

const manage = {
  createPost,
  deletePostById,
  getPostById,
  getPostsByAuthor,
  getPostsByUserId,
  updatePost,
};

export default manage;
