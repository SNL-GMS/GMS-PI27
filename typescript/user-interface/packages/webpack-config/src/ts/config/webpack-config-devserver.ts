import type { Configuration as DevServerConfiguration } from 'webpack-dev-server';

import type { WebpackConfig } from '../types';
import type { Configuration } from '../webpack-config';

/**
 * Returns the development server arguments `HOST:PORT`.
 */
const getDevServerArgs = () => {
  const defaultPort = 8000;
  return {
    host: process.env.HOST || 'localhost',
    port: +(process.env.PORT || '') || defaultPort
  };
};

/**
 * Returns the webpack development server configuration.
 *
 * @param webpackConfig the webpack configuration
 * @param host the host of the development server
 * @param port the port of the development server
 */
export const devServerConfig = (
  webpackConfig: WebpackConfig,
  { host, port }: { host: string; port: number } = getDevServerArgs()
): Configuration => {
  const devServer: DevServerConfiguration | undefined = webpackConfig.shouldIncludeDevServer
    ? {
        host,
        port,
        compress: true,
        open: false,
        liveReload: true,
        client: {
          overlay: {
            warnings: false,
            errors: webpackConfig.isProduction
          }
        }
      }
    : undefined;
  return {
    devServer
  };
};
