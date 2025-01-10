import { Alert, Button, Intent } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { FkTypes, SignalDetectionTypes } from '@gms/common-model';
import { Tooltip2Wrapper } from '@gms/ui-core-components';
import {
  useGetFkMeasuredValues,
  useIsFkAccepted,
  useRevertSignalDetectionAcceptFk,
  useSetFkMeasuredValues,
  useUpdateSignalDetectionAcceptFk
} from '@gms/ui-state';
import classNames from 'classnames';
import React from 'react';

import { FkConfigurationDialog } from './fk-configuration-dialog/fk-configuration-dialog';

export interface FkLabelProps {
  /** Used to derive the station name and phase */
  readonly displayedSignalDetection: SignalDetectionTypes.SignalDetection;
  readonly displayedFkConfiguration: FkTypes.FkSpectraTemplate;
  /** Peak azimuth and slowness values */
  readonly peakAzSlow: FkTypes.AzimuthSlownessValues | undefined;
}

/**
 * Displays the station and phase of the current FK being viewed.
 */
export function FkLabel({
  displayedSignalDetection,
  displayedFkConfiguration,
  peakAzSlow
}: FkLabelProps) {
  const [configurationOpen, setConfigurationOpen] = React.useState<boolean>(false);

  const acceptFk = useUpdateSignalDetectionAcceptFk();
  const revertFk = useRevertSignalDetectionAcceptFk();
  const [isRestoreFkWarningMessageOpen, setIsRestoreFkWarningMessageOpen] = React.useState(false);
  const getFkMeasuredValues = useGetFkMeasuredValues();
  const setFkMeasuredValues = useSetFkMeasuredValues();
  const isAccepted = useIsFkAccepted();
  const needsAcceptance: boolean = !isAccepted(displayedSignalDetection);

  const handleOnAcceptClick = React.useCallback(() => {
    // Retrieves measured value from ui-state or the signal detection
    let analystMeasuredValues = getFkMeasuredValues(displayedSignalDetection);

    // If still undefined use the peakAzSlow value for accept
    if (!analystMeasuredValues) {
      analystMeasuredValues = peakAzSlow;
    }
    acceptFk([
      {
        signalDetectionId: displayedSignalDetection.id,
        measuredValues: {
          azimuth: analystMeasuredValues?.azimuth,
          slowness: analystMeasuredValues?.slowness
        }
      }
    ]);
  }, [acceptFk, displayedSignalDetection, getFkMeasuredValues, peakAzSlow]);

  const handleOnRestoreClick = React.useCallback(
    (previousAnalystMeasuredValue: FkTypes.AzimuthSlownessValues | undefined) => {
      setIsRestoreFkWarningMessageOpen(false);
      setFkMeasuredValues(displayedSignalDetection, previousAnalystMeasuredValue);
      revertFk(displayedSignalDetection.id);
    },
    [setFkMeasuredValues, displayedSignalDetection, revertFk]
  );

  const fmPhase = SignalDetectionTypes.Util.findPhaseFeatureMeasurementValue(
    SignalDetectionTypes.Util.getCurrentHypothesis(
      displayedSignalDetection.signalDetectionHypotheses
    ).featureMeasurements
  );

  const labelString = `${displayedSignalDetection.station.name} ${fmPhase.value.toString()}`;
  const style: React.CSSProperties = {
    // Align label with the left edge of the FK Image
    marginLeft: `calc(0.5rem + ${FkTypes.Util.SIZE_OF_FK_RENDERING_AXIS_PX}px)`
  };
  const sdFkAcceptedValues: FkTypes.AzimuthSlownessValues =
    SignalDetectionTypes.Util.getAzimuthAndSlownessFromSD(displayedSignalDetection);
  return (
    <div className="fk-label" style={style}>
      {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
      <label title={labelString}>{labelString}</label>
      <div className="fk-label__buttons">
        <Button
          className={classNames({
            'fk-label__accept': true,
            'fk-label__accept--non-interactive': !needsAcceptance
          })}
          text="Accept"
          icon={IconNames.CONFIRM}
          intent={!needsAcceptance ? Intent.SUCCESS : Intent.NONE}
          // Should be un-clickable if already accepted
          onClick={needsAcceptance ? handleOnAcceptClick : undefined}
        />
        <Button
          className={classNames({
            'fk-label__revert': true
          })}
          title="Revert to last accepted FK"
          text="Use Last Accepted"
          disabled={sdFkAcceptedValues === undefined || !needsAcceptance}
          onClick={() => setIsRestoreFkWarningMessageOpen(true)}
        />
        <Alert
          className="fk-revert-warning-message"
          cancelButtonText="Cancel"
          confirmButtonText="Revert to Last Accepted FK"
          icon={IconNames.Refresh}
          intent={Intent.DANGER}
          isOpen={isRestoreFkWarningMessageOpen}
          onCancel={() => setIsRestoreFkWarningMessageOpen(false)}
          onConfirm={() => handleOnRestoreClick(sdFkAcceptedValues)}
        >
          Revert FK Display to use last accepted FK? Any changes to the FK parameters will be lost.
        </Alert>
        <Tooltip2Wrapper content="Change FK parameters">
          <Button
            icon={IconNames.COG}
            onClick={() => {
              setConfigurationOpen(true);
            }}
          />
        </Tooltip2Wrapper>
      </div>
      <FkConfigurationDialog
        isOpen={configurationOpen}
        setIsOpen={val => setConfigurationOpen(val)}
        displayedSignalDetection={displayedSignalDetection}
        displayedFkConfiguration={displayedFkConfiguration}
        phase={fmPhase.value}
      />
    </div>
  );
}
