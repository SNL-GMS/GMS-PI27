/* eslint-disable class-methods-use-this */
import type { CommonTypes } from '@gms/common-model';
import { WorkflowTypes } from '@gms/common-model';
import type { Nullable } from '@gms/common-model/lib/type-util/type-util';
import type { IntervalId } from '@gms/common-model/lib/workflow/types';
import {
  isActivityInterval,
  isAutomaticProcessingStage,
  isInteractiveAnalysisStage,
  isInteractiveAnalysisStageInterval
} from '@gms/common-model/lib/workflow/types';
import type GoldenLayout from '@gms/golden-layout';
import type { StageIntervalList } from '@gms/ui-state';
import {
  addGlUpdateOnResize,
  addGlUpdateOnShow,
  addGlUpdateOnTab,
  clearGlUpdateOnResize,
  clearGlUpdateOnShow,
  clearGlUpdateOnTab,
  memoizedGetScrollBarWidth,
  UILogger
} from '@gms/ui-util';
import Immutable from 'immutable';
import cloneDeep from 'lodash/cloneDeep';
import defer from 'lodash/defer';
import flatMap from 'lodash/flatMap';
import flatten from 'lodash/flatten';
import isEqual from 'lodash/isEqual';
import throttle from 'lodash/throttle';
import uniq from 'lodash/uniq';
import uniqBy from 'lodash/uniqBy';
import memoizeOne from 'memoize-one';
import React from 'react';
import type { CollectionCellRendererParams, OnScrollParams } from 'react-virtualized';
import { Collection, ScrollSync } from 'react-virtualized';
import ResizeObserver from 'resize-observer-polyfill';

import { ActivityIntervalCell } from './activity-interval-cell';
import {
  HEIGHT,
  HUNDRED_TWENTY_SECOND_BUFFER,
  TABLE_BUTTON_WIDTH,
  TABLE_LABEL_WIDTH,
  TABLE_SIDE_PADDING,
  TIME_AXIS_HEIGHT,
  TOOLBAR_HEIGHT_PX
} from './constants';
import { DayBoundaryIndicator } from './day-boundary-indicator';
import { StageColumnEntry } from './stage-column-entry';
import { StageExpansionButton } from './stage-expansion-button';
import { TimeRange } from './time-range';
import { WorkflowRowLabel } from './workflow-row-label';
import { WorkflowTimeAxis } from './workflow-time-axis';
import { Tooltip } from './workflow-tooltip';
import { calculateWidth, getScaleForTimeRange } from './workflow-util';

const logger = UILogger.create('GMS_LOG_WORKFLOW', process.env.GMS_LOG_WORKFLOW);

interface Empty {
  endTime: number;
  intervalId: Nullable<IntervalId>;
}

export function isValue(object: Partial<Value>): object is Value {
  return object?.intervalId?.definitionId?.name !== undefined;
}

type Value = WorkflowTypes.StageInterval | WorkflowTypes.ActivityInterval;

type ValueOrEmpty = WorkflowTypes.StageInterval | WorkflowTypes.ActivityInterval | Empty;

interface TableCell {
  readonly index: number;
  readonly rowIndex: number;
  readonly colIndex: number;
  readonly value: ValueOrEmpty;
}

export interface RowState {
  name: string;
  isExpanded: boolean;
  subRows: { name: string; isActivityRow: boolean }[];
}

export interface WorkflowTableProps {
  readonly widthPx: number;
  readonly heightPx: number;
  readonly timeRange: CommonTypes.TimeRange;
  readonly stageIntervals?: StageIntervalList; // "optional" cause they could be undefined while waiting on the query to return
  readonly workflow?: WorkflowTypes.Workflow;
  readonly staleStartTime: number;
  readonly glContainer: GoldenLayout.Container;
}

export interface WorkflowTableState {
  readonly expandedRowStatusRecord: Record<string, RowState>;
}

/**
 * @returns the reference to the virtualized table element
 */
const getVirtualizedContainer = (): Element | null =>
  document.querySelector('.workflow-table .workflow-table-container .ReactVirtualized__Collection');

/**
 * @returns the reference to the hidden virtualized scroll container element
 */
