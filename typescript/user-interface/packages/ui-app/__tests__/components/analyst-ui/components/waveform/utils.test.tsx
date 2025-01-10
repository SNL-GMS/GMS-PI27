import type { StationTypes } from '@gms/common-model';
import { SignalDetectionTypes } from '@gms/common-model';
import {
  defaultStations,
  signalDetectionAsarAs01Shz,
  signalDetectionAsarAs02Shz,
  signalDetectionAsarAs31Bhz,
  signalDetectionAsarEventBeam,
  signalDetectionAsarFkBeams,
  signalDetectionOnRawBHN,
  signalDetectionOnRawBHZ,
  signalDetectionsData,
  tempSignalDetection
} from '@gms/common-model/__tests__/__data__';
import type {
  BeamformingTemplatesByPhase,
  BeamformingTemplatesByStationByPhase
} from '@gms/common-model/lib/beamforming-templates/types';
import { BeamType } from '@gms/common-model/lib/beamforming-templates/types';
import { HotkeyListener } from '@gms/ui-util';
import type { WeavessTypes } from '@gms/weavess-core';
import produce from 'immer';
import type { WritableDraft } from 'immer/dist/internal';

import * as WaveformUtils from '~analyst-ui/components/waveform/utils';

jest.mock('~analyst-ui/components/waveform/utils', () => {
  const actual = jest.requireActual('~analyst-ui/components/waveform/utils');
  return {
    ...actual,
    maskAndBeamWaveforms: jest.fn()
  };
});
jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');

  return {
    ...actual,
    useRawChannels: jest.fn(() => {
      return defaultStations[0].allRawChannels;
    }),
    useBeamformingTemplatesForEvent: jest.fn(() => {
      const stationRecord: BeamformingTemplatesByPhase = {};
      defaultStations.forEach((station: StationTypes.Station) => {
        stationRecord[station.name] = {
          inputChannels: station.allRawChannels,
          leadDuration: 1234,
          beamDuration: 1234,
          beamDescription: {} as any,
          minWaveformsToBeam: 1,
          orientationAngleToleranceDeg: 90,
          sampleRateToleranceHz: 50,
          station
        };
      });
      const data: BeamformingTemplatesByStationByPhase = {
        [BeamType.EVENT]: stationRecord
      };
      return { data };
    })
  };
});

jest.mock('@gms/ui-workers', () => {
  const actual = jest.requireActual('@gms/ui-workers');
  return {
    ...actual,
    axiosBaseQuery: jest.fn(() => async () => Promise.resolve({ data: {} }))
  };
});

// Avoid tests with multiple stations
let asarSignalDetections = signalDetectionsData.filter(sd => sd.station.name === 'ASAR');

