import type { Configuration, RuleSetRule } from 'webpack';

/**
 * Source map loader rule set.
 *
 * @param paths the paths
 */
const sourceMapLoader = (): RuleSetRule => ({
  test: /\.js$/,
  use: ['source-map-loader'],
  enforce: 'pre'
});

/**
 * The webpack load source maps config.
 *
 * @param isProduction true if production, false otherwise
 */
export const sourceMapConfig = (isProduction: boolean): Configuration =>
  isProduction
    ? {}
    : {
        module: {
          rules: [sourceMapLoader()]
        },
        resolve: {
          extensions: ['.js.map']
        }
      };
