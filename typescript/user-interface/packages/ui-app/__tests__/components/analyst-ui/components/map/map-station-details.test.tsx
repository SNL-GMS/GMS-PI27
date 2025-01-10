import React from 'react';
import renderer from 'react-test-renderer';

import { StationDetails } from '../../../../../src/ts/components/analyst-ui/components/map/station-details';

describe('MapStationDetails', () => {
  test('functions are defined', () => {
    expect(StationDetails).toBeDefined();
  });

  it('matches snapshot', () => {
    const component = renderer
      .create(
        <StationDetails
          stationName="STA1"
          latitude="100"
          longitude="100"
          elevation="1000"
          detailedType="Single Station"
          entityType="Station"
        />
      )
      .toJSON();
    expect(component).toMatchSnapshot();
  });

  it('matches snapshot with a site type', () => {
    const component = renderer
      .create(
        <StationDetails
          stationName="STA1"
          latitude="100"
          longitude="100"
          elevation="1000"
          detailedType="Array"
          entityType="ChannelGroup"
        />
      )
      .toJSON();
    expect(component).toMatchSnapshot();
  });
});
