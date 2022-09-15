const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './src/features/project/work/biz/worker/testCase.worker.js',
  target: 'webworker',
  mode: 'none',
  resolve: {
    modules: ['node_modules', path.resolve(__dirname, './src')],
    extensions: ['.js', '.json', '.jsx', '.ts', '.tsx'],
  },
  output: {
    filename: 'worker.js',
    path: path.resolve(__dirname, './public'),
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify('development') }),
  ],
  devtool: 'inline-source-map',
};
