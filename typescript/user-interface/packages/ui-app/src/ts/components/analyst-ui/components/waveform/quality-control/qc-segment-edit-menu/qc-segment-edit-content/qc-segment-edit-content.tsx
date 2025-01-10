import { Button, Classes, Intent } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import type { WorkflowTypes } from '@gms/common-model';
import type { QcSegment, QcSegmentType, QcSegmentVersion } from '@gms/common-model/lib/qc-segment';
import { QcSegmentCategory } from '@gms/common-model/lib/qc-segment';
import type { UITheme } from '@gms/common-model/lib/ui-configuration/types';
import type { FormTypes } from '@gms/ui-core-components';
import { FormMessage, hideImperativeContextMenu } from '@gms/ui-core-components';
import {
  useAppSelector,
  useCreateQcSegments,
  useModifyQcSegment,
  useRejectQcSegment,
  useUiTheme
} from '@gms/ui-state';
import { MILLISECONDS_IN_SECOND } from '@gms/weavess-core/lib/constants';
import classNames from 'classnames';
import React from 'react';

import { setFocusToWaveformDisplay } from '~analyst-ui/components/waveform/utils';

import {
  getFormErrorMessage,
  getQCSegmentCategoryOrTypeString,
  getQCSegmentSwatchColor,
  isNewQCSegment,
  useDetermineChannelsWithOverlappingData,
  useRejectTooltip
} from '../../qc-segment-utils';
import { AllVersionsTable } from './all-versions';
import { CurrentVersionForm } from './current-version';

export interface QcSegmentEditFormProps {
  qcSegment: QcSegment;
  updateBrushStroke?: (start: number, end: number) => void;
}

enum VersionView {
  CURRENT = 'Current Version',
  ALL = 'All Versions'
}

type HandleSaveButton = () => void;
type HandleRejectButton = () => void;
type HandleCancelButton = () => void;

interface QcSegmentEditArgs {
  readonly category: QcSegmentCategory;
  readonly channelNames: string[];
  readonly color: string;
  readonly effectiveAt: number;
  readonly endTime: number;
  readonly id: string;
  readonly isRejected: boolean;
  readonly qcSegmentType: QcSegmentType;
  readonly rationale: string;
  readonly stage: WorkflowTypes.WorkflowDefinitionId;
  readonly startTime: number;
  readonly username: string;
  readonly versions: QcSegmentVersion[];
}

interface QcSegmentEditButtonsProps {
  readonly isSegmentNew: boolean;
  readonly isRejected: boolean;
  readonly isModified: boolean;
  readonly category: QcSegmentCategory;
  readonly startHold: boolean;
  readonly endHold: boolean;
  readonly rejectTooltip: string;
  readonly message: FormTypes.Message;
  readonly handleSaveButton: HandleSaveButton;
  readonly handleRejectButton: HandleRejectButton;
  readonly handleCancelButton: HandleCancelButton;
}

const useDialogArgs = (
  qcSegment: QcSegment,
  uiTheme: UITheme,
  isModified: boolean
): QcSegmentEditArgs => {
  return React.useMemo(() => {
    const dialogSegment = { ...qcSegment };
    const { versionHistory } = dialogSegment;
    const {
      category,
      channels,
      startTime,
      endTime,
      createdBy,
      id,
      rationale,
      type,
      rejected,
      stageId
    } = versionHistory[versionHistory.length - 1];
    const channelNames = channels.map(channel => channel.name);
    const color = getQCSegmentSwatchColor(
      isModified ? QcSegmentCategory.ANALYST_DEFINED : category,
      uiTheme,
      rejected
    );
    return {
      category,
      channelNames,
      color,
      effectiveAt: id.effectiveAt,
      endTime,
      id: id.parentQcSegmentId,
      isRejected: rejected,
      qcSegmentType: type,
      rationale,
      stage: stageId,
      startTime,
      username: createdBy,
      versions: versionHistory
    };
  }, [isModified, qcSegment, uiTheme]);
};

