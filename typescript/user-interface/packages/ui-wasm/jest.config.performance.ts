import type { Config } from 'jest';

import config from './jest.config';

const performanceConfig: Config = {
  ...config,
  testRegex: '/__tests__/.*\\.performance\\.test\\.(ts|tsx)$'
};

// eslint-disable-next-line import/no-default-export
export default performanceConfig;
