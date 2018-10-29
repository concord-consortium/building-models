'use strict';

const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const execSync = require('sync-exec'),
      now = new Date(),
      buildDate = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`,
      gitBranch = execSync('git symbolic-ref --short HEAD').stdout.trim(),
      gitTags   = execSync('git describe --tags').stdout,
      gitLog = execSync('git log -1 --date=short --pretty=format:"%cd %h %ce"').stdout;

const envMap = { production: "production", master: "staging" },
      environment = process.env.ENVIRONMENT || envMap[gitBranch] || "development",
      buildInfo = {
        date: buildDate,
        tag: gitTags.split('-')[0],
        branch: gitBranch,
        commiter: gitLog.split(" ")[2],
        commit: gitLog.split(" ")[1]
      },
      buildInfoString = (buildInfo.date + " " +
        buildInfo.tag + " " +
        buildInfo.branch + " " +
        buildInfo.commit + " " +
        buildInfo.commiter).replace(/\n|\r/g,"");

module.exports = (env, argv) => {
  const devMode = argv.mode !== 'production';

  const addBuildInfo = (content) => {
    return content.toString().replace(/__BUILD_INFO__/g, buildInfoString).replace(/__ENVIRONMENT__/g, environment);
  };

  return {
    context: __dirname, // to automatically find tsconfig.json
    devtool: 'source-map',
    entry: './src/code/app.tsx',
    mode: 'development',
    output: {
      path: __dirname + (devMode ? "/dev" : "/dist"),
      filename: 'js/app.js'
    },
    performance: { hints: false },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          enforce: 'pre',
          use: [
            {
              loader: 'tslint-loader',
              options: {
                configFile: 'tslint.json',
                failOnHint: true
              }
            }
          ]
        },
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          options: {
            transpileOnly: true // IMPORTANT! use transpileOnly mode to speed-up compilation
          }
        },
        {
          test: /\.styl$/i,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
            'stylus-loader'
          ]
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/,
          loader: 'url-loader',
          options: {
            limit: 8192,
            name: 'fonts/[name].[ext]',
            publicPath: function(url) {
              // cf. https://github.com/webpack-contrib/file-loader/issues/160#issuecomment-349771544
              return url.replace(/fonts/, '../fonts');
            }
          }
        },
        {
          test: /\.(png|cur|svg)$/,
          loader: 'url-loader',
          options: {
            limit: 8192,
            name: 'img/[name].[ext]',
            publicPath: function(url) {
              // cf. https://github.com/webpack-contrib/file-loader/issues/160#issuecomment-349771544
              return url.replace(/img/, '../img');
            }
          }
        },
      ]
    },
    resolve: {
      extensions: [ '.ts', '.tsx', '.js' ]
    },
    stats: {
      // suppress "export not found" warnings about re-exported types
      warningsFilter: /export .* was not found in/
    },
    plugins: [
      new ForkTsCheckerWebpackPlugin(),
      new MiniCssExtractPlugin({
        filename: "css/app.css"
      }),
      new HtmlWebpackPlugin({
        inject: false,
        filename: 'index.html',
        template: 'src/templates/index.html.ejs',
        transform (content, path) {
          return addBuildInfo(content);
        }
      }),
      new CopyWebpackPlugin([{
        from: 'src/assets',
        to: '',
        transform (content, path) {
          if (/\.html$/.test(path)) {
            return addBuildInfo(content);
          }
          return content;
        }
      }]),
      new CopyWebpackPlugin([{
        from: 'src/vendor',
        to: 'js'
      }]),
    ],
    optimization: {
      splitChunks: {
        cacheGroups: {
          commons: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            filename: 'js/globals.js'
          }
        }
      }
    }
  };
};