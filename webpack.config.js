const JsonMinimizerPlugin = require('json-minimizer-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');


module.exports = {
  entry: './dev/src/content.js',

  output: {
    path: `${__dirname}/dev`,
    filename: 'content.js'
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        use: [{
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              {
                'plugins': ['@babel/plugin-proposal-class-properties']
              }
            ],
          },
        }],
      },
      // {
      //   test: /\.json$/i,
      //   use: [{
      //     loader: 'file-loader',
      //     options: {
      //       name: '[name].[ext]',
      //       presets: [
      //         {
      //           'plugins': [
      //             new CopyPlugin({
      //               patterns: [{
      //                 // context: 'ks4gt',
      //                 from: './dev/src/config/*.json',
      //                 to: './dev/[name].min.[ext]',
      //               }],
      //             }),
      //           ],
      //           'optimization': {
      //             minimize: true,
      //             minimizer: [
      //               '...',
      //               new JsonMinimizerPlugin(),
      //             ],
      //           },
      //         }
      //       ],
      //     },
      //   }],
      // },
    ],
  },

  plugins: [
    new CopyPlugin({
      patterns: [
        {
          context: './dev',
          from: 'src/config/*.json',
          to: '[name].min.[ext]',
        },
      ],
    }),
  ],

  optimization: {
    minimize: true,
    minimizer: [
      // '...',
      new JsonMinimizerPlugin(),
    ],
  },

  target: ['web', 'es6'],
};
