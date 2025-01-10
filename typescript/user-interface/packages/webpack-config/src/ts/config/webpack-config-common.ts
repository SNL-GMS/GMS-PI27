import CaseSensitivePathsWebpackPlugin from 'case-sensitive-paths-webpack-plugin';
import gitprocess from 'child_process';
import { GitRevisionPlugin } from 'git-revision-webpack-plugin';
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin';
import { resolve } from 'path';
import type { Configuration, EntryObject } from 'webpack';
import { DefinePlugin, ids, IgnorePlugin } from 'webpack';
import merge from 'webpack-merge';

import type { WebpackConfig } from '../types';

const gitRevisionPlugin = new GitRevisionPlugin();

const getGitHash = () => {
  let hash = '';
  try {
    hash = gitprocess.execSync('git rev-parse --short HEAD').toString();
  } catch (e) {
    hash = 'unknown';
  }
  return hash;
};

const getGitBranch = () => {
  let branch = '';
  try {
    branch = gitprocess.execSync('git rev-parse --abbrev-ref HEAD').toString();
  } catch (e) {
    branch = 'unknown';
  }
  return branch;
};

const getVersionNumber = (): string => {
  return process.env.CI_COMMIT_REF_NAME ?? process.env.GIT_BRANCH ?? getGitBranch() ?? 'unknown';
};

const getCommitSha = (): string => {
  const HASH_LENGTH = 8;
  return String(process.env.CI_COMMIT_SHA ?? getGitHash() ?? 'unknown').substring(0, HASH_LENGTH);
};

const gitRevisionPluginVersion = (): string | null => {
  let gitVersion: string | null = '';
  try {
    gitVersion = gitRevisionPlugin.version();
  } catch (e) {
    gitVersion = 'unknown';
  }
  return gitVersion;
};

const gitRevisionPluginCommitHash = (): string | null => {
  let gitCommitHash: string | null = '';
  try {
    gitCommitHash = gitRevisionPlugin.commithash();
  } catch (e) {
    gitCommitHash = 'unknown';
  }
  return gitCommitHash;
};

const gitRevisionPluginBranch = (): string | null => {
  let gitBranch: string | null = '';
  try {
    gitBranch = gitRevisionPlugin.branch();
  } catch (e) {
    gitBranch = 'unknown';
  }
  return gitBranch;
};

/**
 * Returns the version number from the package.json file
 *
 * @param path the path to the package.json file
 */
const getVersion = (path: string): string => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports, import/no-dynamic-require, global-require
  return `${require(path).version}.${gitRevisionPluginVersion()}.${gitRevisionPluginCommitHash()}`;
};

/**
 * Returns the webpack entry
 *
 * @param webpackConfig the webpack configuration
 */
export const getEntry = (
  webpackConfig: WebpackConfig
): string | (() => string | EntryObject | string[]) | EntryObject | string[] => {
  if (typeof webpackConfig.entry === 'string' || webpackConfig.entry instanceof String) {
    const entry = {};
    entry[`${webpackConfig.name}`] = webpackConfig.entry;
    return entry;
  }
  return webpackConfig.entry;
};

/**
 * The webpack common base common configuration
 *
 * @param webpackConfig the webpack configuration
 */
const commonConfig = (webpackConfig: WebpackConfig): Configuration => {
  const gmsEnvs: { [key: string]: string } = {};
  Object.keys(process.env)
    .filter(key => key.startsWith('GMS_'))
    .forEach(key => {
      gmsEnvs[`process.env.${key}`] = JSON.stringify(process.env[key]);
    });
  console.dir(gmsEnvs);

  const common: Configuration = {
    infrastructureLogging: {
      level: (process.env.GMS_WEBPACK_LOG_LEVEL as unknown as any) ?? 'error'
    },
    cache: {
      name: webpackConfig.name,
      cacheDirectory: resolve(
        webpackConfig.paths.baseDir,
        '.cache/webpack/',
        webpackConfig.isProduction ? 'production' : 'development'
      ),
      type: 'filesystem',
      compression: 'gzip'
    },
    experiments: {
      topLevelAwait: true,
      asyncWebAssembly: true,
      syncWebAssembly: true
    },
    plugins: [
      // !cast to a `any` due to a miss type with Webpack 5
      new CaseSensitivePathsWebpackPlugin() as any,

      new ids.HashedModuleIdsPlugin(), // so that file hashes don't change unexpectedly

      // bring in all of the GMS_ specific environment variables
      new DefinePlugin(gmsEnvs),

      new DefinePlugin({
        __VERSION__: `${JSON.stringify(getVersion(webpackConfig.paths.packageJson))}}`,
        'process.env.GIT_VERSION': JSON.stringify(gitRevisionPluginVersion()),
        'process.env.GIT_COMMITHASH': JSON.stringify(gitRevisionPluginCommitHash()),
        'process.env.GIT_BRANCH': JSON.stringify(gitRevisionPluginBranch()),
        'process.env.VERSION_NUMBER': JSON.stringify(getVersionNumber()),
        'process.env.COMMIT_SHA': JSON.stringify(getCommitSha())
      }),

      new IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/
      }),

      new IgnorePlugin({
        resourceRegExp: /^encoding$/,
        contextRegExp: /node-fetch/
      })
    ],
    resolve: {
      alias: webpackConfig.alias,
      symlinks: false,
      extensions: ['.json']
    },
    watchOptions: {
      aggregateTimeout: 1000
    }
  };
  return common;
};

/**
 * The webpack common base web configuration
 *
 * @param webpackConfig the webpack configuration
 */
export const commonWebConfig = (webpackConfig: WebpackConfig): Configuration => {
  const common: Configuration = merge(commonConfig(webpackConfig), {
    target: 'web',
    resolve: {
      fallback: {
        fs: false
      }
    },
    plugins: [new NodePolyfillPlugin({})]
  });
  return common;
};

/**
 * The webpack common base node configuration
 *
 * @param webpackConfig the webpack configuration
 */
export const commonNodeConfig = (webpackConfig: WebpackConfig): Configuration => {
  const common: Configuration = merge(commonConfig(webpackConfig), {
    target: 'node'
  });
  return common;
};
