import fs from "fs";
import readLine from "readline";

// const getTokenFromLine = async(s: string, )
async function generateTypesFromSchemas() {
  // COPY INITIAL DATA TO output.ts
  const copyFile = await fs.copyFile("src/tools/schema/input.ts", "src/tools/schema/output.ts", (err) => err && console.log(err));
  // APPEND THE PROCESSED TYPES
  const fileStream = fs.createReadStream("src/tools/schema/input.ts");

  const rl = readLine.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (line.includes("export const")) {
      const lineTokens = line.split(" ");
      const schemaName = lineTokens[2];
      const typeName = schemaName.replace("Schema", "").concat("Repo");
      const appendLine = `export type ${typeName} = z.infer<typeof ${schemaName}>;\n`;

      fs.appendFile("src/tools/schema/output.ts", appendLine, (err) => {
        err && console.log(err);
      });
    }
  }
}

generateTypesFromSchemas();
