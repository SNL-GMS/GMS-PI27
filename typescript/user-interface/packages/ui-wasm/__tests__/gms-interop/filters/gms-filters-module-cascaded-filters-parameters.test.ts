import type { GmsInteropModule, Wasm } from '../../../src/ts/gms-interop/gms-interop-module';
import { getInteropModule } from '../../../src/ts/gms-interop/gms-interop-module';

describe('GMS Filters Cascaded Filters Parameters Test', () => {
  let gmsInteropModule: GmsInteropModule;

  beforeAll(async () => {
    gmsInteropModule = await getInteropModule();
  });

  test('exists', () => {
    expect(gmsInteropModule).toBeDefined();
  });

  test('CascadeFilterParameters is defined and can be created', () => {
    expect(gmsInteropModule.CascadeFilterParameters).toBeDefined();

    let cascadeFilterParameters: Wasm.CascadeFilterParameters | null = null;

    try {
      /* eslint-disable @typescript-eslint/no-magic-numbers */
      cascadeFilterParameters = new gmsInteropModule.CascadeFilterParameters(3, true, 20, 5);
      expect(cascadeFilterParameters).toBeDefined();
      expect(cascadeFilterParameters.sampleRateHz).toBeDefined();
      expect(cascadeFilterParameters.sampleRateHz).toEqual(20);
      expect(cascadeFilterParameters.sampleRateToleranceHz).toBeDefined();
      expect(cascadeFilterParameters.sampleRateToleranceHz).toEqual(5);
      expect(cascadeFilterParameters.groupDelaySec).toBeDefined();
      expect(cascadeFilterParameters.groupDelaySec).toEqual(3);
      /* eslint-enable @typescript-eslint/no-magic-numbers */
    } finally {
      if (cascadeFilterParameters) cascadeFilterParameters.delete();
    }
  });
});
