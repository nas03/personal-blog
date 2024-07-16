import { z } from "zod";

/* --REPOSITORY-- */
const RepositorySchema = z.object({
  ts_updated: z.date().optional(),
  ts_created: z.date().optional(),
});

const UserBasicDataSchema = RepositorySchema.extend({
  user_id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
  phone_number: z.string(),
  hashed_password: z.string(),
  authorization_id: z.number().min(1).max(2),
});

const UserProfileSchema = RepositorySchema.extend({
  id: z.number(),
  user_id: z.string(),
  profile_image_url: z.string(),
  country: z.string(),
  address: z.string(),
});

const CommentSchema = RepositorySchema.extend({
  comment_id: z.number(),
  post_id: z.number(),
  user_id: z.string(),
  comment: z.string(),
});

const CategorySchema = RepositorySchema.extend({
  category_id: z.number(),
  title: z.string(),
  description: z.string(),
});

const PostSchema = RepositorySchema.extend({
  post_id: z.number(),
  user_id: z.string(),
  thumbnail_url: z.string(),
  title: z.string(),
  content: z.string(),
});

const UserAccessHistorySchema = RepositorySchema.extend({
  id: z.number(),
  user_id: z.string(),
  user_agent: z.string(),
  ip_address: z.string(),
});
const UserRefreshTokenSchema = RepositorySchema.extend({
  id: z.number(),
  user_id: z.string(),
  refresh_token: z.string(),
  iat: z.number(),
  exp: z.number(),
});
export type Repository = z.infer<typeof RepositorySchema>;
export type UserBasicDataRepo = z.infer<typeof UserBasicDataSchema>;
export type UserProfileRepo = z.infer<typeof UserProfileSchema>;
export type CommentRepo = z.infer<typeof CommentSchema>;
export type CategoryRepo = z.infer<typeof CategorySchema>;
export type PostRepo = z.infer<typeof PostSchema>;
export type UserAccessHistoryRepo = z.infer<typeof UserAccessHistorySchema>;
export type UserRefreshTokenRepo = z.infer<typeof UserRefreshTokenSchema>;
