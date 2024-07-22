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
    ts_created      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users_basic_data (user_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "posts"
(
    post_id       INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id       uuid                   NOT NULL,
    private       BOOLEAN                  DEFAULT TRUE,
    status_code   INTEGER                NOT NULL,
    thumbnail_url CHARACTER VARYING(255)   DEFAULT NULL,
    title         CHARACTER VARYING(255) NOT NULL,
    content       TEXT                   NOT NULL,
    ts_updated    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users_basic_data (user_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "m_categories"
(
    category_id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title       CHARACTER VARYING(255) NOT NULL UNIQUE,
    description TEXT                   NOT NULL,
    ts_updated  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE posts_category
(
    id          INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    post_id     INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    ts_updated  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts (user_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES m_categories (category_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE
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
    profile_image_url TEXT                     DEFAULT NULL,
    country           CHARACTER VARYING(30)    DEFAULT NULL,
    address           TEXT                     DEFAULT NULL,
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
CREATE TABLE IF NOT EXISTS "notifications_history"
(
    id                INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    receiver_id       uuid    NOT NULL,
    sender_id         uuid    NOT NULL,
    notification_type INTEGER NOT NULL,
    -- INFO: 10/NOTICE: 20/WARNING: 30/ERROR: 40/EMERGENCY: 50 --
    content           TEXT    NOT NULL,
    ts_updated        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (receiver_id) REFERENCES users_basic_data (user_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users_basic_data (user_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "sms_history"
(
    id                    INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    receiver_phone_number VARCHAR(255) NOT NULL,
    content               TEXT         NOT NULL,
    sms_type              INTEGER      NOT NULL,
    -- OTP:1/NOTIFICATIONS:2--
    ts_updated            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
CREATE TABLE "m_emails_template"
(
    id         INTEGER GENERATED ALWAYS AS IDENTITY,
    email_code INTEGER      NOT NULL,
    title      VARCHAR(255) NOT NULL,
    lang       VARCHAR(30)  NOT NULL,
    template   TEXT         NOT NULL,
    ts_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE users_email_history
(
    id          INTEGER GENERATED ALWAYS AS IDENTITY,
    email_code  INTEGER     NOT NULL,
    lang        VARCHAR(30) NOT NULL,
    sender_id   uuid        NOT NULL,
    receiver_id uuid        NOT NULL,
    ts_updated  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE m_countries
(
    id             INTEGER GENERATED ALWAYS AS IDENTITY,
    country_code   VARCHAR(255) NOT NULL,
    country_name   VARCHAR(255) NOT NULL,
    thumbnail      VARCHAR(255) NOT NULL,
    country_number VARCHAR(255) NOT NULL,
    ts_updated     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE forums
(
    forum_id    INTEGER GENERATED ALWAYS AS IDENTITY,
    title       VARCHAR(255) NOT NULL,
    admin_id    uuid         NOT NULL,
    description TEXT                     DEFAULT NULL,
    forum_type  VARCHAR(255)             DEFAULT 'PUBLIC', --PUBLIC/PRIVATE--
    members     uuid[]                   DEFAULT NULL,
    status      INTEGER                  DEFAULT 1,        -- ACTIVE: 1, LOCK: 2, CLOSED: 3 --
    ts_updated  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE thread
(
    thread_id  INTEGER GENERATED ALWAYS AS IDENTITY,
    forum_id   INTEGER NOT NULL,
    title      TEXT                     DEFAULT NULL,
    content    TEXT    NOT NULL,
    ts_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- TABLE THREAD COMMENTS
CREATE TABLE thread_comments
(
    id         INTEGER GENERATED ALWAYS AS IDENTITY,
    thread_id  INTEGER NOT NULL,
    user_id    uuid    NOT NULL,
    comment    TEXT    NOT NULL,
    ts_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE OR REPLACE FUNCTION update_ts_updated()
    RETURNS TRIGGER AS
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