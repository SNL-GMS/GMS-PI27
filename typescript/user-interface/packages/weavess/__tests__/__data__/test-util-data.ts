import type { WeavessTypes } from '@gms/weavess-core';
import { WeavessConfiguration } from '@gms/weavess-core';

export const initialConfiguration: WeavessTypes.Configuration = {
  ...WeavessConfiguration.defaultConfiguration,
  hotKeys: {
    createSignalDetectionWithCurrentPhase: {
      combos: ['e'],
      category: 'Waveform Display',
      description: 'Create new signal detection with current phase'
    },
    createSignalDetectionWithDefaultPhase: {
      combos: ['alt+e'],
      category: 'Waveform Display',
      description: 'Create new signal detection with default phase'
    },
    scaleWaveformAmplitude: {
      combos: ['Y'],
      category: 'Waveform Display',
      description: 'Scale waveform amplitude'
    },
    drawMeasureWindow: {
      combos: ['Shift'],
      category: 'Waveform Display',
      description: 'Draw a measure window'
    },
    resetSelectedWaveformAmplitudeScaling: {
      combos: ['Alt+Y'],
      category: 'Waveform Display',
      description: 'Reset selected waveform manual amplitude scaling'
    },
    resetAllWaveformAmplitudeScaling: {
      combos: ['Alt+Shift+Y'],
      category: 'Waveform Display',
      description: 'Reset all waveform amplitude scaling'
    },
    scaleAllWaveformAmplitude: {
      combos: ['Control+Shift+Y'],
      category: 'Waveform Display',
      description: 'Scale all waveform amplitudes to the selected channel'
    },
    createQcSegments: {
      combos: ['M'],
      category: 'Waveform Display',
      description: 'Create a new QC segment on the selected raw channel'
    },
    viewQcSegmentDetails: {
      combos: ['Alt'],
      category: 'Waveform Display',
      description: 'View details about QC segments'
    },
    zoomOutFully: {
      combos: ['Space'],
      category: 'Waveform Display',
      description: 'Fully zoom out on the waveform display'
    },
    zoomOutOneStep: {
      combos: ['S'],
      category: 'Waveform Display',
      description: 'Zoom out by one step'
    },
    zoomInOneStep: {
      combos: ['W'],
      category: 'Waveform Display',
      description: 'Zoom in by one step'
    },
    panLeft: {
      combos: ['A'],
      category: 'Waveform Display',
      description: 'Pan left'
    },
    panRight: {
      combos: ['D'],
      category: 'Waveform Display',
      description: 'Pan right'
    },
    editSignalDetectionUncertainty: {
      combos: ['Alt+Control+E'],
      category: 'Waveform Display',
      description: 'Edit signal detection time uncertainty'
    },
    toggleUncertainty: {
      combos: ['Shift+Control+U'],
      category: 'Waveform Display',
      description: 'Toggle signal detection time uncertainty'
    }
  }
};
