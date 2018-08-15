const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'PennController.js',
    path: path.resolve(__dirname, 'dist/js_includes')
  },
  devtool: 'inline-source-map',
  resolve: {
    extensions: ['.js']
  },
  plugins: [
    new webpack.ProvidePlugin({
      PennController: [path.resolve(__dirname, 'src/penncontroller.js'), 'PennController']
    })
  ]
};