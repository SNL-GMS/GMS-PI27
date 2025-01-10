import { UserProfileTypes } from '@gms/common-model';
import {
  asar,
  linearFilter,
  processingAnalystConfigurationData,
  signalDetectionsData
} from '@gms/common-model/__tests__/__data__';
import { getStore } from '@gms/ui-state';
import { defaultSpectraTemplate } from '@gms/ui-state/__tests__/__data__';
import { act, render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import type { FkConfigurationDialogProps } from '~analyst-ui/components/azimuth-slowness/components/fk-display/fk-configuration-dialog/fk-configuration-dialog';
import { FkConfigurationDialog } from '~analyst-ui/components/azimuth-slowness/components/fk-display/fk-configuration-dialog/fk-configuration-dialog';

// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();
const mockUserProfile = {
  userId: '1',
  defaultAnalystLayoutName: 'default',
  currentTheme: 'GMS Dark Theme',
  workspaceLayouts: [
    {
      name: 'default',
      layoutConfiguration: 'test',
      supportedUserInterfaceModes: [UserProfileTypes.UserMode.IAN]
    }
  ]
};
jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  return {
    ...actual,
    useGetUserProfileQuery: jest.fn(() => {
      return { data: mockUserProfile };
    }),
    useSelectedFilterList: jest.fn().mockReturnValue({
      name: 'fk-configuration-dialog-test',
      defaultFilterIndex: 0,
      filters: [linearFilter]
    }),
    useGetAllStationsQuery: jest.fn().mockReturnValue({ data: [asar] }),
    useFkStationTypeConfigurations: jest.fn(
      () => processingAnalystConfigurationData.fkConfigurations.fkStationTypeConfigurations
    )
  };
});

const fkConfigurationDialogProps: FkConfigurationDialogProps = {
  displayedSignalDetection: signalDetectionsData[0],
  isOpen: true,
  displayedFkConfiguration: defaultSpectraTemplate,
  phase: 'p',
  setIsOpen: jest.fn()
};

it('FKConfigurationDialog renders & matches snapshot', async () => {
  let results;
  await act(() => {
    results = render(
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
          <FkConfigurationDialog {...fkConfigurationDialogProps} />
        </div>
      </Provider>
    );
  });
  expect(results.container).toMatchSnapshot();
});
