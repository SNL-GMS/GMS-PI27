import { HotkeysProvider, useHotkeys } from '@blueprintjs/core';
import { getByRole, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';

import { HotkeyHandler } from '../../../src/ts/components/hotkey-handler';
import { initialConfiguration } from '../../__data__/test-util-data';

const panRatio = 0.5;
const zoomInRatio = -0.25;
const zoomOutRatio = 0.5;

jest.mock('@blueprintjs/core', () => {
  const blueprintActual = jest.requireActual('@blueprintjs/core');
  const mockHandleKeyDown = jest.fn();
  const mockHandleKeyUp = jest.fn();
  const mockUseHotkeys = jest.fn(() => ({
    handleKeyUp: mockHandleKeyDown,
    handleKeyDown: mockHandleKeyUp
  }));
  return {
    ...blueprintActual,
    useHotkeys: mockUseHotkeys
  };
});

describe('HotkeyHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockPan = jest.fn();
  const mockZoom = jest.fn();
  const mockFullZoomOut = jest.fn();
  const mockCreateQcSegmentsKeyDown = jest.fn();
  const mockCreateQcSegmentsKeyUp = jest.fn();
  const mockPageDown = jest.fn();
  const mockPageUp = jest.fn();

  it('useHotkeys is called with the proper configuration', () => {
    render(
      <HotkeysProvider>
        <HotkeyHandler
          pan={mockPan}
          panRatio={panRatio}
          zoomInRatio={zoomInRatio}
          zoomOutRatio={zoomOutRatio}
          zoomByPercentageToPoint={mockZoom}
          hotKeysConfig={initialConfiguration.hotKeys}
          fullZoomOut={mockFullZoomOut}
          createQcSegmentsKeyDown={mockCreateQcSegmentsKeyDown}
          createQcSegmentsKeyUp={mockCreateQcSegmentsKeyUp}
          pageDown={mockPageDown}
          pageUp={mockPageUp}
          isSplitChannelOverlayOpen={false}
        >
          hotkey handler contents
        </HotkeyHandler>
      </HotkeysProvider>
    );

    expect((useHotkeys as unknown as any).mock.calls).toMatchSnapshot();
  });

  it('HandleKeyDown is called when a key is pressed', async () => {
    const { container } = render(
      <HotkeysProvider>
        <HotkeyHandler
          pan={mockPan}
          panRatio={panRatio}
          zoomInRatio={zoomInRatio}
          zoomOutRatio={zoomOutRatio}
          zoomByPercentageToPoint={mockZoom}
          hotKeysConfig={initialConfiguration.hotKeys}
          fullZoomOut={mockFullZoomOut}
          createQcSegmentsKeyDown={mockCreateQcSegmentsKeyDown}
          createQcSegmentsKeyUp={mockCreateQcSegmentsKeyUp}
          pageDown={mockPageDown}
          pageUp={mockPageUp}
          isSplitChannelOverlayOpen={false}
        >
          hotkey handler contents
        </HotkeyHandler>
      </HotkeysProvider>
    );
    const hotkeyHandler = getByRole(container, 'tab');
    hotkeyHandler.focus();
    await userEvent.keyboard('a');
    const { handleKeyDown } = useHotkeys([] as any);
    expect(handleKeyDown).toHaveBeenCalled();
  });
});
