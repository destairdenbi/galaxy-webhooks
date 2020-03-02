const LicenseWebpackPlugin = require('license-webpack-plugin').LicenseWebpackPlugin;

module.exports = {
  output: {
    path: __dirname,
    filename: "script.js"
  },
  optimization:{
      minimize: false,
  },
  plugins: [
    new LicenseWebpackPlugin()
  ],
  mode:'production',
}