/** renders the {@link QcSegmentEditContent} form buttons */
function QcSegmentEditButtons(props: QcSegmentEditButtonsProps): JSX.Element {
  const { isSegmentNew, isRejected, isModified, category } = props;
  const { startHold, endHold, rejectTooltip, message } = props;
  const { handleSaveButton, handleRejectButton, handleCancelButton } = props;

  return (
    <div className="form__buttons">
      <div className="form__buttons--right">
        {!isSegmentNew && (
          <Button
            icon={IconNames.Trash}
            intent={Intent.DANGER}
            onClick={handleRejectButton}
            disabled={isRejected || category === QcSegmentCategory.UNPROCESSED}
            title={rejectTooltip || 'Reject QC segment'}
            text="Reject"
          />
        )}
        <Button
          className={`${Classes.BUTTON} form__button`}
          icon={IconNames.FloppyDisk}
          intent={message?.intent === Intent.DANGER ? message.intent : Intent.NONE}
          onClick={handleSaveButton}
          disabled={
            message?.intent === Intent.DANGER ||
            (!isModified && !isSegmentNew) ||
            startHold ||
            endHold ||
            isRejected
          }
          title={
            (message?.intent === Intent.DANGER ? message?.summary : undefined) ||
            (isSegmentNew ? 'Save new QC segment' : 'Save QC segment modifications')
          }
          text="Save"
        />
        <Button
          type="submit"
          className={`${Classes.BUTTON} form__button`}
          onClick={() => handleCancelButton()}
        >
          <span className={Classes.BUTTON_TEXT}>Cancel</span>
        </Button>
      </div>
    </div>
  );
}

/**
 * A form for exiting a QC Segment. Supports five states
 * - Create: If the user chooses to create a new QC Segment using a button from the toolbar, or by holding a hotkey and dragging on a raw channel
 * - Modify: Modifying an existing QC Segment (shown when the user chooses to edit a qc segment, or alt+clicks)
 * - View: Details about a QC Segment (shown when the user chooses to "view" a rejected segment from the context menu)
 * - Reject: Rejecting an existing QC Segment (shown when the user chooses the "reject" option from the context menu, or presses backspace)
 * - Rejected: Details about a rejected QC Segment (shown when the user chooses to "view" a rejected segment from the context menu)
 */
