/** @type {import('ts-jest').JestConfigWithTsJest} */
const config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.test.json",
        useESM: true,
      },
    ],
  },
  transformIgnorePatterns: [],
  testMatch: ["<rootDir>/test/**/*.test.ts"],
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  extensionsToTreatAsEsm: [".ts", ".tsx"],
};

export default config;
