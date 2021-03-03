module.exports = {
  moduleFileExtensions: ["js", "json", "jsx", "ts", "tsx", "node"],
  moduleNameMapper: {
    "@src/(.*)": "<rootDir>/src/$1",
    "\\.(css|less|scss|sss|styl)$": "<rootDir>/node_modules/jest-css-modules",
    "^lodash-es": "lodash"
  },
  roots: ["<rootDir>/src"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/node_modules/(?!lodash-es/set)"
  ],
  transform: {
    "\\.tsx?$": "ts-jest"
  },
  setupFiles: ["<rootDir>/jest.setup.js"]
}
