import type { WeavessTypes } from '@gms/weavess-core';

import type { WeavessWaveformPanelProps } from '../../types';
import type { WeavessWaveformPanel } from '../../weavess-waveform-panel';

export interface MeasureWindowProps extends WeavessWaveformPanelProps {
  /**
   * The information about the selected measure window
   */
  measureWindowSelection: WeavessTypes.MeasureWindowSelection | undefined;

  /**
   * A function that is passed the underlying WeavessWaveformPanel ref to expose the
   * WeavessWaveformPanel's public functions and DOM info
   */
  setMeasureWindowRef: (ref: WeavessWaveformPanel | null) => void;

  /**
   * The height of the measure window, including the x-axis.
   */
  measureWindowHeightPx: number;
}
