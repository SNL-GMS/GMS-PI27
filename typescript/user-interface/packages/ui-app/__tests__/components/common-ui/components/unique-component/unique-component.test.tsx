import '@testing-library/jest-dom';

import { IanDisplays } from '@gms/common-model/lib/displays/types';
import { getStore } from '@gms/ui-state';
import { render, screen } from '@testing-library/react';
import cloneDeep from 'lodash/cloneDeep';
import React from 'react';
import { Provider } from 'react-redux';

import { UniqueComponent } from '~common-ui/components/unique-component';

import { glContainer } from '../../../analyst-ui/components/workflow/gl-container';

describe('Unique Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('will not allow two unique components to be open at once', () => {
    const theContainer = cloneDeep(glContainer);
    theContainer.close = jest.fn();

    const store = getStore();

    render(
      <Provider store={store}>
        <UniqueComponent name={IanDisplays.WAVEFORM} glContainer={theContainer}>
          <div>CHILD 1</div>
        </UniqueComponent>
      </Provider>
    );

    jest.advanceTimersByTime(5);

    render(
      <Provider store={store}>
        <UniqueComponent name={IanDisplays.WAVEFORM} glContainer={theContainer}>
          <div>CHILD 2</div>
        </UniqueComponent>
      </Provider>
    );

    screen.debug();

    expect(screen.queryByText('CHILD 1')).not.toBeInTheDocument();
    expect(screen.getByText('This display is already open in another tab.')).toBeInTheDocument();
    expect(screen.getByText('CHILD 2')).toBeInTheDocument();
  });

  it('will display children in the case where two different components are rendered', () => {
    const theContainer = cloneDeep(glContainer);
    theContainer.close = jest.fn();

    const store = getStore();
    const Component = (
      <Provider store={store}>
        <UniqueComponent name={IanDisplays.WAVEFORM} glContainer={theContainer}>
          <div>CHILD 1</div>
        </UniqueComponent>
        <UniqueComponent name={IanDisplays.WORKFLOW} glContainer={theContainer}>
          <div>CHILD 2</div>
        </UniqueComponent>
      </Provider>
    );

    const container = render(Component);
    container.rerender(Component);

    expect(screen.getByText('CHILD 1')).toBeInTheDocument();
    expect(screen.getByText('CHILD 2')).toBeInTheDocument();
  });

  it('will display children in the case only one component is rendered', () => {
    const theContainer = cloneDeep(glContainer);
    theContainer.close = jest.fn();

    const store = getStore();

    const Component = (
      <Provider store={store}>
        <UniqueComponent name={IanDisplays.WAVEFORM} glContainer={theContainer}>
          <div>CHILD</div>
        </UniqueComponent>
      </Provider>
    );

    const container = render(Component);
    container.rerender(Component);

    expect(screen.getByText('CHILD')).toBeInTheDocument();
  });
});
