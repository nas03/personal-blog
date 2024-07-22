import fs from "fs";
const tables = ["posts", "users_basic_data"];

tables.forEach((table) => {
  const content = `CREATE TRIGGER ${table}
    BEFORE
        UPDATE
    ON ${table}
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();\n`;
  fs.appendFile("src/tools/trigger.sql", content, (err) => {
    console.log(err);
  });
});
