import { ChannelSegmentTypes, type FkTypes } from '@gms/common-model';
import { signalDetectionsData } from '@gms/common-model/__tests__/__data__';
import cloneDeep from 'lodash/cloneDeep';

import {
  updateFk,
  updateFkReducer,
  updateFkThumbnailReducer
} from '../../../../../src/ts/app/api/data/fk/update-fk-reducer';
import { getTestFkChannelSegment } from '../../../../__data__';

describe('Update FK reducers', () => {
  describe('updateFkReducer', () => {
    const mockSd = signalDetectionsData[0];
    const mockFkChannelSegment = getTestFkChannelSegment(mockSd);

    test('adds a computed FkSpectra to state', () => {
      const state = cloneDeep({
        fkChannelSegments: {},
        signalDetections: {
          [mockSd.id]: mockSd
        }
      });

      const action = {
        payload: {
          fkChannelSegment: mockFkChannelSegment,
          signalDetectionId: mockSd.id
        },
        type: updateFk
      };

      updateFkReducer(state as any, action as any);

      expect(
        state.fkChannelSegments[
          ChannelSegmentTypes.Util.createChannelSegmentString(mockFkChannelSegment.id)
        ]
      ).toBe(mockFkChannelSegment);
      expect(state.signalDetections[mockSd.id]._uiFkChannelSegmentDescriptorId).toEqual(
        mockFkChannelSegment.id
      );
    });
  });

  describe('updateFkThumbnailReducer', () => {
    test('adds an fkFrequencyThumbnail to state', () => {
      const mockSd = signalDetectionsData[0];
      const mockFkSpectra = getTestFkChannelSegment(mockSd).timeseries[0];

      const state = cloneDeep({
        fkFrequencyThumbnails: {}
      });

      const action = {
        payload: {
          fkSpectra: mockFkSpectra,
          signalDetectionId: mockSd.id
        },
        type: updateFk
      };
      updateFkThumbnailReducer(state as any, action as any);

      expect(state.fkFrequencyThumbnails[mockSd.id][0]).toBeDefined();
    });

    test('updates an fkFrequencyThumbnail in state', () => {
      const mockSd = signalDetectionsData[0];
      const mockFkSpectra = getTestFkChannelSegment(mockSd).timeseries[0];
      const mockFkThumbnail: FkTypes.FkFrequencyThumbnail = {
        fkSpectra: mockFkSpectra,
        frequencyBand: {
          lowFrequencyHz:
            mockFkSpectra.configuration.fkSpectraParameters.fkFrequencyRange.lowFrequencyHz,
          highFrequencyHz:
            mockFkSpectra.configuration.fkSpectraParameters.fkFrequencyRange.highFrequencyHz
        }
      };

      const state = cloneDeep({
        fkFrequencyThumbnails: {
          [mockSd.id]: [mockFkThumbnail]
        }
      });

      const action = {
        payload: {
          fkSpectra: mockFkSpectra,
          signalDetectionId: mockSd.id
        },
        type: updateFk
      };
      updateFkThumbnailReducer(state as any, action as any);

      // Replace/update, do not add
      expect(state.fkFrequencyThumbnails[mockSd.id][1]).not.toBeDefined();
    });
  });
});
