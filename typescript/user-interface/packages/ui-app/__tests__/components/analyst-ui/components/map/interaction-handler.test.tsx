import { getStore } from '@gms/ui-state';
import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { Provider } from 'react-redux';

import { useInteractionHandler } from '~analyst-ui/components/map/interaction-handler';

import { stationTooltipLabel } from '../../../../../src/ts/components/analyst-ui/components/map/interaction-utils';

const store = getStore();

function TestReduxWrapper({ children }) {
  return <Provider store={store}>{children}</Provider>;
}

describe('InteractionHandler', () => {
  test('can create a mouse move handler', () => {
    const viewer: any = {
      scene: {
        pickPosition: jest.fn(() => {
          'myPosition';
        })
      },
      entities: {
        getById: jest.fn(() => {
          return undefined;
        }),
        add: jest.fn(() => {
          return stationTooltipLabel;
        })
      }
    };
    const container = renderHook(
      () => {
        const InteractionHandler = useInteractionHandler(jest.fn(), jest.fn, jest.fn);
        return <InteractionHandler viewer={viewer} />;
      },
      { wrapper: TestReduxWrapper }
    );
    expect(container).toMatchSnapshot();
  });
  test('can handle an undefined viewer', () => {
    const viewer: any = undefined;
    const container = renderHook(
      () => {
        const InteractionHandler = useInteractionHandler(jest.fn(), jest.fn, jest.fn);
        return <InteractionHandler viewer={viewer} />;
      },
      { wrapper: TestReduxWrapper }
    );
    expect(container).toMatchSnapshot();
  });
});
