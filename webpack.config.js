const webpack = require('webpack');
const path = require('path');
const fs = require("fs");

var config = {
  resolve: {
    extensions: ['.js']
  },
  plugins: [
    new webpack.ProvidePlugin({
      PennController: [path.resolve(__dirname, 'src/penncontroller.js'), 'PennController']
    }),
    new webpack.BannerPlugin(fs.readFileSync('./src/banner', 'utf8')),
  ]
};

module.exports = (env, argv) => {
  if (argv.mode === 'development') {
    config.entry = './src/index_dev.js';
    config.devtool = 'inline-source-map';
    config.output = {
      filename: 'PennController.js',
      path: path.resolve(__dirname, 'dev/js_includes')
    };
  }
  if (argv.mode === 'production') {
    config.entry = './src/index_prod.js';
    config.output = {
      filename: 'PennController.js',
      path: path.resolve(__dirname, 'dist')
    };
  }
  return config;
};