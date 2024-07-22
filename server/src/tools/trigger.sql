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
