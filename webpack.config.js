const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'none',
  entry: {
    main: './src/resumable.ts',
    helpers: './src/resumableHelpers.ts',
  },
  target: ['web', 'es5'],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    library: 'resumablejs',
    libraryTarget: 'umd',
    globalObject: 'this',
    umdNamedDefine: true,
  },
  devtool: "source-map",
  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: ["", ".webpack.js", ".web.js", ".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
      { test: /\.tsx?$/, loader: "ts-loader" },
      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      { test: /\.js$/, loader: "source-map-loader" },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
        patterns: [
          {
            from: './src/types/types.d.ts',
            to: './types/types.d.ts'
          }
        ]
    })
  ]
};
