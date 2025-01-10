import { render } from '@testing-library/react';
import * as React from 'react';
import { MeshBasicMaterial } from 'three';

import { SpectrogramRenderer } from '../../../../../../../../../src/ts/components/weavess-waveform-display/components/station/components/channel/components/spectrogram-renderer/spectrogram-renderer';
import type { SpectrogramRendererProps } from '../../../../../../../../../src/ts/components/weavess-waveform-display/components/station/components/channel/components/spectrogram-renderer/types';

const mockSetSize = jest.fn();
const mockRenderer = {
  canvas: 'canvas',
  context: 'context',
  domElement: 'domElement',
  forceContextLoss: jest.fn(),
  setScissor: jest.fn(),
  setScissorTest: jest.fn(),
  render: jest.fn(),
  setSize: mockSetSize,
  setViewport: jest.fn(),
  clear: jest.fn(),
  dispose: jest.fn()
};
jest.mock('three', () => {
  const three = jest.requireActual('three');
  const mockWebGLRenderer = jest.fn();
  mockWebGLRenderer.mockImplementation(() => {
    return mockRenderer;
  });
  return {
    ...three,
    MeshBasicMaterial: jest.fn(),
    WebGLRenderer: mockWebGLRenderer
  };
});
const props: SpectrogramRendererProps = {
  displayInterval: {
    startTimeSecs: 400,
    endTimeSecs: 700
  },
  startTimeSecs: 5,
  data: [
    [1, 2, 3, 4, 5],
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    [6, 7, 8, 9, 10]
  ],
  frequencyStep: 4,
  timeStep: 2,
  setYAxisBounds: jest.fn(),
  colorScale: jest.fn(() => '#ff000')
};

describe('Weavess Spectrogram Renderer', () => {
  it('to be defined', () => {
    expect(SpectrogramRenderer).toBeDefined();
  });

  it('renders', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const { container } = render(<SpectrogramRenderer {...props} />);
    // should just render a <div>
    expect(MeshBasicMaterial).toHaveBeenCalledTimes(1);
    expect((MeshBasicMaterial as jest.Mock).mock.calls[0][0]).toMatchInlineSnapshot(`
      {
        "color": "#ff000",
      }
    `);
    expect(container).toMatchSnapshot();
  });
});
