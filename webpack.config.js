'use strict';

const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const packageJSON = require("./package.json");
const child_process = require('child_process');

const execSync = child_process.execSync;
const getOutput = (cmd) => execSync(cmd).toString().trim();
const now = new Date(),
      buildDate = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`,
      gitBranch = getOutput('git symbolic-ref --short HEAD'),
      gitLog = getOutput('git log -1 --date=short --pretty=format:"%cd %h %ce"')

const envMap = { production: "production", master: "staging" },
      environment = process.env.ENVIRONMENT || envMap[gitBranch] || "development",
      buildInfo = {
        date: buildDate,
        tag: packageJSON.version,
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
        __BUILD_INFO__: buildInfoString,
        __ENVIRONMENT__: environment,
        __VERSION__: buildInfo.tag,
        __BUILD_DATE__: buildInfo.date,
      }),
      new HtmlWebpackPlugin({
        inject: false,
        filename: 'sagemodeler.html',
        template: 'src/templates/sagemodeler.html.ejs',
        __BUILD_INFO__: buildInfoString,
        __ENVIRONMENT__: environment
      }),
      new CopyWebpackPlugin([{
        from: 'src/assets',
        to: '',
        transform (content, path) {
          if (/\.html$/.test(path)) {
            return content.toString().replace(/__BUILD_INFO__/g, buildInfoString).replace(/__ENVIRONMENT__/g, environment);
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