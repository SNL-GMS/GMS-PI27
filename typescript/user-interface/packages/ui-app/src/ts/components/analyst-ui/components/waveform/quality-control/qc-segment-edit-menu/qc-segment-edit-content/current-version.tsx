import type { WorkflowTypes } from '@gms/common-model';
import { QcSegmentCategory, QcSegmentType } from '@gms/common-model/lib/qc-segment';
import {
  DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION,
  humanReadable,
  MILLISECONDS_IN_SECOND,
  secondsToString
} from '@gms/common-util';
import type { FormTypes, ValidationDefinition } from '@gms/ui-core-components';
import { DialogItem, DropDown, TextArea } from '@gms/ui-core-components';
import { useUsername, useViewableInterval } from '@gms/ui-state';
import truncate from 'lodash/truncate';
import React from 'react';

import {
  getQCSegmentCategoryOrTypeString,
  validateQcFormModifications
} from '../../qc-segment-utils';
import { TimeValues } from './time-values';

interface CurrentVersionFormProps {
  category: QcSegmentCategory | 'Unknown';
  channelNames: string[];
  effectiveAt: number;
  endDate: Date;
  isRejected: boolean;
  qcSegmentType: QcSegmentType;
  rationale: string;
  stage: WorkflowTypes.WorkflowDefinitionId;
  startDate: Date;
  username: string;
  startHold: boolean;
  endHold: boolean;
  isModified: boolean;
  isSegmentNew: boolean;
  setStartDate: (date: Date) => void;
  setEndDate: (date: Date) => void;
  dateOnError: (value: FormTypes.Message) => void;
  setQcSegmentType: (type: QcSegmentType) => void;
  setRationale: (rationale: string) => void;
  setStartHold: (hold: boolean) => void;
  setEndHold: (hold: boolean) => void;
  setIsModified: (isModified: boolean) => void;
}

/**
 * Editable form for the current QC Mask version
 */
