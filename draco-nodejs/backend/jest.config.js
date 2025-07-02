const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  // Only test TypeScript files in src directory
  testMatch: [
    "**/src/**/*.test.ts",
    "**/src/**/*.test.tsx"
  ],
  // Exclude compiled output and declaration files
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "\\.d\\.ts$"
  ],
  // Make sure we're testing source files, not compiled
  roots: ["<rootDir>/src"],
  // Module file extensions
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
};