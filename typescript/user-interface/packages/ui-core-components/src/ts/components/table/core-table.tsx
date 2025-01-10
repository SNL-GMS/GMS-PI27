/* eslint-disable class-methods-use-this */
/* eslint-disable react/destructuring-assignment */
import { uuid } from '@gms/common-util';
import { UILogger } from '@gms/ui-util';
import type {
  CellClickedEvent,
  CellContextMenuEvent,
  GetRowIdParams,
  GridReadyEvent,
  IDatasource,
  IGetRowsParams,
  RowClickedEvent,
  RowNode,
  RowSelectedEvent
} from 'ag-grid-community';
import type { AgGridReactProps } from 'ag-grid-react';
import { AgGridReact } from 'ag-grid-react';
import { ChangeDetectionStrategyType } from 'ag-grid-react/lib/shared/changeDetectionService';
import type Immutable from 'immutable';
import cloneDeep from 'lodash/cloneDeep';
import includes from 'lodash/includes';
import isEqual from 'lodash/isEqual';
import merge from 'lodash/merge';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import type { ColumnApi, ColumnDefinition, ColumnGroupDefinition, Row, TableApi } from './types';

const logger = UILogger.create('GMS_LOG_TABLE', process.env.GMS_LOG_TABLE);

/** The Table Props */
export interface CoreTableProps<RowDataType, ContextDataType> extends AgGridReactProps {
  context?: ContextDataType;
  defaultColDef?: ColumnDefinition<RowDataType, ContextDataType, any, any, any>;
  onCellClicked?(event: CellClickedEvent): void;
  onCellContextMenu?(event: CellContextMenuEvent): void;
  onRowSelected?(event: RowSelectedEvent): void;
}

/**
 * Table component that wraps AgGrid React.
 */
export class CoreTable<RowDataType extends Row, ContextDataType> extends React.Component<
  CoreTableProps<RowDataType, ContextDataType>,
  unknown
