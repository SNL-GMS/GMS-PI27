import type { Configuration, WebpackConfig, WebpackPaths } from '@gms/webpack-config';
import {
  appConfig,
  cesiumConfig,
  getWebpackPaths,
  webpackCopy,
  webpackMerge
} from '@gms/webpack-config';
import { join, resolve } from 'path';
import type { EntryObject, PathData } from 'webpack';

type GetPaths = (isProduction: boolean) => WebpackPaths;

type GetConfiguration = (isProduction, shouldIncludeDevServer, paths) => WebpackConfig;

const defaultMockDataServerUri = 'http://localhost:3001';
const eventManagerProxyUri =
  process.env.EVENT_MANAGER_PROXY_URI || process.env.DEPLOYMENT_URL || 'http://localhost:3001';
const gatewayHttpProxyUri =
  process.env.GATEWAY_HTTP_PROXY_URI || process.env.DEPLOYMENT_URL || `http://localhost:3000`;
const fkControlProxyUri = process.env.FK_CONTROL_PROXY_URI || process.env.DEPLOYMENT_URL;
const frameworksOsdProxyUri =
  process.env.FRAMEWORK_OSD_PROXY_URI || process.env.DEPLOYMENT_URL || defaultMockDataServerUri;
const signalEnhancementConfigurationProxyUri =
  process.env.SIGNAL_ENHANCEMENT_CONFIGURATION_PROXY_URI ||
  process.env.DEPLOYMENT_URL ||
  defaultMockDataServerUri;
const processingConfigurationProxyUri =
  process.env.PROCESSING_CONFIGURATION_PROXY_URI ||
  process.env.DEPLOYMENT_URL ||
  defaultMockDataServerUri;
const signalDetectionProxyUri =
  process.env.SIGNAL_DETECTION_PROXY_URI || process.env.DEPLOYMENT_URL || 'http://localhost:3004';
const stationDefinitionServiceUri =
  process.env.STATION_DEFINITION_SERVICE_URL ||
  process.env.DEPLOYMENT_URL ||
  defaultMockDataServerUri;
const subscriptionsProxyUri =
  process.env.SUBSCRIPTIONS_PROXY_URI || process.env.DEPLOYMENT_URL || `ws://localhost:4001`;
const userManagerProxyUri =
  process.env.USER_MANAGER_PROXY_URI || process.env.DEPLOYMENT_URL || defaultMockDataServerUri;
const waveformManagerProxyUri =
  process.env.WAVEFORM_MANAGER_PROXY_URI || process.env.DEPLOYMENT_URL || `http://localhost:3002`;
const workflowManagerProxyUri =
  process.env.WORKFLOW_MANAGER_PROXY_URI || process.env.DEPLOYMENT_URL || `http://localhost:3003`;

const filename = (pathData: PathData) => {
  // ! do not use hashed names on the service workers.
  return pathData.chunk?.name === 'sw' ? '[name].js' : '[name].[contenthash].js';
};

const ianWebpackPaths: GetPaths = (isProduction: boolean): WebpackPaths =>
  getWebpackPaths({
    baseDir: resolve(__dirname, '.'),
    tsconfigFileName: 'tsconfig-build.json',
    subDir: isProduction ? 'production' : 'development',
    filename,
    chunkFilename: filename
  });

const commonProxyRouteConfig = {
  // !WARNING: A backend server running on HTTPS with an invalid certificate
  // !will not be accepted by default - must set to false to accept
  secure: false,
  changeOrigin: true
};

const ianWebpackConfig: GetConfiguration = (
  isProduction: boolean,
  shouldIncludeDevServer: boolean,
  webpackPaths: WebpackPaths
): WebpackConfig => {
  const entryPoints: EntryObject = {};
  entryPoints['ui-ian-app'] = {
    import: resolve(webpackPaths.src, 'ts/app/ui-ian-app/index.tsx')
  };

  return {
    name: 'ui-ian-app',
    title: 'GMS Interactive Analysis',
    paths: webpackPaths,
    isProduction,
    shouldIncludeDevServer,
    entry: entryPoints,
    htmlWebpackPluginOptions: {
      envInjectScript: `<script src="./env-inject.js"></script>`,
      cesiumScript: `<script src="./${webpackPaths.cesiumDir}/Cesium.js"></script>`,
      appManifest: `<link rel="manifest" href="./ui-ian-app.webmanifest">`
    },
    alias: {}
  };
};

