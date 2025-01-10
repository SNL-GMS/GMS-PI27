import type { GmsInteropModule, Wasm } from '../../../src/ts/gms-interop/gms-interop-module';
import { getInteropModule } from '../../../src/ts/gms-interop/gms-interop-module';

describe('GMS Filters Filter Description Test', () => {
  let gmsInteropModule: GmsInteropModule;

  beforeAll(async () => {
    gmsInteropModule = await getInteropModule();
  });

  test('exists', () => {
    expect(gmsInteropModule).toBeDefined();
  });

  test('FilterDescription is defined and can be created', () => {
    expect(gmsInteropModule.LinearIIRFilterDescription).toBeDefined();

    let iirFilterParameters: Wasm.IIRFilterParameters | null = null;
    let linearIIRFilterDescription: Wasm.LinearIIRFilterDescription | null = null;

    /* eslint-disable @typescript-eslint/no-magic-numbers */
    try {
      const sosNumerator = new gmsInteropModule.VectorDouble();
      sosNumerator.push_back(1.1);
      sosNumerator.push_back(2.2);
      sosNumerator.push_back(3.3);
      const sosDenominator = new gmsInteropModule.VectorDouble();
      sosDenominator.push_back(4.4);
      sosDenominator.push_back(5.5);
      sosDenominator.push_back(6.6);
      const sosCoefficients = new gmsInteropModule.VectorDouble();
      sosCoefficients.push_back(7.7);
      sosCoefficients.push_back(8.8);
      sosCoefficients.push_back(9.9);

      iirFilterParameters = new gmsInteropModule.IIRFilterParameters(
        sosNumerator,
        sosDenominator,
        sosCoefficients,
        1,
        true,
        20,
        5
      );

      linearIIRFilterDescription = new gmsInteropModule.LinearIIRFilterDescription(
        iirFilterParameters,
        false,
        'comment',
        5.0,
        0.5,
        gmsInteropModule.FilterBandType.LOW_PASS,
        gmsInteropModule.FilterDesignModel.BUTTERWORTH,
        10,
        +true
      );

      // assigned pointer value on create confirms it exists in WASM
      expect((iirFilterParameters as unknown as { $$: { ptr: number } }).$$.ptr).not.toEqual(0);
      expect((linearIIRFilterDescription as unknown as { $$: { ptr: number } }).$$.ptr).not.toEqual(
        0
      );
    } catch (e) {
      console.error(e);
      // eslint-disable-next-line jest/no-conditional-expect
      expect(e).not.toBeDefined();
    } finally {
      if (iirFilterParameters) iirFilterParameters.delete();
      if (linearIIRFilterDescription) linearIIRFilterDescription.delete();
    }
    /* eslint-enable @typescript-eslint/no-magic-numbers */
  });
});
