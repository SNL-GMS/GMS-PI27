/* eslint-disable react/destructuring-assignment */
import { WeavessUtil } from '@gms/weavess-core';
import * as d3 from 'd3';
import isEqual from 'lodash/isEqual';
import memoizeOne from 'memoize-one';
import React from 'react';
import * as THREE from 'three';

import type { SpectrogramRendererProps, SpectrogramRendererState } from './types';

/**
 * Spectrogram component. Renders and displays spectrogram graphics data.
 */
export class SpectrogramRenderer extends React.PureComponent<
  SpectrogramRendererProps,
  SpectrogramRendererState
> {
  /** THREE.Scene which holds the spectrograms for this channel */
  public scene: THREE.Scene;

  /** Orthographic camera used to zoom/pan around the spectrogram */
  public camera: THREE.OrthographicCamera;

  /** Current min for all points in gl units */
  private glMin = 0;

  /** Current max for all points in gl units */
  private glMax = 100;

  /**
   * A memoized function for creating the positions vertices.
   * The memoization function caches the results using
   * the most recent argument and returns the results.
   *
   * @param startTimeSecs the start time seconds
   * @param data the data
   * @param timeStep the time step
   * @param frequencyStep the frequency step
   *
   * @returns a map of string ids to vertices array
   */
  private readonly memoizedCreatePositionVertices: (
    startTimeSecs: number,
    data: number[][],
    timeStep: number,
    frequencyStep: number
  ) => Map<string, number[]>;

  /**
   * Constructor
   *
   * @param props props as SpectrogramRendererProps
   */
  public constructor(props: SpectrogramRendererProps) {
    super(props);
    this.memoizedCreatePositionVertices = memoizeOne(this.createPositionVertices);
    this.state = {};
  }

  // ******************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  /**
   * Called immediately after a component is mounted.
   * Setting state here will trigger re-rendering.
   */
  public componentDidMount(): void {
    this.scene = new THREE.Scene();
    const cameraZDepth = 5;
    this.camera = new THREE.OrthographicCamera(
      this.glMin,
      this.glMax,
      1,
      -1,
      cameraZDepth,
      -cameraZDepth
    );
    this.camera.position.z = 0;

    this.renderSpectrogram();
  }

  /**
   * Called immediately after updating occurs. Not called for the initial render.
   *
   * @param prevProps the previous props
   * @param prevState the previous state
   */
  public componentDidUpdate(prevProps: SpectrogramRendererProps): void {
    if (
      this.props.displayInterval !== prevProps.displayInterval ||
      this.props.timeStep !== prevProps.timeStep ||
      this.props.frequencyStep !== prevProps.frequencyStep ||
      !isEqual(this.props.data, prevProps.data)
    ) {
      this.updateCameraBounds(prevProps);
      this.renderSpectrogram();
    }
  }

  // eslint-disable-next-line react/sort-comp
  public render() {
    return null;
  }

  // ******************************************
  // END REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  /**
   * Update the min,max in gl units where we draw the spectrogram, if the view bounds have changed.
   *
   * @param prevProps The previous props
   */
  private readonly updateCameraBounds = (prevProps: SpectrogramRendererProps) => {
    const scale = WeavessUtil.scaleLinear(
      [prevProps.displayInterval.startTimeSecs, prevProps.displayInterval.endTimeSecs],
      [this.glMin, this.glMax]
    );

    const min = scale(this.props.displayInterval.startTimeSecs);
    const max = scale(this.props.displayInterval.endTimeSecs);
    this.glMin = min;
    this.glMax = max;
    this.camera.left = this.glMin;
    this.camera.right = this.glMax;
  };

  /**
   * Generates the color scale.
   *
   * @param min The minimum frequency value
   * @param max THe maximum frequency value
   *
   * @returns D3 object that turns values into colors d3.ScaleSequential<d3.HSLColor>
   */
  // eslint-disable-next-line class-methods-use-this
  private readonly createColorScale: any = (min: number, max: number) =>
    d3
      .scaleSequential((t): string => {
        if (t < 0 || t > 1) {
          // eslint-disable-next-line no-param-reassign
          t -= Math.floor(t);
        }
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        const ts = Math.abs(t - 0.5);
        // map to range [240, 0] hue
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        return d3.hsl(240 - 240 * t, 1.5 - 1.5 * ts, 0.8 - 0.9 * ts).toString();
      })
      .domain([min, max]);

  /**
   * Renders the spectrogram
   */
  private readonly renderSpectrogram = () => {
    if (
      this.props.startTimeSecs &&
      this.props.data &&
      this.props.timeStep &&
      this.props.frequencyStep
    ) {
      const buffer = this.memoizedCreatePositionVertices(
        this.props.startTimeSecs,
        this.props.data,
        this.props.timeStep,
        this.props.frequencyStep
      );

      while (this.scene.children.length > 0) {
        this.scene.remove(this.scene.children[0]);
      }

      const meshGroup: THREE.Group = new THREE.Group();
      buffer.forEach((vertices, color) => {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
        const material = new THREE.MeshBasicMaterial({ color: color as THREE.ColorRepresentation });
        const mesh = new THREE.Mesh(geometry, material);
        meshGroup.add(mesh);
      });
      this.scene.add(meshGroup);

      this.camera.top = this.props.data[0].length * this.props.frequencyStep;
      this.camera.bottom = 0;
      this.props.setYAxisBounds(this.camera.bottom, this.camera.top);
      this.camera.updateProjectionMatrix();
    }
  };

  /**
   * Creates the position vertices.
   *
   * @param startTimeSecs the start time seconds
   * @param data the data
   * @param timeStep the time step
   * @param frequencyStep the frequency step
   *
   * @returns a map of string ids to vertices array
   */
  private readonly createPositionVertices = (
    startTimeSecs: number,
    data: number[][],
    timeStep: number,
    frequencyStep: number
  ): Map<string, number[]> => {
    const min = Math.min(...data.map(intensity => Math.min(...intensity)));
    const max = Math.max(...data.map(intensity => Math.max(...intensity)));
    const colorScale = this.props.colorScale
      ? this.props.colorScale
      : this.createColorScale(min, max);

    // create a buffer that groups the vertices by color, to help increase the performance or rendering
    const buffer: Map<string, number[]> = new Map();

    const timeToGlScale = WeavessUtil.scaleLinear(
      [this.props.displayInterval.startTimeSecs, this.props.displayInterval.endTimeSecs],
      [this.glMin, this.glMax]
    );

    let time = startTimeSecs;
    // eslint-disable-next-line no-restricted-syntax
    for (const timeValue of data) {
      let freq = 0;
      // eslint-disable-next-line no-restricted-syntax
      for (const freqValue of timeValue) {
        // create a simple square shape. duplicate the top left and bottom right
        // vertices because each vertex needs to appear once per triangle.
        const vertices = [
          timeToGlScale(time),
          freq,
          0,
          timeToGlScale(time + timeStep),
          freq,
          0,
          timeToGlScale(time + timeStep),
          freq + frequencyStep,
          0,

          timeToGlScale(time + timeStep),
          freq + frequencyStep,
          0,
          timeToGlScale(time),
          freq + frequencyStep,
          0,
          timeToGlScale(time),
          freq,
          0
        ];
        const color: string = colorScale(freqValue);

        if (buffer.has(color)) {
          const colorBuffer = buffer.get(color);
          if (colorBuffer) {
            colorBuffer.push(...vertices);
          } else {
            buffer.set(color, [...vertices]);
          }
        } else {
          buffer.set(color, [...vertices]);
        }
        freq += frequencyStep;
      }
      time += timeStep;
    }
    return buffer;
  };
}