const getHiddenScrollVirtualizedContainer = (): Element | null =>
  document.querySelector(
    '.workflow-table .workflow-table__time-axis .ReactVirtualized__Collection'
  );

/**
 * Processes the Workflow data into a structure that can be used for the virtualized table
 *
 * @param stage the stage
 * @param stageIntervals the stage intervals
 * @returns the processed data
 */
const processData = (
  stage: WorkflowTypes.Stage,
  stageIntervals: WorkflowTypes.StageInterval[]
): Value[][] => {
  let subRowNames: string[] = [];
  if (isAutomaticProcessingStage(stage)) {
    subRowNames = stage.sequences.map(sequence => sequence.name);
  } else if (isInteractiveAnalysisStage(stage)) {
    subRowNames = stage.activities.map(activity => activity.name);
  }

  const cells: Value[][] = [[]];
  Array(subRowNames.length)
    .fill(undefined)
    .forEach(() => cells.push([]));

  stageIntervals?.forEach((stageInterval: WorkflowTypes.StageInterval, index: number) => {
    cells[0][index] = stageInterval;

    let intervals: WorkflowTypes.Interval[] = [];
    if (WorkflowTypes.isInteractiveAnalysisStageInterval(stageInterval)) {
      intervals = stageInterval.activityIntervals;
    } else if (WorkflowTypes.isAutomaticProcessingStageInterval(stageInterval)) {
      intervals = stageInterval.sequenceIntervals;
    }

    subRowNames?.forEach((name, subRowIndex) => {
      if (stageInterval.stageMode === WorkflowTypes.StageMode.INTERACTIVE) {
        const interval: WorkflowTypes.ActivityInterval = intervals.find(
          int => int.intervalId.definitionId.name === name
        ) as unknown as WorkflowTypes.ActivityInterval;
        cells[subRowIndex + 1][index] = interval;
      } else {
        const interval: WorkflowTypes.StageInterval = intervals.find(
          int => int.intervalId.definitionId.name === name
        ) as unknown as WorkflowTypes.StageInterval;
        cells[subRowIndex + 1][index] = interval;
      }
    });
  });
  return cells;
};

/**
 * Component for rendering the workflow table
 */
export class WorkflowTable extends React.Component<WorkflowTableProps, WorkflowTableState> {
  private timeAxisRef: WorkflowTimeAxis;

  private dayBoundaryIndicatorRef: DayBoundaryIndicator;

  private collectionRef: Collection;

  private timeRangeRef: TimeRange;

  private virtualizedContainer: Element | null;

  private memoizedProcessData: Record<
    string,
    (stage: WorkflowTypes.Stage, stageIntervals: WorkflowTypes.StageInterval[]) => Value[][]
  > = {};

  private data: Immutable.List<TableCell> = Immutable.List();

  private scrollSyncRef: ScrollSync;

  /**
   * A resize observer for the table
   */
  private readonly resizeObserver: ResizeObserver;

  /**
   * Constructor.
   *
   * @param props the initial props
   */
  public constructor(props: WorkflowTableProps) {
    super(props);
    this.resizeObserver = new ResizeObserver(() => this.onResize());
    const expandedRowStatusRecord: Record<string, RowState> = {};
    const { workflow, glContainer } = this.props;

    addGlUpdateOnTab(glContainer, this.glUpdate);
    addGlUpdateOnResize(glContainer, this.glUpdate);
    addGlUpdateOnShow(glContainer, this.glUpdate);

    workflow?.stages?.forEach(stage => {
      const subRows: { name: string; isActivityRow: boolean }[] = [];
      if (isInteractiveAnalysisStage(stage)) {
        stage.activities?.forEach(a => {
          subRows.push({ name: a.name, isActivityRow: true });
        });
      }
      if (isAutomaticProcessingStage(stage)) {
        stage.sequences?.forEach(s => {
          subRows.push({ name: s.name, isActivityRow: true });
        });
      }
      expandedRowStatusRecord[stage.name] = {
        name: stage.name,
        isExpanded: false,
        subRows
      };
    });
    this.state = {
      expandedRowStatusRecord
    };
  }

