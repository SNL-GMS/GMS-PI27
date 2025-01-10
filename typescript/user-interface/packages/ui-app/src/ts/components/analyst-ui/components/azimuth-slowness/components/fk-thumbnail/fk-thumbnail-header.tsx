import { Button, Intent } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import type { FkTypes } from '@gms/common-model';
import { SignalDetectionTypes } from '@gms/common-model';
import {
  selectEvents,
  selectOpenEventId,
  selectOpenIntervalName,
  useAppSelector,
  useEventStatusQuery,
  useGetFkMeasuredValues,
  useIsFkAccepted,
  useUpdateSignalDetectionAcceptFk
} from '@gms/ui-state';
import classNames from 'classnames';
import React from 'react';

import { getSignalDetectionStatus } from '~analyst-ui/common/utils/event-util';

export interface FkThumbnailHeaderProps {
  /** Text to be displayed above the thumbnail */
  readonly label: string;
  /** If true, the confirm button will have a non-default color */
  readonly needsReview: boolean;
  /** Determines if the confirm/close buttons should be shown */
  readonly showButtons: boolean;
  /** The signal detection being represented by the base FkThumbnail component */
  readonly signalDetection: SignalDetectionTypes.SignalDetection;
  setHiddenThumbnails: React.Dispatch<React.SetStateAction<string[]>> | undefined;
  /** Indicates if the thumbnail has loaded */
  readonly hasImage: boolean;
  /** Peak azimuth and slowness values */
  readonly peakAzSlow: FkTypes.AzimuthSlownessValues | undefined;
}

/**
 * Determine the classNames to apply based on SD association status
 */
const useLabelClassName = (signalDetection?: SignalDetectionTypes.SignalDetection) => {
  const events = useAppSelector(selectEvents);
  const openEventId = useAppSelector(selectOpenEventId);
  const eventStatusQuery = useEventStatusQuery();
  const openIntervalName = useAppSelector(selectOpenIntervalName);

  const className = 'fk-thumbnail__label';

  if (!signalDetection) return className;

  const sdAssocStatus = getSignalDetectionStatus(
    signalDetection,
    Object.values(events),
    openEventId,
    eventStatusQuery.data ?? {},
    openIntervalName
  );

  switch (sdAssocStatus) {
    case SignalDetectionTypes.SignalDetectionStatus.OPEN_ASSOCIATED:
      return `${className} ${className}--open-associated`;
    case SignalDetectionTypes.SignalDetectionStatus.COMPLETE_ASSOCIATED:
      return `${className} ${className}--complete-associated`;
    case SignalDetectionTypes.SignalDetectionStatus.OTHER_ASSOCIATED:
      return `${className} ${className}--other-associated`;
    case SignalDetectionTypes.SignalDetectionStatus.UNASSOCIATED:
      return `${className} ${className}--unassociated`;
    case SignalDetectionTypes.SignalDetectionStatus.DELETED:
      return `${className} ${className}--deleted-sd`;
    default:
      return className;
  }
};

/**
 * Internal component used by the FkThumbnail to provide
 * additional information/controls.
 */
export function FkThumbnailHeader({
  label,
  needsReview,
  showButtons,
  signalDetection,
  hasImage,
  setHiddenThumbnails,
  peakAzSlow
}: Readonly<FkThumbnailHeaderProps>) {
  const labelClassName = useLabelClassName(signalDetection);
  const acceptFk = useUpdateSignalDetectionAcceptFk();
  const getFkMeasuredValues = useGetFkMeasuredValues();
  const isAccepted = useIsFkAccepted();
  const needsAcceptance: boolean = !isAccepted(signalDetection);

  const handleHideThumbnailClick = () => {
    if (setHiddenThumbnails) {
      setHiddenThumbnails(prev => [...prev, signalDetection.id]);
    }
  };

  const handleOnAcceptClick = React.useCallback(() => {
    // Retrieves measured value from ui-state or the signal detection
    let analystMeasuredValues = getFkMeasuredValues(signalDetection);

    // If still undefined use the peakAzSlow value for accept
    if (!analystMeasuredValues) {
      analystMeasuredValues = peakAzSlow;
    }
    acceptFk([
      {
        signalDetectionId: signalDetection.id,
        measuredValues: {
          azimuth: analystMeasuredValues?.azimuth,
          slowness: analystMeasuredValues?.slowness
        }
      }
    ]);
  }, [acceptFk, getFkMeasuredValues, peakAzSlow, signalDetection]);

  const getAcceptButtonIntent = () => {
    if (!hasImage) return Intent.NONE;
    if (!needsAcceptance) return Intent.SUCCESS;
    if (needsReview) return Intent.WARNING;
    return Intent.NONE;
  };

  return (
    <div className="fk-thumbnail__header">
      {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
      <label title={label} className={labelClassName}>
        {label}
      </label>
      {showButtons && (
        <span className="fk-thumbnail__buttons">
          <Button
            className={classNames({
              'fk-thumbnail__accept': true,
              'fk-thumbnail__accept--disabled': !hasImage,
              'fk-thumbnail__accept--non-interactive': !needsAcceptance && hasImage
            })}
            small
            intent={getAcceptButtonIntent()}
            icon={IconNames.CONFIRM}
            disabled={!hasImage}
            // Should be un-clickable if already accepted
            onClick={needsAcceptance ? handleOnAcceptClick : undefined}
          />
          <Button small icon={IconNames.CROSS} onClick={handleHideThumbnailClick} />
        </span>
      )}
    </div>
  );
}
