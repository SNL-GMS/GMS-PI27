import { eventData, openIntervalName } from '@gms/common-model/__tests__/__data__';
import type { AppState } from '@gms/ui-state';
import { analystActions, getStore } from '@gms/ui-state';
import { appState } from '@gms/ui-state/__tests__/test-util';
import { UILogger } from '@gms/ui-util';
import { render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import type { ConflictMarkerCellRendererParams } from '../../../../../../src/ts/components/analyst-ui/common/table/conflict-marker-column/conflict-marker-cell-renderer';
import { ConflictMarkerCellRenderer } from '../../../../../../src/ts/components/analyst-ui/common/table/conflict-marker-column/conflict-marker-cell-renderer';
import type { StatusCellRendererParams } from '../../../../../../src/ts/components/analyst-ui/components/events/table/columns/status';
import { StatusCellRenderer } from '../../../../../../src/ts/components/analyst-ui/components/events/table/columns/status';
import type { EventTableCellRendererParams } from '../../../../../../src/ts/components/analyst-ui/components/events/types';
import { dummyData, dummyData2 } from '../event-table-mock-data';

const logger = UILogger.create('GMS_CELL_RENDERS_TEST', process.env.GMS_CELL_RENDERS_TEST);

const props1: EventTableCellRendererParams<boolean> = {
  api: undefined,
  colDef: undefined,
  column: undefined,
  columnApi: undefined,
  context: undefined,
  data: dummyData,
  eGridCell: undefined,
  eParentOfValue: undefined,
  formatValue: undefined,
  getValue: undefined,
  node: undefined,
  refreshCell: undefined,
  rowIndex: undefined,
  setValue: undefined,
  value: true,
  valueFormatted: undefined,
  registerRowDragger(): void {
    logger.info('registerRowDragger function not implemented');
  }
};

const props2: EventTableCellRendererParams<string> = {
  api: undefined,
  colDef: undefined,
  column: undefined,
  columnApi: undefined,
  context: undefined,
  data: dummyData2,
  eGridCell: undefined,
  eParentOfValue: undefined,
  formatValue: undefined,
  getValue: undefined,
  node: undefined,
  refreshCell: undefined,
  rowIndex: undefined,
  setValue: undefined,
  value: undefined,
  valueFormatted: undefined,
  registerRowDragger(): void {
    logger.info('registerRowDragger function not implemented');
  }
};

jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');

  return {
    ...actual,
    useGetEvents: jest.fn().mockReturnValue({
      data: [eventData]
    }),
    useAppSelector: jest.fn((stateFunc: (state: AppState) => any) => {
      const state: AppState = appState;
      state.app.workflow.openIntervalName = openIntervalName;
      return stateFunc(state);
    })
  };
});

describe('ConflictMarkerCellRenderer', () => {
  it('is exporter', () => {
    expect(ConflictMarkerCellRenderer).toBeDefined();
  });

  it('matches the snapshot', () => {
    const store = getStore();
    store.dispatch(analystActions.setOpenEventId(dummyData.id));

    // snapshot with conflict
    let renderResult = render(
      <Provider store={store}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <ConflictMarkerCellRenderer {...(props1 as ConflictMarkerCellRendererParams)} />
      </Provider>
    );
    expect(renderResult.container).toMatchSnapshot();

    props1.data = dummyData;
    store.dispatch(analystActions.setOpenEventId(dummyData.id));

    // snapshot without conflict
    renderResult = render(
      <Provider store={store}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <ConflictMarkerCellRenderer {...(props1 as ConflictMarkerCellRendererParams)} />
      </Provider>
    );
    expect(renderResult.container).toMatchSnapshot();
  });
});

describe('StatusCellRenderer', () => {
  it('is exporter', () => {
    expect(StatusCellRenderer).toBeDefined();
  });

  it('matches the snapshot', () => {
    props2.data = dummyData2;
    // snapshot with complete status
    // eslint-disable-next-line react/jsx-props-no-spreading
    let renderResult = render(<StatusCellRenderer {...(props2 as StatusCellRendererParams)} />);
    expect(renderResult.container).toMatchSnapshot();

    props2.data = dummyData;
    // snapshot without different status
    // eslint-disable-next-line react/jsx-props-no-spreading
    renderResult = render(<StatusCellRenderer {...(props2 as StatusCellRendererParams)} />);
    expect(renderResult.container).toMatchSnapshot();
  });
});
