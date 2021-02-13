module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }, "lodash"],
    "@babel/preset-typescript"
  ]
}
