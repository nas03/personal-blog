CREATE TABLE "user"
(
    user_id         UUID PRIMARY KEY    NOT NULL,
    first_name      VARCHAR(100)        NOT NULL,
    last_name       VARCHAR(100)        NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    phone_number    VARCHAR(20) UNIQUE DEFAULT NULL,
    hashed_password varchar(255)        NOT NULL,
    is_admin        BOOLEAN            DEFAULT FALSE,
    ts_updated      TIMESTAMPTZ        DEFAULT CURRENT_TIMESTAMP,
    ts_created      TIMESTAMPTZ        DEFAULT current_timestamp
);

-- Create the trigger function to update the ts_updated column
CREATE OR REPLACE  FUNCTION update_ts_updated_column()
RETURNS  TRIGGER AS $$
BEGIN
    NEW.ts_updated = CURRENT_TIMESTAMP;
    return NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger that calls the function before each row update
CREATE TRIGGER update_timestamp
BEFORE  UPDATE ON "user"
FOR EACH ROW
EXECUTE FUNCTION update_ts_updated_column();