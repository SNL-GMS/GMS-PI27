import type { ToolbarTypes } from '@gms/ui-core-components';
import { Toolbar } from '@gms/ui-core-components';
import * as React from 'react';

const GL_CONTAINER_PADDING_PX = 16;
interface WaveformToolbarProps {
  leftToolbarItems: ToolbarTypes.ToolbarItemElement[];
  rightToolbarItems: ToolbarTypes.ToolbarItemElement[];
  widthPx: number;
}

/**
 * A stateless waveform component for memoization.
 */
function InternalWaveformToolbar({
  leftToolbarItems,
  rightToolbarItems,
  widthPx
}: WaveformToolbarProps) {
  return (
    <div className="waveform-display-control-panel">
      <Toolbar
        toolbarWidthPx={widthPx}
        parentContainerPaddingPx={GL_CONTAINER_PADDING_PX}
        itemsLeft={leftToolbarItems}
        itemsRight={rightToolbarItems}
      />
    </div>
  );
}

export const WaveformToolbar = React.memo(InternalWaveformToolbar);
