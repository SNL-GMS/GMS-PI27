import type { BeamDescription } from '@gms/common-model/lib/beamforming-templates/types';
import { BeamType } from '@gms/common-model/lib/beamforming-templates/types';

import type { GmsInteropModule, Wasm } from '../../src/ts/gms-interop/gms-interop-module';
import { getInteropModule } from '../../src/ts/gms-interop/gms-interop-module';
import { convertToWasmBeamDescription } from '../../src/ts/gms-interop/ts-to-wasm-converters';

describe('ts-to-wasm-converters', () => {
  let gmsInteropModule: GmsInteropModule;

  beforeAll(async () => {
    gmsInteropModule = await getInteropModule();
  });

  test('convertToWasmBeamDescription', () => {
    const payload: BeamDescription = {
      beamSummation: 'COHERENT',
      beamType: BeamType.EVENT,
      phase: 'S',
      samplingType: 'INTERPOLATED',
      twoDimensional: true
    };

    const builder: Wasm.BeamDescriptionBuilder = new gmsInteropModule.BeamDescriptionBuilder();
    const expected: Wasm.BeamDescription = builder
      .beamSummation(gmsInteropModule.BeamSummationType.COHERENT)
      .beamType(gmsInteropModule.BeamType.EVENT)
      .phase('S')
      .samplingType(gmsInteropModule.SamplingType.INTERPOLATED)
      .twoDimensional(true)
      .build();

    const actual: Wasm.BeamDescription = convertToWasmBeamDescription(gmsInteropModule, payload);
    expect(actual.beamSummation).toEqual(expected.beamSummation);
    expect(actual.beamType).toEqual(expected.beamType);
    expect(actual.phase).toEqual(expected.phase);
    expect(actual.samplingType).toEqual(expected.samplingType);
    expect(actual.twoDimensional).toEqual(expected.twoDimensional);
    builder.delete();
    expected.delete();
  });
});
