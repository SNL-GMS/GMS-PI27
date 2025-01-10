import type { ChannelTypes } from '@gms/common-model';
import config from 'config';

import { gatewayLogger as logger } from '../log/gateway-logger';
import { KafkaProducer } from './kafka-producer';

/** KAFKA settings */
const kafkaSettings = config.get('kafka');

/**
 * Publishes a derived channel to Kafka
 *
 * @param derivedChannels the Channel to be sent
 */
export const publishDerivedChannels = async (
  derivedChannels: ChannelTypes.Channel[]
): Promise<void> => {
  logger.info(`Publishing derived channels size: ${derivedChannels.length}`);
  await KafkaProducer.Instance().send(kafkaSettings.producerTopics.derivedChannels, [
    { value: JSON.stringify(derivedChannels) }
  ]);
};
