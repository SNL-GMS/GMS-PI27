/* eslint-disable jest/expect-expect */
import type { NonIdealStateDefinition } from '@gms/ui-core-components';
import { WithNonIdealStates } from '@gms/ui-core-components';
import { render } from '@testing-library/react';
import * as React from 'react';

import { AnalystNonIdealStates } from '../../../../../src/ts/components/analyst-ui/common/non-ideal-states';

const testForLoading = (def: NonIdealStateDefinition<any>, key: string) => {
  function TestComponent() {
    return <div>Test</div>;
  }
  const WrappedComponent = WithNonIdealStates<any>([def], TestComponent);
  const props = {};

  props[key] = { isLoading: true };
  // eslint-disable-next-line react/jsx-props-no-spreading
  const { container } = render(<WrappedComponent {...props} />);
  expect(container.innerHTML).toMatchSnapshot();
};

const testForParallelLoadingWait = (def: NonIdealStateDefinition<any>, key: string) => {
  function TestComponent() {
    return <div>Test</div>;
  }
  const WrappedComponent = WithNonIdealStates<any>([def], TestComponent);
  const props = {};
  props[key] = { pending: 1, fulfilled: 0 };
  // eslint-disable-next-line react/jsx-props-no-spreading
  const firstRender = render(<WrappedComponent {...props} />);
  expect(firstRender.container.innerHTML).toMatchSnapshot();

  props[key] = { pending: 0, fulfilled: 0 };
  // eslint-disable-next-line react/jsx-props-no-spreading
  const secondRender = render(<WrappedComponent {...props} />);
  expect(secondRender.container.innerHTML).toMatchSnapshot();
};

const testForError = (def: NonIdealStateDefinition<any>, key: string) => {
  function TestComponent() {
    return <div>Test</div>;
  }
  const WrappedComponent = WithNonIdealStates<any>([def], TestComponent);
  const props = {};

  props[key] = { isError: true };
  // eslint-disable-next-line react/jsx-props-no-spreading
  const { container } = render(<WrappedComponent {...props} />);
  expect(container.innerHTML).toMatchSnapshot();
};

describe('Non ideal state definitions', () => {
  it('renders non ideal states for loading and error processing analyst configuration', () => {
    testForLoading(
      AnalystNonIdealStates.processingAnalystConfigNonIdealStateDefinitions[0],
      'processingAnalystConfigurationQuery'
    );
    testForError(
      AnalystNonIdealStates.processingAnalystConfigNonIdealStateDefinitions[2],
      'processingAnalystConfigurationQuery'
    );
  });

  it('renders non ideal states for loading and error user profile', () => {
    testForLoading(
      AnalystNonIdealStates.userProfileNonIdealStateDefinitions[0],
      'userProfileQuery'
    );
    testForError(AnalystNonIdealStates.userProfileNonIdealStateDefinitions[2], 'userProfileQuery');
  });

  it('renders non ideal states for loading and error events', () => {
    testForLoading(AnalystNonIdealStates.eventNonIdealStateDefinitions[0], 'eventResults');
    testForParallelLoadingWait(
      AnalystNonIdealStates.eventNonIdealStateDefinitions[0],
      'eventResults'
    );
    testForError(AnalystNonIdealStates.eventNonIdealStateDefinitions[2], 'eventResults');
  });

  it('renders non ideal states for loading and error signal detections', () => {
    testForError(
      AnalystNonIdealStates.signalDetectionsNonIdealStateDefinitions[1],
      'signalDetectionResults'
    );
  });

  it('renders non ideal states for loading and error station definitions', () => {
    testForLoading(
      AnalystNonIdealStates.stationDefinitionNonIdealStateDefinitions[0],
      'stationsQuery'
    );
    testForError(
      AnalystNonIdealStates.stationDefinitionNonIdealStateDefinitions[2],
      'stationsQuery'
    );
  });
});
