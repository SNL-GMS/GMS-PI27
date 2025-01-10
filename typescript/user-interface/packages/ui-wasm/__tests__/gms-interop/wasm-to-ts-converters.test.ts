/* eslint-disable @typescript-eslint/no-magic-numbers */
import type { WaveformTypes } from '@gms/common-model';
import { TimeseriesType } from '@gms/common-model/lib/channel-segment';
import type { DoubleValue } from '@gms/common-model/lib/common';
import { Units } from '@gms/common-model/lib/common';

import type { GmsInteropModule, Wasm } from '../../src/ts/gms-interop/gms-interop-module';
import { getInteropModule } from '../../src/ts/gms-interop/gms-interop-module';
import { convertToWasmDoubleValue } from '../../src/ts/gms-interop/ts-to-wasm-converters';
import {
  convertToTsDoubleValue,
  convertToTsFkSpectra,
  convertToTsWaveform
} from '../../src/ts/gms-interop/wasm-to-ts-converters';
import { precisionCompare } from './filters/validation/test-utils';
import { fkData } from './test-data/fk-data';

function buildData(sampleCount) {
  return [...Array(sampleCount)].map(() => Math.random());
}

describe('ui-wasm::rotation::ts-converter', () => {
  let gmsInteropModule: GmsInteropModule;

  beforeAll(async () => {
    gmsInteropModule = await getInteropModule();
  });

  test('module exists', () => {
    expect(gmsInteropModule).toBeDefined();
  });

  test('convertWaveformToTs', () => {
    function testConversion() {
      const startTime = 31536010.123456;
      const endTime = 31536310.123456;
      const sampleRateHz = 40.0;
      const sampleCount = (endTime - startTime) * sampleRateHz;
      const testSamples = new Float64Array(buildData(sampleCount));

      const expected: WaveformTypes.Waveform = {
        startTime,
        endTime,
        sampleCount,
        sampleRateHz,
        samples: testSamples,
        type: TimeseriesType.WAVEFORM
      };

      const payload: Wasm.Waveform = new gmsInteropModule.Waveform(
        gmsInteropModule.convertToVectorDouble(testSamples),
        expected.startTime,
        expected.endTime,
        expected.sampleRateHz
      );

      const actual1: WaveformTypes.Waveform = convertToTsWaveform(gmsInteropModule, payload);
      const actual2: WaveformTypes.Waveform = convertToTsWaveform(gmsInteropModule, payload);

      expect(actual1.startTime).toEqual(expected.startTime);
      expect(actual1.endTime).toEqual(expected.endTime);
      expect(actual1.sampleCount).toEqual(expected.sampleCount);
      expect(actual1.sampleRateHz).toEqual(expected.sampleRateHz);
      expect(actual1.type).toEqual(expected.type);
      precisionCompare(actual1.samples, expected.samples);

      expect(actual2.startTime).toEqual(expected.startTime);
      expect(actual2.endTime).toEqual(expected.endTime);
      expect(actual2.sampleCount).toEqual(expected.sampleCount);
      expect(actual2.sampleRateHz).toEqual(expected.sampleRateHz);
      expect(actual2.type).toEqual(expected.type);
      precisionCompare(actual2.samples, expected.samples);

      payload.delete();
    }

    for (let index = 0; index < 1000; index += 1) {
      testConversion();
    }
  });
});

describe('convertFkSpectraToTs', () => {
  let gmsInteropModule: GmsInteropModule;

  beforeAll(async () => {
    gmsInteropModule = await getInteropModule();
  });
  test('convertDoubleValueToTs', () => {
    const units: Wasm.Units = gmsInteropModule.Units.DEGREES;

    const expected: DoubleValue = {
      standardDeviation: 1.162,
      units: Units.DEGREES,
      value: 90
    };
    const payload: Wasm.DoubleValue = new gmsInteropModule.DoubleValue(
      expected.standardDeviation,
      units,
      expected.value
    );
    const result = convertToTsDoubleValue(gmsInteropModule, payload);

    expect(result.standardDeviation).toEqual(expected.standardDeviation);
    expect(result.units).toEqual(expected.units);
    expect(result.value).toEqual(expected.value);
  });

  test('convertFkSpectraToTs', () => {
    const fkSpectrums: Wasm.VectorFkSpectrum = new gmsInteropModule.VectorFkSpectrum();

    fkData.samples.forEach(spectrum => {
      const fkAttributes: Wasm.VectorFkAttributes = new gmsInteropModule.VectorFkAttributes();

      if (spectrum.fkAttributes) {
        spectrum.fkAttributes.forEach(fkAttr => {
          fkAttributes.push_back(
            new gmsInteropModule.FkAttributes(
              fkAttr.peakFStat,
              convertToWasmDoubleValue(gmsInteropModule, fkAttr.slowness),
              convertToWasmDoubleValue(gmsInteropModule, fkAttr.receiverToSourceAzimuth)
            )
          );
        });

        const fstatVector: Wasm.MultiVectorDouble = new gmsInteropModule.MultiVectorDouble();

        spectrum.fstat.forEach((val: number[]) => {
          const numberVector: Wasm.VectorDouble = gmsInteropModule.convertToVectorDouble(val);
          fstatVector.push_back(numberVector);
        });

        const powerVector: Wasm.MultiVectorDouble = new gmsInteropModule.MultiVectorDouble();

        spectrum.power.forEach((val: number[]) => {
          const numberVector: Wasm.VectorDouble = gmsInteropModule.convertToVectorDouble(val);
          powerVector.push_back(numberVector);
        });

        if (spectrum.fkQual)
          fkSpectrums.push_back(
            new gmsInteropModule.FkSpectrum(fstatVector, powerVector, fkAttributes, spectrum.fkQual)
          );
      }
    });

    const fkSpectraMetadata: Wasm.FkSpectraMetadata = new gmsInteropModule.FkSpectraMetadata(
      new gmsInteropModule.FkSpectrumWindow(
        fkData.fkSpectraMetadata?.fkSpectrumWindow.duration ?? 0,
        fkData.fkSpectraMetadata?.fkSpectrumWindow.lead ?? 0
      ),
      fkData.fkSpectraMetadata?.phase ?? 'P',
      new gmsInteropModule.SlownessGrid(
        fkData.fkSpectraMetadata?.slownessGrid.maxSlowness ?? 40,
        fkData.fkSpectraMetadata?.slownessGrid.numPoints ?? 81
      )
    );

    const fkSpectra: Wasm.FkSpectra = new gmsInteropModule.FkSpectra(
      fkSpectrums,
      fkSpectraMetadata,
      fkData.startTime,
      fkData.endTime,
      fkData.sampleRateHz,
      fkData.sampleCount
    );

    const result = convertToTsFkSpectra(gmsInteropModule, fkSpectra);

    expect(result).toBeDefined();
    expect(result.startTime).toEqual(fkData.startTime);
  });
});
