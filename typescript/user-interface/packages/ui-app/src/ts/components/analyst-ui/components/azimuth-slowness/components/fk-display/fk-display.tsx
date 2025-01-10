import type { ColorTypes, EventTypes, FkTypes, SignalDetectionTypes } from '@gms/common-model';
import React from 'react';

import { FkProperties } from '../fk-properties';
import { FkRendering } from '../fk-rendering/fk-rendering';
import { getPeakAzimuthSlowness } from '../fk-util';
import { FkLabel } from './fk-label';
import { FkPlots } from './fk-plots';

/**
 * Azimuth Slowness Redux Props
 */
export interface FkDisplayProps {
  displayedSignalDetection: SignalDetectionTypes.SignalDetection;
  featurePredictionsForDisplayedSignalDetection: EventTypes.FeaturePrediction[];
  fkDisplayWidthPx: number;
  currentMovieSpectrumIndex: number;
  setCurrentMovieSpectrumIndex: (index: number) => void;
  displayedFk: FkTypes.FkSpectra;
  selectedFkUnit: FkTypes.FkUnits;
  setSelectedFkUnit: (fkUnit: FkTypes.FkUnits) => void;
  colorMap: ColorTypes.ColorMapName;
  setPhaseMenuVisibility: (isOpen: boolean) => void;
}

/**
 * Azimuth Slowness primary component
 * Displays the FK plot and details of selected fk
 */
export function FkDisplay({
  displayedSignalDetection,
  featurePredictionsForDisplayedSignalDetection,
  fkDisplayWidthPx,
  currentMovieSpectrumIndex,
  setCurrentMovieSpectrumIndex,
  displayedFk,
  selectedFkUnit,
  setSelectedFkUnit,
  colorMap,
  setPhaseMenuVisibility
}: FkDisplayProps) {
  const fkRenderingWidth = 430;

  /** Reference to the FK plots container */
  const fkPlotsContainerRef = React.useRef<HTMLDivElement | null>(null);

  /** Peak Azimuth/Slowness value for this FK, if exists */
  const peakAzSlow = React.useMemo<FkTypes.AzimuthSlownessValues | undefined>(
    () =>
      displayedFk ? getPeakAzimuthSlowness(displayedFk, currentMovieSpectrumIndex) : undefined,
    [currentMovieSpectrumIndex, displayedFk]
  );

  return (
    <div className="azimuth-slowness-data-display">
      <FkLabel
        displayedSignalDetection={displayedSignalDetection}
        displayedFkConfiguration={displayedFk.configuration}
        peakAzSlow={peakAzSlow}
      />
      <div className="azimuth-slowness-data-display__wrapper">
        <div className="fk-image-and-details-container">
          <FkRendering
            featurePredictionsForDisplayedSignalDetection={
              featurePredictionsForDisplayedSignalDetection
            }
            selectedFkUnit={selectedFkUnit}
            setSelectedFkUnit={setSelectedFkUnit}
            fkRenderingWidth={fkRenderingWidth}
            currentMovieSpectrumIndex={currentMovieSpectrumIndex}
            displayedFk={displayedFk}
            colorMap={colorMap}
            displayedSignalDetection={displayedSignalDetection}
          />
          <FkProperties
            displayedSignalDetection={displayedSignalDetection}
            featurePredictionsForDisplayedSignalDetection={
              featurePredictionsForDisplayedSignalDetection
            }
            selectedFkUnit={selectedFkUnit}
            fkRenderingWidth={fkRenderingWidth}
            currentMovieSpectrumIndex={currentMovieSpectrumIndex}
            displayedFk={displayedFk}
            fkDisplayWidthPx={fkDisplayWidthPx}
          />
        </div>
      </div>
      {displayedSignalDetection && (
        <div ref={fkPlotsContainerRef}>
          <FkPlots
            displayedSignalDetection={displayedSignalDetection}
            featurePredictionsForDisplayedSignalDetection={
              featurePredictionsForDisplayedSignalDetection
            }
            displayedFk={displayedFk}
            setCurrentMovieSpectrumIndex={setCurrentMovieSpectrumIndex}
            setPhaseMenuVisibility={setPhaseMenuVisibility}
            fkDisplayWidthPx={fkDisplayWidthPx}
          />
        </div>
      )}
    </div>
  );
}
