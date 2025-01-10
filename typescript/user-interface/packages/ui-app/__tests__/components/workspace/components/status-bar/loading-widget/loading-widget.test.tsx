import '@testing-library/jest-dom';

import { analystActions, getStore } from '@gms/ui-state';
import type { RequestTrackerMessage } from '@gms/ui-workers';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import { LoadingWidget } from '~components/workspace/components/status-bar/loading-widget/loading-widget';

describe('LoadingWidget', () => {
  const store = getStore();
  // set up request tracking redux state
  const pendingRequestTrackers: RequestTrackerMessage[] = [
    {
      id: '1',
      message: 'REQUEST_INITIATED',
      url: 'https://example.com/foo',
      actionType: 'REQUEST'
    },
    {
      id: '2',
      message: 'REQUEST_INITIATED',
      url: 'https://example.com/bar',
      actionType: 'REQUEST'
    },
    {
      id: '3',
      message: 'REQUEST_INITIATED',
      url: 'https://example.com/baz',
      actionType: 'REQUEST'
    },
    {
      id: '4',
      message: 'REQUEST_INITIATED',
      url: 'https://example.com/foo',
      actionType: 'REQUEST'
    },
    {
      id: '5',
      message: 'REQUEST_INITIATED',
      url: 'https://example.com/bar',
      actionType: 'REQUEST'
    },
    {
      id: '6',
      message: 'REQUEST_INITIATED',
      url: 'https://example.com/baz',
      actionType: 'REQUEST'
    }
  ];
  const completedRequestTrackers: RequestTrackerMessage[] = [
    {
      id: '2',
      message: 'REQUEST_COMPLETED',
      url: 'https://example.com/bar',
      actionType: 'REQUEST'
    },
    {
      id: '1',
      message: 'REQUEST_COMPLETED',
      url: 'https://example.com/foo',
      actionType: 'REQUEST'
    },
    {
      id: '3',
      message: 'REQUEST_COMPLETED',
      url: 'https://example.com/baz',
      error: 'ERROR: Baz',
      actionType: 'REQUEST'
    }
  ];
  let container;

  const renderLoadingWidget = () => {
    store.dispatch(analystActions.trackPendingRequests(pendingRequestTrackers));
    store.dispatch(analystActions.trackCompletedRequests(completedRequestTrackers));
    container = render(
      <Provider store={store}>
        <LoadingWidget />
      </Provider>
    ).container;
  };
  const cleanupLoadingWidget = () => {
    store.dispatch(analystActions.resetRequestTracker());
    cleanup();
  };
  describe('StatusBar widget', () => {
    beforeEach(renderLoadingWidget);
    afterEach(cleanupLoadingWidget);
    it('matches a snapshot', () => {
      expect(container).toMatchSnapshot();
    });
    it('has the loading counter', () => {
      const loadingCounter = container.querySelector('.loading-counter');
      expect(loadingCounter).toMatchSnapshot();
      expect(loadingCounter.innerHTML).toBe(
        `${completedRequestTrackers.length}/${pendingRequestTrackers.length}`
      );
    });
    it('Shows "Completed" when loading finishes', () => {
      cleanup();
      store.dispatch(
        analystActions.trackCompletedRequests([
          {
            id: '4',
            message: 'REQUEST_COMPLETED',
            url: 'https://example.com/foo',
            actionType: 'REQUEST'
          },
          {
            id: '5',
            message: 'REQUEST_COMPLETED',
            url: 'https://example.com/bar',
            actionType: 'REQUEST'
          },
          {
            id: '6',
            message: 'REQUEST_COMPLETED',
            url: 'https://example.com/baz',
            error: 'Test Error: Baz',
            actionType: 'REQUEST'
          }
        ])
      );
      container = render(
        <Provider store={store}>
          <LoadingWidget />
        </Provider>
      ).container;
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });
  });
  describe('LoadingInfoTooltip', () => {
    beforeEach(renderLoadingWidget);
    afterEach(cleanupLoadingWidget);
    it('creates the tooltip on click', () => {
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(screen.getByText('Error:')).toBeInTheDocument();
      expect(screen.getByText('ERROR: Baz')).toBeInTheDocument();
      expect(screen.getAllByText('/foo')).toHaveLength(2);
      expect(screen.getAllByText('/bar')).toHaveLength(2);
      expect(screen.getAllByText('/baz')).toHaveLength(3);
    });
  });
});