describe('Waveform utils', () => {
  function getArrivalTimeFM(
    sd: WritableDraft<SignalDetectionTypes.SignalDetection>
  ): WritableDraft<SignalDetectionTypes.ArrivalTimeFeatureMeasurement> {
    const currentHypo = SignalDetectionTypes.Util.getCurrentHypothesis(
      sd.signalDetectionHypotheses
    );
    return SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurement(
      currentHypo.featureMeasurements
    );
  }
  describe('getChannelLabelAndToolTipFromSignalDetectionsAndEventBeams', () => {
    it('creates labels with the expected temp channel label and tooltip when only given temp channels', () => {
      expect(
        WaveformUtils.getChannelLabelAndToolTipFromSignalDetectionsAndEventBeams(
          [tempSignalDetection],
          []
        )
      ).toMatchObject({
        channelLabel: 'temp.---'
      });
    });
    it('creates the expected label and tooltip message  for a single raw channel equal to the channel name', () => {
      expect(
        WaveformUtils.getChannelLabelAndToolTipFromSignalDetectionsAndEventBeams(
          [signalDetectionOnRawBHZ],
          []
        )
      ).toMatchObject({
        channelLabel: 'ULM.BHZ'
      });
    });
    it('creates the expected label and tooltip message for multiple signal detections on the same raw channel', () => {
      expect(
        WaveformUtils.getChannelLabelAndToolTipFromSignalDetectionsAndEventBeams(
          [signalDetectionOnRawBHZ, signalDetectionOnRawBHZ],
          []
        )
      ).toMatchObject({
        channelLabel: 'ULM.BHZ'
      });
    });
    it('creates the expected label and tooltip message for multiple signal detections on different raw channels', () => {
      expect(
        WaveformUtils.getChannelLabelAndToolTipFromSignalDetectionsAndEventBeams(
          [signalDetectionOnRawBHZ, signalDetectionOnRawBHN],
          []
        )
      ).toMatchObject({
        channelLabel: 'ULM.*',
        tooltip: 'Multiple raw channels'
      });
    });
    it('creates the expected label and tooltip message for multiple signal detections on different raw channels with the same channel code', () => {
      expect(
        WaveformUtils.getChannelLabelAndToolTipFromSignalDetectionsAndEventBeams(
          [signalDetectionAsarAs01Shz, signalDetectionAsarAs02Shz],
          []
        )
      ).toMatchObject({
        channelLabel: 'raw.SHZ',
        tooltip: 'Multiple raw channels'
      });
    });
    it('creates the expected label and tooltip message for multiple signal detections on different raw channels with different channel codes', () => {
      expect(
        WaveformUtils.getChannelLabelAndToolTipFromSignalDetectionsAndEventBeams(
          [signalDetectionAsarAs01Shz, signalDetectionAsarAs02Shz, signalDetectionAsarAs31Bhz],
          []
        )
      ).toMatchObject({
        channelLabel: 'raw.*',
        tooltip: 'Multiple raw channels'
      });
    });
    it('creates the expected label and tooltip message for an FK beam', () => {
      expect(
        WaveformUtils.getChannelLabelAndToolTipFromSignalDetectionsAndEventBeams(
          [signalDetectionAsarFkBeams[0], signalDetectionAsarFkBeams[0]],
          []
        )
      ).toMatchObject({
        channelLabel: 'beam.SHZ'
      });
    });
    it('creates the expected label and tooltip message for multiple beam types of shz channels', () => {
      expect(
        WaveformUtils.getChannelLabelAndToolTipFromSignalDetectionsAndEventBeams(
          [signalDetectionAsarEventBeam, signalDetectionAsarFkBeams[0]],
          []
        )
      ).toMatchObject({
        channelLabel: '*.SHZ',
        tooltip: 'Multiple beam types'
      });
    });
    it('creates the expected label and tooltip message for fk beams on different channel types', () => {
      expect(
        WaveformUtils.getChannelLabelAndToolTipFromSignalDetectionsAndEventBeams(
          signalDetectionAsarFkBeams,
          []
        )
      ).toMatchObject({
        channelLabel: 'beam.*',
        tooltip: 'Multiple channel types'
      });
    });
    it('creates the expected label and tooltip message for multiple beam types of mixed channels', () => {
      expect(
        WaveformUtils.getChannelLabelAndToolTipFromSignalDetectionsAndEventBeams(
          [signalDetectionAsarEventBeam, signalDetectionAsarFkBeams[1]],
          []
        )
      ).toMatchObject({
        channelLabel: '*',
        tooltip: 'Multiple beam and channel types'
      });
    });
    it('creates the expected label and tooltip message for a mix of beams and raw waveforms with different channel codes', () => {
      expect(
        WaveformUtils.getChannelLabelAndToolTipFromSignalDetectionsAndEventBeams(
          [signalDetectionAsarFkBeams[0], signalDetectionAsarAs31Bhz],
          []
        )
      ).toMatchObject({
        channelLabel: '*',
        tooltip: 'Multiple waveform and channel types'
      });
    });
    it('creates the expected label and tooltip message for a mix of beams and raw waveforms with the same channel codes', () => {
      expect(
        WaveformUtils.getChannelLabelAndToolTipFromSignalDetectionsAndEventBeams(
          [signalDetectionAsarAs01Shz, signalDetectionAsarFkBeams[0]],
          []
        )
      ).toMatchObject({
        channelLabel: '*.SHZ',
        tooltip: 'Multiple waveform types'
      });
    });
    test('same channel names', () => {
      asarSignalDetections = produce(asarSignalDetections, draft => {
        getArrivalTimeFM(draft[0]).channel = {
          name: 'ASAR.beam.SHZ/beam,fk,coherent',
          effectiveAt: 0
        };
        getArrivalTimeFM(draft[1]).channel = {
          name: 'ASAR.beam.SHZ/beam,fk,coherent',
          effectiveAt: 0
        };
        getArrivalTimeFM(draft[2]).channel = {
          name: 'ASAR.beam.SHZ/beam,fk,coherent',
          effectiveAt: 0
        };
      });

      const res = WaveformUtils.getChannelLabelAndToolTipFromSignalDetectionsAndEventBeams(
        asarSignalDetections,
        []
      );
      expect(res.channelLabel).toMatch('beam.SHZ');
      expect(res.tooltip).toBeUndefined();
    });

    test('mixed channel orientations', () => {
      asarSignalDetections = produce(asarSignalDetections, draft => {
        getArrivalTimeFM(draft[0]).channel = {
          name: 'ASAR.beam.SHZ/beam,fk,coherent',
          effectiveAt: 0
        };
        getArrivalTimeFM(draft[1]).channel = {
          name: 'ASAR.beam.BHZ/beam,fk,coherent',
          effectiveAt: 0
        };
        getArrivalTimeFM(draft[2]).channel = {
          name: 'ASAR.beam.BHZ/beam,fk,coherent',
          effectiveAt: 0
        };
      });
      const res = WaveformUtils.getChannelLabelAndToolTipFromSignalDetectionsAndEventBeams(
        asarSignalDetections,
        []
      );
      expect(res.channelLabel).toMatch('beam.*');
      expect(res.tooltip).toMatch('Multiple channel types');
    });

    test('mixed beams', () => {
      asarSignalDetections = produce(asarSignalDetections, draft => {
        getArrivalTimeFM(draft[0]).channel = {
          name: 'ASAR.beam.SHZ/beam,fk,coherent',
          effectiveAt: 0
        };
        getArrivalTimeFM(draft[1]).channel = {
          name: 'ASAR.beam.SHZ/beam,event,coherent',
          effectiveAt: 0
        };
        getArrivalTimeFM(draft[2]).channel = {
          name: 'ASAR.beam.SHZ/beam,detection,coherent',
          effectiveAt: 0
        };
      });
      const res = WaveformUtils.getChannelLabelAndToolTipFromSignalDetectionsAndEventBeams(
        asarSignalDetections,
        []
      );
      expect(res.channelLabel).toMatch('*.SHZ');
      expect(res.tooltip).toMatch('Multiple beam types');
    });

    test('mixed beams and channel orientations', () => {
      asarSignalDetections = produce(asarSignalDetections, draft => {
        getArrivalTimeFM(draft[0]).channel = {
          name: 'ASAR.beam.SHZ/beam,event,coherent',
          effectiveAt: 0
        };
        getArrivalTimeFM(draft[1]).channel = {
          name: 'ASAR.beam.BHZ/beam,fk,coherent',
          effectiveAt: 0
        };
      });
      const res = WaveformUtils.getChannelLabelAndToolTipFromSignalDetectionsAndEventBeams(
        asarSignalDetections,
        []
      );
      expect(res.channelLabel).toMatch('*');
      expect(res.tooltip).toMatch('Multiple beam and channel types');
    });

    test('missing channel name', () => {
      asarSignalDetections = produce(asarSignalDetections, draft => {
        getArrivalTimeFM(draft[0]).channel = {
          name: '',
          effectiveAt: 0
        };
        getArrivalTimeFM(draft[1]).channel = {
          name: undefined,
          effectiveAt: 0
        };
        getArrivalTimeFM(draft[2]).channel = {
          name: '',
          effectiveAt: 0
        };
      });
      expect(() => {
        WaveformUtils.getChannelLabelAndToolTipFromSignalDetectionsAndEventBeams(
          asarSignalDetections,
          []
        );
      }).toThrow('Cannot get channel name. No channel name provided.');
    });

    test('bad channel name', () => {
      asarSignalDetections = produce(asarSignalDetections, draft => {
        getArrivalTimeFM(draft[0]).channel = {
          name: '',
          effectiveAt: 0
        };
        getArrivalTimeFM(draft[1]).channel = {
          name: 'foo',
          effectiveAt: 0
        };
        getArrivalTimeFM(draft[2]).channel = {
          name: 'bar',
          effectiveAt: 0
        };
      });
      expect(() => {
        WaveformUtils.getChannelLabelAndToolTipFromSignalDetectionsAndEventBeams(
          asarSignalDetections,
          []
        );
      }).toThrow('Cannot get channel name. No channel name provided.');
    });

    test('mismatched station and channel throws an error', () => {
      asarSignalDetections = produce(asarSignalDetections, draft => {
        draft[1].signalDetectionHypotheses[0].station = {
          name: 'ASAR',
          effectiveAt: 0
        };
        getArrivalTimeFM(draft[0]).channel = {
          name: 'ASAR.beam.SHZ',
          effectiveAt: 0
        };
        getArrivalTimeFM(draft[1]).channel = {
          name: 'AAK.beam.SHZ',
          effectiveAt: 0
        };
        getArrivalTimeFM(draft[2]).channel = {
          name: 'ARCES.beam.SHZ',
          effectiveAt: 0
        };
      });
      expect(() => {
        WaveformUtils.getChannelLabelAndToolTipFromSignalDetectionsAndEventBeams(
          asarSignalDetections,
          []
        );
      }).toThrow('Invalid signal detection. Station has channel from a different station.');
    });

    test('not same station throws error', () => {
      asarSignalDetections = produce(asarSignalDetections, draft => {
        draft[0].signalDetectionHypotheses[0].station = {
          name: 'ASAR',
          effectiveAt: 0
        };
        draft[1].signalDetectionHypotheses[0].station = {
          name: 'AAK',
          effectiveAt: 0
        };
        draft[2].signalDetectionHypotheses[0].station = {
          name: 'ARCES',
          effectiveAt: 0
        };
        getArrivalTimeFM(draft[0]).channel = {
          name: 'ASAR.beam.SHZ',
          effectiveAt: 0
        };
        getArrivalTimeFM(draft[1]).channel = {
          name: 'AAK.beam.SHZ',
          effectiveAt: 0
        };
        getArrivalTimeFM(draft[2]).channel = {
          name: 'ARCES.beam.SHZ',
          effectiveAt: 0
        };
      });
      expect(() => {
        WaveformUtils.getChannelLabelAndToolTipFromSignalDetectionsAndEventBeams(
          asarSignalDetections,
          []
        );
      }).toThrow('Cannot build a row label out of channels from multiple stations.');
    });

    test('not 3 channel elements', () => {
      asarSignalDetections = produce(asarSignalDetections, draft => {
        getArrivalTimeFM(draft[0]).channel = {
          name: 'ele1.ele2.ele3.ele4',
          effectiveAt: 0
        };
        getArrivalTimeFM(draft[1]).channel = {
          name: 'ele1.ele2.ele3.ele4',
          effectiveAt: 0
        };
      });
      expect(() =>
        WaveformUtils.getChannelLabelAndToolTipFromSignalDetectionsAndEventBeams(
          asarSignalDetections,
          []
        )
      ).toThrow(
        'Cannot get channel name. Channel name format invalid. Channel name must have a three-part STATION.GROUP.CODE format'
      );
    });

    test('null signal detection list', () => {
      const res = WaveformUtils.getChannelLabelAndToolTipFromSignalDetectionsAndEventBeams(
        null,
        []
      );
      expect(res.channelLabel).toMatch('');
      expect(res.tooltip).toBeUndefined();
    });

    test('empty signal detection list', () => {
      const res = WaveformUtils.getChannelLabelAndToolTipFromSignalDetectionsAndEventBeams([], []);
      expect(res.channelLabel).toMatch('');
      expect(res.tooltip).toBeUndefined();
    });
  });

  describe('get viewable interval with offset with base station time', () => {
    it('memoizedViewableIntervalWithOffset', () => {
      expect(
        WaveformUtils.memoizedViewableIntervalWithOffset(
          {
            startTimeSecs: 0,
            endTimeSecs: 100
          },
          0,
          0,
          1
        )
      ).toMatchSnapshot();
    });
  });

  describe('isAnyCreateSDHotkeySatisfied', () => {
    let subscriptionId;

    const initialConfiguration: Partial<WeavessTypes.Configuration> = {
      hotKeys: {
        createSignalDetectionWithCurrentPhase: { combos: ['e'] },
        createSignalDetectionWithDefaultPhase: { combos: ['alt+e'] },
        createSignalDetectionWithChosenPhase: { combos: ['ctrl+e'] },
        createSignalDetectionNotAssociatedWithWaveformCurrentPhase: {
          combos: ['shift+e']
        },
        createSignalDetectionNotAssociatedWithWaveformDefaultPhase: {
          combos: ['shift+alt+e']
        },
        createSignalDetectionNotAssociatedWithWaveformChosenPhase: { combos: ['ctrl+shift+e'] }
      }
    };

    beforeEach(() => {
      subscriptionId = HotkeyListener.subscribeToGlobalHotkeyListener();
    });
    afterEach(() => {
      HotkeyListener.unsubscribeFromGlobalHotkeyListener(subscriptionId);
    });
    it('properly checks if a non sd hotkey is selected', () => {
      const modifierKeyDownEvent: KeyboardEvent = new KeyboardEvent('keydown', {
        key: 'D',
        code: 'KeyD'
      });
      const modifierKeyUpEvent: KeyboardEvent = new KeyboardEvent('keyup', {
        key: 'D',
        code: 'KeyD'
      });

      document.body.dispatchEvent(modifierKeyDownEvent);
      expect(
        WaveformUtils.isAnyCreateSDHotkeySatisfied(
          { nativeEvent: null } as any,
          initialConfiguration
        )
      ).toBeFalsy();
      document.body.dispatchEvent(modifierKeyUpEvent);
    });
    it('properly checks if e is selected', () => {
      const modifierKeyDownEvent: KeyboardEvent = new KeyboardEvent('keydown', {
        key: 'E',
        code: 'KeyE'
      });
      const modifierKeyUpEvent: KeyboardEvent = new KeyboardEvent('keyup', {
        key: 'E',
        code: 'KeyE'
      });

      document.body.dispatchEvent(modifierKeyDownEvent);
      expect(
        WaveformUtils.isAnyCreateSDHotkeySatisfied(
          { nativeEvent: null } as any,
          initialConfiguration
        )
      ).toBeTruthy();
      document.body.dispatchEvent(modifierKeyUpEvent);
    });
    it('properly checks if ctrl+e are selected', () => {
      const modifierKeyDownEvent: KeyboardEvent = new KeyboardEvent('keydown', {
        key: 'E',
        code: 'KeyE',
        ctrlKey: true
      });
      const modifierKeyUpEvent: KeyboardEvent = new KeyboardEvent('keyup', {
        key: 'E',
        code: 'KeyE',
        ctrlKey: true
      });

      document.body.dispatchEvent(modifierKeyDownEvent);
      expect(
        WaveformUtils.isAnyCreateSDHotkeySatisfied(
          { nativeEvent: null } as any,
          initialConfiguration
        )
      ).toBeTruthy();
      document.body.dispatchEvent(modifierKeyUpEvent);
    });
    it('properly checks if alt+e are selected', () => {
      const modifierKeyDownEvent: KeyboardEvent = new KeyboardEvent('keydown', {
        key: 'E',
        code: 'KeyE',
        altKey: true
      });
      const modifierKeyUpEvent: KeyboardEvent = new KeyboardEvent('keyup', {
        key: 'E',
        code: 'KeyE',
        altKey: true
      });

      document.body.dispatchEvent(modifierKeyDownEvent);
      expect(
        WaveformUtils.isAnyCreateSDHotkeySatisfied(
          { nativeEvent: null } as any,
          initialConfiguration
        )
      ).toBeTruthy();
      document.body.dispatchEvent(modifierKeyUpEvent);
    });
    it('properly checks if shift+e are selected', () => {
      const modifierKeyDownEvent: KeyboardEvent = new KeyboardEvent('keydown', {
        key: 'E',
        code: 'KeyE',
        shiftKey: true
      });
      const modifierKeyUpEvent: KeyboardEvent = new KeyboardEvent('keyup', {
        key: 'E',
        code: 'KeyE',
        shiftKey: true
      });

      document.body.dispatchEvent(modifierKeyDownEvent);
      expect(
        WaveformUtils.isAnyCreateSDHotkeySatisfied(
          { nativeEvent: null } as any,
          initialConfiguration
        )
      ).toBeTruthy();
      document.body.dispatchEvent(modifierKeyUpEvent);
    });
    it('properly checks if shift+ctrl+e are selected', () => {
      const modifierKeyDownEvent: KeyboardEvent = new KeyboardEvent('keydown', {
        key: 'E',
        code: 'KeyE',
        ctrlKey: true,
        shiftKey: true
      });
      const modifierKeyUpEvent: KeyboardEvent = new KeyboardEvent('keyup', {
        key: 'E',
        code: 'KeyE',
        ctrlKey: true,
        shiftKey: true
      });

      document.body.dispatchEvent(modifierKeyDownEvent);
      expect(
        WaveformUtils.isAnyCreateSDHotkeySatisfied(
          { nativeEvent: null } as any,
          initialConfiguration
        )
      ).toBeTruthy();
      document.body.dispatchEvent(modifierKeyUpEvent);
    });

    it('properly checks if shift+alt+e are selected', () => {
      const modifierKeyDownEvent: KeyboardEvent = new KeyboardEvent('keydown', {
        key: 'E',
        code: 'KeyE',
        altKey: true,
        shiftKey: true
      });
      const modifierKeyUpEvent: KeyboardEvent = new KeyboardEvent('keyup', {
        key: 'E',
        code: 'KeyE',
        altKey: true,
        shiftKey: true
      });

      document.body.dispatchEvent(modifierKeyDownEvent);
      expect(
        WaveformUtils.isAnyCreateSDHotkeySatisfied(
          { nativeEvent: null } as any,
          initialConfiguration
        )
      ).toBeTruthy();
      document.body.dispatchEvent(modifierKeyUpEvent);
    });
  });
});