  /**
   * Invoked when the component mounted.
   */
  public componentDidMount(): void {
    this.virtualizedContainer = getVirtualizedContainer();
    if (this.virtualizedContainer) {
      this.updateScrollLeft(this.virtualizedContainer.scrollWidth);
      this.resizeObserver.observe(this.virtualizedContainer);
    }
  }

  public shouldComponentUpdate(
    nextProps: WorkflowTableProps,
    nextState: WorkflowTableState
  ): boolean {
    const { widthPx, heightPx, timeRange, workflow, stageIntervals } = this.props;
    const { expandedRowStatusRecord } = this.state;

    return (
      heightPx !== nextProps.heightPx ||
      widthPx !== nextProps.widthPx ||
      timeRange.startTimeSecs !== nextProps.timeRange.startTimeSecs ||
      timeRange.endTimeSecs !== nextProps.timeRange.endTimeSecs ||
      !isEqual(expandedRowStatusRecord, nextState.expandedRowStatusRecord) ||
      !isEqual(workflow, nextProps.workflow) ||
      !isEqual(stageIntervals, nextProps.stageIntervals)
    );
  }

  /**
   * Invoked after a component is updated.
   */
  public componentDidUpdate(prevProps: WorkflowTableProps): void {
    const {
      timeRange: prevTimeRange,
      widthPx: prevWidthPx,
      heightPx: prevHeightPx,
      workflow: prevWorkflow,
      stageIntervals: prevStageIntervals
    } = prevProps;
    const { timeRange, widthPx, heightPx, workflow, stageIntervals } = this.props;
    if (
      prevWorkflow !== workflow ||
      prevStageIntervals !== stageIntervals ||
      prevTimeRange.startTimeSecs !== timeRange.startTimeSecs ||
      prevTimeRange.endTimeSecs !== timeRange.endTimeSecs
    ) {
      // !Per React-Virtualized's documentation:
      // !This is required if cell sizes or positions have changed but nothing else has changed.
      // !Since collection only receives cellCount (and not the underlying List or Array) it has no way of
      // !detecting when the underlying data changes.
      this.collectionRef.calculateSizeAndPositionData();
      this.collectionRef.forceUpdate();
    }
    if (
      prevTimeRange.startTimeSecs !== timeRange.startTimeSecs ||
      prevTimeRange.endTimeSecs !== timeRange.endTimeSecs ||
      prevWidthPx !== widthPx ||
      prevHeightPx !== heightPx
    ) {
      this.virtualizedContainer = getVirtualizedContainer();
    }
  }

  /**
   * clean up when the component is unmounted
   */
  public componentWillUnmount(): void {
    this.virtualizedContainer = getVirtualizedContainer();
    try {
      if (this.virtualizedContainer) {
        this.resizeObserver.unobserve(this.virtualizedContainer);
      }
    } catch (e) {
      logger.error(e);
    }
    const { glContainer } = this.props;
    clearGlUpdateOnTab(glContainer, this.glUpdate);
    clearGlUpdateOnResize(glContainer, this.glUpdate);
    clearGlUpdateOnShow(glContainer, this.glUpdate);
  }

  private readonly glUpdate = () => {
    defer(() => {
      this.virtualizedContainer = getVirtualizedContainer();
      if (this.virtualizedContainer?.scrollWidth) {
        this.updateScrollLeft(this.virtualizedContainer.scrollWidth);
        const hiddenScrollVirtualizedContainer = getHiddenScrollVirtualizedContainer();
        if (hiddenScrollVirtualizedContainer) {
          hiddenScrollVirtualizedContainer.scrollLeft = this.virtualizedContainer.scrollWidth;
        }
      }
    });
  };

  private readonly setCollectionRef = (collectionRef: Collection | null) => {
    if (collectionRef) {
      this.collectionRef = collectionRef;
    }
  };

  /**
   * @returns the total number of cells
   */
  private readonly getCellCount = (): number => this.data.size;

  /**
   * Sets the state for override scroll left and sets virtualized container scroll left
   *
   * @param scrollLeft for virtualized container scrolling
   */
  private readonly updateScrollLeft = (scrollLeft: number) => {
    this.virtualizedContainer = getVirtualizedContainer();
    if (this.virtualizedContainer) {
      this.virtualizedContainer.scrollLeft = scrollLeft;
    }
  };

