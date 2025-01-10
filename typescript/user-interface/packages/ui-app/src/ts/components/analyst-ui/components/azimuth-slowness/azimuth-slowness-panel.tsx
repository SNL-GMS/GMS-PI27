import type { EventTypes, SignalDetectionTypes } from '@gms/common-model';
import { FkTypes } from '@gms/common-model';
import { WithNonIdealStates } from '@gms/ui-core-components';
import {
  FkQueryStatus,
  selectDisplayedSignalDetectionId,
  selectedDisplayedSignalDetection,
  useAppSelector,
  useColorMap,
  useGetFkData,
  useGetFkQueryStatus
} from '@gms/ui-state';
import classNames from 'classnames';
import React from 'react';

import { AzimuthSlownessHotkeys } from '~analyst-ui/common/hotkey-configs/azimuth-slowness-hotkey-configs';
import { AnalystNonIdealStates } from '~analyst-ui/common/non-ideal-states';

import { WeavessContext } from '../waveform/weavess-context';
import { FkDisplay } from './components/fk-display';
import type { FkDisplayProps } from './components/fk-display/fk-display';
import { useNextFk, useSignalDetectionsWithFeaturePredictions } from './components/fk-hooks';
import { FkThumbnailList } from './components/fk-thumbnail-list/fk-thumbnail-list';
import { FkThumbnailSize } from './components/fk-thumbnail-list/fk-thumbnails-controls';
import { PhaseSelectorWrapper } from './components/phase-selector-wrapper';

/**
 * Additional props for use with {@link WithNonIdealStates}
 */
export interface FkDisplayOrNonIdealStateProps
  extends Omit<FkDisplayProps, 'displayedSignalDetection' | 'displayedFk'> {
  /** Query pending flag */
  isPending: boolean;
  /** Allows undefined for non-ideal state */
  displayedSignalDetection: SignalDetectionTypes.SignalDetection | undefined;
  /** Allows undefined for non-ideal state */
  displayedFk: FkTypes.FkSpectra | undefined;
}

/**
 * Wrapped non-ideal state component for the {@link FkDisplay}
 */
const FkDisplayOrNonIdealState = WithNonIdealStates<FkDisplayOrNonIdealStateProps, FkDisplayProps>(
  [...AnalystNonIdealStates.fkDisplayNonIdealStateDefinitions],
  FkDisplay
);

/**
 * An intermediary between AzimuthSlownessComponent and the other components so that event handling is simpler
 */
