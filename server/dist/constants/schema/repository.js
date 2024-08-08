"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreadsCommentSchema = exports.ForumsThreadSchema = exports.ForumsSchema = exports.MCountries = exports.UsersEmailHistorySchema = exports.MEmailTemplatesSchema = exports.UsersMessageSchema = exports.SmsHistorySchema = exports.NotificationsHistorySchema = exports.UsersConnection = exports.UsersProfileSchema = exports.UsersLoginTokenSchema = exports.UsersAccessHistorySchema = exports.PostsCommentSchema = exports.PostsAnalyticSchema = exports.PostsCategorySchema = exports.MCategoriesSchema = exports.PostsSchema = exports.UsersLoginDataSchema = exports.UsersBasicDataSchema = void 0;
const zod_1 = require("zod");
const RepositorySchema = zod_1.z.object({
    delete_flag: zod_1.z.number().min(0).max(1).optional(),
    ts_updated: zod_1.z.string().datetime().optional(),
    ts_created: zod_1.z.string().datetime().optional(),
});
exports.UsersBasicDataSchema = RepositorySchema.extend({
    user_id: zod_1.z.string().uuid(),
    first_name: zod_1.z.string(),
    last_name: zod_1.z.string(),
    authorization_id: zod_1.z.number().min(1).max(2),
    email: zod_1.z.string(),
    phone_number: zod_1.z.string().nullable(),
});
exports.UsersLoginDataSchema = RepositorySchema.extend({
    id: zod_1.z.number(),
    user_id: zod_1.z.string().uuid(),
    email: zod_1.z.string().email(),
    hashed_password: zod_1.z.string(),
    last_login_date: zod_1.z.string().datetime().nullable(),
    last_login_ip: zod_1.z.string().ip().nullable(),
});
exports.PostsSchema = RepositorySchema.extend({
    post_id: zod_1.z.number(),
    user_id: zod_1.z.string().uuid(),
    private: zod_1.z.boolean().default(true),
    status_code: zod_1.z.number().default(10),
    thumbnail_url: zod_1.z.string().nullish(),
    title: zod_1.z.string(),
    content: zod_1.z.string().nullish(),
});
exports.MCategoriesSchema = RepositorySchema.extend({
    category_id: zod_1.z.number(),
    title: zod_1.z.string(),
    description: zod_1.z.string().nullish(),
});
exports.PostsCategorySchema = RepositorySchema.extend({
    id: zod_1.z.number(),
    post_id: zod_1.z.number(),
    category_id: zod_1.z.number(),
});
exports.PostsAnalyticSchema = RepositorySchema.extend({
    id: zod_1.z.number(),
    post_id: zod_1.z.number(),
    up_votes: zod_1.z.number().optional(),
    down_votes: zod_1.z.number().optional(),
    views: zod_1.z.number().optional(),
});
exports.PostsCommentSchema = RepositorySchema.extend({
    comment_id: zod_1.z.number(),
    post_id: zod_1.z.number(),
    user_id: zod_1.z.string().uuid(),
    comment: zod_1.z.string().max(255),
    path: zod_1.z.string().nullable(),
});
exports.UsersAccessHistorySchema = RepositorySchema.extend({
    id: zod_1.z.number(),
    user_id: zod_1.z.string().uuid(),
    user_agent: zod_1.z.string().nullable(),
    ip_address: zod_1.z.string().ip(),
    platform: zod_1.z.string(),
});
exports.UsersLoginTokenSchema = RepositorySchema.extend({
    id: zod_1.z.number(),
    user_id: zod_1.z.string().uuid(),
    session_id: zod_1.z.string().uuid(),
    access_token: zod_1.z.string(),
    refresh_token: zod_1.z.string(),
    exp: zod_1.z.number(),
    iat: zod_1.z.number(),
});
exports.UsersProfileSchema = RepositorySchema.extend({
    id: zod_1.z.number(),
    user_id: zod_1.z.string().uuid(),
    profile_image_url: zod_1.z.string().nullish(),
    country: zod_1.z.string().max(30).nullish(),
    address: zod_1.z.string().nullish(),
    stars: zod_1.z.number().optional(),
});
exports.UsersConnection = RepositorySchema.extend({
    id: zod_1.z.number(),
    follower_id: zod_1.z.string().uuid(),
    following_id: zod_1.z.string().uuid(),
});
exports.NotificationsHistorySchema = RepositorySchema.extend({
    id: zod_1.z.number(),
    receiver_id: zod_1.z.string().uuid(),
    sender_id: zod_1.z.string().uuid(),
    notification_type: zod_1.z.number() /* INFO: 10/NOTICE: 20/WARNING: 30/ERROR: 40/EMERGENCY: 50 */,
    content: zod_1.z.string(),
});
exports.SmsHistorySchema = RepositorySchema.extend({
    id: zod_1.z.number(),
    receiver_phone_number: zod_1.z.string().max(255),
    receiver_id: zod_1.z.string().uuid(),
    content: zod_1.z.string(),
    sms_type: zod_1.z.number() /* OTP:1/NOTIFICATIONS:2 */,
});
exports.UsersMessageSchema = RepositorySchema.extend({
    id: zod_1.z.number(),
    sender_id: zod_1.z.string().uuid(),
    receiver_id: zod_1.z.string().uuid(),
    content: zod_1.z.string(),
});
exports.MEmailTemplatesSchema = RepositorySchema.extend({
    id: zod_1.z.number(),
    email_code: zod_1.z.number(),
    title: zod_1.z.string().max(255),
    lang: zod_1.z.string().max(255),
    template: zod_1.z.string(),
});
exports.UsersEmailHistorySchema = RepositorySchema.extend({
    id: zod_1.z.number(),
    email_code: zod_1.z.number(),
    lang: zod_1.z.string().max(30),
    sender_id: zod_1.z.string().uuid(),
    receiver_id: zod_1.z.string().uuid(),
});
exports.MCountries = RepositorySchema.extend({
    id: zod_1.z.number(),
    country_code: zod_1.z.string().max(255),
    country_name: zod_1.z.string().max(255),
    thumbnail: zod_1.z.string().max(255),
    country_number: zod_1.z.string().max(255),
});
exports.ForumsSchema = RepositorySchema.extend({
    forum_id: zod_1.z.number(),
    title: zod_1.z.string().max(255),
    admin_id: zod_1.z.string().uuid(),
    description: zod_1.z.string(),
    forum_type: zod_1.z.number().optional() /*PUBLIC: 0/PRIVATE: 1  */,
    members: zod_1.z.array(zod_1.z.string().uuid()).nullish(),
    status: zod_1.z.number().optional(),
});
exports.ForumsThreadSchema = RepositorySchema.extend({
    thread_id: zod_1.z.number(),
    forum_id: zod_1.z.number(),
    up_vote: zod_1.z.number().optional(),
    down_vote: zod_1.z.number().optional(),
    title: zod_1.z.string().nullable(),
    content: zod_1.z.string(),
});
exports.ThreadsCommentSchema = RepositorySchema.extend({
    id: zod_1.z.number(),
    thread_id: zod_1.z.number(),
    user_id: zod_1.z.string().uuid(),
    comment: zod_1.z.string(),
});