  /**
   * @returns the total number of rows
   */
  private readonly getRowCount = (): number => uniq([...this.data.map(c => c.rowIndex)]).length;

  /**
   * @param index the index of the cell
   * @returns the cell value
   */
  private readonly getCellValue = (index: number): TableCell | undefined => this.data.get(index);

  /**
   * @param param (index) the index of the cell
   * @returns the position of the cell at the provided index
   */
  private readonly cellSizeAndPositionGetter = ({
    index
  }): {
    height: number;
    width: number;
    x: number;
    y: number;
  } => {
    const { timeRange } = this.props;
    const cellValue = this.getCellValue(index);
    if (cellValue === undefined)
      throw new Error('Attempting to get workflow cell size and position for undefined');
    const { rowIndex, value } = cellValue;
    const { scaleToPosition } = getScaleForTimeRange(timeRange);
    const x: number = scaleToPosition(value.intervalId.startTime);
    const y: number = rowIndex * HEIGHT;
    const width = calculateWidth(value.intervalId.startTime, value.endTime);
    const height = HEIGHT;
    return { height, width, x, y };
  };

  /**
   * @returns the JSX.Element that is rendered when no context exists
   */
  private readonly noContentRenderer = (): JSX.Element => <div>No cells</div>;

  /**
   * @param renderer the table cell render
   * @returns the rendered table cell for the provided renderer
   */
  private readonly cellRenderer = (renderer: CollectionCellRendererParams): JSX.Element => {
    const { index, key, style } = renderer;
    const { staleStartTime, workflow } = this.props;

    const cellValue = this.getCellValue(index);
    if (cellValue === undefined)
      throw new Error('Attempting to get workflow cell value for undefined');
    const { value } = cellValue;

    if (isValue(value)) {
      if (isActivityInterval(value)) {
        const activityIntervalKey = `${value.stageName}_${value.intervalId.definitionId.name}_${value.intervalId.startTime}_${value.endTime}`;
        return (
          <div key={key} style={style}>
            <Tooltip key={activityIntervalKey} interval={value} staleStartTime={staleStartTime}>
              <ActivityIntervalCell key={activityIntervalKey} activityInterval={value} />
            </Tooltip>
          </div>
        );
      }

      const stageIntervalKey = `${value.intervalId.definitionId.name}_${value.intervalId.startTime}_${value.endTime}`;
      const activeAnalystRollup = isInteractiveAnalysisStageInterval(value)
        ? uniqBy(
            flatten(value.activityIntervals.map(activity => activity.activeAnalysts)),
            name => {
              return name;
            }
          )
        : undefined;

      return (
        <div key={key} style={style}>
          <Tooltip
            key={stageIntervalKey}
            interval={value}
            activeAnalysts={activeAnalystRollup}
            staleStartTime={staleStartTime}
          >
            <StageColumnEntry key={stageIntervalKey} stageInterval={value} workflow={workflow} />
          </Tooltip>
        </div>
      );
    }
    return <div key={key} style={style} />;
  };

  /**
   * @param stageName processing stage name
   * @returns the JSX.Element that is rendered when no context exists
   */
  private readonly updateExpandedRowStatusRecordState = (stageName: string) => {
    this.setState(state => {
      const expandedRowStatusRecord = cloneDeep(state.expandedRowStatusRecord);
      expandedRowStatusRecord[stageName].isExpanded =
        !expandedRowStatusRecord[stageName].isExpanded;
      return { expandedRowStatusRecord };
    });
  };

  /**
   * Handles the event called when a new table section is rendered
   *
   * @param params the section rendered params
   */
  private readonly onSectionRendered = (): void => {
    // !the passed in params do not match the expected API type
    this.updateCurrentTimeRange();
  };

  /**
   * Handles the on scroll event for the workflow display.
   * This function is what syncs the two virtualized containers for scrolling.
   */
  public readonly onScroll = (onScrollSync: (params: OnScrollParams) => void, scrollLeft: number) =>
    throttle((params: OnScrollParams): void => {
      if (params) {
        if (Math.abs(params.scrollLeft - scrollLeft) > 5) {
          if (this.timeAxisRef) {
            this.timeAxisRef.setScrollLeft(params.scrollLeft);
          }

          if (this.dayBoundaryIndicatorRef) {
            this.dayBoundaryIndicatorRef.scrollDayIndicator(params.scrollLeft);
          }

          onScrollSync(params);
        }
      }
    });

