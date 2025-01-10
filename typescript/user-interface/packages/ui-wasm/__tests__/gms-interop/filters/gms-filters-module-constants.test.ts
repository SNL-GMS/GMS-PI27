import type { GmsInteropModule } from '../../../src/ts/gms-interop/gms-interop-module';
import { getInteropModule } from '../../../src/ts/gms-interop/gms-interop-module';

describe('GMS Filters Constants Test', () => {
  let gmsInteropModule: GmsInteropModule;

  beforeAll(async () => {
    gmsInteropModule = await getInteropModule();
  });

  test('exists', () => {
    expect(gmsInteropModule).toBeDefined();
  });

  test('constants and thresholds are defined and equal', () => {
    expect(gmsInteropModule.MAX_NAME_SIZE).toBeDefined();
    expect(gmsInteropModule.MAX_COMMENT_SIZE).toBeDefined();
    expect(gmsInteropModule.MAX_FILTER_ORDER).toBeDefined();
    expect(gmsInteropModule.MAX_POLES).toBeDefined();
    expect(gmsInteropModule.MAX_SOS).toBeDefined();
    expect(gmsInteropModule.MAX_TRANSFER_FUNCTION).toBeDefined();
    expect(gmsInteropModule.MAX_FILTER_DESCRIPTIONS).toBeDefined();
  });
});
