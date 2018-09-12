const webpack = require('webpack');
const path = require('path');
const fs = require("fs");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

var config = {
  resolve: {
    extensions: ['.js']
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: fs.readFileSync('./src/banner', 'utf8'),
      exclude: /.*PennElement.*/
    }),
    new BundleAnalyzerPlugin()
  ]
};

module.exports = (env, argv) => {
  if (argv.mode === 'development') {
    config.entry = './src/index_core.js';
    config.devtool = 'inline-source-map';
    config.output = {
      filename: 'PennController.js',
      path: path.resolve(__dirname, 'dev/js_includes')
    };
  }
  if (argv.mode === 'production') {
    config.entry = {
      'Components/PennCore': './src/index_core.js',
      PennController: './src/index_full.js'
    };
    config.output = {
      filename: '[name].js',
      path: path.resolve(__dirname, 'dist')
    };
    fs.readdirSync('./src/elements/').forEach(file => {
      let name = 'Components/'+file.replace(/\.[^.]+$/,'');
      config.entry[name] = './src/elements/'+file;
    });
  }
  return config;
};