  /**
   * Handles updating scrollLeft for horizontal scrolling. Will do nothing for vertical
   * scrolling, as that is handled natively.
   */
  public readonly onWheel = (event: React.WheelEvent<HTMLDivElement>): void => {
    if (!event || !this.virtualizedContainer) return;
    const { deltaX, deltaY, shiftKey } = event;

    let scrollValue: number;
    const scrollLeftValue: number = this.virtualizedContainer.scrollLeft;
    if (deltaX !== 0) {
      // Mac & track pads
      scrollValue = scrollLeftValue + deltaX;
    } else if (shiftKey) {
      // On Windows machines, deltaX is always 0 even with shift held down. Fall back to Y.
      scrollValue = scrollLeftValue + deltaY;
    } else {
      // Vertical scrolling is handled natively; do nothing.
      return;
    }

    if (this.timeAxisRef) {
      this.timeAxisRef.setScrollLeft(scrollValue);
    }
    this.updateScrollLeft(scrollValue);
  };

  /**
   * Pans the table by the provided number of seconds
   *
   * @param seconds the number of seconds to pan
   */
  public readonly panBy = (seconds: number): void => {
    if (this.virtualizedContainer) {
      const { timeRange } = this.props;
      const { scaleToPosition, scaleToTime } = getScaleForTimeRange(timeRange);
      const time =
        (scaleToTime(this.virtualizedContainer.scrollLeft) as unknown as number) + seconds;
      this.updateScrollLeft(scaleToPosition(time));
    }
  };

  /**
   * @returns the current time range display as a string
   */
  private readonly updateCurrentTimeRange = (): void => {
    this.virtualizedContainer = getVirtualizedContainer();
    if (this.timeRangeRef) {
      if (this.virtualizedContainer) {
        const { timeRange } = this.props;
        const { scaleToTime } = getScaleForTimeRange(timeRange);
        const scrollLeftValue: number = this.virtualizedContainer.scrollLeft;
        const clientWidthValue: number = this.virtualizedContainer.clientWidth;
        const startTime = scaleToTime(scrollLeftValue);
        const endTime = scaleToTime(scrollLeftValue + clientWidthValue);
        this.timeRangeRef.update(startTime, endTime);
      }
    }
  };

  /**
   * @param workflow the workflow
   * @param stageIntervals the stage intervals
   * @returns the table data
   */
  private readonly getTableData = (
    workflow: WorkflowTypes.Workflow | undefined,
    stageIntervals: StageIntervalList | undefined,
    timeRange: CommonTypes.TimeRange
  ): Immutable.List<TableCell> => {
    const { startTimeSecs, endTimeSecs } = timeRange;

    const listData: ValueOrEmpty[][] = flatMap(
      workflow?.stages.map(stage => {
        const intervals = stageIntervals?.find(si => si.name === stage.name)?.value ?? [];
        if (!this.memoizedProcessData[stage.name]) {
          this.memoizedProcessData[stage.name] = memoizeOne(processData, isEqual);
        }

        // add empty buffers to the start and end to ensure that the entire scroll region is rendered
        const startBuffer: Empty = {
          intervalId: {
            startTime: startTimeSecs,
            definitionId: undefined
          },
          endTime: startTimeSecs + HUNDRED_TWENTY_SECOND_BUFFER
        };
        const endBuffer: Empty = {
          intervalId: {
            startTime: endTimeSecs - HUNDRED_TWENTY_SECOND_BUFFER,
            definitionId: undefined
          },
          endTime: endTimeSecs
        };

        return this.memoizedProcessData[stage.name](stage, intervals).map(v => [
          startBuffer,
          ...v,
          endBuffer
        ]);
      })
    );

    const { expandedRowStatusRecord } = this.state;
    const dataToShow: ValueOrEmpty[][] = [];
    let index = -1;

    Object.values(expandedRowStatusRecord).forEach(entry => {
      index += 1;
      dataToShow.push(listData[index]);
      if (entry.isExpanded) {
        entry.subRows.forEach((subRow, i) => {
          dataToShow.push(listData[index + (i + 1)]);
        });
      }
      index += entry.subRows.length;
    });

    return Immutable.List(
      flatMap(
        dataToShow.map((row, rowIndex) => {
          const startIndex = dataToShow.reduce(
            (prev, val, key) => (key < rowIndex ? prev + val.length : prev),
            0
          );
          return row.map((cell, colIndex) => ({
            index: startIndex + colIndex,
            rowIndex,
            colIndex,
            value: cell
          }));
        })
      )
    );
  };

