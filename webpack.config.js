const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const buildDir = path.join(__dirname, 'dist');

module.exports = {
  entry: {
    app: './src/index.js',
  },
  output: {
    filename: '[name].bundle.js',
    path: buildDir,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loaders: ['babel-loader'],
      },
      {
        test: /\.(glsl|vs|fs)$/,
        loader: 'shader-loader',
        options: {
          glsl: {
            chunkPath: path.resolve('/glsl/chunks'),
          },
        },
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin([buildDir]),
    new HtmlWebpackPlugin({
      title: 'Web Sample',
      template: './public/index.html',
    }),
  ],
};
