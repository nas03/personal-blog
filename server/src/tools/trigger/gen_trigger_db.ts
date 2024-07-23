import fs from "fs";
import readLine from "readline";

const getTrigger = async (): Promise<string[]> => {
  const fileStream = fs.createReadStream("src/tools/trigger/triggers.sql");
  const rl = readLine.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const triggers: string[] = [];
  for await (const line of rl) {
    let trigger: string = ``;

    if (line != "") trigger += line;
    else {
      triggers.push(trigger);
      trigger = "";
    }
  }
  return triggers;
};


async function generateTriggers() {
  // TODO: Create loop for multiple trigger
  // const triggers = await getTrigger()
  const fileStream = fs.createReadStream("src/tools/trigger/db.sql");

  const rl = readLine.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.
  for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.
    if (line.includes("CREATE TABLE")) {
      const lineTokens = line.split(" ");
      const table = lineTokens[lineTokens.length - 1].replace(/"/g, "").trim();
      const content = `CREATE TRIGGER update_${table}
    BEFORE
        UPDATE
    ON ${table}
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();\n`;
      fs.appendFile("src/tools/trigger.sql", content, (err) => {
        err && console.log(err);
      });
    }
  }
}

generateTriggers();