  /**
   * @returns current viewable min start time
   */
  public readonly getViewableMinStartTime = (): number | undefined => {
    const { timeRange } = this.props;
    this.virtualizedContainer = getVirtualizedContainer();
    if (this.virtualizedContainer && timeRange) {
      const { scaleToTime } = getScaleForTimeRange(timeRange);
      return scaleToTime(this.virtualizedContainer.scrollLeft);
    }
    return undefined;
  };

  private readonly onResize = () => {
    defer(() => {
      this.virtualizedContainer = getVirtualizedContainer();
      if (this.virtualizedContainer && this.scrollSyncRef) {
        this.updateScrollLeft(this.virtualizedContainer.scrollWidth);

        const scrollPercentage =
          (100 * this.scrollSyncRef.state.scrollLeft) /
          (this.scrollSyncRef.state.scrollWidth - this.scrollSyncRef.state.clientWidth);

        const scrollLeft =
          this.scrollSyncRef.state.scrollWidth === 0
            ? 0
            : (scrollPercentage / 100) *
              (this.scrollSyncRef.state.scrollWidth - this.virtualizedContainer.clientWidth);

        if (this.scrollSyncRef) {
          this.scrollSyncRef.setState({
            scrollLeft,
            clientWidth: this.virtualizedContainer.clientWidth
          });

          if (this.timeAxisRef) {
            this.timeAxisRef.setScrollLeft(scrollLeft);
          }

          if (this.dayBoundaryIndicatorRef) {
            this.dayBoundaryIndicatorRef.scrollDayIndicator(scrollLeft);
          }
        }
      }
    });
  };

  /**
   * @param row processing stage row
   * @returns the JSX.Element that is rendered for each row
   */
  private readonly renderIntervalCell = (row: RowState): JSX.Element => {
    return (
      <div
        key={`expand ${row.name}`}
        className="workflow-button"
        data-cy={`workflow-expand-${row.name}`}
      >
        <div key={`main row ${row.name}`} className="workflow-button__expand_collapse">
          <StageExpansionButton
            isExpanded={row.isExpanded}
            disabled={false}
            stageName={row.name}
            toggle={() => {
              this.updateExpandedRowStatusRecordState(row.name);
            }}
          />
        </div>
        {row.isExpanded
          ? row.subRows.map(subRow => (
              <div className="workflow-button__blank" key={`sub row ${row.name} ${subRow.name}`} />
            ))
          : undefined}
      </div>
    );
  };

