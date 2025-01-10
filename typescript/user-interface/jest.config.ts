import type { Config } from 'jest';

const config: Config = {
  cacheDirectory: '<rootDir>/.cache/jest',
  // Prettier version 3 is not supported! (https://jestjs.io/docs/configuration/#prettierpath-string)
  prettierPath: require.resolve('prettier-2'),
  testEnvironmentOptions: {
    url: 'http://localhost/'
  },
  globalSetup: '<rootDir>/jest.global-setup.ts',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  roots: [
    '<rootDir>',
    '<rootDir>/packages/common-model',
    '<rootDir>/packages/common-util',
    '<rootDir>/packages/mock-data-server',
    '<rootDir>/packages/ui-app',
    '<rootDir>/packages/ui-core-components',
    '<rootDir>/packages/ui-electron',
    '<rootDir>/packages/ui-state',
    '<rootDir>/packages/ui-util',
    '<rootDir>/packages/ui-wasm',
    '<rootDir>/packages/ui-workers',
    '<rootDir>/packages/weavess',
    '<rootDir>/packages/weavess-core'
  ],
  projects: [
    '<rootDir>/packages/common-model/jest.config.ts',
    '<rootDir>/packages/common-util/jest.config.ts',
    '<rootDir>/packages/mock-data-server/jest.config.ts',
    '<rootDir>/packages/ui-app/jest.config.ts',
    '<rootDir>/packages/ui-core-components/jest.config.ts',
    '<rootDir>/packages/ui-electron/jest.config.ts',
    '<rootDir>/packages/ui-state/jest.config.ts',
    '<rootDir>/packages/ui-util/jest.config.ts',
    '<rootDir>/packages/ui-wasm/jest.config.ts',
    '<rootDir>/packages/ui-workers/jest.config.ts',
    '<rootDir>/packages/weavess/jest.config.ts',
    '<rootDir>/packages/weavess-core/jest.config.ts'
  ],
  moduleDirectories: ['.yarn'],
  transform: {
    '^.+\\.m?jsx?$': ['babel-jest', { configFile: './jest-babelrc.json' }],
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        isolatedModules: true,
        diagnostics: false
      }
    ]
  },
  moduleNameMapper: {
    '.*\\.(css|less|styl|scss|sass)$': '<rootDir>/__mocks__/style-mock.ts',
    '.*\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|wasm)$':
      '<rootDir>/__mocks__/file-mock.ts'
  },
  modulePathIgnorePatterns: ['<rootDir>/lib/', '<rootDir>/dist/'],
  testRegex: '/__tests__/.*\\.test\\.(ts|tsx)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  testEnvironment: 'jsdom',
  collectCoverage: true,
  coverageReporters: ['lcov', 'html', 'text-summary']
};
// eslint-disable-next-line import/no-default-export
export default config;
