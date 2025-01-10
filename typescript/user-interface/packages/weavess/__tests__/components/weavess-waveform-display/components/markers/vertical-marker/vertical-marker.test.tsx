/* eslint-disable react/jsx-props-no-spreading */
import { WeavessTypes } from '@gms/weavess-core';
import { render } from '@testing-library/react';
import * as React from 'react';

import type { VerticalMarkerProps } from '../../../../../../src/ts/components/weavess-waveform-display/components/markers/vertical-marker/types';
import { VerticalMarker } from '../../../../../../src/ts/components/weavess-waveform-display/components/markers/vertical-marker/vertical-marker';

const props: VerticalMarkerProps = {
  name: 'my-marker',
  color: '#ff0000',
  lineStyle: WeavessTypes.LineStyle.DASHED,
  percentageLocation: 90
};
describe('Weavess Vertical Marker', () => {
  it('Weavess Vertical Marker to be defined', () => {
    expect(VerticalMarker).toBeDefined();
  });

  it('renders', () => {
    const { container } = render(<VerticalMarker {...props} />);
    expect(container).toMatchSnapshot();
  });
});
