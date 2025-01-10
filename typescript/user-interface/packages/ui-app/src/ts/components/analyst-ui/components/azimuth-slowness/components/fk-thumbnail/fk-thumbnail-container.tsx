import type { EventTypes, FkTypes } from '@gms/common-model';
import { SignalDetectionTypes } from '@gms/common-model';
import { FkQueryStatus, useColorMap, useGetFkQueryStatus, useMarkFkReviewed } from '@gms/ui-state';
import classNames from 'classnames';
import React from 'react';
import { toast } from 'react-toastify';

import * as fkUtil from '../fk-util';
import { determineArrivalTimeSpectrumIndex } from '../fk-util';
import { FkThumbnailContent } from './fk-thumbnail-content';
import { FkThumbnailHeader } from './fk-thumbnail-header';

/**
 * Props for {@link FkThumbnailContainer}
 */
export interface FkThumbnailContainerProps {
  /** FK Spectra data to be displayed */
  readonly fkData: FkTypes.FkSpectra | undefined;
  readonly sizePx: number;
  /** Text to be displayed above the thumbnail */
  readonly label: string;
  readonly fkUnit: FkTypes.FkUnits;
  /** Used to determine the predicted point */
  readonly signalDetectionFeaturePredictions?: EventTypes.FeaturePrediction[];
  /** FK is action target */
  readonly isActionTarget?: boolean;
  readonly isUnqualifiedActionTarget?: boolean;
  /** FK is selected */
  readonly isSelected?: boolean;
  /** FK is being displayed in the main FK window */
  readonly isDisplayed: boolean;
  /** Determines if the confirm/close buttons should be shown */
  readonly showButtons: boolean;
  readonly constantVelocityRings: number[];
  readonly needsReview: boolean;
  readonly signalDetection: SignalDetectionTypes.SignalDetection;
  readonly onContextMenu?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  /** Optional click handler */
  readonly onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  /** Optional double click handler */
  readonly onDoubleClick?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  /** Optional hidden thumbnail state setter */
  readonly setHiddenThumbnails?: React.Dispatch<React.SetStateAction<string[]>>;
}

/**
 * Top-level container object for an FK thumbnail. Holds styling, hover
 * behavior, header bar and main content (image or non-ideal state)
 */
