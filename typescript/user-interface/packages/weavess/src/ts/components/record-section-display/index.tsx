/* eslint-disable class-methods-use-this */
/* eslint-disable react/destructuring-assignment */
import { UILogger } from '@gms/ui-util';
import { WeavessConstants } from '@gms/weavess-core';
import React from 'react';
import * as THREE from 'three';
import { RpcProvider } from 'worker-rpc';

import { WorkerOperations } from '../../workers/operations';
import { RecordSectionLabels } from './labels';
import type { RecordSectionState } from './types';

const logger = UILogger.create('GMS_LOG_WEAVESS', process.env.GMS_LOG_WEAVESS);

export const workerRpc = (() => {
  const worker = new Worker(
    new URL('../../workers/index.ts' /* webpackChunkName: 'weavess-rsd-worker' */, import.meta.url)
  );
  const rpc = new RpcProvider((message, transfer) =>
    worker.postMessage(message, transfer as unknown as any)
  );
  worker.onmessage = e => rpc.dispatch(e.data);

  return rpc;
})();

/**
 * RecordSection
 */
export class RecordSection extends React.Component<unknown, RecordSectionState> {
  /** Canvas reference */
  public canvasRef: HTMLCanvasElement | null;

  /** Three web gl render */
  public renderer: THREE.WebGLRenderer;

  /** Three Scene */
  public scene: THREE.Scene;

  /** Three.OrthographicCamera */
  public camera: THREE.OrthographicCamera;

  private readonly containerStyle: React.CSSProperties = {
    height: '100%',
    position: 'relative',
    width: '100%'
  };

  private readonly recordSectionStyle: React.CSSProperties = {
    alignItems: 'center',
    fontFamily: 'sans-serif',
    fontSize: 'large',
    height: '100%',
    justifyContent: 'center',
    width: '100%'
  };

  private readonly canvasStyle: React.CSSProperties = {
    height: '100%',
    position: 'absolute',
    width: '100%',
    zIndex: 0
  };

  /** Constant for 180 degrees */
  private readonly ONE_HUNDRED_EIGHTY_DEGREES: number = 180;

  /** Constant for calculating Km to Degrees */
  private readonly KM_TO_DEGREES = 6371e3;

  /** Magic 200 */
  private readonly MAGIC_TWO_HUNDRED: number = 200;

  /** Magic 400 */
  private readonly MAGIC_FOUR_HUNDRED: number = 400;

  /** The pixel height of the canvas known to the render/painting, not the height of the actual canvas div. */
  private readonly logicalCanvasHeight: number =
    this.ONE_HUNDRED_EIGHTY_DEGREES * this.MAGIC_TWO_HUNDRED;

  /** Each waveform has the Y axis quantized and scaled to fit within 800 logical pixels. */
  private readonly logicalWaveformHeight: number = 800;

  /** Default camera left */
  private readonly defaultCameraLeft: number = 0;

  /**  Default camera right */
  private readonly defaultCameraRight: number = 20;

  /** Web worker */
  private readonly workerRpc: RpcProvider;

  /**
   * Kilometers to Degrees
   *
   * @param km kilometer to convert to degrees
   *
   * @returns result of kilometers to degrees
   */
  // eslint-disable-next-line react/sort-comp
  public kilometersToDegrees = (km: number): number =>
    (km / (Math.PI * this.KM_TO_DEGREES)) * this.ONE_HUNDRED_EIGHTY_DEGREES;

  /**
   * Min array returner
   *
   * @param arr input array
   *
   * @returns min value in array
   */
  public arrayMin = (arr: number[]): number =>
    arr.reduce((prev, curr) => (curr < prev ? curr : prev), Infinity);

  /**
   * Max array returner
   *
   * @param arr input array
   *
   * @returns max value of array
   */
  public arrayMax = (arr: number[]): number =>
    arr.reduce((prev, curr) => (curr > prev ? curr : prev), -Infinity);

  public numericSortAsc = (a: number, b: number): number => a - b;

  /**
   * Constructor
   *
   * @param props RecordSection props
   */
  public constructor(props: unknown) {
    super(props);
    this.state = {
      bottomVal: 0,
      loaded: false,
      options: { data: [] },
      phases: [],
      rendering: true,
      topVal: 0
    };
    this.workerRpc = workerRpc;
  }

