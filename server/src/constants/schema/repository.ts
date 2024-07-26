import { z } from "zod";

const RepositorySchema = z.object({
  delete_flag: z.number().min(0).max(1).optional(),
  ts_updated: z.string().datetime().optional(),
  ts_created: z.string().datetime().optional(),
});

export const UsersBasicDataSchema = RepositorySchema.extend({
  user_id: z.string().uuid(),
  first_name: z.string(),
  last_name: z.string(),
  authorization_id: z.number().min(1).max(2),
  email: z.string(),
  phone_number: z.string().nullable(),
});

export const UsersLoginDataSchema = RepositorySchema.extend({
  id: z.number(),
  user_id: z.string().uuid(),
  email: z.string().email(),
  hashed_password: z.string(),
  last_login_date: z.string().datetime().nullable(),
  last_login_ip: z.string().ip().nullable(),
});

export const PostsSchema = RepositorySchema.extend({
  post_id: z.number(),
  user_id: z.string().uuid(),
  private: z.boolean().default(true),
  status_code: z.number().default(10),
  thumbnail_url: z.string().nullish(),
  title: z.string(),
  content: z.string().nullish(),
});

export const MCategoriesSchema = RepositorySchema.extend({
  category_id: z.number(),
  title: z.string(),
  description: z.string().nullish(),
});

export const PostsCategorySchema = RepositorySchema.extend({
  id: z.number(),
  post_id: z.number(),
  category_id: z.number(),
});

export const PostsAnalyticSchema = RepositorySchema.extend({
  id: z.number(),
  post_id: z.number(),
  up_votes: z.number().optional(),
  down_votes: z.number().optional(),
  views: z.number().optional(),
});

export const PostsCommentSchema = RepositorySchema.extend({
  comment_id: z.number(),
  post_id: z.number(),
  user_id: z.string().uuid(),
  comment: z.string().max(255),
  path: z.string().nullable(),
});

export const UsersAccessHistorySchema = RepositorySchema.extend({
  id: z.number(),
  user_id: z.string().uuid(),
  user_agent: z.string().nullable(),
  ip_address: z.string().ip(),
  platform: z.string(),
});

export const UsersLoginTokenSchema = RepositorySchema.extend({
  id: z.number(),
  user_id: z.string().uuid(),
  session_id: z.string().uuid(),
  access_token: z.string(),
  refresh_token: z.string(),
  exp: z.number(),
  iat: z.number(),
});

export const UsersProfileSchema = RepositorySchema.extend({
  id: z.number(),
  user_id: z.string().uuid(),
  profile_image_url: z.string().nullish(),
  country: z.string().max(30).nullish(),
  address: z.string().nullish(),
  stars: z.number().optional(),
});

export const UsersConnection = RepositorySchema.extend({
  id: z.number(),
  follower_id: z.string().uuid(),
  following_id: z.string().uuid(),
});

export const NotificationsHistorySchema = RepositorySchema.extend({
  id: z.number(),
  receiver_id: z.string().uuid(),
  sender_id: z.string().uuid(),
  notification_type: z.number() /* INFO: 10/NOTICE: 20/WARNING: 30/ERROR: 40/EMERGENCY: 50 */,
  content: z.string(),
});

export const SmsHistorySchema = RepositorySchema.extend({
  id: z.number(),
  receiver_phone_number: z.string().max(255),
  receiver_id: z.string().uuid(),
  content: z.string(),
  sms_type: z.number() /* OTP:1/NOTIFICATIONS:2 */,
});

export const UsersMessageSchema = RepositorySchema.extend({
  id: z.number(),
  sender_id: z.string().uuid(),
  receiver_id: z.string().uuid(),
  content: z.string(),
});

export const MEmailTemplatesSchema = RepositorySchema.extend({
  id: z.number(),
  email_code: z.number(),
  title: z.string().max(255),
  lang: z.string().max(255),
  template: z.string(),
});

export const UsersEmailHistorySchema = RepositorySchema.extend({
  id: z.number(),
  email_code: z.number(),
  lang: z.string().max(30),
  sender_id: z.string().uuid(),
  receiver_id: z.string().uuid(),
});

export const MCountries = RepositorySchema.extend({
  id: z.number(),
  country_code: z.string().max(255),
  country_name: z.string().max(255),
  thumbnail: z.string().max(255),
  country_number: z.string().max(255),
});

export const ForumsSchema = RepositorySchema.extend({
  forum_id: z.number(),
  title: z.string().max(255),
  admin_id: z.string().uuid(),
  description: z.string(),
  forum_type: z.number().optional() /*PUBLIC: 0/PRIVATE: 1  */,
  members: z.array(z.string().uuid()).nullish(),
  status: z.number().optional(),
});

export const ForumsThreadSchema = RepositorySchema.extend({
  thread_id: z.number(),
  forum_id: z.number(),
  up_vote: z.number().optional(),
  down_vote: z.number().optional(),
  title: z.string().nullable(),
  content: z.string(),
});

export const ThreadsCommentSchema = RepositorySchema.extend({
  id: z.number(),
  thread_id: z.number(),
  user_id: z.string().uuid(),
  comment: z.string(),
});
export type UsersBasicDataRepo = z.infer<typeof UsersBasicDataSchema>;
export type PostsRepo = z.infer<typeof PostsSchema>;
export type UsersLoginDataRepo = z.infer<typeof UsersLoginDataSchema>;
export type MCategoriesRepo = z.infer<typeof MCategoriesSchema>;
export type PostsCategoryRepo = z.infer<typeof PostsCategorySchema>;
export type PostsAnalyticRepo = z.infer<typeof PostsAnalyticSchema>;
export type PostsCommentRepo = z.infer<typeof PostsCommentSchema>;
export type UsersAccessHistoryRepo = z.infer<typeof UsersAccessHistorySchema>;
export type UsersLoginTokenRepo = z.infer<typeof UsersLoginTokenSchema>;
export type UsersProfileRepo = z.infer<typeof UsersProfileSchema>;
export type UsersConnectionRepo = z.infer<typeof UsersConnection>;
export type NotificationsHistoryRepo = z.infer<typeof NotificationsHistorySchema>;
export type SmsHistoryRepo = z.infer<typeof SmsHistorySchema>;
export type UsersMessageRepo = z.infer<typeof UsersMessageSchema>;
export type MEmailTemplatesRepo = z.infer<typeof MEmailTemplatesSchema>;
export type UsersEmailHistoryRepo = z.infer<typeof UsersEmailHistorySchema>;
export type MCountriesRepo = z.infer<typeof MCountries>;
export type ForumsRepo = z.infer<typeof ForumsSchema>;
export type ForumsThreadRepo = z.infer<typeof ForumsThreadSchema>;
export type ThreadsCommentRepo = z.infer<typeof ThreadsCommentSchema>;
