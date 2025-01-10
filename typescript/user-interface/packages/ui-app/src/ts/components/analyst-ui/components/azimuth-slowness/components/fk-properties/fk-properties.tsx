import { Button } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import type { EventTypes } from '@gms/common-model';
import { FkTypes, SignalDetectionTypes } from '@gms/common-model';
import { AgGridReact, Tooltip2Wrapper } from '@gms/ui-core-components';
import {
  selectOpenEventId,
  useAppSelector,
  useGetFkMeasuredValues,
  useProcessingAnalystConfiguration
} from '@gms/ui-state';
import React from 'react';

import { FkFrequencyThumbnails } from '../fk-display/fk-frequency-thumbnails';
import { getFkPropertiesTableColumnDefs } from './column-definitions';
import { getFkPropertiesRows } from './fk-properties-table-utils';

/**
 * FkProperties Props
 */
export interface FkPropertiesProps {
  displayedSignalDetection: SignalDetectionTypes.SignalDetection;
  featurePredictionsForDisplayedSignalDetection: EventTypes.FeaturePrediction[];
  selectedFkUnit: FkTypes.FkUnits;
  fkRenderingWidth: number;
  currentMovieSpectrumIndex: number;
  displayedFk: FkTypes.FkSpectra;
  fkDisplayWidthPx: number;
}

/**
 * Creates a table of FK properties
 */
export function FkProperties({
  displayedSignalDetection,
  featurePredictionsForDisplayedSignalDetection,
  selectedFkUnit,
  fkRenderingWidth,
  currentMovieSpectrumIndex,
  displayedFk,
  fkDisplayWidthPx
}: FkPropertiesProps) {
  // minimum width to determine the thumbnail accordion icons
  const MIN_FK_DISPLAY_WIDTH = 850;
  const MIN_TABLE_WIDTH_FOR_RESIZING = 445;

  const tableRef = React.useRef<AgGridReact | null>(null);

  const [frequencyThumbnailsExpanded, setFrequencyThumbnailsExpanded] =
    React.useState<boolean>(false);
  const { phasesWithoutPredictions } = useProcessingAnalystConfiguration();

  const openEventId = useAppSelector(selectOpenEventId);

  const getFkMeasuredValues = useGetFkMeasuredValues();

  const stationName = displayedSignalDetection.station.name;
  // Find the station to get channels for the total trackers
  const fmPhase = SignalDetectionTypes.Util.findPhaseFeatureMeasurementValue(
    SignalDetectionTypes.Util.getCurrentHypothesis(
      displayedSignalDetection.signalDetectionHypotheses
    ).featureMeasurements
  );

  /** Memoized Table data */
  const tableData = React.useMemo(() => {
    const analystMeasuredValues: FkTypes.AzimuthSlownessValues =
      getFkMeasuredValues(displayedSignalDetection);
    return getFkPropertiesRows(
      featurePredictionsForDisplayedSignalDetection,
      displayedFk,
      analystMeasuredValues,
      currentMovieSpectrumIndex,
      fmPhase.value,
      openEventId,
      phasesWithoutPredictions
    );
  }, [
    getFkMeasuredValues,
    displayedSignalDetection,
    featurePredictionsForDisplayedSignalDetection,
    displayedFk,
    currentMovieSpectrumIndex,
    fmPhase.value,
    openEventId,
    phasesWithoutPredictions
  ]);

  const frequencyThumbnails = (
    <FkFrequencyThumbnails
      fkUnit={selectedFkUnit}
      displayedSignalDetection={displayedSignalDetection}
      displayedFk={displayedFk}
    />
  );

  // toggle expanded/contracted class based on frequencyThumbnailsExpanded state
  const frequencyThumbnailsContainerClassNames = frequencyThumbnailsExpanded
    ? 'fk-frequency-thumbnails-container expanded'
    : 'fk-frequency-thumbnails-container contracted';
  // toggle icon based on frequencyThumbnailsExpanded state
  const horizontalAccordionIcon = !frequencyThumbnailsExpanded
    ? IconNames.CHEVRON_RIGHT
    : IconNames.CHEVRON_LEFT;
  // toggle icon based on frequencyThumbnailsExpanded state
  const verticalAccordionIcon = !frequencyThumbnailsExpanded
    ? IconNames.CHEVRON_DOWN
    : IconNames.CHEVRON_UP;
  // icon changes based on fk-display width
  const frequencyThumbnailsAccordionButtonIcon =
    fkDisplayWidthPx >= MIN_FK_DISPLAY_WIDTH ? horizontalAccordionIcon : verticalAccordionIcon;
  // layout changes based on fk-display width
  const frequencyThumbnailsContainerHeight =
    fkDisplayWidthPx >= MIN_FK_DISPLAY_WIDTH
      ? `${fkRenderingWidth - FkTypes.Util.FK_RENDERING_HEIGHT_OFFSET}px`
      : 'auto';

  const resizeTable = React.useCallback(() => {
    if (
      tableRef.current?.api &&
      tableRef.current.api.getHorizontalPixelRange().right >= MIN_TABLE_WIDTH_FOR_RESIZING
    ) {
      tableRef.current.api.sizeColumnsToFit();
    }
  }, []);

  const onTableReady = React.useCallback(() => {
    tableRef?.current?.api.setAlwaysShowHorizontalScroll(false);
    tableRef?.current?.api.setAlwaysShowVerticalScroll(false);
    resizeTable();
  }, [resizeTable]);

  return (
    <>
      <div
        className={frequencyThumbnailsContainerClassNames}
        style={{
          height: frequencyThumbnailsContainerHeight
        }}
      >
        {frequencyThumbnails}
        <Tooltip2Wrapper
          content={!frequencyThumbnailsExpanded ? 'Show FK previews' : 'Hide FK previews'}
        >
          <Button
            className="fk-frequency-thumbnails-accordion-button"
            aria-label="FK Frequency Thumbnails"
            icon={IconNames.GRID_VIEW}
            rightIcon={frequencyThumbnailsAccordionButtonIcon}
            onClick={() => {
              // toggles the thumbnails' visibility
              setFrequencyThumbnailsExpanded(prev => !prev);
            }}
            text="FK Bands"
          />
        </Tooltip2Wrapper>
      </div>
      <div className="ag-theme-dark fk-properties">
        <div className="fk-properties__column">
          <div className="fk-properties-label-row">
            <div className="fk-properties-label-row__left">
              <div>
                Station:
                <span className="fk-properties__label">{stationName}</span>
              </div>
              <div>
                Phase:
                <span className="fk-properties__label">{fmPhase.value.toString()}</span>
              </div>
            </div>
          </div>
          <div className="fk-properties__table">
            <div className="max">
              <AgGridReact
                ref={tableRef}
                columnDefs={getFkPropertiesTableColumnDefs()}
                rowData={tableData}
                getRowId={node => node.data.id}
                overlayNoRowsTemplate="No data available"
                onGridReady={onTableReady}
                onGridSizeChanged={resizeTable}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
