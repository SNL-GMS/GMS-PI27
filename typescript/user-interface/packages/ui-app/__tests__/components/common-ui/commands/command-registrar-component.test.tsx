import { MILLISECONDS_IN_SECOND, SECONDS_IN_MINUTES } from '@gms/common-util';
import { getStore } from '@gms/ui-state';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import { CommandRegistrarComponent } from '../../../../src/ts/components/common-ui/commands/command-registrar-component';
import { CommandPaletteContext } from '../../../../src/ts/components/common-ui/components/command-palette/command-palette-context';
import { commandPaletteContextData } from '../../../__data__/common-ui/command-palette-context-data';

const lodash = jest.requireActual('lodash');
lodash.uniqueId = () => '1';

Date.now = jest.fn().mockReturnValue(() => MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTES);

describe('Common Command Registrar Component', () => {
  render(
    <Provider store={getStore()}>
      <CommandPaletteContext.Provider value={commandPaletteContextData}>
        <CommandRegistrarComponent setAppAuthenticationStatus={jest.fn()} />
      </CommandPaletteContext.Provider>
    </Provider>
  );

  it('registers commands after component updates', async () => {
    await waitFor(() => {
      expect(commandPaletteContextData.registerCommands).toHaveBeenCalled();
    });
  });
});
