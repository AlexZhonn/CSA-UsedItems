export default {
  testEnvironment: "node",
  transform: {},
  testMatch: ["**/tests/**/*.test.js"],
  setupFilesAfterFramework: ["./tests/setup.js"],
  testTimeout: 30000,
  env: {
    JWT_SECRET: "test_secret_for_jest",
    PORT: "3001",
  },
};
