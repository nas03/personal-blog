CREATE TABLE IF NOT EXISTS "users_basic_data"
(
    user_id          uuid PRIMARY KEY                       DEFAULT gen_random_uuid(),
    first_name       CHARACTER VARYING(100)        NOT NULL,
    last_name        CHARACTER VARYING(100)        NOT NULL,
    authorization_id INTEGER                       NOT NULL DEFAULT 2,
    email            CHARACTER VARYING(255) UNIQUE NOT NULL,
    phone_number     CHARACTER VARYING(20)                  DEFAULT NULL,
    ts_updated       TIMESTAMP WITH TIME ZONE               DEFAULT CURRENT_TIMESTAMP,
    ts_created       TIMESTAMP WITH TIME ZONE               DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "users_login_data"
(
    id              INTEGER GENERATED ALWAYS AS IDENTITY,
    user_id         uuid                          NOT NULL UNIQUE,
    email           CHARACTER VARYING(255) UNIQUE NOT NULL,
    hashed_password CHARACTER VARYING(255) UNIQUE NOT NULL,
    ts_updated      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "posts"
(
    post_id       INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id       uuid                   NOT NULL,
    private       BOOLEAN                  DEFAULT TRUE,
    categories    INTEGER[],
    thumbnail_url CHARACTER VARYING(255),
    title         CHARACTER VARYING(255) NOT NULL,
    content       TEXT                   NOT NULL,
    ts_updated    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users_basic_data (user_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE
);
CREATE TABLE "posts_analytic"
(
    id         INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    post_id    INTEGER NOT NULL,
    up_votes   INTEGER                  DEFAULT 0,
    down_votes INTEGER                  DEFAULT 0,
    views      INTEGER                  DEFAULT 0,
    ts_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts (post_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "categories"
(
    category_id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title       CHARACTER VARYING(255) NOT NULL UNIQUE,
    description TEXT                   NOT NULL,
    ts_updated  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "comments"
(
    comment_id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    post_id    INTEGER                NOT NULL,
    user_id    uuid                   NOT NULL,
    comment    CHARACTER VARYING(200) NOT NULL,
    ts_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts (post_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users_basic_data (user_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "users_access_history"
(
    id         INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id    uuid                   NOT NULL,
    user_agent CHARACTER VARYING(255) NOT NULL,
    ip_address inet                   NOT NULL,
    platform   VARCHAR(255)           NOT NULL,
    ts_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users_basic_data (user_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "users_refresh_token"
(
    id            INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id       uuid   NOT NULL,
    refresh_token TEXT   NOT NULL,
    exp           BIGINT NOT NULL,
    iat           BIGINT NOT NULL,
    ts_updated    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users_basic_data (user_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "users_profile"
(
    id                INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id           uuid NOT NULL UNIQUE,
    profile_image_url TEXT,
    country           CHARACTER VARYING(30)    DEFAULT NULL,
    address           TEXT,
    stars             INTEGER                  DEFAULT 0,
    ts_updated        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users_basic_data (user_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "users_connection"
(
    id           INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    follower_id  uuid NOT NULL,
    following_id uuid NOT NULL,
    ts_updated   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users_basic_data (user_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users_basic_data (user_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "notifications"
(
    id                INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id           uuid NOT NULL,
    sender_id         uuid NOT NULL,
    notification_type VARCHAR(50),
    content           TEXT NOT NULL,
    ts_updated        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users_basic_data (user_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users_basic_data (user_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE
);
CREATE TABLE "users_message"
(
    id          INTEGER GENERATED ALWAYS AS IDENTITY,
    sender_id   uuid NOT NULL,
    receiver_id uuid NOT NULL,
    content     TEXT NOT NULL,
    ts_updated  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users_basic_data (user_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users_basic_data (user_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE
);
CREATE TABLE "emails_template"
(
    id                INTEGER GENERATED ALWAYS AS IDENTITY,
    email_code        INTEGER      NOT NULL,
    title             VARCHAR(255) NOT NULL,
    lang              VARCHAR(30)  NOT NULL,
    template          TEXT         NOT NULL,
    ts_updated        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
CREATE TRIGGER user_access_histories
    BEFORE
        UPDATE
    ON users_access_history
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER user_refresh_tokens
    BEFORE
        UPDATE
    ON users_refresh_token
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER users_profile
    BEFORE
        UPDATE
    ON users_profile
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER posts_analytic
    BEFORE
        UPDATE
    ON posts_analytic
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER users_connection
    BEFORE
        UPDATE
    ON users_connection
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER notifications
    BEFORE
        UPDATE
    ON notifications
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER users_message
    BEFORE
        UPDATE
    ON users_message
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER emails_template
    BEFORE
        UPDATE
    ON emails_template
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
