import type HtmlWebpackPlugin from 'html-webpack-plugin';
import type { AssetInfo, EntryObject, PathData } from 'webpack';

/**
 * The Webpack build paths.
 */
export interface WebpackPaths {
  /** The base folder name */
  readonly baseDirName: string;

  /** The base directory for the project path */
  readonly baseDir: string;

  /** The eslint path */
  readonly eslint: string;

  /** The tsconfig file path */
  readonly tsconfig: string;

  /** The project package JSON path */
  readonly packageJson: string;

  /** The project dist path */
  readonly dist: string;

  /** The project source path */
  readonly src: string;

  /** The project resources */
  readonly resources: string;

  /** The path to cesium */
  readonly cesium: string;

  /** The path to cesium */
  readonly cesiumDir: string;

  /** The output path for the bundle analyzer */
  readonly bundleAnalyze: string;

  // (optional) the subdirectory that is created under the dist folder
  readonly filename?: string | ((pathData: PathData, assetInfo?: AssetInfo) => string);

  // (optional) the subdirectory that is created under the dist folder
  readonly chunkFilename?: string | ((pathData: PathData, assetInfo?: AssetInfo) => string);
}

/**
 * The Webpack configuration.
 */
export interface WebpackConfig {
  /** The name of the module/project */
  readonly name: string;

  /** The title to use for the generated HTML document */
  readonly title: string;

  /** The webpack project paths */
  readonly paths: WebpackPaths;

  /**
   * Flag indicating if the build is for production or development
   * true if production; false if development
   */
  readonly isProduction: boolean;

  /**
   * Flag indicating that the dev server should be configured
   */
  readonly shouldIncludeDevServer: boolean;

  /** The webpack project entry */
  readonly entry: string | (() => string | EntryObject | string[]) | EntryObject | string[];

  /** The webpack project aliases */
  readonly alias:
    | {
        /**
         * New request.
         */
        alias: string | false | string[];
        /**
         * Request to be redirected.
         */
        name: string;
        /**
         * Redirect only exact matching request.
         */
        onlyModule?: boolean;
      }[]
    | { [index: string]: string | false | string[] };

  // additional html webpack plugin options
  readonly htmlWebpackPluginOptions?: HtmlWebpackPlugin.Options;
}
