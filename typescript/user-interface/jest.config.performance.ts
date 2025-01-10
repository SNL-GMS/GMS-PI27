import type { Config } from 'jest';

import config from './jest.config';

const performanceConfig: Config = {
  ...config,
  projects: [
    '<rootDir>/packages/common-model/jest.config.performance.ts',
    '<rootDir>/packages/common-util/jest.config.performance.ts',
    '<rootDir>/packages/mock-data-server/jest.config.performance.ts',
    '<rootDir>/packages/ui-app/jest.config.performance.ts',
    '<rootDir>/packages/ui-core-components/jest.config.performance.ts',
    '<rootDir>/packages/ui-electron/jest.config.performance.ts',
    '<rootDir>/packages/ui-state/jest.config.performance.ts',
    '<rootDir>/packages/ui-util/jest.config.performance.ts',
    '<rootDir>/packages/ui-wasm/jest.config.performance.ts',
    '<rootDir>/packages/ui-workers/jest.config.performance.ts',
    '<rootDir>/packages/weavess/jest.config.performance.ts',
    '<rootDir>/packages/weavess-core/jest.config.performance.ts'
  ],
  testRegex: '/__tests__/.*\\.performance\\.test\\.(ts|tsx)$'
};

// eslint-disable-next-line import/no-default-export
export default performanceConfig;
