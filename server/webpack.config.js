const path = require("path");

module.exports = {
  entry: "./src/server.ts",
  target: "node",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "server.js",
  },
  externals: {
    // Possible drivers for knex - we'll ignore them
    sqlite3: "sqlite3",
    mariasql: "mariasql",
    mssql: "mssql",
    mysql: "mysql",
    oracle: "oracle",
    "strong-oracle": "strong-oracle",
    oracledb: "oracledb",
    "pg-query-stream": "pg-query-stream",
    postgres: "postgres",
    "better-sqlite3": "better-sqlite3",
    mysql2: "mysql2",
    tedious: "tedious",
    "pg-native": "pg-native",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
};