const getCommonConfig = (isProduction: boolean, webpackPaths: WebpackPaths): Configuration => {
  const GMS_KEYCLOAK_REALM = `${process.env.GMS_KEYCLOAK_REALM}`;
  const GMS_KEYCLOAK_URL = `${process.env.GMS_KEYCLOAK_URL}`;
  const GMS_KEYCLOAK_CLIENT_ID = `${process.env.GMS_KEYCLOAK_CLIENT_ID}`;
  const GMS_DISABLE_KEYCLOAK_AUTH = process.env.GMS_DISABLE_KEYCLOAK_AUTH === 'true';

  if (GMS_DISABLE_KEYCLOAK_AUTH) {
    console.log(`KEYCLOAK authentication is disabled`);
  } else {
    console.log(`KEYCLOAK authentication is enabled with the following parameters`);
    console.log(`  --> GMS_KEYCLOAK_REALM : ${GMS_KEYCLOAK_REALM}`);
    console.log(`  --> GMS_KEYCLOAK_URL : ${GMS_KEYCLOAK_URL}`);
    console.log(`  --> GMS_KEYCLOAK_CLIENT_ID : ${GMS_KEYCLOAK_CLIENT_ID}`);
  }

  return webpackMerge(
    {
      externals: {
        electron: 'electron'
      },
      plugins: [
        webpackCopy({
          patterns: [
            {
              from: join(webpackPaths.baseDir, `resources/sounds`),
              to: resolve(webpackPaths.dist, `resources/sounds`)
            },
            {
              from: join(webpackPaths.baseDir, 'ui-ian-app.webmanifest'),
              to: resolve(webpackPaths.dist, 'ui-ian-app.webmanifest')
            },
            {
              from: join(webpackPaths.baseDir, 'resources/images'),
              to: resolve(webpackPaths.dist, 'resources/images')
            },
            {
              from: join(webpackPaths.baseDir, 'src/ts/env/env-inject-template.js'),
              to: resolve(webpackPaths.dist, 'env-inject-template.js')
            },
            {
              from: join(webpackPaths.baseDir, 'src/ts/env/env-inject-template.js'),
              to: resolve(webpackPaths.dist, 'env-inject.js'),
              /* eslint-disable no-template-curly-in-string */
              transform(content) {
                return content
                  .toString()
                  .replace('${GMS_KEYCLOAK_REALM}', GMS_KEYCLOAK_REALM)
                  .replace('${GMS_KEYCLOAK_URL}', GMS_KEYCLOAK_URL)
                  .replace('${GMS_KEYCLOAK_CLIENT_ID}', GMS_KEYCLOAK_CLIENT_ID)
                  .replace('${GMS_DISABLE_KEYCLOAK_AUTH}', GMS_DISABLE_KEYCLOAK_AUTH.toString());
                /* eslint-enable no-template-curly-in-string */
              }
            }
          ]
        })
      ]
    },
    cesiumConfig(webpackPaths, isProduction)
  );
};

const devServerConfig = (shouldIncludeDevServer: boolean): Configuration =>
  shouldIncludeDevServer
    ? {
        devServer: {
          https: false,
          proxy: {
            '/fk-control-service/spectra/interactive': {
              target: fkControlProxyUri,
              ...commonProxyRouteConfig
            },
            '/frameworks-osd-service/osd/coi/acquired-channel-environment-issues/query/station-id-time-and-type':
              {
                target: gatewayHttpProxyUri,
                ...commonProxyRouteConfig
              },
            '/frameworks-osd-service/osd/station-groups': {
              target: frameworksOsdProxyUri,
              ...commonProxyRouteConfig
            },
            '/interactive-analysis-api-gateway/alive': {
              target: gatewayHttpProxyUri,
              ...commonProxyRouteConfig
            },
            '/interactive-analysis-api-gateway/ready': {
              target: gatewayHttpProxyUri,
              ...commonProxyRouteConfig
            },
            '/interactive-analysis-api-gateway/health-check': {
              target: gatewayHttpProxyUri,
              ...commonProxyRouteConfig
            },
            '/interactive-analysis-api-gateway/client-log': {
              target: `${gatewayHttpProxyUri}`,
              ...commonProxyRouteConfig
            },
            '/interactive-analysis-api-gateway/publish-derived-channels': {
              target: `${gatewayHttpProxyUri}`,
              ...commonProxyRouteConfig
            },
            '/interactive-analysis-api-gateway/subscriptions': {
              target: subscriptionsProxyUri,
              ws: true,
              ...commonProxyRouteConfig
            },
            '/user-manager-service/user-profile': {
              target: userManagerProxyUri,
              ...commonProxyRouteConfig
            },
            '/ui-processing-configuration-service': {
              target: processingConfigurationProxyUri,
              ...commonProxyRouteConfig
            },
            '/signal-enhancement-configuration-service/': {
              target: signalEnhancementConfigurationProxyUri,
              ...commonProxyRouteConfig
            },
            '/station-definition-service/': {
              target: stationDefinitionServiceUri,
              ...commonProxyRouteConfig
            },
            '/waveform-manager-service/': {
              target: waveformManagerProxyUri,
              ...commonProxyRouteConfig
            },
            '/workflow-manager-service/': {
              target: workflowManagerProxyUri,
              ...commonProxyRouteConfig
            },
            '/event-manager-service/': {
              target: eventManagerProxyUri,
              ...commonProxyRouteConfig
            },
            '/signal-detection-manager-service/': {
              target: signalDetectionProxyUri,
              ...commonProxyRouteConfig
            }
          }
        }
      }
    : {};

const getWebpackAppConfig = (
  isProduction: boolean,
  shouldIncludeDevServer: boolean,
  getPaths: GetPaths,
  getConfiguration: GetConfiguration
): Configuration => {
  console.log(`Creating ${isProduction ? 'production' : 'development'} bundle`);
  const paths = getPaths(isProduction);
  return webpackMerge(
    getCommonConfig(isProduction, paths),
    appConfig(getConfiguration(isProduction, shouldIncludeDevServer, paths)),
    devServerConfig(shouldIncludeDevServer)
  );
};

const getWebpackAppConfigs = (
  env: { [key: string]: string | boolean },
  getPaths: GetPaths,
  getConfiguration: GetConfiguration
): Configuration[] => {
  const shouldIncludeDevServer: boolean = env.devserver === true;

  if (env.production === true) {
    return [getWebpackAppConfig(true, shouldIncludeDevServer, getPaths, getConfiguration)];
  }

  if (env.development === true) {
    return [getWebpackAppConfig(false, shouldIncludeDevServer, getPaths, getConfiguration)];
  }

  return [
    getWebpackAppConfig(true, shouldIncludeDevServer, getPaths, getConfiguration),
    getWebpackAppConfig(false, shouldIncludeDevServer, getPaths, getConfiguration)
  ];
};

const config = (env: { [key: string]: string | boolean }): Configuration[] => {
  return [...getWebpackAppConfigs(env, ianWebpackPaths, ianWebpackConfig)];
};

// eslint-disable-next-line import/no-default-export
export default config;
