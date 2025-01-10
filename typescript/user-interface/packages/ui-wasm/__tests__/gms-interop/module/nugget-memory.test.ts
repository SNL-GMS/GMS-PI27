import type { GmsInteropModule, Wasm } from '../../../src/ts/gms-interop/gms-interop-module';
import { getInteropModule } from '../../../src/ts/gms-interop/gms-interop-module';

describe('ui-wasm::nugget-memory', () => {
  let gmsInteropModule: GmsInteropModule;

  beforeAll(async () => {
    gmsInteropModule = await getInteropModule();
  });

  test('exists', () => {
    expect(gmsInteropModule).toBeDefined();
  });

  test('flushPendingDeletes', () => {
    expect(gmsInteropModule).toBeDefined();

    const wasmObjectBuilder: Wasm.BeamDescriptionBuilder =
      new gmsInteropModule.BeamDescriptionBuilder();
    const wasmObject = wasmObjectBuilder
      .beamSummation(gmsInteropModule.BeamSummationType.COHERENT)
      .beamType(gmsInteropModule.BeamType.EVENT)
      .phase('S')
      .samplingType(gmsInteropModule.SamplingType.INTERPOLATED)
      .twoDimensional(true)
      .build();
    wasmObjectBuilder.delete();
    wasmObject.delete();
    gmsInteropModule.flushPendingDeletes();
    expect(() => {
      wasmObjectBuilder.build();
    }).toThrow();
  });
});
