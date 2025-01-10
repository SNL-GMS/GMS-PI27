import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import type { Configuration } from 'webpack';
import { DefinePlugin } from 'webpack';

/**
 * Returns the webpack production configuration.
 */
export const productionConfig = (): Configuration => {
  return {
    performance: {
      hints: 'warning',
      maxAssetSize: 4000000,
      maxEntrypointSize: 10000000
    },
    mode: 'production',
    optimization: {
      nodeEnv: 'production',
      runtimeChunk: false,
      usedExports: true,
      mergeDuplicateChunks: true,
      minimize: true,
      removeEmptyChunks: true,
      removeAvailableModules: true,
      sideEffects: true,
      providedExports: true,
      mangleExports: 'size',
      minimizer: [new CssMinimizerPlugin({ parallel: true }), '...'],
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          styles: {
            name: 'styles',
            test: /\.css$/,
            chunks: 'all',
            reuseExistingChunk: true,
            enforce: true
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              // get the name. E.g. node_modules/packageName/not/this/part.js or node_modules/packageName
              const matched = (module.context as string).match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
              );
              if (matched) {
                const packageName = matched?.length > 1 ? matched[1] : matched[0];
                // npm package names are URL-safe, but some servers don't like @ symbols
                return `vender.${packageName.replace('@', '')}`;
              }
              return module.context;
            },
            reuseExistingChunk: true,
            enforce: true
          }
        }
      }
    },
    plugins: [
      new DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('production')
      })
    ]
  };
};
