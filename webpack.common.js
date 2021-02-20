const path = require("path")

module.exports = {
  entry: {
    todo: path.join(__dirname, "src/index.tsx")
  },
  output: {
    path: path.join(__dirname, "dist/js"),
    filename: "[name].js"
  },
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.tsx?$/,
        use: "ts-loader"
      },
      {
        test: /\.(css|scss)$/,
        use: [
          {
            loader: "style-loader"
          },
          {
            loader: "css-loader"
          },
          {
            loader: "sass-loader"
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    alias: {
      "@src": path.resolve(__dirname, "src/")
    },
    mainFields: ["module", "main"],
    fallback: {
      path: false
    }
  },
  stats: {
    // Display bailout reasons
    optimizationBailout: false
  }
}
