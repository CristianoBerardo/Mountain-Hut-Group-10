import type { Config } from "jest";

const config: Config = {
  verbose: true,
  testMatch: ["**/?(*.)+(test).[jt]s?(x)"], // Matches only *.test.ts and *.test.js
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],

  // collectCoverage: true,
  // coverageDirectory: '<rootDir>/coverage',
  // collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
};

export default config;