export function AzimuthSlownessPanel() {
  const nextFk = useNextFk();

  /** Used to constrain the max width of the thumbnail drag resize */
  const azimuthSlownessContainer = React.useRef<HTMLDivElement | null>(null);
  /** Used to drag & resize this element */
  const fkThumbnailsContainer = React.useRef<HTMLDivElement | null>(null);
  /** Ref to the draggable divider indicator element */
  const draggableDividerRef = React.useRef<HTMLDivElement | null>(null);
  /** Max percentage of container that the divider can be dragged to */
  const containerMaxWidthPercentage = 0.8;
  /** offset for correcting draggable div's x position while dragging */
  const draggableDividerXOffset = 20;
  /** width of draggable div's active area */
  const dividerHoverWidth = 10;
  /** Default width for the fk thumbnail list */
  const DEFAULT_FK_THUMBNAIL_LIST_SIZE_PX = 255;

  const displayedSignalDetectionId = useAppSelector(selectDisplayedSignalDetectionId);

  const getFkData = useGetFkData();

  const [currentMovieSpectrumIndex, setCurrentMovieSpectrumIndex] = React.useState<number>(0);
  const [selectedFkUnit, setSelectedFkUnit] = React.useState(FkTypes.FkUnits.FSTAT);
  const [phaseMenuVisibility, setPhaseMenuVisibility] = React.useState<boolean>(false);
  const [fkThumbnailSizePx, setFkThumbnailSizePx] = React.useState<number>(FkThumbnailSize.MEDIUM);
  const [fkThumbnailColumnSizePx, setFkThumbnailColumnSizePx] = React.useState(
    DEFAULT_FK_THUMBNAIL_LIST_SIZE_PX
  );

  // These are passed in as props for non-ideal-state-checking
  const displayedSignalDetection = useAppSelector(selectedDisplayedSignalDetection);
  const displayedFk = getFkData(displayedSignalDetection);

  const getFkQueryStatus = useGetFkQueryStatus();
  const fkQueryStatus = getFkQueryStatus(displayedSignalDetection);

  const [dividerIsDragging, setDividerIsDragging] = React.useState<boolean>(false);
  const [minDividerX, setMinDividerX] = React.useState<number>(
    fkThumbnailSizePx + draggableDividerXOffset * 2
  );
  let containerWidth = 0;
  if (azimuthSlownessContainer.current?.clientWidth) {
    const offset = 20;
    containerWidth = azimuthSlownessContainer.current.clientWidth + offset;
  }
  const [maxDividerX, setMaxDividerX] = React.useState<number>(
    containerWidth * containerMaxWidthPercentage
  );

  // Hotkeys setup
  const { weavessRef } = React.useContext(WeavessContext);

  /** Handles resetting waveform amplitudes within Weavess */
  const resetAmplitudes = React.useCallback(() => {
    if (weavessRef) {
      weavessRef.resetWaveformPanelAmplitudes();
    }
  }, [weavessRef]);

  const [colorMap] = useColorMap();
  // Get collection of signalDetectionIds mapped to featurePredictions
  const signalDetectionIdToFeaturePredictionsMap: Map<string, EventTypes.FeaturePrediction[]> =
    useSignalDetectionsWithFeaturePredictions();

  /**
   * constrains the position of the divider
   *
   * @param currentXPos
   * @returns number constrained to set limits
   */
  const constrainDividerXPos = React.useCallback(
    (currentXPos: number) => {
      // This should never be undefined
      if (azimuthSlownessContainer.current) {
        const rect = azimuthSlownessContainer.current.getBoundingClientRect();
        let newXPos = currentXPos - rect.x;
        if (newXPos > maxDividerX) {
          newXPos = maxDividerX;
        }
        if (newXPos < minDividerX) {
          newXPos = minDividerX;
        }
        return newXPos;
      }
      return currentXPos;
    },
    [maxDividerX, minDividerX]
  );

  /**
   * Sets the divider's position
   *
   * @param newPosition number
   */
  const setDividerXPosition = React.useCallback((newPosition: number) => {
    if (draggableDividerRef.current)
      draggableDividerRef.current.style.transform = `translateX(${newPosition}px)`;
  }, []);

  /**
   * Handles mouse move while dragging divider
   *
   * @param e keyboard event
   */
  const onDividerMouseMove = React.useCallback(
    (e: MouseEvent) => {
      // Returning early prevents unnecessary work
      if (!azimuthSlownessContainer.current) return;

      // move the crosshair to the current pointer location relative to container
      const currentXPos: number = constrainDividerXPos(e.clientX);
      setDividerXPosition(currentXPos + dividerHoverWidth / 2);
    },
    [constrainDividerXPos, setDividerXPosition]
  );

  /**
   * Handles mouse up while dragging divider
   *
   * @param e keyboard event
   */
  const onDividerMouseUp = React.useCallback(
    (event: MouseEvent) => {
      // Clean up event handlers and state
      document.removeEventListener('mouseup', onDividerMouseUp);
      setDividerIsDragging(false);

      if (!azimuthSlownessContainer.current) return; // Prevent unnecessary setting of the exact same values
      azimuthSlownessContainer.current.removeEventListener('mousemove', onDividerMouseMove);

      // New width of the thumbnail container = (mouse Xpos in document) - (fk container Xpos in document) - offset + active width of dragger
      const newWidth = constrainDividerXPos(event.clientX);

      setFkThumbnailColumnSizePx(newWidth - draggableDividerXOffset + dividerHoverWidth);
      setDividerXPosition(newWidth - dividerHoverWidth / 2);
    },
    [constrainDividerXPos, onDividerMouseMove, setDividerXPosition]
  );

  /**
   * Start a drag on mouse down on the divider
   */
  const onDividerMouseDown = React.useCallback(() => {
    // Set up event listeners
    document.addEventListener('mouseup', onDividerMouseUp);
    setDividerIsDragging(true);
    setDividerXPosition(fkThumbnailColumnSizePx + draggableDividerXOffset);

    azimuthSlownessContainer.current?.addEventListener('mousemove', onDividerMouseMove);
  }, [fkThumbnailColumnSizePx, onDividerMouseMove, onDividerMouseUp, setDividerXPosition]);

  React.useEffect(() => {
    setMinDividerX(fkThumbnailSizePx + draggableDividerXOffset * 2);
    setMaxDividerX(containerWidth * containerMaxWidthPercentage);
    setDividerXPosition(fkThumbnailColumnSizePx + draggableDividerXOffset);
  }, [
    fkThumbnailColumnSizePx,
    fkThumbnailSizePx,
    containerWidth,
    onDividerMouseUp,
    setDividerXPosition
  ]);

  // Get featurePredictions that correspond to the displayed SD
  const featurePredictionsForDisplayedSignalDetection =
    signalDetectionIdToFeaturePredictionsMap.get(displayedSignalDetectionId ?? '') ?? [];

  return (
    <AzimuthSlownessHotkeys nextFk={nextFk} resetAllWaveformAmplitudeScaling={resetAmplitudes}>
      {/* // eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        ref={azimuthSlownessContainer}
        key={`azimuth-slowness-panel--${colorMap}`}
        className={classNames('azimuth-slowness-container', {
          'divider-is-dragging': dividerIsDragging
        })}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
      >
        <div
          ref={fkThumbnailsContainer}
          className="azimuth-slowness-thumbnails"
          style={{ width: `${fkThumbnailColumnSizePx}px` }}
        >
          <PhaseSelectorWrapper isOpen={phaseMenuVisibility} setIsOpen={setPhaseMenuVisibility} />
          <div className="azimuth-slowness-thumbnails__wrapper-1">
            <FkThumbnailList
              thumbnailSizePx={fkThumbnailSizePx}
              signalDetectionIdToFeaturePredictionsMap={signalDetectionIdToFeaturePredictionsMap}
              selectedFkUnit={selectedFkUnit}
              setPhaseMenuVisibility={setPhaseMenuVisibility}
              setFkThumbnailSizePx={setFkThumbnailSizePx}
              fkThumbnailColumnSizePx={fkThumbnailColumnSizePx}
            />
          </div>
        </div>
        {/* actual draggable element */}
        <div
          className={classNames('azimuth-slowness-draggable-divider', {
            'not-dragging': !dividerIsDragging
          })}
          data-testid="azimuth-slowness-draggable-divider-ref"
          ref={draggableDividerRef}
        />
        {/* element with hover state & click handler */}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div
          className={classNames('azimuth-slowness-divider', {
            'is-dragging': dividerIsDragging
          })}
          style={{ width: `${dividerHoverWidth}px` }}
          data-testid="azimuth-slowness-draggable-divider"
          onMouseDown={onDividerMouseDown}
        >
          <div>
            <div className="azimuth-slowness-divider__spacer" />
          </div>
        </div>
        <FkDisplayOrNonIdealState
          isPending={fkQueryStatus === FkQueryStatus.PENDING_QUERY}
          displayedSignalDetection={displayedSignalDetection}
          featurePredictionsForDisplayedSignalDetection={
            featurePredictionsForDisplayedSignalDetection
          }
          fkDisplayWidthPx={containerWidth - fkThumbnailColumnSizePx}
          setCurrentMovieSpectrumIndex={setCurrentMovieSpectrumIndex}
          currentMovieSpectrumIndex={currentMovieSpectrumIndex}
          displayedFk={displayedFk}
          selectedFkUnit={selectedFkUnit}
          setSelectedFkUnit={setSelectedFkUnit}
          colorMap={colorMap}
          setPhaseMenuVisibility={setPhaseMenuVisibility}
        />
      </div>
    </AzimuthSlownessHotkeys>
  );
}
