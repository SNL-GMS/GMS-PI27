import type { FkTypes } from '@gms/common-model';
import { ChannelSegmentTypes, CommonTypes } from '@gms/common-model';
import type { FkSpectraTemplate, FstatData } from '@gms/common-model/lib/fk';
import { UILogger } from '@gms/ui-util';
import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AxiosRequestConfig } from 'axios';
import produce from 'immer';

import type { AppState, DataState } from '../../../../ui-state';
import { computeLegacyFkSpectraApi } from '../../../../workers/api';
import { CANCELED } from '../../../query';
import {
  addAsyncFetchHistoryEntryFulfilled,
  addAsyncFetchHistoryEntryPending,
  addAsyncFetchHistoryEntryRejected,
  hasAlreadyBeenRequested,
  hasBeenRejected
} from '../../../query/async-fetch-util';
import { config } from './endpoint-configuration';
import { mutateFkThumbnailRecord } from './mutate-fk-channel-segment-record';
import { updateFkMetadata } from './update-fk-util';

const logger = UILogger.create(
  'GMS_LOG_COMPUTE_FK_SPECTRA',
  process.env.GMS_LOG_COMPUTE_FK_SPECTRA
);

export const createRequestString = (args: FkTypes.FkInputWithConfiguration): string => {
  return `${args.signalDetectionId}.${JSON.stringify(args.fkComputeInput)}`;
};
/**
 * Helper function used to determine if the computeFkSpectra query should be skipped.
 *
 * @returns returns true if the arguments are valid; false otherwise.
 */
export const shouldSkipComputeLegacyFkSpectra = (args: FkTypes.FkInputWithConfiguration): boolean =>
  !args ||
  args.configuration == null ||
  args.fkComputeInput == null ||
  args.signalDetectionId == null;

/**
 * Async thunk action that request a FK be computed.
 *
 * @deprecated to be replaced with the local WASM Compute Fk Algorithm
 */
export const computeLegacyFkSpectra = createAsyncThunk<
  ChannelSegmentTypes.ChannelSegment<FkTypes.FkPowerSpectra>,
  FkTypes.FkInputWithConfiguration
>(
  'fk/computeLegacyFkSpectra',
  async (arg: FkTypes.FkInputWithConfiguration, { rejectWithValue }) => {
    const requestConfig: AxiosRequestConfig<FkTypes.ComputeFkInput> = {
      ...config.computeFkSpectra.services.computeFkSpectra.requestConfig,
      data: arg.fkComputeInput
    };
    return computeLegacyFkSpectraApi(requestConfig).catch(error => {
      if (error.message !== CANCELED) {
        logger.error(`Failed computeLegacyFkSpectra (rejected)`, error);
      }
      return rejectWithValue(error);
    });
  },
  {
    condition: (arg: FkTypes.FkInputWithConfiguration, { getState }) => {
      const state = (getState as () => AppState)();

      // determine if the query should be skipped based on the provided args; check if valid
      if (shouldSkipComputeLegacyFkSpectra(arg)) {
        return false;
      }

      // check if the query has been executed already
      const requests = state.data.queries.computeFkSpectra[createRequestString(arg)] ?? {};
      return (
        !hasAlreadyBeenRequested<FkTypes.FkInputWithConfiguration>(requests, arg) &&
        !hasBeenRejected<FkTypes.FkInputWithConfiguration>(requests, arg)
      );
    }
  }
);

/**
 * Injects the computeFkSpectra reducers to the provided builder.
 *
 * @param builder the action reducer map builder
 */
