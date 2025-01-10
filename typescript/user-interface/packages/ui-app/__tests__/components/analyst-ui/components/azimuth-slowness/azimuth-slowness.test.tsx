import React from 'react';
import renderer from 'react-test-renderer';

import { AzimuthSlowness } from '../../../../../src/ts/components/analyst-ui/components/azimuth-slowness';
import { azSlowProps } from '../../../../__data__/test-util-data';

// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();

it('AzimuthSlowness renders & matches snapshot', () => {
  const tree = renderer
    .create(
      <div
        style={{
          border: `1px solid #111`,
          resize: 'both',
          overflow: 'auto',
          height: '700px',
          width: '1000px'
        }}
      >
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <AzimuthSlowness {...(azSlowProps as any)} />
      </div>
    )
    .toJSON();

  expect(tree).toMatchSnapshot();
});
