import { NonIdealState } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import type { ConfigurationTypes, EventTypes } from '@gms/common-model';
import { FkTypes, SignalDetectionTypes } from '@gms/common-model';
import type { FkThumbnailsFilterType } from '@gms/ui-state';
import {
  AnalystWorkspaceOperations,
  selectActionTargetSignalDetectionIds,
  selectCurrentFkThumbnailFilter,
  selectDisplayedSignalDetectionId,
  selectMeasurementMode,
  selectOpenActivityNames,
  selectOpenEvent,
  selectOpenIntervalName,
  selectSdIdsToShowFk,
  selectSelectedSortType,
  selectValidActionTargetSignalDetectionIds,
  useAllStations,
  useAppSelector,
  useEffectiveTime,
  useFkReviewablePhasesByActivityNameQuery,
  useGetAllStationsQuery,
  useGetFkData,
  useGetSelectedSdIds,
  useGetSignalDetections,
  useKeyboardShortcutConfigurations,
  useProcessingAnalystConfiguration,
  useSetDisplayedSignalDetectionId,
  useSetSelectedSdIds,
  useSetSignalDetectionActionTargets,
  useSignalDetections
} from '@gms/ui-state';
import { isHotKeyCommandSatisfied } from '@gms/ui-util/lib/ui-util/hot-key-util';
import React from 'react';

import { showSignalDetectionDetails } from '~analyst-ui/common/dialogs/signal-detection-details/signal-detection-details';
import { showSignalDetectionMenu } from '~analyst-ui/common/menus/signal-detection-menu';
import { EventUtils } from '~analyst-ui/common/utils';

import { useFksNeedReview, useShowOrGenerateSignalDetectionFk } from '../fk-hooks';
import { FkThumbnail } from '../fk-thumbnail';
import * as fkUtil from '../fk-util';
import { getUnassociatedDetectionsForShowFk } from '../fk-util';
import type { FkThumbnailSize } from './fk-thumbnails-controls';
import { FkThumbnailsControls } from './fk-thumbnails-controls';

/**
 * Fk Thumbnails Props
 */
export interface FkThumbnailListProps {
  readonly signalDetectionIdToFeaturePredictionsMap: Map<string, EventTypes.FeaturePrediction[]>;
  readonly thumbnailSizePx: number;
  readonly selectedFkUnit: FkTypes.FkUnits;
  readonly setPhaseMenuVisibility: (isOpen: boolean) => void;
  readonly setFkThumbnailSizePx: (size: FkThumbnailSize) => void;
  readonly fkThumbnailColumnSizePx: number;
}

/**
 * List of fk thumbnails with controls for filtering them
 */
