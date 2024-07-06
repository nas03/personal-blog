CREATE TABLE IF NOT EXISTS "user"
(
    user_id         UUID               DEFAULT gen_random_uuid(),
    first_name      VARCHAR(100)        NOT NULL,
    last_name       VARCHAR(100)        NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    phone_number    VARCHAR(20) UNIQUE DEFAULT NULL,
    hashed_password VARCHAR(255)        NOT NULL,
    is_admin        BOOLEAN            DEFAULT FALSE,
    ts_updated      TIMESTAMPTZ        DEFAULT CURRENT_TIMESTAMP,
    ts_created      TIMESTAMPTZ        DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id)
);

CREATE TABLE IF NOT EXISTS "post"
(
    post_id       INT GENERATED ALWAYS AS IDENTITY,
    user_id       uuid                    NOT NULL,
    thumbnail_url VARCHAR(255) DEFAULT '' NOT NULL,
    title         VARCHAR(255) DEFAULT '' NOT NULL,
    content       TEXT         DEFAULT '' NOT NULL,
    ts_updated    TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    ts_registered TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES "user" (user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "comment"
(
    comment_id    INT GENERATED ALWAYS AS IDENTITY,
    post_id       INT  NOT NULL,
    user_id       uuid NOT NULL,
    comment       VARCHAR(200) DEFAULT '',
    ts_updated    TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    ts_registered TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (comment_id),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES "user" (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_post FOREIGN KEY (post_id) REFERENCES "post" (post_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "category"
(
    category_id   INT GENERATED ALWAYS AS IDENTITY,
    title         VARCHAR(255) DEFAULT '' NOT NULL,
    description   TEXT         DEFAULT '' NOT NULL,
    ts_updated    TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    ts_registered TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (category_id)
);

CREATE TABLE IF NOT EXISTS  "post_category"
(
    id            INT GENERATED ALWAYS AS IDENTITY,
    post_id       INT NOT NULL,
    category_id   INT NOT NULL,
    ts_updated    TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    ts_registered TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_post FOREIGN KEY (post_id) REFERENCES post (post_id) ON DELETE CASCADE,
    CONSTRAINT fK_category FOREIGN KEY (category_id) REFERENCES category (category_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "user_refresh_token"
(
    id            INT GENERATED ALWAYS AS IDENTITY,
    user_id       uuid         NOT NULL,
    refresh_token TEXT        NOT NULL,
    ts_expired    timestamptz NOT NULL,
    ts_updated    timestamptz DEFAULT CURRENT_TIMESTAMP,
    ts_registered timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES "user" (user_id)
);

CREATE TABLE IF NOT EXISTS "user_access_history"
(
    id            INT GENERATED ALWAYS AS IDENTITY,
    user_id       uuid          NOT NULL,
    user_agent    VARCHAR(255) NOT NULL,
    ip_address    inet         NOT NULL,
    ts_updated    timestamptz DEFAULT CURRENT_TIMESTAMP,
    ts_registered timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fK_user FOREIGN KEY (user_id) REFERENCES "user" (user_id)
);

CREATE OR REPLACE FUNCTION update_ts_updated_column()
    RETURNS TRIGGER AS
$$
BEGIN
    NEW.ts_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger that calls the function before each row update
CREATE TRIGGER update_timestamp
    BEFORE UPDATE
    ON "user"
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated_column();

CREATE TRIGGER update_timestamp
    BEFORE UPDATE
    ON "post"
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated_column();

CREATE TRIGGER update_timestamp
    BEFORE UPDATE
    ON "category"
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated_column();

CREATE TRIGGER update_timestamp
    BEFORE UPDATE
    ON "comment"
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated_column();

CREATE TRIGGER update_timestamp
    BEFORE UPDATE
    ON "user_access_history"
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated_column();

CREATE TRIGGER update_timestamp
    BEFORE UPDATE
    ON "user_refresh_token"
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated_column();

CREATE TRIGGER update_timestamp
    BEFORE UPDATE
    ON "post_category"
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated_column();