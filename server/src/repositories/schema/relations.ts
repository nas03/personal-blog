import { relations } from "drizzle-orm/relations";
import { posts, comments, users_basic_data, user_access_histories, post_category, categories, user_refresh_tokens, users_profile } from "./schema";

export const commentsRelations = relations(comments, ({one}) => ({
	post: one(posts, {
		fields: [comments.post_id],
		references: [posts.post_id]
	}),
	users_basic_datum: one(users_basic_data, {
		fields: [comments.user_id],
		references: [users_basic_data.user_id]
	}),
}));

export const postsRelations = relations(posts, ({one, many}) => ({
	comments: many(comments),
	post_categories: many(post_category),
	users_basic_datum: one(users_basic_data, {
		fields: [posts.user_id],
		references: [users_basic_data.user_id]
	}),
}));

export const users_basic_dataRelations = relations(users_basic_data, ({many}) => ({
	comments: many(comments),
	user_access_histories: many(user_access_histories),
	posts: many(posts),
	user_refresh_tokens: many(user_refresh_tokens),
	users_profiles: many(users_profile),
}));

export const user_access_historiesRelations = relations(user_access_histories, ({one}) => ({
	users_basic_datum: one(users_basic_data, {
		fields: [user_access_histories.user_id],
		references: [users_basic_data.user_id]
	}),
}));

export const post_categoryRelations = relations(post_category, ({one}) => ({
	post: one(posts, {
		fields: [post_category.post_id],
		references: [posts.post_id]
	}),
	category: one(categories, {
		fields: [post_category.category_id],
		references: [categories.category_id]
	}),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	post_categories: many(post_category),
}));

export const user_refresh_tokensRelations = relations(user_refresh_tokens, ({one}) => ({
	users_basic_datum: one(users_basic_data, {
		fields: [user_refresh_tokens.user_id],
		references: [users_basic_data.user_id]
	}),
}));

export const users_profileRelations = relations(users_profile, ({one}) => ({
	users_basic_datum: one(users_basic_data, {
		fields: [users_profile.user_id],
		references: [users_basic_data.user_id]
	}),
}));