import React from 'react';

import type { CreateEventMenuState } from '../menus/create-event-menu-item';
import { useSignalDetectionConfigKeyDown } from './signal-detection-hotkey-configs';

export interface MapHotkeysProps {
  readonly selectedSignalDetectionsIds: string[];
  readonly setPhaseMenuVisibility: (value: boolean) => void;
  readonly setCreateEventMenuState: (value: CreateEventMenuState) => void;
}

/**
 * @returns the HotkeyConfiguration for the map display
 */
export const MapHotkeys = React.memo(function MapHotkeys({
  selectedSignalDetectionsIds,
  setPhaseMenuVisibility,
  setCreateEventMenuState,
  children
}: React.PropsWithChildren<MapHotkeysProps>) {
  const containerRef = React.useRef<HTMLDivElement>();

  const handleKeyDown = useSignalDetectionConfigKeyDown(
    selectedSignalDetectionsIds,
    setPhaseMenuVisibility,
    setCreateEventMenuState
  );

  return (
    <div
      ref={containerRef}
      className="map-hotkeys"
      onKeyDown={handleKeyDown}
      style={{ height: '100%' }}
      role="tab"
      tabIndex={-1}
      onClick={() => {
        containerRef.current?.focus();
      }}
    >
      {children}
    </div>
  );
});