  // eslint-disable-next-line react/sort-comp
  public render(): JSX.Element {
    return (
      <div className="record-section-container" style={this.containerStyle}>
        <canvas
          ref={canvas => {
            this.canvasRef = canvas;
          }}
          style={this.canvasStyle}
        />
        <RecordSectionLabels
          topVal={this.state.topVal}
          bottomVal={this.state.bottomVal}
          phases={this.state.phases}
        />
        <div className="record-section" style={this.recordSectionStyle} />
      </div>
    );
  }

  public componentDidMount(): void {
    if (!this.canvasRef) return;

    // TODO remove this listener on unmount
    window.addEventListener('resize', this.animate.bind(this));
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: this.canvasRef
    });
    this.initialize();
    this.animate();
  }

  public initialize(): void {
    const frustumTopPlane = -5;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(
      this.defaultCameraLeft,
      this.defaultCameraRight,
      1,
      -1,
      frustumTopPlane,
      5
    );
    this.camera.position.z = -5;
  }

  /**
   * Update the display. If 'clear' is false, then the data in this.state.options.data is painted on the canvas.
   * If 'clear' is true, then the canvas is cleared.
   *
   * @param clear clear flag
   */
  public update(clear: boolean): void {
    this.scene = new THREE.Scene();
    if (!clear && this.state.options.data.length !== 0) {
      this.loadData(this.state.options.data).catch(error => {
        logger.warn(`Failed to load data ${error}`);
      });
    } else {
      this.setState({
        bottomVal: 0,
        phases: [],
        topVal: 0
      });
      window.requestAnimationFrame(this.animate.bind(this));
    }
  }

  /**
   * Given an array of integers that correspond to the Y values of a waveform and the degree distance from the origin,
   * convert the original Y values into new record section Y coordinate.
   *
   * @param waveformYArray waveform Y array
   * @param distanceDegrees distance degrees
   *
   * @returns Object {yArr, yMax, yMedian, Ymin}
   */
  public convertWaveformYToCanvasY(
    waveformYArray: number[],
    distanceDegrees: number
  ): {
    yArr: number[];
    yMax: number;
    yMedian: number;
    yMin: number;
  } {
    // Create a sorted version of the array to get the min, median, and max
    const sortedYArray = waveformYArray.slice(0, waveformYArray.length).sort(this.numericSortAsc);
    const yMin = sortedYArray[0];
    const yMax = sortedYArray[sortedYArray.length - 1];
    const yMedian = sortedYArray[Math.floor(sortedYArray.length / 2)];

    const yRange = yMax - yMin;

    // Based on the distance from the origin, get the y offset for where the waveform should be placed. At 0 degrees
    // (ie. the station is right at the origin), the yOffset is the very top of the canvas. At 180 degrees (ie. the
    // station is on the opposite side of the world), the yOffset is the very bottom.
    const yOffset =
      this.logicalCanvasHeight * (1 - distanceDegrees / this.ONE_HUNDRED_EIGHTY_DEGREES);

    // Find the min, median, and max y values and convert them to their corresponding y coordinate on the canvas.
    // This median is used as the center of the signal detection line so that the line appears to be closely aligned
    // with the median of the waveform.
    const [correctedYMin, correctedYMedian, correctedYMax] = [yMin, yMedian, yMax].map(
      val => yOffset + ((val - yMedian) / yRange) * this.logicalWaveformHeight
    );

    // For each value in the array, translate it so that the midpoint is at 0, scale it so that the values range
    // between -400 and 400, then translate it to its appropriate canvas y position.
    const correctedY = waveformYArray.map(
      y => ((y - yMedian) / yRange) * this.logicalWaveformHeight + yOffset
    );

    return {
      yArr: correctedY,
      yMax: correctedYMax,
      yMedian: correctedYMedian,
      yMin: correctedYMin
    };
  }

  /**
   * Load data
   *
   * @param waveformArray  data
   */
  public async loadData(waveformArray: any[]): Promise<void> {
    let maxY = -Infinity;
    let minY = Infinity;

    const phases: any = [];
    const cameraXRange = this.defaultCameraRight - this.defaultCameraLeft;

    // eslint-disable-next-line no-restricted-syntax
    for (const waveform of waveformArray) {
      if (!waveform.distance) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const waveformCanvasY = this.convertWaveformYToCanvasY(
        waveform.data,
        this.kilometersToDegrees(waveform.distance)
      );

      // eslint-disable-next-line no-await-in-loop
      const float32Array: Float32Array = await this.workerRpc.rpc<unknown, Float32Array>(
        WorkerOperations.CREATE_RECORD_SECTION_POSITION_BUFFER,
        {
          cameraXRange,
          data: waveform.data,
          defaultCameraLeft: this.defaultCameraLeft,
          distance: waveform.distance
        }
      );

      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(float32Array, 3));
      const lineMaterial = new THREE.LineBasicMaterial({
        color: this.state.options.color,
        linewidth: 1
      });
      const signalDetectMaterial = new THREE.LineBasicMaterial({ color: '#ff0000', linewidth: 1 });

      this.scene.add(new THREE.Line(lineGeometry, lineMaterial));

      // Draw the signal detection.
      const duration = waveform.data.length / waveform.sampleRate;
      const detectionTimeSecs =
        waveform.signalDetection[0].time.getTime() / WeavessConstants.MILLISECONDS_IN_SECOND;
      const detectX = ((detectionTimeSecs - waveform.startTime) / duration) * cameraXRange;
      const detectY = waveformCanvasY.yMedian;
      const vertices: THREE.Vector3[] = [
        new THREE.Vector3(detectX, detectY + this.MAGIC_FOUR_HUNDRED, 0),
        new THREE.Vector3(detectX, detectY - this.MAGIC_FOUR_HUNDRED, 0)
      ];
      const signalDetectGeometry = new THREE.BufferGeometry().setFromPoints(vertices);

      this.scene.add(new THREE.Line(signalDetectGeometry, signalDetectMaterial));

      // Collect information about where the phase labels should be placed as divs.
      phases.push({
        detectY,
        percentX: (detectX / cameraXRange) * 100,
        percentY: 0,
        phase: waveform.phase
      });
      maxY = Math.max(waveformCanvasY.yMax, maxY);
      minY = Math.min(waveformCanvasY.yMin, minY);
    }

    const twoPercentMarginMultiplicative = 0.02;
    const convertDecimalToPercent = 100;
    const margin = (maxY - minY) * twoPercentMarginMultiplicative;
    maxY += margin;
    minY -= margin;
    phases.forEach(val => {
      val.percentY = (1 - (val.detectY - minY) / (maxY - minY)) * convertDecimalToPercent;
    });

    const topVal = (1 - maxY / this.logicalCanvasHeight) * this.ONE_HUNDRED_EIGHTY_DEGREES;
    const bottomVal = (1 - minY / this.logicalCanvasHeight) * this.ONE_HUNDRED_EIGHTY_DEGREES;
    const rendering = true;
    this.setState(prevState => prevState);
    this.setState({
      bottomVal,
      topVal,
      rendering,
      phases
    });

    this.camera.top = maxY;
    this.camera.bottom = minY;
    this.camera.updateProjectionMatrix();
    window.requestAnimationFrame(this.animate.bind(this));
  }

  public animate(): void {
    if (this.state.rendering) {
      this.updateSize();
      this.renderer.render(this.scene, this.camera);
    }
  }

  public updateSize(): void {
    if (!this.canvasRef) return;
    const width = this.canvasRef.offsetWidth;
    const height = this.canvasRef.offsetHeight;

    if (this.canvasRef.width !== width || this.canvasRef.height !== height) {
      this.renderer.setSize(width, height, false);
    }
  }

  /**
   * Adds waveform data, used for late arriving data
   *
   * @param options configurations as any[]
   * @param delayed isDelayed as boolean
   */
  public addWaveformArray(options: any[], delayed: boolean): void {
    const defaultWaveformOptions = {
      color: '#4580E6',
      data: options
    };

    this.setState(
      {
        loaded: false,
        options: defaultWaveformOptions
      },
      () => {
        if (!delayed && options && options.length !== 0) {
          this.update(false);
          this.setState({
            loaded: true
          });
        } else {
          this.update(true);
        }
      }
    );
  }

  public stopRender(): void {
    this.setState({
      rendering: false
    });
  }

  public resumeRender(): void {
    this.setState({
      rendering: true
    });
    if (!this.state.loaded) {
      this.update(false);
      this.setState({
        loaded: true
      });
    } else {
      window.requestAnimationFrame(this.animate.bind(this));
    }
  }
}
