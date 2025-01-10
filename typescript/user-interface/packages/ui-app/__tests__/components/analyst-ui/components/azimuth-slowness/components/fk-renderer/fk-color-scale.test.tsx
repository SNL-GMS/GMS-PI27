import { FkTypes } from '@gms/common-model';
import { getStore } from '@gms/ui-state';
import { render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import type { FkColorScaleProps } from '../../../../../../../src/ts/components/analyst-ui/components/azimuth-slowness/components/fk-rendering/fk-color-scale';
import { FkColorScale } from '../../../../../../../src/ts/components/analyst-ui/components/azimuth-slowness/components/fk-rendering/fk-color-scale';

// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();

const fkColorScaleProps: FkColorScaleProps = {
  minSlow: 1.0,
  maxSlow: 100.0,
  fkUnits: FkTypes.FkUnits.FSTAT
};

it('FkColorScale renders & matches snapshot', () => {
  const { container } = render(
    <Provider store={getStore()}>
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
        <FkColorScale {...fkColorScaleProps} />
      </div>
    </Provider>
  );

  expect(container).toMatchSnapshot();
});
