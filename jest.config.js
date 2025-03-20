export default {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@modelcontextprotocol/sdk/(.*)$":
      "<rootDir>/node_modules/@modelcontextprotocol/sdk/dist/esm/$1",
  },
  testMatch: ["<rootDir>/test/**/*.test.ts"],
};
