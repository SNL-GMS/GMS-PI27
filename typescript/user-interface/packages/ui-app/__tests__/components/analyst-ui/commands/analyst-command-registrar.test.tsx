import { getStore } from '@gms/ui-state';
import { render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import { AnalystCommandRegistrar } from '../../../../src/ts/components/analyst-ui/commands/analyst-command-registrar';
import { CommandPaletteContext } from '../../../../src/ts/components/common-ui/components/command-palette';
import { commandPaletteContextData } from '../../../__data__/common-ui/command-palette-context-data';

jest.mock('@gms/ui-state/lib/app/api/workflow/workflow-api-slice', () => {
  const actual = jest.requireActual('@gms/ui-state/lib/app/api/workflow/workflow-api-slice');
  const workflowData = jest.requireActual('../../../__data__/workflow-data');
  return {
    ...actual,
    useStageIntervalsByIdAndTimeQuery: jest
      .fn()
      .mockReturnValue({ data: workflowData.stageIntervals })
  };
});

const store = getStore();

describe('AnalystCommandRegistrar', () => {
  it('registers workflow commands', () => {
    render(<AnalystCommandRegistrar />, {
      wrapper: ({ children }) => (
        <Provider store={store}>
          <CommandPaletteContext.Provider value={commandPaletteContextData}>
            {children}
          </CommandPaletteContext.Provider>
        </Provider>
      )
    });
    expect(commandPaletteContextData.registerCommands).toHaveBeenCalledWith(
      [
        {
          action: expect.any(Function),
          commandType: 'Workflow: Open Latest Interval',
          displayText: 'Workflow: Open AL1 Interval',
          searchTags: ['open', 'interval', 'al1']
        }
      ],
      'ANALYST'
    );
  });
});
