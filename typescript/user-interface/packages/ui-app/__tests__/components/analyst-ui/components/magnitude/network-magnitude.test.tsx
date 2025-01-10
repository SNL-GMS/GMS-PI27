import { uuid } from '@gms/common-util';
import { render } from '@testing-library/react';
import React from 'react';

import { NetworkMagnitude } from '../../../../../src/ts/components/analyst-ui/components/magnitude/components/network-magnitude/network-magnitude-component';
import { legacyEventData } from '../../../../__data__/event-data';
import { testMagTypes } from '../../../../__data__/test-util-data';

// Mock console.warn to remove warns from the test log
console.warn = jest.fn();

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

describe('when loading a bad marking the UnrecognizedMarkingWarning', () => {
  uuid.asString = jest.fn().mockReturnValue('1e872474-b19f-4325-9350-e217a6feddc0');

  it('renders the network magnitude component', () => {
    const result = render(
      <NetworkMagnitude
        locationSolutionSet={
          legacyEventData.currentEventHypothesis.eventHypothesis.locationSolutionSets[0]
        }
        computeNetworkMagnitudeSolution={undefined}
        preferredSolutionId="id1"
        selectedSolutionId="id1"
        displayedMagnitudeTypes={testMagTypes}
        setSelectedLocationSolution={jest.fn()}
      />
    );
    expect(result.container).toMatchSnapshot();
  });

  it('re-renders given new props', () => {
    const result = render(
      <NetworkMagnitude
        locationSolutionSet={
          legacyEventData.currentEventHypothesis.eventHypothesis.locationSolutionSets[0]
        }
        computeNetworkMagnitudeSolution={undefined}
        preferredSolutionId={undefined}
        selectedSolutionId="id1"
        displayedMagnitudeTypes={testMagTypes}
        setSelectedLocationSolution={jest.fn()}
      />
    );
    const { innerHTML } = result.container;
    // change the props and re-render
    result.rerender(
      <NetworkMagnitude
        locationSolutionSet={
          legacyEventData.currentEventHypothesis.eventHypothesis.locationSolutionSets[0]
        }
        computeNetworkMagnitudeSolution={undefined}
        preferredSolutionId={undefined}
        selectedSolutionId="id2"
        displayedMagnitudeTypes={testMagTypes}
        setSelectedLocationSolution={jest.fn()}
      />
    );
    expect(result.container.innerHTML).not.toEqual(innerHTML);
  });
});
