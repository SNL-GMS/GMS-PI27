import { getStore } from '@gms/ui-state';
import { render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import { HistoryComponent } from '~analyst-ui/components/history/history-component';

import { glContainer } from '../workflow/gl-container';

describe('history component', () => {
  it('exists', () => {
    expect(HistoryComponent).toBeDefined();
  });

  it('can render with no history - non-ideal state', () => {
    const { container } = render(
      <Provider store={getStore()}>
        <HistoryComponent glContainer={glContainer} />
      </Provider>
    );

    expect(container).toMatchSnapshot();
  });
});