export function QcSegmentEditContent({
  qcSegment,
  updateBrushStroke
}: QcSegmentEditFormProps): JSX.Element {
  const [startHold, setStartHold] = React.useState(false);
  const [endHold, setEndHold] = React.useState(false);
  const [isModified, setIsModified] = React.useState(false);

  const [uiTheme] = useUiTheme();
  const [versionView, setVersionView] = React.useState<VersionView>(VersionView.CURRENT);
  const dialogArgs = useDialogArgs(qcSegment, uiTheme, isModified);

  const createQcSegments = useCreateQcSegments();
  const modifyQcSegment = useModifyQcSegment();
  const rejectQcSegment = useRejectQcSegment();

  const { category, channelNames, color, effectiveAt, endTime } = dialogArgs;
  const { id, isRejected, qcSegmentType, rationale, stage } = dialogArgs;
  const { startTime, username, versions } = dialogArgs;

  const [startDate, setStartDate] = React.useState(new Date(startTime * MILLISECONDS_IN_SECOND));
  const [endDate, setEndDate] = React.useState(new Date(endTime * MILLISECONDS_IN_SECOND));

  const [startEndDateInvalidMsg, setStartEndDateInvalidMsg] =
    React.useState<FormTypes.Message>(undefined);

  const setStartDateHandler: (newStartDate: Date) => void = React.useCallback(
    newStartDate => {
      setStartDate(newStartDate);
      setStartEndDateInvalidMsg(undefined);
      if (updateBrushStroke)
        updateBrushStroke(
          newStartDate.getTime() / MILLISECONDS_IN_SECOND,
          endDate.getTime() / MILLISECONDS_IN_SECOND
        );
    },
    [endDate, updateBrushStroke]
  );

  const setEndDateHandler: (newEndDate: Date) => void = React.useCallback(
    newEndDate => {
      setEndDate(newEndDate);
      setStartEndDateInvalidMsg(undefined);
      if (updateBrushStroke)
        updateBrushStroke(
          startDate.getTime() / MILLISECONDS_IN_SECOND,
          newEndDate.getTime() / MILLISECONDS_IN_SECOND
        );
    },
    [startDate, updateBrushStroke]
  );

  const [selectedQcSegmentType, setSelectedQcSegmentType] = React.useState(qcSegmentType);
  const [modifiedRationale, setModifiedRationale] = React.useState(rationale);

  const qcSegmentRecord = useAppSelector(state => state.data.qcSegments);
  const isSegmentNew = isNewQCSegment(qcSegmentRecord, id);

  const updateQcSegmentOperation = isSegmentNew ? createQcSegments : modifyQcSegment;

  const handleSaveButton: HandleSaveButton = React.useCallback(() => {
    updateQcSegmentOperation(
      qcSegment,
      startDate.getTime() / MILLISECONDS_IN_SECOND,
      endDate.getTime() / MILLISECONDS_IN_SECOND,
      selectedQcSegmentType,
      modifiedRationale
    );
    hideImperativeContextMenu({ callback: setFocusToWaveformDisplay });
  }, [
    endDate,
    modifiedRationale,
    qcSegment,
    selectedQcSegmentType,
    startDate,
    updateQcSegmentOperation
  ]);

  const handleRejectButton: HandleRejectButton = React.useCallback(() => {
    rejectQcSegment(qcSegment, modifiedRationale);
    hideImperativeContextMenu({ callback: setFocusToWaveformDisplay });
  }, [modifiedRationale, qcSegment, rejectQcSegment]);

  const handleCancelButton: HandleCancelButton = React.useCallback(() => {
    hideImperativeContextMenu({ callback: setFocusToWaveformDisplay });
  }, []);

  const rejectTooltip = useRejectTooltip(category, isRejected);

  const headerCategory = isModified ? QcSegmentCategory.ANALYST_DEFINED : category;

  const [channelIdsWithData, channelIdsWithoutData] = useDetermineChannelsWithOverlappingData(
    channelNames,
    startDate,
    endDate
  );

  const message = getFormErrorMessage(
    category,
    isRejected,
    startEndDateInvalidMsg,
    channelIdsWithData,
    channelIdsWithoutData
  );

  // Used to set focus back to Waveform Display on unmount, this is needed when a user
  // triggers the menu to open but closes it by clicking off it somewhere and not using the buttons
  const componentWillUnmount = React.useRef(false);

  // This is componentWillUnmount
  React.useEffect(() => {
    return () => {
      componentWillUnmount.current = true;
    };
  }, []);

  React.useEffect(() => {
    return () => {
      // This line only evaluates to true after the componentWillUnmount happens
      if (componentWillUnmount.current) {
        setFocusToWaveformDisplay();
      }
    };
  }, []);

  return (
    <div className={classNames('form', 'qc-segment-form')}>
      <div className="form__header">
        <div>{isSegmentNew ? 'Create QC Segment' : 'QC Segment'}</div>
        <div className="form__header-decoration">
          <div>
            <div className="qc-segment-swatch" style={{ backgroundColor: color }} />
            <span className="qc-segment-swatch-label">
              {isRejected
                ? 'Rejected'
                : getQCSegmentCategoryOrTypeString(headerCategory, isRejected)}
            </span>
          </div>
        </div>
      </div>
      <div className="form">
        {!isSegmentNew && versions?.length && (
          <div className="form__panel-selector">
            <div className={Classes.BUTTON_GROUP}>
              <Button
                type="button"
                value={VersionView.CURRENT}
                className={classNames({
                  [`${Classes.ACTIVE}`]: versionView === VersionView.CURRENT
                })}
                onClick={() => setVersionView(VersionView.CURRENT)}
              >
                <span className={Classes.BUTTON_TEXT}>{VersionView.CURRENT}</span>
              </Button>
              <Button
                value={VersionView.ALL}
                className={classNames({
                  [`${Classes.ACTIVE}`]: versionView === VersionView.ALL
                })}
                onClick={() => setVersionView(VersionView.ALL)}
              >
                <span className={Classes.BUTTON_TEXT}>{VersionView.ALL}</span>
              </Button>
            </div>
          </div>
        )}
        {(versionView === VersionView.CURRENT && (
          <CurrentVersionForm
            category={category}
            channelNames={channelIdsWithData}
            effectiveAt={effectiveAt}
            endDate={endDate}
            isRejected={isRejected}
            qcSegmentType={selectedQcSegmentType}
            rationale={modifiedRationale}
            stage={stage}
            startDate={startDate}
            username={username}
            startHold={startHold}
            endHold={endHold}
            isModified={isModified}
            isSegmentNew={isSegmentNew}
            setStartDate={setStartDateHandler}
            setEndDate={setEndDateHandler}
            dateOnError={setStartEndDateInvalidMsg}
            setQcSegmentType={setSelectedQcSegmentType}
            setRationale={setModifiedRationale}
            setStartHold={setStartHold}
            setEndHold={setEndHold}
            setIsModified={setIsModified}
          />
        )) || <AllVersionsTable versions={versions} />}

        <div className="qc-segment-form__message">
          <FormMessage message={message} />
        </div>

        <QcSegmentEditButtons
          isSegmentNew={isSegmentNew}
          isRejected={isRejected}
          isModified={isModified}
          category={category}
          startHold={startHold}
          endHold={endHold}
          rejectTooltip={rejectTooltip}
          message={message}
          handleSaveButton={handleSaveButton}
          handleRejectButton={handleRejectButton}
          handleCancelButton={handleCancelButton}
        />
      </div>
    </div>
  );
}