> {
  /** Default header height for tables */
  private readonly headerHeight: number = 32;

  /** Default row buffer */
  private readonly rowBuffer: number = 10;

  /** The number of milliseconds to fire the row node redraw timer */
  private readonly redrawRowNodesMs: number = 300000; // 5 minutes

  /** The reference to the ag react component */
  public agGridReactRef: AgGridReact | null;

  /** The table api */
  public tableApi: TableApi | undefined;

  /** The column api */
  public columnApi: ColumnApi | undefined;

  /**
   * These are merged with the user-provided column definitions, if any.
   * The user's column definitions take precedence over these.
   */
  private readonly defaultColumnDefs: ColumnDefinition<any, any, any, any, any> = {
    lockVisible: true,
    resizable: true,
    suppressCellFlash: true,
    sortingOrder: ['asc', 'desc']
  };

  /**
   * The timeout that is fired to ensure that all row nodes are
   * periodically removed from the DOM and redrawn.
   * NOTE: This is to prevent the memory leak within ag-grid
   * while having the setting of `immutableData` enabled.
   */
  private redrawRowNodesTimeout: ReturnType<typeof setTimeout> | undefined;

  // ******************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  /**
   * React lifecycle `shouldComponentUpdate`.
   * Determines if the component should update based on the next props passed in.
   *
   * @param nextProps props for the axis of type YAxisProps
   *
   * @returns boolean
   */
  public shouldComponentUpdate(nextProps: CoreTableProps<RowDataType, ContextDataType>): boolean {
    // the component should only update (render) if the props have changed
    return !isEqual(nextProps, this.props);
  }

  /**
   * React lifecycle `componentDidUpdate`.
   * Called immediately after updating occurs. Not called for the initial render.
   *
   * @param prevProps the previous props
   * @param prevState the previous state
   */
  public componentDidUpdate(): void {
    if (this.props.debug) {
      logger.debug(`table componentDidUpdate`);
    }
    if (this.tableApi) {
      if (this.headerRequiresRefresh()) {
        this.tableApi.refreshHeader();
      }
    }
  }

  /**
   * React lifecycle `componentWillUnmount`.
   * Called immediately before a component is destroyed. Perform any necessary
   * cleanup in this method, such as canceled network requests,
   * or cleaning up any DOM elements created in componentDidMount.
   */
  public componentWillUnmount(): void {
    if (this.props.debug) {
      logger.debug(`table componentWillUnmount`);
    }
    this.destroy();
  }

  /**
   * React lifecycle `render`.
   * Renders the component.
   */
  // eslint-disable-next-line react/sort-comp
  public render(): JSX.Element {
    if (this.props.debug) {
      logger.debug(`table render`);
    }

    return (
      <AgGridReact
        ref={ref => {
          this.agGridReactRef = ref;
        }}
        // default settings
        preventDefaultOnContextMenu
        enableBrowserTooltips
        suppressContextMenu
        suppressLoadingOverlay
        suppressScrollOnNewData
        headerHeight={this.headerHeight}
        animateRows={false}
        rowBuffer={this.rowBuffer}
        getRowId={this.getRowId}
        // user passed in props
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...this.props}
        /*
         * override user passed in props
         */
        onRowClicked={this.props.onRowClicked ? this.props.onRowClicked : this.onRowClicked}
        rowDataChangeDetectionStrategy={ChangeDetectionStrategyType.IdentityCheck}
        // set the row data to null; always use the manual batch update to update and set the table data
        rowData={null}
        // inject a `uuid` into the context to ensure that ag-grid always picks up a change to the context
        // this ensures that the `refreshHeader()` actually refreshes the headers
        context={
          this.headerRequiresRefresh()
            ? merge(this.props.context, { uuid: uuid.asString() })
            : this.props.context
        }
        defaultColDef={merge(
          this.defaultColumnDefs,
          this.removeNonAgGridProperties(this.props.defaultColDef || {})
        )}
        // map column definitions to use static rendering if necessary
        columnDefs={this.mapColumnDefinitionsForStaticRendering(this.props.columnDefs || [])}
        onGridReady={this.onGridReady}
        onColumnMoved={e => {
          this.refreshRenderedRowNodes();
          if (this.props.onColumnMoved) {
            this.props.onColumnMoved(e);
          }
        }}
      />
    );
  }

  // ******************************************
  // END REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  /**
   * Destroys the component instance.
   */
  public readonly destroy = (): void => {
    if (this.props.debug) {
      logger.debug(`table destroy`);
    }

    // destroy the redraw row nodes timeout interval
    clearInterval(this.redrawRowNodesTimeout);
    this.redrawRowNodesTimeout = undefined;

    if (this.columnApi) {
      this.columnApi = undefined;
    }

    if (this.tableApi) {
      const currentRowModelType = this.tableApi.getModel().getType();
      if (currentRowModelType === 'clientSide') {
        this.tableApi.setRowData([]);
      }
      if (currentRowModelType === 'infinite') {
        const emptyDataSource = this.getEmptyDataSource();
        this.tableApi.setDatasource(emptyDataSource);
        this.tableApi.purgeInfiniteCache();
      }
      this.refreshAllRowNodes();
      this.tableApi.destroy();
      this.tableApi = undefined;
    }
  };

  /**
   * Refresh the provided Row Nodes.
   * Removes each row from the DOM and recreates it again from scratch.
   *
   * @param ids the unique ids of the row nodes to refresh
   */
  public readonly refreshRowNodesByIds = (ids: string[]): void => {
    if (this.tableApi && ids) {
      if (this.props.debug) {
        logger.debug(`table refreshRowNodesByIds`, ids);
      }

      const rowNodes: RowNode[] = [];
      ids.forEach(id => {
        const node = this.tableApi?.getRowNode(id);
        if (node) {
          rowNodes.push(node);
        }
      });
      this.refreshRow(rowNodes);
    }
  };

  /**
   * Refresh the rendered Row Nodes.
   */
  public readonly refreshRenderedRowNodes = (): void => {
    if (this.tableApi) {
      if (this.props.debug) {
        logger.debug(`table refreshRenderedRowNodes`);
      }

      const rowNodes: RowNode[] = [];
      this.tableApi.getRenderedNodes().forEach((node: RowNode) => {
        rowNodes.push(node);
      });
      this.refreshRow(rowNodes);
    }
  };

  /**
   * Refresh all Row Nodes.
   * Removes each row from the DOM and recreates it again from scratch.   *
   */
  public readonly refreshAllRowNodes = (): void => {
    if (this.tableApi) {
      if (this.props.debug) {
        logger.debug(`table refreshAllRowNodes`);
      }

      const rowNodes: RowNode[] = [];
      this.tableApi.forEachNode((node: RowNode) => {
        rowNodes.push(node);
      });
      this.refreshRow(rowNodes);
    }
  };

  /**
   * Refreshes the row nodes
   *
   * @param rowNodes the row nodes to refresh
   * @param force true to force refresh; false only refresh if changed
   */
  public readonly refreshRow = (rowNodes: RowNode[], force = true): void => {
    this.tableApi?.refreshCells({ rowNodes, force });
  };

  /**
   * Returns the Table Api instance.
   */
  public readonly getTableApi = (): TableApi | undefined => this.tableApi;

  /**
   * Returns the Column Api instance.
   */
  public readonly getColumnApi = (): ColumnApi | undefined => this.columnApi;

  /**
   * Returns the number of visible columns.
   */
  public readonly getNumberOfVisibleColumns = (): number =>
    this.columnApi?.getAllDisplayedColumns().length || 0;

  /**
   * Sets a column as visible or not visible (show/hide).
   *
   * @param key the unique key for the column
   * @param visible true to show; false to hide
   */
  public readonly setColumnVisible = (key: string, visible: boolean): void => {
    this.columnApi?.setColumnVisible(key, visible);
  };

  /**
   * Sets the column definitions for the table.
   *
   * @param columnDefinitions the column definitions
   */
  public readonly setColumnDefinitions = (
    columnDefinitions: (
      | ColumnDefinition<RowDataType, ContextDataType, unknown, unknown, unknown>
      | ColumnGroupDefinition
    )[]
  ): void => {
    if (this.tableApi) {
      if (!isEqual(this.props.columnDefs, columnDefinitions)) {
        if (this.props.debug) {
          logger.debug(`table setColumnDefinitions`);
        }
        this.tableApi.setColumnDefs(this.mapColumnDefinitionsForStaticRendering(columnDefinitions));
        this.tableApi.refreshHeader();
      }
    }
  };

  /**
   * Default implementation of `getRowId` for determine the unique
   * id of a row node in the table.
   *
   * @param params the data of the row
   */
  public readonly getRowId = (params: GetRowIdParams): string => {
    if (!params?.data || params.data.id === undefined || params.data.id === null) {
      logger.error(`ID undefined for row`);
    }
    return params.data.id;
  };

  /**
   * Updates the row selection with the provided ids - synced selection
   *
   * @param ids the ids to select
   */
  public readonly updateRowSelection = (ids: string[]): void => {
    if (this.tableApi) {
      const selectedNodes = this.tableApi.getSelectedNodes();
      selectedNodes.forEach(rowNode => {
        if (!includes(ids, rowNode.id)) {
          rowNode.setSelected(false);
        }
      });

      this.tableApi.forEachNode(rowNode => {
        if (includes(ids, rowNode.id)) {
          rowNode.setSelected(true);
        }
      });
    }
  };

  /**
   * Called from destroy, reset the datasource
   *
   * @returns an empty IDatasource
   */
  public readonly getEmptyDataSource = (): IDatasource => {
    return {
      getRows(params: IGetRowsParams) {
        params.successCallback([], 0);
      }
    };
  };

  // ******************************************
  // START PRIVATE METHODS
  // ******************************************

  /**
   * Handles row selection
   *
   * @param event StationStatisticsRowClickedEvent
   */
  private readonly onRowClicked = (event: RowClickedEvent): void => {
    const rowIds: string[] = event.api.getSelectedRows().map(row => row.id);
    this.updateRowSelection(rowIds);
  };

  /**
   * Event handler for the `onGridReady` event. This is fired once when the ag-grid is initially created.
   * Invokes the users' `onGridReady` callback when specified.
   *
   * @param event The grid ready even
   */
  private readonly onGridReady = (event: GridReadyEvent): void => {
    this.tableApi = event.api;
    this.columnApi = event.columnApi;

    this.setRedrawRowNodesTimeout();

    if (this.props.onGridReady) {
      this.props.onGridReady(event);
    }
  };

  /**
   * Sets up the timer that will be fired to redraw each row node periodically.
   * NOTE: This is to prevent the memory leak within ag-grid
   * while having the setting of `immutableData` enabled.
   */
  private readonly setRedrawRowNodesTimeout = (): void => {
    // set up the timer to redraw the row nodes periodically
    clearInterval(this.redrawRowNodesTimeout);
    this.redrawRowNodesTimeout = setInterval(() => {
      this.refreshAllRowNodes();
    }, this.redrawRowNodesMs);
  };

  /**
   * Returns true if the table header requires refresh; false otherwise.
   */
  public readonly headerRequiresRefresh = () =>
    this.props.columnDefs &&
    this.props.columnDefs.find(col => col.headerClass !== undefined) !== undefined;

  /**
   * Removes all non ag-grid properties from the definition.
   * Prevents warnings from being thrown by ag-grid.
   *
   * @param definition the column or column group definition
   */
  private readonly removeNonAgGridProperties = (
    definition:
      | ColumnDefinition<RowDataType, ContextDataType, unknown, unknown, unknown>
      | ColumnGroupDefinition
  ):
    | ColumnDefinition<RowDataType, ContextDataType, unknown, unknown, unknown>
    | ColumnGroupDefinition => {
    if (!definition) {
      return definition;
    }

    const updatedDefinition = cloneDeep(definition);
    // remove unknown fields to ag-grid - prevents warnings
    delete updatedDefinition.disableStaticMarkupForHeaderComponentFramework;
    delete updatedDefinition.disableStaticMarkupForCellRendererFramework;
    return updatedDefinition;
  };

  /**
   * Log debug message
   *
   * @param disableStaticMarkupForHeaderComponentFramework
   * @param columnDefinition
   * @param disableStaticMarkupForCellRendererFramework
   * @param definition
   */
  public readonly logDebugMessage = (
    disableStaticMarkupForHeaderComponentFramework: boolean,
    columnDefinition: ColumnDefinition<RowDataType, ContextDataType, unknown, unknown, unknown>,
    disableStaticMarkupForCellRendererFramework: boolean,
    definition: any
  ) => {
    if (this.props.debug) {
      if (
        !disableStaticMarkupForHeaderComponentFramework &&
        columnDefinition.headerComponentFramework
      ) {
        logger.debug(
          `header component framework for column definition ${definition.headerName} will be statically rendered`
        );
      }

      if (!disableStaticMarkupForCellRendererFramework && columnDefinition.cellRenderer) {
        logger.debug(
          `cell renderer framework for column definition ${definition.headerName} will be statically rendered`
        );
      }
    }
  };

  /**
   * Get the cell renderer framework statically as a cell renderer
   *
   * @param disableStaticMarkupForCellRendererFramework
   * @param columnDefinition
   * @returns
   */
  private readonly getColumnCellRender = (
    disableStaticMarkupForCellRendererFramework: boolean,
    columnDefinition: ColumnDefinition<RowDataType, ContextDataType, unknown, unknown, unknown>
  ) => {
    const CellRenderer = columnDefinition.cellRenderer;
    return !disableStaticMarkupForCellRendererFramework && CellRenderer
      ? params =>
          ReactDOMServer.renderToStaticMarkup(
            // eslint-disable-next-line react/jsx-props-no-spreading
            <CellRenderer {...params} />
          )
      : undefined;
  };

  private readonly getUpdatedDefinition = (
    definition: ColumnDefinition<RowDataType, ContextDataType, unknown, unknown, unknown>
  ) => {
    const columnDefinition = definition;

    // determine if disabled based on the column definition and the default column definition
    const disableStaticMarkupForHeaderComponentFramework =
      columnDefinition.disableStaticMarkupForHeaderComponentFramework ||
      this.props.defaultColDef?.disableStaticMarkupForHeaderComponentFramework;

    const disableStaticMarkupForCellRendererFramework =
      columnDefinition.disableStaticMarkupForCellRendererFramework ||
      this.props.defaultColDef?.disableStaticMarkupForCellRendererFramework;

    this.logDebugMessage(
      disableStaticMarkupForHeaderComponentFramework || false,
      columnDefinition,
      disableStaticMarkupForCellRendererFramework || false,
      definition
    );

    const headerFrameworkComp =
      !disableStaticMarkupForHeaderComponentFramework && columnDefinition.headerComponentFramework
        ? // render the header component framework statically as header
          (params: JSX.IntrinsicAttributes) =>
            ReactDOMServer.renderToStaticMarkup(
              // eslint-disable-next-line react/jsx-props-no-spreading
              <columnDefinition.headerComponentFramework {...params} />
            )
        : columnDefinition.headerComponentFramework;
    const headerComp = columnDefinition.headerComponent ? undefined : headerFrameworkComp;

    const columnDefRenderer =
      columnDefinition?.cellRenderer ||
      this.getColumnCellRender(
        disableStaticMarkupForCellRendererFramework || false,
        columnDefinition
      );

    const headerComponent = columnDefinition?.headerComponent;
    const cellRendererFramework =
      !disableStaticMarkupForCellRendererFramework && columnDefinition.cellRenderer
        ? undefined
        : columnDefinition.cellRendererFramework;
    const updatedDefinition = {
      ...columnDefinition,
      headerComponent,
      headerComponentFramework: headerComp,
      cellRenderer: columnDefRenderer,

      cellRendererFramework
    };
    // remove unknown fields to ag-grid - prevents warnings
    return this.removeNonAgGridProperties(updatedDefinition);
  };

  /**
   * Maps the user's specified column definitions for any defined cell renderer frameworks
   * so that they use a static markup rendering
   * unless `disableStaticMarkupForCellRendererFramework` has been set to true.
   *
   * NOTE: this does not change the behavior of cell renderers.
   *
   * @param definitions the column definitions
   */
  private readonly mapColumnDefinitionsForStaticRendering = (
    definitions: (
      | ColumnDefinition<RowDataType, ContextDataType, unknown, unknown, unknown>
      | ColumnGroupDefinition
    )[]
  ): (
    | ColumnDefinition<RowDataType, ContextDataType, unknown, unknown, unknown>
    | ColumnGroupDefinition
  )[] =>
    definitions && this.props.columnDefs
      ? cloneDeep(this.props.columnDefs).map((definition: any) => {
          if (
            definition.headerComponent ||
            definition.headerComponentFramework ||
            definition.cellRenderer ||
            definition.cellRendererFramework
          ) {
            return this.getUpdatedDefinition(definition);
          }
          return definition;
        })
      : [];

  /**
   * Toggles visible columns
   *
   * @param columnsToDisplay columnNames to display map
   */
  public updateVisibleColumns<T extends string>(columnsToDisplay: Immutable.Map<T, boolean>): void {
    if (this.columnApi) {
      columnsToDisplay.forEach((shouldDisplay, columnName) => {
        this.columnApi?.setColumnVisible(columnName, shouldDisplay);
      });
    }
  }
  // ******************************************
  // END PRIVATE METHODS
  // ******************************************
}
