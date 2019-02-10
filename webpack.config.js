// Multi-entry сборка отдельно
// Long-term caching отдельно
// MiniCssExtractPlugin отдельно

// +DevServer
// +HtmlWebpackPlugin
// +CleanWebpackPlugin
// +dynamic imports
// +webpack-assets-manifest, cache
// +MiniCssExtractPlugin
// +IgnorePlugin

const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const postcssPresetEnv = require('postcss-preset-env');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WebpackNotifierPlugin = require('webpack-notifier');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const AssetsManifestPlugin = require('webpack-assets-manifest');

const developmentEnv = process.env.NODE_ENV === 'development';

const lang = process.env.NODE_LANG || 'en';

function resolve(relPath) {
  return path.resolve(__dirname, relPath);
}

function extHash(name, ext, hash = '[hash]') {
  return developmentEnv ? `${name}.${ext}?${hash}` : `${name}.${hash}.${ext}`;
}

module.exports = (env) => { // env from CLI
  return {
    entry:     {
      // default name is main also
      main: resolve('src/main.js')
    },
    output:    {
      path:          resolve('dist'),
      publicPath:    '/',
      filename:   extHash('[name]', 'js'),
      chunkFilename: extHash('[name]-[id]', 'js'),
    },

    devServer: {
      port:               8000,
      host:               'localhost',
      publicPath:         '/',
      historyApiFallback: true,
      contentBase:        resolve('dist'),
      writeToDisk:        true
    },

    // not eval to read compiled source in the screencast
    devtool: developmentEnv ? 'inline-cheap-module-source-map' : false,
    mode: developmentEnv ? 'development' : 'production',

    /*
    // if we're not using devserver
    watch: developmentEnv,

    watchOptions: {
      aggregateTimeout: 30,
      ignored:          /node_modules/
    },
     */

    plugins: [
      new WebpackNotifierPlugin(),
      new HtmlWebpackPlugin({
        template:       resolve('src/template.html'),
        filename:       resolve('dist/index.html'),
        chunksSortMode: 'none' // temporary fix, https://github.com/facebook/create-react-app/issues/4667
      }),
      new CleanWebpackPlugin([resolve('dist'), resolve('build')]),
      new CopyWebpackPlugin([{from: 'assets'  }]),
      new webpack.DefinePlugin({
        LANG: JSON.stringify(lang),
      }),
      new AssetsManifestPlugin({
        // for LTS
        // move it out of public root (not needed there)
        output: '../build/manifest.json'
      }),
      // new MiniCssExtractPlugin({
      //   filename:   extHash('[name]', 'css'),
      //   chunkFilename: extHash('[name]-[id]', 'css')
      // }),
      // ignore all moment locales except current lang
      new webpack.IgnorePlugin({
        checkResource(request, context) {
          // locale requires that file back from it, need to keep it
          if (request === '../moment') return false; // don't ignore this

          // only ignore locales
          if (!context.endsWith(path.join('node_modules', 'moment', 'locale'))) return false;

          // for "en" ignore all locale files, no need
          if (lang === 'en') return true;

          if (request !== `./${lang}.js`) return true; // don't ignore current locale ./ru ./ru.js ./zh ./zh-cn.js

        },
      }),

      // webpack visualizer only shows modules (obvious which one is not needed)
      // webpack analyzer shows which modules requires which modules
      //  can use VisualizerPlugin to generate html or upload to service
      {
        apply(compiler) {
          if (process.env.WEBPACK_STATS) {
            compiler.plugin("done", function(stats) { // https://github.com/FormidableLabs/webpack-stats-plugin
              stats = stats.toJson();
              fs.writeFileSync(resolve('build/stats.json'), JSON.stringify(stats));
            });
          }
        }
      },
    ],
    resolve: {
      extensions: ['.js'],
      alias:      {
        lib: resolve('lib')
      }
    },
    module:  {
      rules: [
        {
          test:    /\.js$/,
          exclude: /node_modules/,
          loader:  'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: {
                  browsers: '> 3%'
                  // browsers: '> 3%, ie 11' // ie 11 transpiles classes
                }
              }]
            ],
            plugins: [
              '@babel/plugin-proposal-object-rest-spread',
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-syntax-dynamic-import'
            ]
          }
        },
        {
          test: /\.(gif|png|jpg)$/,
          use:  [{
            // also exists url-loader
            loader:  'file-loader',
            options: {
              name:  extHash('[path][name]', '[ext]')
            }
          }]
        },
        {
          test: /\.pug/,
          use:  'pug-loader'
        },
        {
          test: /\.css$/,
          use:  [
            // {
            //   loader: MiniCssExtractPlugin.loader
            // },
            'style-loader',
            {
              loader:  'css-loader',
              options: {
                // css loader needs to know how many loaders to apply to all imported files
                // any @import'ed css first gets through loaders below (separately from other imported files)
                importLoaders: 1
              }
            },
            {
              loader: 'postcss-loader',
              options: {
                ident:   'postcss',
                plugins: () => [
                  postcssPresetEnv({
                    features: {
                      'nesting-rules': true,
                      // https://github.com/postcss/postcss-custom-properties/issues/167
                      'custom-properties': true // css vars
                    }
                  })
                ]
              }
            }
          ]
        }
      ]
    }
  };
};
