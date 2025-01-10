import { toOSDTime } from '@gms/common-util';
import type { Express } from 'express';

import { KafkaConsumer } from '../kafka/kafka-consumer';
import { KafkaProducer } from '../kafka/kafka-producer';
import { gatewayLogger as logger } from '../log/gateway-logger';
import { healthChecks, HealthStatus } from './health-checks';

export const appName = process.env.APP_NAME || 'interactive-analysis-api-gateway';

// http 200 'OK'
const HTTP_STATUS_200 = 200;
// http 500 'Internal Server Error'
const HTTP_STATUS_500 = 500;

/**
 * Hack to get around Request host being different
 * when request is external (ingress) to deployment
 * vs internally (kubernetes livenessProbe/readinessProbe)
 *
 * The host needs to be set to the internal host not the host via ingress
 *
 * This is brittle since it depends on the livenessProbe/readinessProbe
 * will be called first before an external request
 */
let host;

/**
 * Defines the available routes.
 */
export interface Routes {
  /** route to check alive status */
  readonly liveness: string;
  /** route to check the ready status */
  readonly readiness: string;
  /** route to check all health status */
  readonly healthCheck: string;
  /** health check routes */
  readonly healthChecks: {
    /** initialization health check */
    readonly initialized: string;
    /** kafka health check */
    readonly kafka: string;
    /** websocket server health check */
    readonly websocket: string;
  };
}

/**
 * The routes
 */
const routes: Routes = {
  liveness: `/${appName}/liveness`,
  readiness: `/${appName}/readiness`,
  healthCheck: `/${appName}/health-check`,
  healthChecks: {
    initialized: `/${appName}/health-check/initialized`,
    kafka: `/${appName}/health-check/kafka`,
    websocket: `/${appName}/health-check/websocket`
  }
};

/**
 * Configures the `alive` route.
 * This route returns a timestamp indicating the the gateway server is alive.
 *
 * @param app the express server app
 */
export const configureRouteAlive = (app: Express): void => {
  const handler = (req, res) => {
    if (!host) {
      host = req.headers.host;
    }
    return res.status(HTTP_STATUS_200).send(HealthStatus.UP);
  };
  logger.info(`register ${routes.liveness}`);
  app.get(routes.liveness, handler);
};

/**
 * Configures the `ready` route.
 * Performs simple health checks and verifies that the gateway is up and ready.
 *
 * @param app the express server app
 * @param protocol the http protocol
 */
export const configureRouteReady = (app: Express, protocol: string): void => {
  const handler = async (req, res) => {
    if (!host) {
      host = req.headers.host;
    }
    const checks = await healthChecks([
      { id: routes.liveness, path: `${protocol}${host}${routes.liveness}` },
      {
        id: routes.healthChecks.initialized,
        path: `${protocol}${host}${routes.healthChecks.initialized}`
      },
      {
        id: routes.healthChecks.websocket,
        path: `${protocol}${host}${routes.healthChecks.websocket}`
      },
      {
        id: routes.healthChecks.kafka,
        path: `${protocol}${host}${routes.healthChecks.kafka}`
      }
    ]);
    const status = checks.map<HealthStatus>(c => c.status).every(s => s === HealthStatus.UP)
      ? HealthStatus.UP
      : HealthStatus.FAILED;
    return res.status(status === HealthStatus.UP ? HTTP_STATUS_200 : HTTP_STATUS_500).send(status);
  };
  logger.info(`register ${routes.readiness}`);
  app.get(routes.readiness, handler);
};

/**
 * Configures the `health-check` route.
 * Performs all of the health checks and returns each status.
 *
 * @param app the express server app
 * @param protocol the http protocol
 */
export const configureRouteHealthCheck = (app: Express, protocol: string): void => {
  const handler = async (req, res) => {
    if (!host) {
      host = req.headers.host;
    }
    const checks = await healthChecks([
      { id: routes.liveness, path: `${protocol}${host}${routes.liveness}` },
      {
        id: routes.healthChecks.initialized,
        path: `${protocol}${host}${routes.healthChecks.initialized}`
      },
      {
        id: routes.healthChecks.kafka,
        path: `${protocol}${host}${routes.healthChecks.kafka}`
      },
      {
        id: routes.healthChecks.websocket,
        path: `${protocol}${host}${routes.healthChecks.websocket}`
      }
    ]);
    logger.info(`health checks sending ${JSON.stringify(checks)}`);
    return res.send(JSON.stringify(checks));
  };

  logger.info(`register ${routes.healthCheck}`);
  app.get(routes.healthCheck, handler);
};

/**
 * Configures the `health-check/initialized` route.
 * Performs a simple health check to see if the gateway is initialized.
 *
 * @param app the express server app
 */
export const configureRouteCheckInitialized = (app: Express): void => {
  const handler = (req, res) => res.status(HTTP_STATUS_200).send(HealthStatus.UP);
  logger.info(`register ${routes.healthChecks.initialized}`);
  app.get(routes.healthChecks.initialized, handler);
};

/**
 * Configures the `health-check/kafka` route.
 * Performs a simple health check to see if the KAFKA connections are ok.
 *
 * @param app the express server app
 */
export const configureRouteCheckKafka = (app: Express): void => {
  const consumerUpTime = KafkaProducer.Instance().getUpTime();
  const consumerTime = consumerUpTime ? toOSDTime(consumerUpTime.getTime() / 1000) : undefined;

  const producerUpTime = KafkaProducer.Instance().getUpTime();
  const producerTime = producerUpTime ? toOSDTime(producerUpTime.getTime() / 1000) : undefined;

  const handler = (req, res) =>
    res
      .status(
        KafkaConsumer.Instance().connected() && KafkaProducer.Instance().connected()
          ? HTTP_STATUS_200
          : HTTP_STATUS_500
      )
      .send({
        'KAFKA Consumer': {
          Status: KafkaConsumer.Instance().getStatus(),
          'Up Time': KafkaConsumer.Instance().getUpTime()
            ? `${consumerTime} (${KafkaConsumer.Instance().getUpTimeSeconds()}s)`
            : 'N/A',
          'Status History': KafkaConsumer.Instance().getStatusHistoryInformationAsObject()
        },
        'KAFKA Producer': {
          Status: KafkaProducer.Instance().getStatus(),
          'Up Time': KafkaProducer.Instance().getUpTime()
            ? `${producerTime} (${KafkaProducer.Instance().getUpTimeSeconds()}s)`
            : `N/A`,
          'Status History': KafkaProducer.Instance().getStatusHistoryInformationAsObject()
        }
      });
  logger.info(`register ${routes.healthChecks.kafka}`);
  app.get(routes.healthChecks.kafka, handler);
};

/**
 * Configures the `health-checks/websocket` route.
 * Performs simple health checks and verifies that the websocket server is ready
 *
 * @param app the express server app
 */
export const configureRouteCheckWebsocket = (app: Express): void => {
  const handler = (req, res) => res.status(HTTP_STATUS_200).send(HealthStatus.UP);
  logger.info(`register ${routes.healthChecks.websocket}`);
  app.get(routes.healthChecks.websocket, handler);
};
