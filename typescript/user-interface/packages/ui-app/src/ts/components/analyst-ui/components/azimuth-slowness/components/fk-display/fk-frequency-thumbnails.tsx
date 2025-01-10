import type { ConfigurationTypes, SignalDetectionTypes } from '@gms/common-model';
import { FkTypes } from '@gms/common-model';
import {
  selectFkFrequencyThumbnails,
  useAllStations,
  useAppSelector,
  useLegacyComputeFk,
  useProcessingAnalystConfiguration
} from '@gms/ui-state';
import produce from 'immer';
import isEqual from 'lodash/isEqual';
import React from 'react';

import { FkThumbnail } from '../fk-thumbnail';
import {
  getConstantVelocityRingsForStationType,
  getFrequencyBandsForStationType
} from '../fk-util';

const SIZE_PX_OF_FREQUENCY_THUMBNAILS_PX = 100;

export interface FkFrequencyThumbnailProps {
  fkUnit: FkTypes.FkUnits;
  displayedSignalDetection: SignalDetectionTypes.SignalDetection;
  displayedFk: FkTypes.FkSpectra;
}

export function FkFrequencyThumbnails({
  fkUnit,
  displayedSignalDetection,
  displayedFk
}: FkFrequencyThumbnailProps) {
  const stations = useAllStations();
  const processingAnalystConfig: ConfigurationTypes.ProcessingAnalystConfiguration =
    useProcessingAnalystConfiguration();
  const computeFk = useLegacyComputeFk();
  const constantVelocityRings: number[] = getConstantVelocityRingsForStationType(
    stations,
    displayedSignalDetection,
    processingAnalystConfig
  );

  const frequencyBands = getFrequencyBandsForStationType(
    stations,
    displayedSignalDetection,
    processingAnalystConfig
  );

  const fkFrequencyRecord = useAppSelector(selectFkFrequencyThumbnails);
  const fkFrequencyThumbnails = React.useMemo<FkTypes.FkFrequencyThumbnail[]>(
    () => fkFrequencyRecord[displayedSignalDetection.id] ?? [],
    [displayedSignalDetection.id, fkFrequencyRecord]
  );

  /**
   * Identifies which thumbnail matches the rendered fk
   */
  const determineDisplayed = React.useCallback(
    frequencyBand => {
      return (
        displayedFk.configuration.fkSpectraParameters.fkFrequencyRange.lowFrequencyHz ===
          frequencyBand.lowFrequencyHz &&
        displayedFk.configuration.fkSpectraParameters.fkFrequencyRange.highFrequencyHz ===
          frequencyBand.highFrequencyHz
      );
    },
    [
      displayedFk.configuration.fkSpectraParameters.fkFrequencyRange.highFrequencyHz,
      displayedFk.configuration.fkSpectraParameters.fkFrequencyRange.lowFrequencyHz
    ]
  );

  const getFkSpectraForFKThumbnail = React.useCallback(
    (freqRange: FkTypes.FkFrequencyRange) => {
      const fkFrequencyThumbnail =
        fkFrequencyThumbnails.length > 0
          ? fkFrequencyThumbnails.find(
              thumbnail =>
                thumbnail.frequencyBand?.lowFrequencyHz === freqRange?.lowFrequencyHz &&
                thumbnail.frequencyBand?.highFrequencyHz === freqRange?.highFrequencyHz
            )
          : undefined;
      return fkFrequencyThumbnail ? fkFrequencyThumbnail.fkSpectra : undefined;
    },
    [fkFrequencyThumbnails]
  );

  /** Thumbnail click handler */
  const onFrequencyThumbnailClick = React.useCallback(
    async (minFrequency: number, maxFrequency: number) => {
      const frequencyPair: FkTypes.FkFrequencyRange = {
        highFrequencyHz: maxFrequency,
        lowFrequencyHz: minFrequency
      };
      if (isEqual(frequencyPair, displayedFk.configuration.fkSpectraParameters.fkFrequencyRange)) {
        return;
      }
      const updatedFkConfig = produce(displayedFk.configuration, draft => {
        draft.fkSpectraParameters.fkFrequencyRange = frequencyPair;
      });

      // Call to compute the fk and thumbnails
      await computeFk(updatedFkConfig, displayedSignalDetection);
    },
    [computeFk, displayedFk.configuration, displayedSignalDetection]
  );

  return (
    <div className="fk-frequency-thumbnails">
      {frequencyBands.map(fqBand => {
        const key = FkTypes.Util.frequencyBandToString(fqBand);
        const isDisplayed = determineDisplayed(fqBand);
        return (
          <FkThumbnail
            signalDetection={displayedSignalDetection}
            fkData={getFkSpectraForFKThumbnail(fqBand)}
            label={FkTypes.Util.frequencyBandToString(fqBand)}
            key={key}
            isDisplayed={isDisplayed}
            sizePx={SIZE_PX_OF_FREQUENCY_THUMBNAILS_PX}
            fkUnit={fkUnit}
            needsReview={false}
            showButtons={false}
            constantVelocityRings={constantVelocityRings}
            onClick={async () => {
              await onFrequencyThumbnailClick(fqBand.lowFrequencyHz, fqBand.highFrequencyHz);
            }}
          />
        );
      })}
    </div>
  );
}