export const addComputeLegacyFkSpectraReducers = (
  builder: ActionReducerMapBuilder<DataState>
): void => {
  builder
    /**
     * computeFkSpectra PENDING action
     * Updates the signal detection query state to indicate that the query status is pending.
     * Note: Mutating the state maintains immutability because it uses immer under the hood.
     */
    .addCase(computeLegacyFkSpectra.pending, (state, action) => {
      const history = state.queries.computeFkSpectra;
      const id = createRequestString(action.meta.arg);
      addAsyncFetchHistoryEntryPending(history, id, action);
    })

    /**
     * computeFkSpectra FULFILLED action
     * Updates the signal detection query state to indicate that the query status is fulfilled.
     * Stores the retrieved signal detections in the signal detection redux state.
     * Stores the retrieved channel segments in the channel segment redux state.
     * Note: Mutating the state maintains immutability because it uses immer under the hood.
     */
    .addCase(computeLegacyFkSpectra.fulfilled, (state, action) => {
      const history = state.queries.computeFkSpectra;
      const id = createRequestString(action.meta.arg);
      addAsyncFetchHistoryEntryFulfilled(history, id, action);

      const { signalDetectionId } = action.meta.arg;

      // Restore config and process waveforms
      const fkResult: ChannelSegmentTypes.ChannelSegment<FkTypes.FkPowerSpectra> = action.payload;
      // TODO: Convert to new FKSpectra remove when FK wasm is implemented
      const { timeseries } = fkResult;
      const newTimeseries: FkTypes.FkSpectra[] = timeseries.map(ts => {
        const newFkSpectrums: FkTypes.FkSpectrum[] = ts.values.map(fkSpectrum => {
          const newSpectrum: FkTypes.FkSpectrum = {
            power: fkSpectrum.power,
            fstat: fkSpectrum.fstat,
            fkQual: fkSpectrum.quality,
            fkAttributes: fkSpectrum.attributes.map(attrib => {
              const newAttr: FkTypes.FkAttributes = {
                peakFStat: attrib.peakFStat,
                receiverToSourceAzimuth: {
                  value: attrib.azimuth,
                  standardDeviation: attrib.azimuthUncertainty,
                  units: CommonTypes.Units.DEGREES
                },
                slowness: {
                  value: attrib.slowness,
                  standardDeviation: attrib.slownessUncertainty,
                  units: CommonTypes.Units.SECONDS
                }
              };
              return newAttr;
            })
          };
          return newSpectrum;
        });
        const newFkSpectra: FkTypes.FkSpectra = {
          startTime: ts.startTime,
          endTime: ts.endTime,
          type: ChannelSegmentTypes.TimeseriesType.FK_SPECTRA,
          sampleRateHz: ts.sampleRateHz,
          sampleCount: ts.sampleCount,
          samples: newFkSpectrums,
          fkSpectraMetadata: {
            fkSpectrumWindow: {
              lead: action.meta.arg.configuration.fkSpectraParameters.fkSpectrumWindow.lead,
              duration: action.meta.arg.configuration.fkSpectraParameters.fkSpectrumWindow.duration
            },
            slownessGrid: {
              maxSlowness:
                action.meta.arg.configuration.fkSpectraParameters.slownessGrid.maxSlowness,
              numPoints: action.meta.arg.configuration.fkSpectraParameters.slownessGrid.numPoints
            },
            phase: ts.metadata.phaseType
          },
          configuration: {} as FkSpectraTemplate,
          reviewed: false,
          fstatData: {} as FstatData
        };
        return newFkSpectra;
      });

      const newFkCs: ChannelSegmentTypes.ChannelSegment<FkTypes.FkSpectra> = {
        ...fkResult,
        timeseriesType: ChannelSegmentTypes.TimeseriesType.FK_SPECTRA,
        timeseries: newTimeseries
      };
      const fk = produce(newFkCs, draft => {
        draft.timeseries = draft.timeseries.map(tsFk => {
          return updateFkMetadata(tsFk, action.meta.arg.configuration);
        });
      });
      if (!action.meta.arg.isThumbnailRequest) {
        if (fk) {
          const fkChannelSegmentId = ChannelSegmentTypes.Util.createChannelSegmentString(fk.id);
          state.fkChannelSegments[fkChannelSegmentId] = fk;
          state.signalDetections[signalDetectionId]._uiFkChannelSegmentDescriptorId = fk.id;
        }
      } else {
        const fkFrequencyRange: FkTypes.FkFrequencyRange = {
          highFrequencyHz: action.meta.arg.fkComputeInput.highFrequency,
          lowFrequencyHz: action.meta.arg.fkComputeInput.lowFrequency
        };
        mutateFkThumbnailRecord(
          fkFrequencyRange,
          action.meta.arg.signalDetectionId,
          state.fkFrequencyThumbnails,
          fk
        );
      }
    })

    /**
     * computeFkSpectra REJECTED action
     * Updates the signal detection query state to indicate that the query status is rejected,
     * and adds the error message.
     * Note: Mutating the state maintains immutability because it uses immer under the hood.
     */
    .addCase(computeLegacyFkSpectra.rejected, (state, action) => {
      const history = state.queries.computeFkSpectra;
      const id = createRequestString(action.meta.arg);
      addAsyncFetchHistoryEntryRejected(history, id, action);
    });
};
