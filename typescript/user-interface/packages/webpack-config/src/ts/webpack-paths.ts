import { dirname, resolve } from 'path';
import type { AssetInfo, PathData } from 'webpack';

import type { WebpackPaths } from './types';

export interface WebpackPathsParams {
  // the path to the directory of the package that is being built (see the relevant webpack.config.ts file)
  baseDir: string;
  // the eslint configuration file name
  eslintConfigFileName?: string;
  // (optional) the typescript configuration file name
  tsconfigFileName?: string;
  // (optional) the subdirectory that is created under the dist folder
  subDir?: string;
  // (optional) specifies the file name
  filename?: string | ((pathData: PathData, assetInfo?: AssetInfo) => string);
  // (optional) specifies the chunk file name
  chunkFilename?: string | ((pathData: PathData, assetInfo?: AssetInfo) => string);
}

/**
 * Returns the Webpack build paths
 *
 * @param params the settings to setup and configure the webpack paths
 */
export const getWebpackPaths = (params: WebpackPathsParams): WebpackPaths => {
  const splitBaseDir = params.baseDir.match(/([^/]*)\/*$/);
  const baseDirName = splitBaseDir && splitBaseDir.length >= 2 ? splitBaseDir[1] : '';
  const eslint = resolve(params.baseDir, params.eslintConfigFileName || '.eslintrc-config.yaml');
  const tsconfig = resolve(params.baseDir, params.tsconfigFileName || 'tsconfig.json');
  const packageJson = resolve(params.baseDir, 'package.json');
  const src = resolve(params.baseDir, 'src');
  const resources = resolve(src, 'resources');
  const dist = resolve(params.baseDir, params.subDir ? `dist/${params.subDir}` : 'dist');
  const cesium = `${dirname(require.resolve('cesium/package.json'))}/target`;
  const cesiumDir = `cesium_${Date.now()}`; // add timestamp as unique string per bundle
  const bundleAnalyze = resolve(params.baseDir, 'bundle-analyzer');
  const { filename } = params;
  const { chunkFilename } = params;

  return {
    baseDirName,
    baseDir: params.baseDir,
    eslint,
    tsconfig,
    packageJson,
    cesium,
    cesiumDir,
    src,
    resources,
    dist,
    bundleAnalyze,
    filename,
    chunkFilename
  };
};
