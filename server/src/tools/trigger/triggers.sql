CREATE OR REPLACE FUNCTION update_ts_updated() RETURNS TRIGGER AS $$ BEGIN NEW.ts_updated = NOW();
RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';