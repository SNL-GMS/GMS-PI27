import type { Configuration, WebpackConfig } from '@gms/webpack-config';
import { appConfig, getWebpackPaths, libCjsConfig } from '@gms/webpack-config';
import { resolve } from 'path';

const config = (env: { [key: string]: string | boolean }): Configuration[] => {
  const shouldIncludeDevServer: boolean = env.devserver === true;
  const webpackPaths = getWebpackPaths({
    baseDir: resolve(__dirname, '.'),
    tsconfigFileName: 'tsconfig-build.json'
  });
  const webpackConfig: WebpackConfig = {
    name: 'weavess',
    title: 'WEAVESS',
    paths: webpackPaths,
    isProduction: env.production === true,
    shouldIncludeDevServer,
    entry: env.devserver
      ? resolve(webpackPaths.src, 'ts/examples/index.tsx')
      : resolve(webpackPaths.src, 'ts/weavess.tsx'),
    alias: {}
  };
  return shouldIncludeDevServer ? [appConfig(webpackConfig)] : [libCjsConfig(webpackConfig)];
};

// eslint-disable-next-line import/no-default-export
export default config;
