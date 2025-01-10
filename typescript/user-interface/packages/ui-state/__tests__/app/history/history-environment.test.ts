import { GMS_HISTORY, IS_HISTORY_DEBUG } from '../../../src/ts/app/history/history-environment';

describe('history environment', () => {
  const { env } = process;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...env, GMS_HISTORY: 'warn' };
  });

  afterEach(() => {
    process.env = env;
  });

  it('exists', () => {
    expect(GMS_HISTORY).toBeDefined();
    expect(IS_HISTORY_DEBUG).toBeDefined();
  });

  it('can use history environment configuration', () => {
    expect(IS_HISTORY_DEBUG).toBeFalsy();
  });
});
