import { render } from '@testing-library/react';
import React from 'react';

import { LoadingBar } from '../../../../src/ts/components/ui-widgets/loading-bar';

describe('Loading bar', () => {
  it('exists', () => {
    expect(LoadingBar).toBeDefined();
  });
  it('matches a snapshot for non-percentage loading indicator', () => {
    const { container } = render(<LoadingBar isLoading />);
    expect(container).toMatchSnapshot();
  });
  it('matches a snapshot for a percentage loading indicator', () => {
    const { container } = render(<LoadingBar isLoading percentage={0.66667} />);
    expect(container).toMatchSnapshot();
  });
});