export function FkThumbnailList({
  signalDetectionIdToFeaturePredictionsMap,
  thumbnailSizePx,
  selectedFkUnit,
  setPhaseMenuVisibility,
  setFkThumbnailSizePx,
  fkThumbnailColumnSizePx
}: FkThumbnailListProps) {
  const keyboardShortcutConfigurations = useKeyboardShortcutConfigurations();
  const signalDetections = useSignalDetections();
  const selectedSdIds = useGetSelectedSdIds();
  const setSelectedSdIds = useSetSelectedSdIds();
  const openActivityNames = useAppSelector(selectOpenActivityNames);
  const reviewablePhases: FkTypes.FkReviewablePhasesByStation =
    useFkReviewablePhasesByActivityNameQuery(openActivityNames[0]);
  const selectedSortType = useAppSelector(selectSelectedSortType);
  const currentOpenEvent = useAppSelector(selectOpenEvent);
  const getFkData = useGetFkData();

  const stations = useAllStations();
  const processingAnalystConfig: ConfigurationTypes.ProcessingAnalystConfiguration =
    useProcessingAnalystConfiguration();

  const signalDetectionActionTargets = useAppSelector(selectActionTargetSignalDetectionIds);

  const validActionTargetSignalDetectionIds = useAppSelector(
    selectValidActionTargetSignalDetectionIds
  );
  const sdIdsToShowFk = useAppSelector(selectSdIdsToShowFk);
  const openIntervalName = useAppSelector(selectOpenIntervalName);
  const displayedSignalDetectionId: string = useAppSelector(selectDisplayedSignalDetectionId);
  const signalDetectionResults = useGetSignalDetections();
  const effectiveAt = useEffectiveTime();
  const stationsQuery = useGetAllStationsQuery(effectiveAt);
  const setDisplayedSignalDetectionId = useSetDisplayedSignalDetectionId();
  const showOrGenerateSignalDetectionFk = useShowOrGenerateSignalDetectionFk();

  // Items used for context menu
  const setSignalDetectionActionTargets = useSetSignalDetectionActionTargets();
  const measurementMode = useAppSelector(selectMeasurementMode);

  const currentFkThumbnailFilter: FkThumbnailsFilterType = useAppSelector(
    selectCurrentFkThumbnailFilter
  );

  const [hiddenThumbnails, setHiddenThumbnails] = React.useState<string[]>([]);

  // the list of fks that need review and are associated to the currently open event
  const fksNeedReview = useFksNeedReview();

  const associatedSignalDetections = EventUtils.getAssociatedDetections(
    currentOpenEvent,
    signalDetectionResults.data ?? [],
    openIntervalName
  );

  // The list are the sd's which aren't associated to the open event
  // but are necessary to show the Fk
  const unassociatedSDsForShowFk = getUnassociatedDetectionsForShowFk(
    signalDetectionResults.data ?? [],
    sdIdsToShowFk,
    associatedSignalDetections
  );

  const distances = EventUtils.getDistanceToStationsForPreferredLocationSolutionId(
    currentOpenEvent,
    stationsQuery.data ?? [],
    openIntervalName,
    []
  );

  const filteredSignalDetections = fkUtil.filterSignalDetections(
    [...associatedSignalDetections.filter(sd => !hiddenThumbnails.includes(sd.id))],
    [...unassociatedSDsForShowFk.filter(sd => !hiddenThumbnails.includes(sd.id))],
    currentFkThumbnailFilter,
    processingAnalystConfig.fkConfigurations.keyActivityPhases[openActivityNames[0]],
    selectedSortType,
    distances,
    fksNeedReview
  );
  const associatedSignalDetectionIds = associatedSignalDetections.map(sd => sd.id);
  const associatedFilteredSignalDetections = filteredSignalDetections.filter(sd =>
    associatedSignalDetectionIds.includes(sd.id)
  );
  const reviewableSds = fksNeedReview(associatedFilteredSignalDetections);

  /**
   * Handles single and multi-selection of FK
   */
  const onThumbnailClick = React.useCallback(
    (e: React.MouseEvent<HTMLElement, MouseEvent>, sdId: string) => {
      // Open Signal Detection Details
      const showSdDetailsHotkeys =
        keyboardShortcutConfigurations?.clickEvents?.showSignalDetectionDetails.combos ?? [];
      if (isHotKeyCommandSatisfied(e.nativeEvent, showSdDetailsHotkeys)) {
        const signalDetection = signalDetections[sdId];
        showSignalDetectionDetails(
          e,
          { signalDetection },
          {
            onClose: () => {
              setSignalDetectionActionTargets([]);
            }
          }
        );
        return;
      }

      const isAlreadySelected = selectedSdIds.indexOf(sdId) > -1;
      let newSelectedSdIds: string[] = [];

      // Handle multi-select
      if (isHotKeyCommandSatisfied(e.nativeEvent, ['Ctrl', 'Meta', 'Shift'])) {
        // Remove from selectedSdIds
        if (isAlreadySelected) {
          newSelectedSdIds = selectedSdIds.filter(id => id !== sdId);
        } else {
          // Add to selectedSdIds
          newSelectedSdIds = [...selectedSdIds, sdId];
        }
      }
      // Handle single-select
      else if (!isAlreadySelected || selectedSdIds.length !== 1) {
        newSelectedSdIds = [sdId];
      }
      setSelectedSdIds(newSelectedSdIds);
    },
    [
      keyboardShortcutConfigurations?.clickEvents?.showSignalDetectionDetails.combos,
      selectedSdIds,
      setSelectedSdIds,
      setSignalDetectionActionTargets,
      signalDetections
    ]
  );

  /**
   * Handles displaying the context menu when right-clicking an FK thumbnail
   */
  const onThumbnailContextMenu = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>, sdId: string) => {
      e.preventDefault();
      if (e.ctrlKey) {
        return;
      }
      // if provided && not already selected, set the current selection to just the context-menu'd detection
      const detectionIds = sdId && selectedSdIds.indexOf(sdId) === -1 ? [sdId] : selectedSdIds;
      setSignalDetectionActionTargets(detectionIds);
      showSignalDetectionMenu(
        e,
        {
          measurementMode,
          setMeasurementModeEntries: AnalystWorkspaceOperations.setMeasurementModeEntries,
          setPhaseMenuVisibilityCb: setPhaseMenuVisibility,
          isAzimuthSlownessContextMenu: true
        },
        {
          onClose: () => {
            setSignalDetectionActionTargets([]);
          }
        }
      );
    },
    [measurementMode, selectedSdIds, setPhaseMenuVisibility, setSignalDetectionActionTargets]
  );

  const fkThumbnails = React.useMemo<JSX.Element[]>(() => {
    return filteredSignalDetections.map(sd => {
      const isActionTarget = signalDetectionActionTargets.includes(sd.id);

      const fmPhase = SignalDetectionTypes.Util.findPhaseFeatureMeasurementValue(
        SignalDetectionTypes.Util.getCurrentHypothesis(sd.signalDetectionHypotheses)
          .featureMeasurements
      );

      const label = `${sd.station.name} ${fmPhase.value.toString()}`;

      const signalDetectionFeaturePredictions: EventTypes.FeaturePrediction[] | undefined =
        signalDetectionIdToFeaturePredictionsMap.get(sd.id);

      const constantVelocityRings: number[] = fkUtil.getConstantVelocityRingsForStationType(
        stations,
        sd,
        processingAnalystConfig
      );

      // needsReview if it's associated to open event and .reviewed == false
      const needsReview =
        !!associatedSignalDetections.find(associatedSd => associatedSd.id === sd.id) &&
        FkTypes.Util.fkNeedsReview(getFkData(sd), reviewablePhases[sd.station.name], sd);
      return (
        <FkThumbnail
          key={sd.id}
          signalDetection={sd}
          fkData={getFkData(sd)}
          label={label}
          fkUnit={selectedFkUnit}
          sizePx={thumbnailSizePx}
          needsReview={needsReview}
          isActionTarget={isActionTarget}
          isUnqualifiedActionTarget={
            isActionTarget && !validActionTargetSignalDetectionIds.includes(sd.id)
          }
          isSelected={selectedSdIds.indexOf(sd.id) >= 0}
          isDisplayed={displayedSignalDetectionId === sd.id}
          constantVelocityRings={constantVelocityRings}
          signalDetectionFeaturePredictions={signalDetectionFeaturePredictions}
          showButtons
          onClick={e => onThumbnailClick(e, sd.id)}
          onDoubleClick={() => setDisplayedSignalDetectionId(sd.id)}
          onContextMenu={e => onThumbnailContextMenu(e, sd.id)}
          setHiddenThumbnails={setHiddenThumbnails}
        />
      );
    });
  }, [
    filteredSignalDetections,
    signalDetectionActionTargets,
    signalDetectionIdToFeaturePredictionsMap,
    stations,
    processingAnalystConfig,
    associatedSignalDetections,
    getFkData,
    reviewablePhases,
    selectedFkUnit,
    thumbnailSizePx,
    validActionTargetSignalDetectionIds,
    selectedSdIds,
    displayedSignalDetectionId,
    onThumbnailClick,
    setDisplayedSignalDetectionId,
    onThumbnailContextMenu
  ]);

  /**
   * Handles automatically displaying an FK. First priority will be the first FK that
   * needs review, followed by first FK that has available data.
   */
  const autoDisplayFk = React.useCallback(() => {
    if (
      !displayedSignalDetectionId ||
      !filteredSignalDetections.find(sd => sd.id === displayedSignalDetectionId)
    ) {
      // Always select the first SD
      const sdToDisplay = filteredSignalDetections.at(0);
      if (sdToDisplay) {
        setDisplayedSignalDetectionId(sdToDisplay.id);
      }
    } else if (filteredSignalDetections.length === 0) {
      setDisplayedSignalDetectionId('');
    }
  }, [displayedSignalDetectionId, filteredSignalDetections, setDisplayedSignalDetectionId]);

  React.useEffect(() => {
    autoDisplayFk();
  }, [autoDisplayFk]);

  React.useEffect(() => {
    // Check if default FKs need to be requested
    showOrGenerateSignalDetectionFk();
  }, [showOrGenerateSignalDetectionFk]);

  /**
   * Renders the component.
   */
  return (
    <>
      <div className="azimuth-slowness-thumbnails__control-container">
        <FkThumbnailsControls
          setFkThumbnailSizePx={setFkThumbnailSizePx}
          anyDisplayedFksNeedReview={reviewableSds.length > 0}
          fkThumbnailColumnSizePx={fkThumbnailColumnSizePx}
          hiddenThumbnails={hiddenThumbnails}
          setHiddenThumbnails={setHiddenThumbnails}
          selectedSdIds={selectedSdIds}
          filteredSignalDetections={filteredSignalDetections}
        />
      </div>
      <div className="azimuth-slowness-thumbnails__wrapper-2">
        <div
          className="azimuth-slowness-thumbnails__wrapper-3"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          key="fk-thumbnails"
        >
          {filteredSignalDetections.length === 0 ? (
            <NonIdealState title="No FKs available for this filter" icon={IconNames.HEAT_GRID} />
          ) : (
            fkThumbnails
          )}
        </div>
      </div>
    </>
  );
}
