## Database Design

- Tables:
  - users (user_id, name, email, hashedPassword, isAdmin)
  - posts (post_id, user_id, est_read_time, thumbnail_url, title, content, ts_updated, ts_registered, view_number, like_number, dislike_number)
  - categories (category_id, title, description)
  - post_category (post_id, category_id)
  - post_comments (id, post_id, user_id, comment) (limit comment to 150 words)
  - post_medias (id, post_id, file_type, file_url)
  - 
  - user_access_history (id, user_id, user_agent, ip_address, ts_registered)
  - user_refresh_tokens (id, user_id, access_token, expired, delete_flag, ts_registered)

- Buckets:
