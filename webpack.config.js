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
    extensions: ['.js'],
    alias: {
      'controller': path.resolve(__dirname, './src/controller'),
      'define': path.resolve(__dirname, './src/define_ibex_controller'),
      'instruction': path.resolve(__dirname, './src/instructions/instruction')
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      Abort: ['controller', 'Abort'],
      PennController: ['controller', 'PennController'],
      Ctrlr: ['controller', 'Ctrlr'],
      Block: ['block', 'Block'],
      Instruction: ['instruction', 'Instruction'],
    })
  ]
};