export function CurrentVersionForm(props: CurrentVersionFormProps): JSX.Element {
  const {
    category,
    channelNames,
    effectiveAt,
    endDate,
    isRejected,
    qcSegmentType,
    rationale,
    stage,
    startDate,
    username,
    startHold,
    endHold,
    isModified,
    isSegmentNew,
    setEndDate,
    setQcSegmentType,
    dateOnError,
    setRationale,
    setStartDate,
    setEndHold,
    setStartHold,
    setIsModified
  } = props;

  const typeRef = React.useRef(qcSegmentType);
  const startRef = React.useRef(startDate);
  const endRef = React.useRef(endDate);
  const rationaleRef = React.useRef(rationale);

  React.useEffect(() => {
    validateQcFormModifications(
      {
        type: typeRef.current,
        start: startRef.current,
        end: endRef.current,
        rationale: rationaleRef.current
      },
      { type: qcSegmentType, start: startDate, end: endDate, rationale },
      isSegmentNew,
      setIsModified
    );
  }, [endDate, isSegmentNew, qcSegmentType, rationale, setIsModified, startDate]);

  const [viewableInterval] = useViewableInterval();
  const currentUsername = useUsername();

  /** Validation to ensure the selected date is within the viewable interval */
  const dateStartValidationDefs: ValidationDefinition<Date>[] = [
    {
      valueIsInvalid: input => {
        if (!viewableInterval.startTimeSecs || !viewableInterval.endTimeSecs) return true;
        return (
          input > endDate ||
          input.getTime() < viewableInterval.startTimeSecs * MILLISECONDS_IN_SECOND
        );
      },
      invalidMessage: { summary: 'Start time is after end time', intent: 'danger' }
    },
    {
      valueIsInvalid: input => {
        if (!viewableInterval.startTimeSecs || !viewableInterval.endTimeSecs) return true;
        return (
          input.getTime() < viewableInterval.startTimeSecs * MILLISECONDS_IN_SECOND ||
          input.getTime() > viewableInterval.endTimeSecs * MILLISECONDS_IN_SECOND
        );
      },
      invalidMessage: { summary: 'Start time outside of viewable interval', intent: 'danger' }
    }
  ];

  const dateEndValidationDefs: ValidationDefinition<Date>[] = [
    {
      valueIsInvalid: input => {
        if (!viewableInterval.startTimeSecs || !viewableInterval.endTimeSecs) return true;
        return (
          input < startDate ||
          input.getTime() > viewableInterval.endTimeSecs * MILLISECONDS_IN_SECOND
        );
      },
      invalidMessage: { summary: 'End time is before start time', intent: 'danger' }
    },
    {
      valueIsInvalid: input => {
        if (!viewableInterval.startTimeSecs || !viewableInterval.endTimeSecs) return true;
        return (
          input.getTime() < viewableInterval.startTimeSecs * MILLISECONDS_IN_SECOND ||
          input.getTime() > viewableInterval.endTimeSecs * MILLISECONDS_IN_SECOND
        );
      },
      invalidMessage: { summary: 'End time outside of viewable interval', intent: 'danger' }
    }
  ];

  /** Referentially stable handler for the {@link DropDown}'s OnMaybeValue */
  const onChangeQcSegmentTypeHandler = React.useCallback(
    (maybeQcSegmentType: QcSegmentType) => {
      setQcSegmentType(maybeQcSegmentType);
    },
    [setQcSegmentType]
  );

  const rationaleHandler = React.useCallback(
    (rational: string) => {
      setRationale(rational);
    },
    [setRationale]
  );

  const buildQcSegmentTypeDialogItem = (): JSX.Element => {
    if (isRejected || category === QcSegmentCategory.UNPROCESSED) {
      return <>{getQCSegmentCategoryOrTypeString(qcSegmentType || 'Unknown', isRejected)}</>;
    }
    return (
      <DropDown<string[]>
        className="full-width"
        dropDownItems={[undefined, ...Object.values(QcSegmentType)]}
        dropDownText={[
          'Select a QC segment type',
          ...Object.values(QcSegmentType).map(humanReadable)
        ]}
        value={qcSegmentType}
        onChange={onChangeQcSegmentTypeHandler}
        disabled={isRejected}
        title={
          qcSegmentType in QcSegmentType
            ? getQCSegmentCategoryOrTypeString(qcSegmentType, isRejected)
            : 'Select a QC segment type'
        }
      />
    );
  };

  const buildRationaleDialogItem = (): JSX.Element => {
    if (isRejected || category === QcSegmentCategory.UNPROCESSED) {
      return <div className="form__text--wrap">{rationale}</div>;
    }
    return (
      <TextArea
        fillWidth
        defaultValue={rationale}
        title="Rationale"
        onMaybeValue={rationaleHandler}
        disabled={isRejected}
        maxChar={160}
      />
    );
  };

  const channelNamesAsStr = channelNames.reduce((str, cn, i) => {
    return `${str}${i > 0 ? ', ' : ''}${cn}`;
  }, '');

  return (
    <div className="form-content">
      <DialogItem
        label="Category"
        value={getQCSegmentCategoryOrTypeString(
          isModified ? QcSegmentCategory.ANALYST_DEFINED : category,
          isRejected
        )}
      />
      <DialogItem label="Type" value={buildQcSegmentTypeDialogItem()} />
      <DialogItem
        label="Channel name"
        value={
          <div className="form__text--wrap" title={channelNamesAsStr}>
            {truncate(channelNamesAsStr, { length: 200 })}
          </div>
        }
      />
      <TimeValues
        isRejected={isRejected}
        category={category}
        startDate={startDate}
        endDate={endDate}
        startHold={startHold}
        endHold={endHold}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        setStartHold={setStartHold}
        setEndHold={setEndHold}
        dateOnError={dateOnError}
        dateStartValidationDefs={dateStartValidationDefs}
        dateEndValidationDefs={dateEndValidationDefs}
      />

      {!isSegmentNew && <DialogItem label="Stage" value={String(stage?.name || 'Unknown')} />}
      <DialogItem label="Author" value={isSegmentNew ? currentUsername : username} />
      {!isSegmentNew && effectiveAt != null && (
        <DialogItem
          label="Effective at"
          monospace
          value={secondsToString(effectiveAt, DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION)}
        />
      )}
      <DialogItem label="Rejected" value={isRejected ? 'True' : 'False'} />
      <DialogItem label="Rationale" value={buildRationaleDialogItem()} />
    </div>
  );
}
