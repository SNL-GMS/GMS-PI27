import React from 'react';
import renderer from 'react-test-renderer';

import { FkLegend } from '../../../../../../../src/ts/components/analyst-ui/components/azimuth-slowness/components/fk-rendering/fk-legend';

it('FkLegend renders & matches snapshot', () => {
  const tree = renderer
    .create(
      <div>
        <FkLegend />
      </div>
    )
    .toJSON();

  expect(tree).toMatchSnapshot();
});
