import HtmlWebpackPlugin from 'html-webpack-plugin';
import { resolve } from 'path';
import type { Configuration } from 'webpack';
import merge from 'webpack-merge';

import type { WebpackConfig } from '../types';
import { assetConfig } from './webpack-asset';
import { bundleAnalyzeConfig } from './webpack-config-analyze';
import { commonWebConfig, getEntry } from './webpack-config-common';
import { developmentConfig } from './webpack-config-development';
import { devServerConfig } from './webpack-config-devserver';
import { productionConfig } from './webpack-config-production';
import { sourceMapConfig } from './webpack-config-sourcemap';
import { styleConfig } from './webpack-config-styles';
import { tsConfig } from './webpack-config-typescript';

/**
 * The webpack common configuration for applications
 *
 * @param webpackConfig the webpack configuration
 */
const appCommonConfig = (webpackConfig: WebpackConfig): Configuration => {
  const entry = getEntry(webpackConfig);
  return merge(commonWebConfig(webpackConfig), {
    entry,
    output: {
      pathinfo: false,
      filename: webpackConfig.paths.filename ?? '[name]-[contenthash].js',
      chunkFilename: webpackConfig.paths.chunkFilename ?? '[name]-[contenthash].js',
      path: webpackConfig.paths.dist,
      publicPath: 'auto',
      // needed to compile multiline strings in Cesium
      sourcePrefix: ''
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: resolve(webpackConfig.paths.baseDir, 'index.html'),
        title: `${webpackConfig.title}`,
        favicon: resolve(webpackConfig.paths.baseDir, '../../resources/gms-logo-favicon.ico'),
        chunksSortMode: 'auto',
        ...webpackConfig?.htmlWebpackPluginOptions
      })
    ]
  });
};

/**
 * The webpack configuration for applications
 *
 * @param webpackConfig the webpack configuration
 */
export const appConfig = (webpackConfig: WebpackConfig): Configuration =>
  merge(
    tsConfig(webpackConfig),
    styleConfig(webpackConfig.isProduction),
    assetConfig(),
    sourceMapConfig(webpackConfig.isProduction),
    appCommonConfig(webpackConfig),
    devServerConfig(webpackConfig),
    webpackConfig.isProduction ? productionConfig() : developmentConfig(),
    bundleAnalyzeConfig(webpackConfig)
  );
