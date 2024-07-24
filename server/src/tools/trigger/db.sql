CREATE TABLE "users_basic_data"
(
    user_id          uuid PRIMARY KEY                       DEFAULT gen_random_uuid(),
    first_name       CHARACTER VARYING(100)        NOT NULL,
    last_name        CHARACTER VARYING(100)        NOT NULL,
    authorization_id INTEGER                       NOT NULL DEFAULT 2,
    email            CHARACTER VARYING(255) UNIQUE NOT NULL,
    phone_number     CHARACTER VARYING(20)                  DEFAULT NULL,
    delete_flag      INTEGER                                DEFAULT 0,
    ts_updated       TIMESTAMP WITH TIME ZONE               DEFAULT CURRENT_TIMESTAMP,
    ts_created       TIMESTAMP WITH TIME ZONE               DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "users_login_data"
(
    id              INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id         uuid                          NOT NULL UNIQUE,
    email           CHARACTER VARYING(255) UNIQUE NOT NULL,
    hashed_password CHARACTER VARYING(255)        NOT NULL,
    delete_flag     INTEGER                  DEFAULT 0,
    ts_updated      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users_basic_data (user_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION
);
CREATE TABLE "posts"
(
    post_id       INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id       uuid,
    private       BOOLEAN                         DEFAULT TRUE,
    status_code   INTEGER                NOT NULL DEFAULT 10, -- PENDING: 10/APPROVED: 20 --
    thumbnail_url CHARACTER VARYING(255)          DEFAULT NULL,
    title         CHARACTER VARYING(255) NOT NULL,
    content       TEXT,
    delete_flag   INTEGER                         DEFAULT 0,
    ts_updated    TIMESTAMP WITH TIME ZONE        DEFAULT CURRENT_TIMESTAMP,
    ts_created    TIMESTAMP WITH TIME ZONE        DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users_basic_data (user_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION
);
CREATE TABLE "m_categories"
(
    category_id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title       CHARACTER VARYING(255) NOT NULL UNIQUE,
    description TEXT,
    delete_flag INTEGER                  DEFAULT 0,
    ts_updated  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE posts_category
(
    id          INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    post_id     INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    delete_flag INTEGER                  DEFAULT 0,
    ts_updated  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts (post_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION,
    FOREIGN KEY (category_id) REFERENCES m_categories (category_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION
);
CREATE TABLE "posts_analytic"
(
    id          INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    post_id     INTEGER NOT NULL,
    up_votes    INTEGER                  DEFAULT 0,
    down_votes  INTEGER                  DEFAULT 0,
    views       INTEGER                  DEFAULT 0,
    delete_flag INTEGER                  DEFAULT 0,
    ts_updated  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts (post_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION
);
CREATE TABLE "posts_comment"
(
    comment_id  INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    post_id     INTEGER                NOT NULL,
    user_id     uuid                   NOT NULL,
    comment     CHARACTER VARYING(200) NOT NULL,
    path        TEXT,
    delete_flag INTEGER                  DEFAULT 0,
    ts_updated  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts (post_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION,
    FOREIGN KEY (user_id) REFERENCES users_basic_data (user_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION
);
CREATE TABLE "users_access_history"
(
    id          INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id     uuid         NOT NULL,
    user_agent  CHARACTER VARYING(255),
    ip_address  inet         NOT NULL,
    platform    VARCHAR(255) NOT NULL,
    delete_flag INTEGER                  DEFAULT 0,
    ts_updated  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users_basic_data (user_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION
);
CREATE TABLE "users_refresh_token"
(
    id            INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id       uuid   NOT NULL,
    refresh_token TEXT   NOT NULL,
    exp           BIGINT NOT NULL,
    iat           BIGINT NOT NULL,
    delete_flag   INTEGER                  DEFAULT 0,
    ts_updated    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users_basic_data (user_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION
);
CREATE TABLE "users_profile"
(
    id                INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id           uuid NOT NULL UNIQUE,
    profile_image_url TEXT                     DEFAULT NULL,
    country           CHARACTER VARYING(30)    DEFAULT NULL,
    address           TEXT                     DEFAULT NULL,
    stars             INTEGER                  DEFAULT 0,
    delete_flag       INTEGER                  DEFAULT 0,
    ts_updated        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users_basic_data (user_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION
);
CREATE TABLE "users_connection"
(
    id           INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    follower_id  uuid,
    following_id uuid,
    delete_flag  INTEGER                  DEFAULT 0,
    ts_updated   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users_basic_data (user_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION,
    FOREIGN KEY (following_id) REFERENCES users_basic_data (user_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION
);
CREATE TABLE "notifications_history"
(
    id                INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    receiver_id       uuid,
    sender_id         uuid,
    notification_type INTEGER NOT NULL,
    -- INFO: 10/NOTICE: 20/WARNING: 30/ERROR: 40/EMERGENCY: 50 --
    content           TEXT    NOT NULL,
    delete_flag       INTEGER                  DEFAULT 0,
    ts_updated        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (receiver_id) REFERENCES users_basic_data (user_id) MATCH SIMPLE ON DELETE NO ACTION,
    FOREIGN KEY (sender_id) REFERENCES users_basic_data (user_id) MATCH SIMPLE ON DELETE NO ACTION
);
CREATE TABLE "sms_history"
(
    id                    INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    receiver_phone_number VARCHAR(255) NOT NULL,
    receiver_id           uuid,
    content               TEXT         NOT NULL,
    sms_type              INTEGER      NOT NULL,
    -- OTP:1/NOTIFICATIONS:2--
    delete_flag           INTEGER                  DEFAULT 0,
    ts_updated            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (receiver_id) REFERENCES users_basic_data (user_id) ON DELETE NO ACTION
);
CREATE TABLE "users_message"
(
    id          INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    sender_id   uuid,
    receiver_id uuid,
    content     TEXT NOT NULL,
    delete_flag INTEGER                  DEFAULT 0,
    ts_updated  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (receiver_id) REFERENCES users_basic_data (user_id) ON DELETE NO ACTION,
    FOREIGN KEY (sender_id) REFERENCES users_basic_data (user_id) ON DELETE NO ACTION

);
CREATE TABLE "m_email_templates"
(
    id          INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    email_code  INTEGER      NOT NULL,
    title       VARCHAR(255) NOT NULL,
    lang        VARCHAR(30)  NOT NULL,
    template    TEXT         NOT NULL,
    delete_flag INTEGER                  DEFAULT 0,
    ts_updated  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "users_email_history"
(
    id          INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    email_code  INTEGER     NOT NULL,
    lang        VARCHAR(30) NOT NULL,
    sender_id   uuid,
    receiver_id uuid,
    delete_flag INTEGER                  DEFAULT 0,
    ts_updated  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users_basic_data (user_id) ON DELETE NO ACTION,
    FOREIGN KEY (receiver_id) REFERENCES users_basic_data (user_id) ON DELETE NO ACTION
);
CREATE TABLE "m_countries"
(
    id             INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    country_code   VARCHAR(255) NOT NULL,
    country_name   VARCHAR(255) NOT NULL,
    thumbnail      VARCHAR(255) NOT NULL,
    country_number VARCHAR(255) NOT NULL,
    delete_flag    INTEGER                  DEFAULT 0,
    ts_updated     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "forums"
(
    forum_id    INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title       VARCHAR(255) NOT NULL,
    admin_id    uuid,
    description TEXT                     DEFAULT NULL,
    forum_type  INTEGER                  DEFAULT 0, -- PUBLIC: 0/PRIVATE: 1 --
    members     uuid[]                   DEFAULT NULL,
    status      INTEGER                  DEFAULT 1, -- ACTIVE: 1, LOCK: 2, CLOSED: 3 --
    delete_flag INTEGER                  DEFAULT 0,
    ts_updated  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users_basic_data (user_id) ON DELETE NO ACTION
);
CREATE TABLE "forums_thread"
(
    thread_id   INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    forum_id    INTEGER NOT NULL,
    up_vote     INTEGER                  DEFAULT 0,
    down_vote   INTEGER                  DEFAULT 0,
    title       TEXT                     DEFAULT NULL,
    content     TEXT    NOT NULL,
    delete_flag INTEGER                  DEFAULT 0,
    ts_updated  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (forum_id) REFERENCES forums (forum_id) ON DELETE NO ACTION
);
-- TABLE THREAD COMMENTS
CREATE TABLE "threads_comment"
(
    id          INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    thread_id   INTEGER NOT NULL,
    user_id     uuid    NOT NULL,
    comment     TEXT    NOT NULL,
    delete_flag INTEGER                  DEFAULT 0,
    ts_updated  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ts_created  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES forums_thread (thread_id) MATCH SIMPLE ON DELETE NO ACTION
);
CREATE OR REPLACE FUNCTION update_ts_updated()
    RETURNS TRIGGER AS
$$
BEGIN
    NEW.ts_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_users_basic_data
    BEFORE
        UPDATE
    ON users_basic_data
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER update_users_login_data
    BEFORE
        UPDATE
    ON users_login_data
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER update_posts
    BEFORE
        UPDATE
    ON posts
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER update_m_categories
    BEFORE
        UPDATE
    ON m_categories
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER update_posts_category
    BEFORE
        UPDATE
    ON posts_category
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER update_users_refresh_token
    BEFORE
        UPDATE
    ON users_refresh_token
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER update_posts_analytic
    BEFORE
        UPDATE
    ON posts_analytic
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER update_posts_comment
    BEFORE
        UPDATE
    ON posts_comment
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER update_users_profile
    BEFORE
        UPDATE
    ON users_profile
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER update_users_connection
    BEFORE
        UPDATE
    ON users_connection
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER update_notifications_history
    BEFORE
        UPDATE
    ON notifications_history
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER update_users_access_history
    BEFORE
        UPDATE
    ON users_access_history
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER update_users_message
    BEFORE
        UPDATE
    ON users_message
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER update_sms_history
    BEFORE
        UPDATE
    ON sms_history
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER update_m_email_templates
    BEFORE
        UPDATE
    ON m_email_templates
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER update_users_email_history
    BEFORE
        UPDATE
    ON users_email_history
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER update_m_countries
    BEFORE
        UPDATE
    ON m_countries
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER update_forums_thread
    BEFORE
        UPDATE
    ON forums_thread
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER update_threads_comment
    BEFORE
        UPDATE
    ON threads_comment
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
CREATE TRIGGER update_forums
    BEFORE
        UPDATE
    ON forums
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();
