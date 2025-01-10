import type { GmsInteropModule } from '../../../src/ts/gms-interop/gms-interop-module';
import { getInteropModule } from '../../../src/ts/gms-interop/gms-interop-module';

describe('GMSFilters: WASM enum parity tests', () => {
  let gmsInteropModule: GmsInteropModule;

  beforeAll(async () => {
    gmsInteropModule = await getInteropModule();
  });

  test('WasmFilterBandType', () => {
    expect(gmsInteropModule.FilterBandType.LOW_PASS.value).toMatchInlineSnapshot(`0`);
    expect(gmsInteropModule.FilterBandType.HIGH_PASS.value).toMatchInlineSnapshot(`1`);
    expect(gmsInteropModule.FilterBandType.BAND_PASS.value).toMatchInlineSnapshot(`2`);
    expect(gmsInteropModule.FilterBandType.BAND_REJECT.value).toMatchInlineSnapshot(`3`);
  });

  test('WasmFilterComputationType', () => {
    expect(gmsInteropModule.FilterComputationType.AR).toMatchInlineSnapshot(
      `FilterComputationType_AR {}`
    );
    expect(gmsInteropModule.FilterComputationType.FIR).toMatchInlineSnapshot(
      `FilterComputationType_FIR {}`
    );
    expect(gmsInteropModule.FilterComputationType.IIR).toMatchInlineSnapshot(
      `FilterComputationType_IIR {}`
    );
    expect(gmsInteropModule.FilterComputationType.PM).toMatchInlineSnapshot(
      `FilterComputationType_PM {}`
    );
  });

  test('WasmFilterDescriptionType', () => {
    expect(gmsInteropModule.FilterDescriptionType.FIR_FILTER_DESCRIPTION).toMatchInlineSnapshot(
      `FilterDescriptionType_FIR_FILTER_DESCRIPTION {}`
    );
    expect(gmsInteropModule.FilterDescriptionType.IIR_FILTER_DESCRIPTION).toMatchInlineSnapshot(
      `FilterDescriptionType_IIR_FILTER_DESCRIPTION {}`
    );
  });

  test('WasmFilterDesignModel', () => {
    expect(gmsInteropModule.FilterDesignModel.BUTTERWORTH).toMatchInlineSnapshot(
      `FilterDesignModel_BUTTERWORTH {}`
    );
    expect(gmsInteropModule.FilterDesignModel.CHEBYSHEV_I).toMatchInlineSnapshot(
      `FilterDesignModel_CHEBYSHEV_I {}`
    );
    expect(gmsInteropModule.FilterDesignModel.CHEBYSHEV_II).toMatchInlineSnapshot(
      `FilterDesignModel_CHEBYSHEV_II {}`
    );
    expect(gmsInteropModule.FilterDesignModel.ELLIPTIC).toMatchInlineSnapshot(
      `FilterDesignModel_ELLIPTIC {}`
    );
  });
});
