module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.ts?(x)", "**/?(*.)+(spec|test).ts?(x)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/index.tsx",
    "!src/**/*.spec.ts"
  ],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          esModuleInterop: true
        }
      }
    ]
  },
  transformIgnorePatterns: [
    "node_modules/(?!(lodash-es)/)"
  ],
  moduleNameMapper: {
    "^lodash-es$": "lodash",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy"
  }
}