export function FkThumbnailContainer({
  fkData,
  sizePx,
  label,
  fkUnit,
  signalDetectionFeaturePredictions,
  isActionTarget,
  isUnqualifiedActionTarget,
  isSelected,
  isDisplayed,
  showButtons,
  constantVelocityRings,
  needsReview,
  signalDetection,
  onContextMenu,
  onClick,
  onDoubleClick,
  setHiddenThumbnails
}: FkThumbnailContainerProps) {
  /** destination to draw the fk. */
  const canvasElementRef = React.useRef<HTMLCanvasElement | null>(null);

  /** Used to prevent collisions between the single and double-click handlers */
  const singleClickTimerRef = React.useRef<NodeJS.Timeout | undefined>();

  /** The current fk represented as an ImageBitmap. */
  const [currentImage, setCurrentImage] = React.useState<ImageBitmap | undefined>();
  const [colorMap] = useColorMap();
  const getFkQueryStatus = useGetFkQueryStatus();

  const fkQueryStatus = getFkQueryStatus(signalDetection);
  const hasImage = currentImage !== undefined;

  /** Measured value for this FK, if exists */
  const sdAzimuthSlownessValues = React.useMemo<FkTypes.AzimuthSlownessValues | undefined>(
    () =>
      signalDetection
        ? SignalDetectionTypes.Util.getAzimuthAndSlownessFromSD(signalDetection)
        : undefined,
    [signalDetection]
  );

  const arrivalTimeSpectrumIndex = determineArrivalTimeSpectrumIndex(fkData, signalDetection);

  /** Peak Azimuth/Slowness value for this FK, if exists */
  const peakAzSlow = React.useMemo<FkTypes.AzimuthSlownessValues | undefined>(
    () => (fkData ? fkUtil.getPeakAzimuthSlowness(fkData, arrivalTimeSpectrumIndex) : undefined),
    [arrivalTimeSpectrumIndex, fkData]
  );

  const markFkReviewed = useMarkFkReviewed();

  // Mark FK reviewed (if applicable)
  if (needsReview && hasImage && isDisplayed) {
    markFkReviewed(signalDetection);
  }

  /**
   * Displays a context menu for reviewing/clearing an fk
   */
  const showThumbnailContextMenu = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      e.preventDefault();
      if (onContextMenu) {
        onContextMenu(e);
      }
    },
    [onContextMenu]
  );

  /**
   * Memoized click handler
   */
  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (onClick) {
        const timeout = 200;
        if (singleClickTimerRef.current) clearTimeout(singleClickTimerRef.current);
        singleClickTimerRef.current = setTimeout(() => {
          onClick(e);
        }, timeout);
      }
    },
    [onClick]
  );

  /**
   * Memoized double click handler
   */
  const handleDoubleClick = React.useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (onDoubleClick) {
        if (singleClickTimerRef.current) clearTimeout(singleClickTimerRef.current);
        onDoubleClick(e);
      }
    },
    [onDoubleClick]
  );

  /**
   * Create the FK thumbnail image
   */
  React.useEffect(() => {
    async function createThumbnailImage(fk: FkTypes.FkSpectra) {
      const fkDisplayData = fkUtil.getFkHeatmapArrayFromFkSpectra(
        fk.samples[arrivalTimeSpectrumIndex],
        fkUnit
      );
      const [min, max] = fkUtil.computeMinMaxFkValues(fkDisplayData);
      await fkUtil
        .createFkImageBitmap(fkDisplayData, min, max, colorMap)
        .then(imageToDraw => {
          setCurrentImage(imageToDraw);
        })
        .catch(() => {
          toast.error('Error fetching fk image', { toastId: 'toast-error-fetching-fk-image' });
        });
    }

    if (fkData) {
      // Invoke the async call to update thumbnail image
      createThumbnailImage(fkData).catch(() => {
        toast.error('Error fetching fk image', { toastId: 'toast-error-fetching-fk-image' });
      });
    }
  }, [arrivalTimeSpectrumIndex, colorMap, fkData, fkUnit]);

  /**
   * (Re)draw the thumbnail image
   */
  React.useEffect(() => {
    if (fkData && currentImage && canvasElementRef.current) {
      const predictedPoint = signalDetectionFeaturePredictions
        ? fkUtil.getPredictedPoint(signalDetectionFeaturePredictions)
        : undefined;
      fkUtil.drawImage(canvasElementRef.current, currentImage);

      const dotLocation = sdAzimuthSlownessValues
        ? fkUtil.getCartesianFromMeasuredValue(
            fkData,
            sdAzimuthSlownessValues?.azimuth,
            sdAzimuthSlownessValues?.slowness,
            canvasElementRef.current.height
          )
        : undefined;

      fkUtil.drawImageOverlay(
        canvasElementRef.current,
        fkData,
        predictedPoint,
        arrivalTimeSpectrumIndex,
        constantVelocityRings,
        dotLocation
      );
    }
  }, [
    sdAzimuthSlownessValues,
    arrivalTimeSpectrumIndex,
    constantVelocityRings,
    currentImage,
    fkData,
    signalDetectionFeaturePredictions,
    sizePx
  ]);

  const gapSizePx = 2;

  const computeFailed: boolean =
    fkQueryStatus === FkQueryStatus.NO_TEMPLATE || fkQueryStatus === FkQueryStatus.NETWORK_FAILURE;

  return (
    <div
      style={{ maxWidth: sizePx + gapSizePx * 2 }}
      className={classNames('fk-thumbnail', {
        'is-displayed': isDisplayed,
        'is-selected': isSelected,
        'action-target': isActionTarget,
        'unqualified-action-target': isUnqualifiedActionTarget,
        'compute-failed': computeFailed
      })}
      onContextMenu={showThumbnailContextMenu}
    >
      <FkThumbnailHeader
        needsReview={needsReview}
        label={label}
        showButtons={showButtons}
        signalDetection={signalDetection}
        setHiddenThumbnails={setHiddenThumbnails}
        hasImage={hasImage}
        peakAzSlow={peakAzSlow}
      />
      {/* Thumbnail OR Status */}
      <FkThumbnailContent
        fkQueryStatus={fkQueryStatus}
        sizePx={sizePx}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        ref={ref => {
          canvasElementRef.current = ref;
        }}
      />
    </div>
  );
}
