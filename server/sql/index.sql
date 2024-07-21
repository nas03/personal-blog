CREATE TABLE IF NOT EXISTS "users_basic_data"
(
    user_id          uuid PRIMARY KEY                DEFAULT gen_random_uuid(),
    first_name       CHARACTER VARYING(100) NOT NULL,
    last_name        CHARACTER VARYING(100) NOT NULL,
    authorization_id INTEGER                NOT NULL DEFAULT 2
        email CHARACTER VARYING (255) NOT NULL,
    phone_number     CHARACTER VARYING(20)           DEFAULT NULL,
    hashed_password  CHARACTER VARYING(255) NOT NULL,
    ts_updated       TIMESTAMP WITH TIME ZONE        DEFAULT CURRENT_TIMESTAMP,
    ts_created       TIMESTAMP WITH TIME ZONE        DEFAULT CURRENT_TIMESTAMP,
);
CREATE TABLE IF NOT EXISTS "posts"
(
    post_id       INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id       uuid                   NOT NULL,
    categories    INTEGER[],
    thumbnail_url CHARACTER VARYING(255) NOT NULL DEFAULT '',
    title         CHARACTER VARYING(255) NOT NULL DEFAULT '',
    content       TEXT                   NOT NULL DEFAULT ''::TEXT,
    ts_updated    TIMESTAMP WITH TIME ZONE        DEFAULT CURRENT_TIMESTAMP,
    ts_registered TIMESTAMP WITH TIME ZONE        DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users_basic_data (user_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "categories"
(
    category_id   INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title         CHARACTER VARYING(255) NOT NULL DEFAULT '',
    description   TEXT                   NOT NULL DEFAULT ''::TEXT,
    ts_updated    TIMESTAMP WITH TIME ZONE        DEFAULT CURRENT_TIMESTAMP,
    ts_registered TIMESTAMP WITH TIME ZONE        DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "comments"
(
    comment_id    INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    post_id       INTEGER NOT NULL,
    user_id       uuid    NOT NULL,
    COMMENT       CHARACTER VARYING(200)   DEFAULT '',
    ts_updated    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_registered TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts (post_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users_basic_data (user_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "user_access_histories"
(
    id            INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id       uuid                   NOT NULL,
    user_agent    CHARACTER VARYING(255) NOT NULL,
    ip_address    inet                   NOT NULL,
    ts_updated    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_registered TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users_basic_data (user_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "user_refresh_tokens"
(
    id            INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id       uuid   NOT NULL,
    refresh_token TEXT   NOT NULL,
    exp           BIGINT NOT NULL,
    iat           BIGINT NOT NULL,
    ts_updated    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_registered TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users_basic_data (user_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS user_email_key ON users_basic_data USING btree (email);
CREATE UNIQUE INDEX IF NOT EXISTS  user_phone_number_key ON users_basic_data USING btree (phone_number);
CREATE TABLE IF NOT EXISTS "users_profile"
(
    id                INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id           uuid NOT NULL UNIQUE,
    profile_image_url TEXT,
    country           CHARACTER VARYING(30)    DEFAULT NULL,
    address           TEXT,
    FOREIGN KEY (user_id) REFERENCES users_basic_data (user_id),
    ts_updated        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users_basic_data (user_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE
);
CREATE OR REPLACE FUNCTION update_ts_updated() RETURNS TRIGGER AS
$$
BEGIN
    NEW.ts_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';
CREATE TRIGGER users_basic_data
    BEFORE
        UPDATE
    ON users_basic_data
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER posts
    BEFORE
        UPDATE
    ON posts
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER categories
    BEFORE
        UPDATE
    ON categories
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER comments
    BEFORE
        UPDATE
    ON comments
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER post_category
    BEFORE
        UPDATE
    ON post_category
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER user_access_histories
    BEFORE
        UPDATE
    ON user_access_histories
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER user_refresh_tokens
    BEFORE
        UPDATE
    ON user_refresh_tokens
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER users_profile
    BEFORE
        UPDATE
    ON users_profile
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();