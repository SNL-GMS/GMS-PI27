import { eventBeamformingTemplate } from '@gms/common-model/__tests__/__data__';
import { toast } from 'react-toastify';

import { reportBeamformingErrors } from '../../../../src/ts/app';
import {
  BeamformingArrivalTimeError,
  BeamformingAzimuthError,
  BeamformingMinimumNumberOfChannelsError,
  BeamformingSlownessError
} from '../../../../src/ts/app/processing/beamforming/errors';

describe('beamforming report errors', () => {
  it('exists', () => {
    expect(reportBeamformingErrors).toBeDefined();
  });

  it('report', () => {
    const toastSpy = jest.spyOn(toast, 'error');

    // eslint-disable-next-line no-console
    console.error = jest.fn();

    expect(() => {
      reportBeamformingErrors([
        new BeamformingArrivalTimeError({ name: 'testA' }, undefined, undefined, 'P'),
        new BeamformingAzimuthError({ name: 'testC' }, undefined, undefined, 'P'),
        new BeamformingSlownessError({ name: 'testB' }, undefined, undefined, 'P')
      ]);
    }).not.toThrow();

    expect(toastSpy).toHaveBeenCalledTimes(1);
    expect(toastSpy).toHaveBeenLastCalledWith(
      'There was an error creating event beams for stations: testA, testB, testC',
      { toastId: 'beaming-processing-error' }
    );

    expect(() => {
      reportBeamformingErrors([
        new BeamformingMinimumNumberOfChannelsError({ name: 'testB' }, [], eventBeamformingTemplate)
      ]);
    }).not.toThrow();

    expect(toastSpy).toHaveBeenCalledTimes(2);
    expect(toastSpy).toHaveBeenLastCalledWith(
      'There was a problem with configuration for stations: testB',
      { toastId: 'beaming-configuration-error' }
    );

    expect(() => {
      reportBeamformingErrors([
        new BeamformingArrivalTimeError({ name: 'testA' }, undefined, undefined, 'P'),
        new BeamformingAzimuthError({ name: 'testC' }, undefined, undefined, 'P'),
        new BeamformingSlownessError({ name: 'testB' }, undefined, undefined, 'P'),
        new BeamformingMinimumNumberOfChannelsError({ name: 'testB' }, [], eventBeamformingTemplate)
      ]);
    }).not.toThrow();

    expect(toastSpy).toHaveBeenCalledTimes(4);
    expect(toastSpy).toHaveBeenLastCalledWith(
      'There was an error creating event beams for stations: testA, testB, testC',
      { toastId: 'beaming-processing-error' }
    );
  });
});
