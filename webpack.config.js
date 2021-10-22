const webpack = require('webpack');
const path = require('path');
const fs = require("fs");
//const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

var config = {
  resolve: {
    extensions: ['.js']
  },
  plugins: [],
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: require.resolve('@open-wc/webpack-import-meta-loader')
      }
    ]
  }
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
      PennController: './src/index_full.js',
      doc: './src/doc.js'
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


var ACstringAll = "";
var ACstringElement = {};
var ACpattern = new RegExp("/[*] ([$]AC[$] ([^.]+?)\.([^\\s]+?) (.+?) [$]AC[$]) [*]/", "g");
var ACdir = function(dir){
  fs.readdirSync(dir).forEach(file => {
      file = path.resolve(dir, file);      
      var stat = fs.statSync(file);
      if (stat && stat.isDirectory())
        ACdir(file);
      else{
        var content = fs.readFileSync(file, 'utf8');
        var AC;
        while ((AC = ACpattern.exec(content)) !== null){
          let isElement = file.match(/PennElement_.+\.js/);
          if (isElement){
            if (!ACstringElement.hasOwnProperty(isElement[0]))
              ACstringElement[isElement[0]] = "";
            ACstringElement[isElement[0]] += AC[1];
          }
          else
            ACstringAll += AC[1];
        }
      }
  });
}
ACdir('./src/');

// config.plugins.push(
//   new webpack.BannerPlugin({
//     banner: ACstringAll,
//     include: /.*PennCo.*/
//   })
// );
config.plugins.push(
  new webpack.BannerPlugin({
    banner: ACstringAll,
    include: /doc/
  })
);

// for (let el in ACstringElement){
//   config.plugins.push(
//     new webpack.BannerPlugin({
//       banner: ACstringElement[el],
//       include: [new RegExp(".*"+el+".*"), /.*PennController.*/]
//     })
//   );
// }
for (let el in ACstringElement){
  config.plugins.push(
    new webpack.BannerPlugin({
      banner: ACstringElement[el],
      include: /doc/
    })
  );
}

// Add main banner
config.plugins.push(
  new webpack.BannerPlugin({
    banner: fs.readFileSync('./src/banner', 'utf8'),
    exclude: [/.*PennElement.*/,/doc/]
  })
);
