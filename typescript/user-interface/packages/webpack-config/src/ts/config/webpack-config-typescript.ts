import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import type { Configuration, RuleSetRule, WebpackPluginInstance } from 'webpack';

import type { WebpackConfig } from '../types';

/**
 * Babel Loader rule set.
 *
 * @param paths the paths
 */
export const babelLoader = (): RuleSetRule => ({
  test: /\.ts(x?)$/,
  exclude: [/.*node_modules.*/],
  use: {
    loader: 'babel-loader'
  }
});

/**
 * Typescript loader rule set.
 *
 * @param paths the paths
 */
export const tsLoader = (): RuleSetRule => ({
  test: /\.ts(x?)$/,
  exclude: [/.*node_modules.*/],
  use: {
    loader: 'ts-loader',
    options: {
      transpileOnly: true,
      projectReferences: true,
      useCaseSensitiveFileNames: true,
      experimentalFileCaching: true
    }
  }
});

/**
 *  Typescript plugins.
 *
 * @param tsconfig the path to the tsconfig file
 */
const tsPlugins = (webpackConfig: WebpackConfig): WebpackPluginInstance[] => {
  const disableTypescriptChecker = process.env.GMS_DISABLE_TYPESCRIPT_CHECKER === 'true';
  console.log(`ForkTsCheckerWebpackPlugin disable typescript check: ${disableTypescriptChecker}`);
  return !disableTypescriptChecker
    ? [
        new ForkTsCheckerWebpackPlugin({
          async: true,
          devServer: webpackConfig.shouldIncludeDevServer,
          typescript: {
            memoryLimit: 4096,
            build: true,
            configFile: webpackConfig.paths.tsconfig,
            diagnosticOptions: {
              semantic: true,
              syntactic: true
            }
          }
        })
      ]
    : [];
};

/**
 * The webpack typescript configuration.
 *
 * @param webpackConfig the webpack configuration
 */
export const tsConfig = (webpackConfig: WebpackConfig): Configuration => ({
  module: {
    rules: [tsLoader()]
  },
  plugins: [...tsPlugins(webpackConfig)],
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.tsx', '.wasm'],
    plugins: [
      new TsconfigPathsPlugin({
        baseUrl: webpackConfig.paths.baseDir,
        configFile: webpackConfig.paths.tsconfig
      })
    ]
  }
});