  /**
   * @param tableHeight
   * @param expandedRowStatusRecord
   * @param timeRange
   * @param width
   * @param onScrollWithAxisAndBoundaryUpdate
   * @param scrollLeft
   * @returns the JSX.Element that is rendered for each cell in the workflow table
   */
  private readonly renderIntervalCells = (
    tableHeight: number,
    expandedRowStatusRecord: Record<string, RowState>,
    timeRange: any,
    width: number,
    onScrollWithAxisAndBoundaryUpdate: any,
    scrollLeft
  ): JSX.Element => {
    return (
      <>
        <div className="workflow-table-container">
          <div className="workflow-table__curtain-left" style={{ height: `${tableHeight}px` }} />
          <div className="workflow-table__buttons">
            {[...Object.values(expandedRowStatusRecord)].map(row => {
              return this.renderIntervalCell(row);
            })}
          </div>
          <DayBoundaryIndicator
            timeRange={timeRange}
            width={width}
            height={tableHeight}
            ref={ref => {
              if (ref) {
                this.dayBoundaryIndicatorRef = ref;
              }
            }}
          />
          <div
            role="presentation"
            style={{ height: tableHeight }}
            data-cy="workflow-table__container"
            onWheel={this.onWheel}
          >
            <Collection
              key="table"
              height={tableHeight}
              ref={this.setCollectionRef}
              width={width}
              cellCount={this.getCellCount()}
              cellRenderer={this.cellRenderer}
              cellSizeAndPositionGetter={this.cellSizeAndPositionGetter}
              noContentRenderer={this.noContentRenderer}
              onScroll={onScrollWithAxisAndBoundaryUpdate}
              onSectionRendered={throttle(this.onSectionRendered)}
              scrollLeft={scrollLeft}
              // shallowCompare prop, per react-virtualized documentation
              data={this.data}
              horizontalOverscanSize={100}
            />
          </div>
          <div className="workflow-table__labels" style={{ height: `${tableHeight}px` }}>
            {flatMap<JSX.Element>(
              [...Object.values(expandedRowStatusRecord)].map<JSX.Element[]>(row => {
                const mainRow = (
                  <WorkflowRowLabel
                    key={`label ${row.name}`}
                    label={row.name}
                    isActivityRow={false}
                  />
                );
                const subRows = row.isExpanded
                  ? row.subRows.map(subRow => (
                      <WorkflowRowLabel
                        key={`label ${row.name} ${subRow.name} ${subRow.isActivityRow}`}
                        label={subRow.name}
                        isActivityRow={subRow.isActivityRow}
                      />
                    ))
                  : [];
                return [mainRow, ...subRows];
              })
            )}
          </div>
          <div className="workflow-table__curtain-right" style={{ height: `${tableHeight}px` }} />
        </div>
        <div className="workflow-table__time-axis">
          <Collection
            key="table-hidden"
            height={16}
            width={width}
            cellCount={this.getCellCount()}
            cellRenderer={() => undefined}
            cellSizeAndPositionGetter={this.cellSizeAndPositionGetter}
            noContentRenderer={() => undefined}
            onScroll={onScrollWithAxisAndBoundaryUpdate}
            scrollLeft={scrollLeft}
            // shallowCompare prop, per react-virtualized documentation
            data={this.data}
          />
          <WorkflowTimeAxis
            key="axis"
            timeRange={timeRange}
            width={width}
            ref={ref => {
              if (ref) {
                this.timeAxisRef = ref;
              }
            }}
          />
          <TimeRange
            key="timerange"
            ref={ref => {
              if (ref) {
                this.timeRangeRef = ref;
              }
            }}
            startTime={timeRange.startTimeSecs}
            endTime={timeRange.endTimeSecs}
          />
        </div>
      </>
    );
  };

  /** *
   *
   * @returns JSX Element workflow table
   */
  public render(): JSX.Element {
    logger.debug('Rendering WorkflowTable', this.props);

    const { widthPx, heightPx, timeRange, workflow, stageIntervals } = this.props;
    const { expandedRowStatusRecord } = this.state;
    this.data = this.getTableData(workflow, stageIntervals, timeRange);

    const height = heightPx - TOOLBAR_HEIGHT_PX - TIME_AXIS_HEIGHT;

    const scrollBarWidth: number = memoizedGetScrollBarWidth();

    const width =
      widthPx -
      TABLE_SIDE_PADDING -
      TABLE_BUTTON_WIDTH -
      TABLE_LABEL_WIDTH -
      TABLE_SIDE_PADDING -
      scrollBarWidth;

    const tableHeight = this.getRowCount() * HEIGHT;

    return (
      <div className="workflow-table" style={{ height: `${height}px` }}>
        <ScrollSync
          ref={ref => {
            if (ref) {
              this.scrollSyncRef = ref;
            }
          }}
        >
          {({ onScroll, scrollLeft }) => {
            const onScrollWithAxisAndBoundaryUpdate = this.onScroll(onScroll, scrollLeft);
            return this.renderIntervalCells(
              tableHeight,
              expandedRowStatusRecord,
              timeRange,
              width,
              onScrollWithAxisAndBoundaryUpdate,
              scrollLeft
            );
          }}
        </ScrollSync>
      </div>
    );
  }
}
