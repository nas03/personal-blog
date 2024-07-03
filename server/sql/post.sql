CREATE TABLE "post"
(
    post_id       uuid PRIMARY KEY        NOT NULL,
    user_id       uuid                    NOT NULL,
    thumbnail_url VARCHAR(255) DEFAULT '' NOT NULL,
    title         VARCHAR(255) DEFAULT '' NOT NULL,
    content       TEXT         DEFAULT '' NOT NULL
)