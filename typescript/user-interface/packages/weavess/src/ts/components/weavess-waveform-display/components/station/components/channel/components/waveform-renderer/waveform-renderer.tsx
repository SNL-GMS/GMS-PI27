/* eslint-disable react/destructuring-assignment */
import { recordLength } from '@gms/common-util';
import { blendColors, UILogger } from '@gms/ui-util';
import { WeavessConstants, WeavessTypes, WeavessUtil } from '@gms/weavess-core';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import sortBy from 'lodash/sortBy';
import memoizeOne from 'memoize-one';
import React from 'react';
import * as THREE from 'three';

import { clearThree, isWithinTimeRange } from '../../../../../../utils';
import { findDataSegmentTimeRange } from '../../../../utils';
import type { Float32ArrayData, WaveformRendererProps, WaveformRendererState } from './types';

const logger = UILogger.create('GMS_LOG_WEAVESS', process.env.GMS_LOG_WEAVESS);

/**
 * This override is to allow THREE to support 2d array buffers.
 * It assumes 3 points (x, y, and z) by default in an array buffer at
 * arr[0], arr[1], and arr[2], respectively. This allows us to override arr[2], because
 * it would not be present in a 2d buffer. By doing this, we are able to eliminate 1/3 of
 * the points in the buffer, since they are all 0 anyway.
 * TODO: If this causes an error, delete it and change the array buffer to expect 3 points, the
 * TODO: third of which is set to 0;
 * eg: geometry.addAttribute('position', new THREE.BufferAttribute(float32Array, 3));
 * https://github.com/mrdoob/three.js/issues/19735
 *
 * @param index
 */
// eslint-disable-next-line func-names
THREE.BufferAttribute.prototype.getZ = function (index) {
  return this.array[index * this.itemSize + 2] || 0;
};

const getLineMaterial = memoizeOne(
  (materialColor: string) =>
    new THREE.LineBasicMaterial({
      color: materialColor as THREE.ColorRepresentation,
      linewidth: 1
    })
);

/**
 * Filters values for Float32Array or number [] based on the time range
 * used to calculate min/max amplitudes for DataBySampleRate/DataClaimCheck data segments
 *
 * @param data
 * @param timeRange
 * @param valuesToFilter
 * @returns returns amplitude values within time range
 */
const filterValuesForDataSampleRate = (
  data: WeavessTypes.DataBySampleRate | WeavessTypes.DataClaimCheck,
  timeRange: WeavessTypes.TimeRange,
  valuesToFilter: Float32Array | number[] | WeavessTypes.TimeValuePair[]
): Float32Array | number[] => {
  let values: Float32Array | number[] = [];
  const { sampleRate, startTimeSecs } = data;
  const pointTimeIncrement = 1 / sampleRate;
  if (WeavessTypes.isFloat32Array(valuesToFilter)) {
    let timeIndex = 0;
    values = valuesToFilter.filter((value, index) => {
      if (index % 2 === 1) {
        timeIndex += 1;
      }
      const pointTimeSecs = pointTimeIncrement * timeIndex + startTimeSecs;
      if (index % 2 === 1 && isWithinTimeRange(pointTimeSecs, timeRange)) {
        return true;
      }
      return false;
    });
  } else if (!WeavessTypes.isTimeValuePairArray(valuesToFilter)) {
    // Filter out values where time is not withing the time range
    values = valuesToFilter.filter((value, index) => {
      const pointTimeSecs = pointTimeIncrement * index + startTimeSecs;
      return isWithinTimeRange(pointTimeSecs, timeRange);
    });
  }
  return values;
};

/**
 * Waveform component. Renders and displays waveform graphics data.
 */
export class WaveformRenderer extends React.PureComponent<
  WaveformRendererProps,
  WaveformRendererState
> {
  /**
   * Flag to ensure that deprecated messages are only logged once in the logger
   * note: will only log when NODE_ENV is set to `development`
   */
  private static shouldLogDeprecated: boolean = process.env.NODE_ENV === 'development';

  /** Default channel props, if not provided */
  // eslint-disable-next-line react/static-property-placement
  public static readonly defaultProps: WeavessTypes.ChannelDefaultConfiguration = {
    displayType: [WeavessTypes.DisplayType.LINE],
    pointSize: 2,
    color: '#4580E6'
  };

  /** THREE.Scene which holds the waveforms for this channel */
  public scene: THREE.Scene | null;

  /** Orthographic camera used to zoom/pan around the waveform */
  public camera: THREE.OrthographicCamera | null;

  /** Shutting down stop and calls */
  private shuttingDown = false;

  /** Building Masks */
  private buildingMasks = false;

  /** References to the masks drawn on the scene. */
  private renderedMaskRefs: THREE.Mesh[] = [];

  /** References to the mask start/end points drawn on the scene. */
  private renderedMaskPointRefs: THREE.Points[] = [];

  /** References to the masks to be drawn on the scene. */
  private readonly tempRenderedMaskRefs: THREE.Mesh[] = [];

  /** References to the mask start/end points to be drawn on the scene. */
  private readonly tempRenderedMaskPointRefs: THREE.Points[] = [];

  /** Camera max top value for specific channel. */
  private cameraTopMax = -Infinity;

  /** Camera max bottom value for specific channel */
  private cameraBottomMax = Infinity;

  /** Camera max bottom value for specific channel */
  private maskHeight = 0;

  /** The manual amplitude scaled value to set on channel */
  private manualAmplitudeScaledValue = 0;

  /** Manual amplitude scale is set */
  private isManualAmplitudeScaleSet = false;

  /** Map from waveform filter id to processed data segments */
  private processedSegmentCache: Map<string, Float32ArrayData[]> = new Map();

  /** Left side of the channel that's outside the {@link WaveformRendererProps.viewableInterval} */
  private leftBoundaryMarker: THREE.Mesh;

  /** Right side of the channel that's outside the {@link WaveformRendererProps.viewableInterval} */
  private rightBoundaryMarker: THREE.Mesh;

  /** Map from channel segment id to pre-calculated boundaries */
  private channelSegmentBoundaries: Map<string, WeavessTypes.ChannelSegmentBoundaries[]> =
    new Map();

  /** Default cameraZ */
  private readonly defaultCameraZDepth = 5;

  /** Default cameraY */
  private readonly defaultCameraY = 1;

  // PNG for the mask start/end point
  private readonly MASK_SPRITE = new THREE.TextureLoader().load(
    new URL('../../../../../../../../../../resources/textures/disc.png', import.meta.url).toString()
  );

  /**
   * Update amplitude for given time range
   */
  public updateAmplitude = debounce(
    async (timeRange: WeavessTypes.TimeRange): Promise<void> => {
      /**
       * If we are in the process of zooming, drop this call because another
       *
       * @function updateAmplitude call will be scheduled.
       */
      await this.updateBounds(timeRange);
      /**
       * If we are in the process of zooming, drop this call because another
       *
       * @function updateAmplitude call will be scheduled.
       * We add this second check here in case zooming was triggered while we awaited
       * the @function updateBounds above.
       */
      this.updateAmplitudeFromBounds();
      this.updateBoundaryMarkers();

      // If we have masks but the masks list is empty, render masks previous render was likely canceled due to boundaries not being set yet
      if (this.props.masks && this.renderedMaskRefs.length === 0) {
        this.renderChannelMasks(this.props.masks);
      }
      this.props.renderWaveforms({ shouldCallAnimationLoopEnd: false }); // false so we don't get an infinite loop of amplitude update calls
    },
    WeavessConstants.ONE_FRAME_MS,
    { leading: false, trailing: true }
  );

  /**
   * Constructor
   *
   * @param props Waveform props as WaveformRenderProps
   */
  public constructor(props: WaveformRendererProps) {
    super(props);
    this.state = {};

    // If the msr window amplitude scale adjustment (factor) is set
    // then this must be the measure window's channel so set the adjustment
    this.manualAmplitudeScaledValue = this.props.msrWindowWaveformAmplitudeScaleFactor ?? 0;
    this.isManualAmplitudeScaleSet = this.manualAmplitudeScaledValue !== 0;
  }

  // ******************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ******************************************d

  /**
   * Called immediately after a component is mounted.
   * Setting state here will trigger re-rendering.
   */
  public async componentDidMount(): Promise<void> {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(
      this.props.glMin,
      this.props.glMax,
      this.defaultCameraY,
      -this.defaultCameraY,
      this.defaultCameraZDepth,
      -this.defaultCameraZDepth
    );
    this.camera.position.z = 0;
    await this.prepareWaveformData(true);

    await this.updateBounds(this.props.displayInterval);
    this.updateAmplitudeFromBounds();
    if (this.props.masks) {
      this.renderChannelMasks(this.props.masks);
    }
    await this.updateBounds(this.props.displayInterval);
    this.updateBoundaryMarkers();
  }

  /**
   * Called immediately after updating occurs. Not called for the initial render.
   *
   * @param prevProps the previous props
   * @param prevState the previous state
   */
  public async componentDidUpdate(prevProps: WaveformRendererProps): Promise<void> {
    // if the measure window amplitude scale factor is set update camera amplitude factor
    if (
      this.props.msrWindowWaveformAmplitudeScaleFactor ||
      prevProps.msrWindowWaveformAmplitudeScaleFactor
    ) {
      this.updateMsrWindowCameraAmplitudeAdjustment(prevProps);
    }

    // Received data for the first time
    if (
      // TODO: should do a deep equal check?
      !isEqual(prevProps.channelSegmentsRecord, this.props.channelSegmentsRecord) ||
      prevProps.displayInterval !== this.props.displayInterval ||
      !isEqual(prevProps.defaultRange, this.props.defaultRange) ||
      prevProps.getBoundaries !== this.props.getBoundaries ||
      prevProps.isAutoDimmed !== this.props.isAutoDimmed
    ) {
      this.updateCameraBounds();
      await this.prepareWaveformData(true);
      this.updateBoundaryMarkers();
    } else if (prevProps.channelSegmentId !== this.props.channelSegmentId) {
      this.updateCameraBounds();
      try {
        await this.prepareWaveformData(false);

        this.props.setError(false);
        this.updateBoundaryMarkers();
      } catch (e) {
        this.props.setError(true, `Error rendering channel segment ${this.props.channelSegmentId}`);
      }
    }
    this.renderChannelMasks(this.props.masks || []);
  }

  /**
   * Stop any calls propagating to channel after unmount
   */
  public componentWillUnmount(): void {
    this.shuttingDown = true;
    this.processedSegmentCache = new Map();
    this.channelSegmentBoundaries = new Map();
    clearThree(this.scene);
    this.scene = null;
    clearThree(this.camera);
    this.camera = null;
    clearThree(this.renderedMaskRefs);
    this.renderedMaskRefs = [];
    clearThree(this.renderedMaskPointRefs);
    this.renderedMaskPointRefs = [];
  }

  // ******************************************
  // END REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  /**
   * Get the manual scaled amplitude if set else returns 0
   *
   * @returns camera (manual) amplitude scaled value
   */
  public getCameraManualScaleAmplitude = (): number => {
    return this.isManualAmplitudeScaleSet ? this.manualAmplitudeScaledValue : 0;
  };

  /**
   * @returns true if amplitude has been manually scaled
   */
  public isManuallyAmplitudeScaled = (): boolean => {
    return this.isManualAmplitudeScaleSet;
  };

  /**
   * Scales the amplitude of the single waveform.
   *
   * @param e The mouse event
   */
  public readonly beginScaleAmplitudeDrag = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (!this.camera) return;

    // prevent propagation of these events so that the underlying channel click doesn't register
    let previousPos = e.clientY;
    let currentPos = e.clientY;
    let diff = 0;

    if (!this.isManualAmplitudeScaleSet) {
      this.isManualAmplitudeScaleSet = true;
      this.manualAmplitudeScaledValue = Math.abs(this.camera.top);
    }
    const onMouseMove = (e2: MouseEvent) => {
      if (!this.camera) return;

      currentPos = e2.clientY;
      diff = previousPos - currentPos;
      previousPos = currentPos;

      const currentCameraRange = Math.abs(this.camera.top - this.camera.bottom);

      // calculate the amplitude adjustment
      const percentDiff = 0.05;
      const amplitudeAdjustment: number = currentCameraRange * percentDiff;

      // Was mouse moving up or down
      if (diff > 0) {
        this.manualAmplitudeScaledValue += amplitudeAdjustment;
      } else if (diff < 0) {
        this.manualAmplitudeScaledValue -= amplitudeAdjustment;
      }
      // apply the any amplitude adjustment to the camera
      this.camera.top = this.manualAmplitudeScaledValue;
      this.camera.bottom = -this.manualAmplitudeScaledValue;

      this.setYAxisBounds(this.camera.bottom, this.camera.top);
      this.camera.updateProjectionMatrix();
      this.props.renderWaveforms();
    };

    const onMouseUp = () => {
      document.body.removeEventListener('mousemove', onMouseMove);
      document.body.removeEventListener('mouseup', onMouseUp);
    };

    document.body.addEventListener('mousemove', onMouseMove);
    document.body.addEventListener('mouseup', onMouseUp);
  };

  /**
   * Reset the amplitude to the default.
   */
  public resetAmplitude = (): void => {
    if (!this.camera) return;

    // Clear manual scaling
    this.manualAmplitudeScaledValue = 0;
    this.isManualAmplitudeScaleSet = false;

    // Determines if the cameraTopMax has not been changed
    const cameraMaxUninitialized: boolean =
      this.cameraTopMax !== -Infinity && this.cameraBottomMax !== Infinity;

    // Check that the amplitude needs resetting
    if (
      cameraMaxUninitialized &&
      (this.camera.top !== this.cameraTopMax || this.camera.bottom !== this.cameraBottomMax)
    ) {
      // reset the amplitude to the window default for this channel
      this.camera.top = this.cameraTopMax;
      this.camera.bottom = this.cameraBottomMax;
      this.setYAxisBounds(this.camera.bottom, this.camera.top);
      this.camera.updateProjectionMatrix();
      this.props.renderWaveforms();
    }
  };

  /**
   * Gets the channel segments with the ID provided in this.props
   *
   * @returns the channel segments that matches the channelSegmentID given by props
   */
  private readonly getThisChannelSegments = () =>
    this.props.channelSegmentsRecord &&
    this.props.channelSegmentsRecord[this.props.channelSegmentId]
      ? this.props.channelSegmentsRecord[this.props.channelSegmentId]
      : undefined;

  /**
   * If the Amplitude values in the ChannelSegmentBoundaries was not already set
   * create them and set them in the channelSegmentBoundaries map for each channel segment
   *
   * * @param timeRange
   */
  private readonly updateBounds = async (timeRange: WeavessTypes.TimeRange) => {
    if (
      this.props.channelSegmentsRecord == null ||
      Object.entries(this.props.channelSegmentsRecord) == null
    ) {
      return;
    }
    // Clear the map before rebuilding the boundaries for the timeRange
    this.channelSegmentBoundaries.clear();
    try {
      await Promise.all(
        Object.entries(this.props.channelSegmentsRecord).map(async ([id, channelSegments]) => {
          if (channelSegments == null) {
            // return a promise so we can use Promise.all above.
            await Promise.resolve(undefined);
          }
          await Promise.all(
            channelSegments.map(async channelSegment => {
              await this.updateChannelSegmentBounds(timeRange, channelSegment, id);
            })
          );
        })
      );
    } catch (e) {
      this.props.setError(true, e);
    }
  };

  /**
   * Updates channelSegmentBoundaries map for each channel segment
   *
   * @param timeRange
   * @param channelSegment
   * @param id
   */
  private readonly updateChannelSegmentBounds = async (
    timeRange: WeavessTypes.TimeRange,
    channelSegment: WeavessTypes.ChannelSegment,
    id: string
  ) => {
    let boundary = channelSegment.channelSegmentBoundaries;
    if (
      !boundary &&
      this.props.getBoundaries &&
      WeavessTypes.areDataSegmentsAllClaimChecks(channelSegment.dataSegments)
    ) {
      try {
        if (this.props.channelOffset) {
          const offsetTimeRange: WeavessTypes.TimeRange = {
            startTimeSecs: timeRange.startTimeSecs - this.props.channelOffset,
            endTimeSecs: timeRange.endTimeSecs - this.props.channelOffset
          };
          boundary = await this.props.getBoundaries(
            this.props.channelName,
            channelSegment,
            offsetTimeRange
          );
        } else {
          boundary = await this.props.getBoundaries(
            this.props.channelName,
            channelSegment,
            timeRange
          );
        }
      } catch (e) {
        this.props.setError(true, e);
      }
    } else {
      boundary = await this.createChannelSegmentBoundaries(channelSegment, id, timeRange);
    }
    if (boundary) {
      if (this.channelSegmentBoundaries?.has(id) && this.channelSegmentBoundaries.get(id)) {
        const entry = this.channelSegmentBoundaries.get(id);
        if (entry) {
          entry.push(boundary);
        }
      } else {
        this.channelSegmentBoundaries.set(id, [boundary]);
      }
    }
  };

  /**
   * Update the min,max in gl units where we draw waveforms, if the view bounds have changed.
   *
   * @param prevProps The previous waveform props
   */
  private readonly updateCameraBounds = () => {
    if (!this.camera) return;
    this.camera.left = this.props.glMin;
    this.camera.right = this.props.glMax;
  };

  /**
   * For measure window update the camera amplitude adjustment if adjustment changed
   * or the display time range has changed
   *
   * @param prevProps The previous waveform props
   */
  private readonly updateMsrWindowCameraAmplitudeAdjustment = (
    prevProps: WaveformRendererProps
  ): void => {
    if (
      prevProps.msrWindowWaveformAmplitudeScaleFactor !==
        this.props.msrWindowWaveformAmplitudeScaleFactor ||
      prevProps.displayInterval !== this.props.displayInterval ||
      !isEqual(prevProps.defaultRange, this.props.defaultRange)
    ) {
      this.manualAmplitudeScaledValue = this.props.msrWindowWaveformAmplitudeScaleFactor ?? 0;
      this.isManualAmplitudeScaleSet = this.manualAmplitudeScaledValue !== 0;
    }
  };

  /**
   * Prepares the waveform display for rendering.
   *
   * @param refreshVerticesCache True if the cache should be refreshed, false otherwise
   */
  private readonly prepareWaveformData = async (refreshVerticesCache: boolean) => {
    // Converts from array of floats to an array of vertices
    if (refreshVerticesCache) {
      await this.convertDataToVerticesArray();
      this.props.renderWaveforms();
    }

    // Create ThreeJS scene from vertices data
    this.setupThreeJSFromVertices();
  };

  /**
   * Updates the y axis and camera position based on the boundaries in this.channelSegmentBoundaries
   */
  private readonly updateAmplitudeFromBounds = () => {
    /**
     * If we are in the process of zooming, drop this call because another
     *
     * @function updateAmplitude call will be scheduled.
     */
    if (this.shuttingDown) {
      return;
    }

    const boundaries = this.channelSegmentBoundaries.get(this.props.channelSegmentId);
    if (!boundaries) {
      this.setYAxisBounds(undefined, undefined);
      return;
    }

    const amplitudeMin = boundaries
      .map(boundary => Math.min(boundary.bottomMax, boundary.topMax))
      .reduce(
        (previousBoundary, currentBoundary) => Math.min(previousBoundary, currentBoundary),
        Infinity
      );

    const amplitudeMax = boundaries
      .map(boundary => Math.max(boundary.bottomMax, boundary.topMax))
      .reduce(
        (previousBoundary, currentBoundary) => Math.max(previousBoundary, currentBoundary),
        -Infinity
      );
    this.updateCameraForMinMaxAmplitudes(amplitudeMin, amplitudeMax, boundaries);
  };

  /**
   * Update the camera based on the min/max amplitudes
   *
   * @param amplitudeMin
   * @param amplitudeMax
   * @param boundaries ChannelSegmentBoundaries
   */
  private readonly updateCameraForMinMaxAmplitudes = (
    amplitudeMin: number,
    amplitudeMax: number,
    boundaries: WeavessTypes.ChannelSegmentBoundaries[]
  ): void => {
    if (!this.camera) return;

    // Set channel average and set default camera top/bottom based on average
    // calculate the average using the unloaded data segments
    // and the previous loaded segments
    // Set axis offset and default view but account for the zero (empty channel)
    const axisOffset: number = Math.max(Math.abs(amplitudeMax), Math.abs(amplitudeMin));

    if (amplitudeMin < 0 && amplitudeMax > 0) {
      const channelAvg =
        boundaries
          .map(boundary => boundary.channelAvg)
          .reduce((previous, current) => previous + current, 0) / boundaries.length;
      this.cameraTopMax = channelAvg + axisOffset;
      this.cameraBottomMax = channelAvg - axisOffset;
    } else {
      // account for the amplitude if it is all positive or all negative
      this.cameraTopMax = amplitudeMax;
      this.cameraBottomMax = amplitudeMin;
    }

    // apply the default yaxis range if provided, instead of using the
    // calculated min/max for the yaxis based on the provided data
    if (this.props.defaultRange) {
      // apply the default max for the yaxis
      if (this.props.defaultRange.max) {
        this.cameraTopMax = this.props.defaultRange.max;
      }

      // apply the default min for the yaxis
      if (this.props.defaultRange.min !== undefined) {
        this.cameraBottomMax = this.props.defaultRange.min;
      }
    }

    if (this.cameraTopMax > this.maskHeight) {
      this.maskHeight = this.cameraTopMax;
    }

    if (-this.cameraBottomMax > this.maskHeight) {
      this.maskHeight = -this.cameraBottomMax;
    }

    if (this.cameraTopMax !== -Infinity && this.cameraBottomMax !== Infinity) {
      // update the camera and apply the any amplitude adjustment to the camera
      if (!this.isManualAmplitudeScaleSet) {
        this.camera.top = this.cameraTopMax;
        this.camera.bottom = this.cameraBottomMax;
      } else {
        this.camera.top = this.manualAmplitudeScaledValue;
        this.camera.bottom = -this.manualAmplitudeScaledValue;
      }

      // set amplitude for label
      this.setYAxisBounds(this.camera.bottom, this.camera.top);
      this.camera.updateProjectionMatrix();
    }
  };

  /**
   * Add line or scatter points to the scene
   *
   * @param float32ArrayWithStartTime
   * @param anySelected
   */
  private readonly addScene = (
    float32ArrayWithStartTime: Float32ArrayData,
    anySelected: boolean
  ) => {
    const color: string = float32ArrayWithStartTime.color || WaveformRenderer.defaultProps.color;

    const { float32Array } = float32ArrayWithStartTime;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(float32Array, 2));
    (float32ArrayWithStartTime.displayType || WaveformRenderer.defaultProps.displayType).forEach(
      displayType => {
        if (displayType === WeavessTypes.DisplayType.LINE) {
          // Default material is bright if any of the CS are selected
          // then dim all CS that are not selected
          let lineColor = color;

          const dimColor = this.props.initialConfiguration?.backgroundColor
            ? blendColors(
                color,
                this.props.initialConfiguration?.backgroundColor,
                this.props.initialConfiguration?.waveformDimPercent
              )
            : lineColor;
          if (this.props.isAutoDimmed || (anySelected && !float32ArrayWithStartTime.isSelected)) {
            lineColor = dimColor;
          }
          const line = new THREE.Line(geometry, getLineMaterial(lineColor));
          if (this.scene) {
            this.scene.add(line);
          }
        } else if (displayType === WeavessTypes.DisplayType.SCATTER) {
          const pointsMaterial = new THREE.PointsMaterial({
            color: color as THREE.ColorRepresentation,
            size: float32ArrayWithStartTime.pointSize || WaveformRenderer.defaultProps.pointSize,
            sizeAttenuation: false
          });
          const points = new THREE.Points(geometry, pointsMaterial);
          if (this.scene) {
            this.scene.add(points);
          }
        }
      }
    );
  };

  /**
   * Create two lists and to make sure the bright (selected) waveforms are more visible
   * add the bright waveforms after the dimmed waveforms
   *
   * @param processedData list Float32ArrayData for this channel
   * @param anySelected are any of the channel segments selected
   * @returns Float32ArrayData[] in order to be added to the scene
   */
  private readonly createProcessedDataList = (
    processedData: Float32ArrayData[],
    anySelected: boolean
  ): Float32ArrayData[] => {
    const brightProcessedData: Float32ArrayData[] = [];
    const dimmedProcessedData: Float32ArrayData[] = [];
    processedData.forEach(float32ArrayWithStartTime => {
      if (this.props.isMeasureWindow) {
        if (!anySelected || float32ArrayWithStartTime.isSelected) {
          brightProcessedData.push(float32ArrayWithStartTime);
        }
      } else if (anySelected && !float32ArrayWithStartTime.isSelected) {
        dimmedProcessedData.push(float32ArrayWithStartTime);
      } else {
        brightProcessedData.push(float32ArrayWithStartTime);
      }
    });

    return [...dimmedProcessedData, ...brightProcessedData];
  };

  /**
   * Manages {@link this.leftBoundaryMarker} and {@link this.rightBoundaryMarker}.
   * Calculates width, height, and position using interval times and the camera.
   * !This must be called *after* {@link this.updateAmplitudeFromBounds}, which updates {@link this.camera.top}.
   */
  private readonly updateBoundaryMarkers = () => {
    if (!this.scene || !this.camera) return;

    // Cleanup previous markers
    if (this.leftBoundaryMarker && this.rightBoundaryMarker) {
      this.scene.remove(this.leftBoundaryMarker);
    }
    if (this.rightBoundaryMarker) {
      this.scene.remove(this.rightBoundaryMarker);
    }

    const timeToGlScale = WeavessUtil.scaleLinear(
      [this.props.displayInterval.startTimeSecs, this.props.displayInterval.endTimeSecs],
      [this.props.glMin, this.props.glMax]
    );

    const color = this.props.initialConfiguration?.outOfBoundsColor;
    const material = new THREE.MeshBasicMaterial({
      color: color as THREE.ColorRepresentation,
      transparent: true
    });

    const height = this.camera.top - this.camera.bottom;

    const depth = 1; // This keeps the boundaries behind the beams

    // Left marker start offset is subtracted since it is always negative
    const leftStartSeconds =
      this.props.displayInterval.startTimeSecs - (this.props.channelOffset || 0);
    const leftEndSeconds = this.props.viewableInterval.startTimeSecs;

    // Do not create and add to scene if there is no width
    if (leftEndSeconds - leftStartSeconds > 0) {
      const leftWidth = timeToGlScale(leftEndSeconds) - timeToGlScale(leftStartSeconds);

      const leftMarkerGeometry = new THREE.PlaneGeometry(leftWidth, height);
      this.leftBoundaryMarker = new THREE.Mesh(leftMarkerGeometry, material);

      const leftMidpoint = timeToGlScale(
        leftStartSeconds + (leftEndSeconds - leftStartSeconds) / 2
      );
      this.leftBoundaryMarker.position.x = leftMidpoint;
      this.leftBoundaryMarker.position.z = depth;

      this.scene.add(this.leftBoundaryMarker);
    }

    // Right marker end offset is subtracted since it is always negative
    const rightStartSeconds = this.props.viewableInterval.endTimeSecs;
    const rightEndSeconds =
      this.props.displayInterval.endTimeSecs - (this.props.channelOffset || 0);

    // Do not create and add to scene if there is no width
    if (rightEndSeconds - rightStartSeconds > 0) {
      const rightWidth = timeToGlScale(rightEndSeconds) - timeToGlScale(rightStartSeconds);
      const rightMarkerGeometry = new THREE.PlaneGeometry(rightWidth, height);
      this.rightBoundaryMarker = new THREE.Mesh(rightMarkerGeometry, material);

      const rightMidpoint = timeToGlScale(
        rightStartSeconds + (rightEndSeconds - rightStartSeconds) / 2
      );
      this.rightBoundaryMarker.position.x = rightMidpoint;
      this.rightBoundaryMarker.position.z = depth;
      this.scene.add(this.rightBoundaryMarker);
    }
  };

  /**
   * Iterates through cached vertices data in the float32 array format
   * and creates ThreeJS objects and adds them to the
   * ThreeJS scene
   */
  private readonly setupThreeJSFromVertices = () => {
    if (this.shuttingDown) {
      return;
    }
    // removed old three js objects from scene
    this.clearScene();

    if (!this.props.channelSegmentId) {
      return;
    }
    const channelSegments = this.getThisChannelSegments();
    const anySelected = channelSegments?.find(cs => cs.isSelected) !== undefined || false;
    const processedData = this.processedSegmentCache.get(this.props.channelSegmentId);

    if (processedData) {
      // A list of data to add to scene in order of dimmed then bright channel segments
      // The list will always be defined
      const processedDataList = this.createProcessedDataList(processedData, anySelected);
      processedDataList.forEach(data => this.addScene(data, anySelected));
    }
    this.updateAmplitudeFromBounds();
    this.updateBoundaryMarkers();
  };

  /**
   * Converts waveform data into useable vertices
   */
  private readonly convertDataToVerticesArray = async () => {
    // determine the new data segments that need to be added to the scene
    if (this.props.channelSegmentsRecord) {
      // If no entries then clear cache to remove all waveform entries
      if (Object.keys(this.props.channelSegmentsRecord).length === 0) {
        this.processedSegmentCache.clear();
        return;
      }

      await Promise.all(
        Object.entries(this.props.channelSegmentsRecord).map(async ([key, channelSegments]) => {
          if (channelSegments && channelSegments.length > 0) {
            const processedSegments: Float32ArrayData[] =
              await this.convertWaveformDataFloat32(channelSegments);

            // if all processed segments have no waveform data don't set cache
            if (processedSegments?.find((ps: Float32ArrayData) => ps.float32Array.length > 0)) {
              this.processedSegmentCache.set(key, processedSegments);
            }
          }
        })
      );
    }
  };

  /**
   * Converts claim check data to a Float32Array
   *
   * @param getPositionBuffer valid getPositionBuffer getter (passed as Weavess props)
   * @param data to convert
   * @returns converted Float32Array data
   * @throws if getPositionBuffer callback is undefined
   */
  private readonly convertDataClaimCheckToFloat32 = async (
    getPositionBuffer: WaveformRendererProps['getPositionBuffer'],
    data: WeavessTypes.DataClaimCheck
  ): Promise<Float32Array | undefined> => {
    if (getPositionBuffer) {
      try {
        return await getPositionBuffer(
          data.id,
          data.startTimeSecs,
          data.endTimeSecs,
          data.domainTimeRange
        );
      } catch (e) {
        logger.error(e.message);
        this.props.setError(true, e.message);
      }
    } else {
      throw new Error(
        'Data by Claim Check needs a valid getPositionBuffer getter (passed as Weavess props)'
      );
    }
    return undefined;
  };

  /**
   * Converts sample rate data to a Float32Array
   *
   * @param data to convert
   * @returns converted Float32Array data
   */
  private readonly convertDataBySampleRateToFloat32 = (data: WeavessTypes.DataBySampleRate) => {
    if (WaveformRenderer.shouldLogDeprecated) {
      logger.warn(
        'Deprecated (data by sample rate) - recommended to pass the data in using a typed array'
      );
      WaveformRenderer.shouldLogDeprecated = false;
    }
    const values: number[] = data.values as any[];
    return WeavessUtil.createPositionBufferForDataBySampleRate({
      values,
      displayStartTimeSecs: this.props.displayInterval.startTimeSecs,
      displayEndTimeSecs: this.props.displayInterval.endTimeSecs,
      glMax: this.props.glMax,
      glMin: this.props.glMin,
      sampleRate: data.sampleRate,
      startTimeSecs: data.startTimeSecs,
      endTimeSecs: data.endTimeSecs
    });
  };

  /**
   * Converts data by time to a Float32Array
   *
   * @param data to convert
   * @returns converted Float32Array data
   */
  private readonly convertDataByTimeToFloat32 = (data: WeavessTypes.DataByTime) => {
    if (WaveformRenderer.shouldLogDeprecated) {
      logger.warn(
        'Deprecated (data by time) - recommended to pass the data in using a typed array'
      );
      WaveformRenderer.shouldLogDeprecated = false;
    }
    const values = data.values as unknown as WeavessTypes.TimeValuePair[];
    return WeavessUtil.createPositionBufferForDataByTime({
      glMax: this.props.glMax,
      glMin: this.props.glMin,
      displayStartTimeSecs: this.props.displayInterval.startTimeSecs,
      displayEndTimeSecs: this.props.displayInterval.endTimeSecs,
      values
    });
  };

  /**
   * Converts a data segment into a Float32ArrayData
   * if it is dataClaimCheck or dataBySampleRate
   * if already a Float32ArrayData then just returns it
   *
   * @param dataSegment to convert
   * @returns converted Float32ArrayData  or undefined
   */
  private readonly convertDataSegmentDataFloat32 = async (
    isChannelSegmentSelected: boolean,
    dataSegment: WeavessTypes.DataSegment
  ): Promise<Float32ArrayData | void> => {
    let float32Array: Float32Array | undefined;
    if (WeavessTypes.isFloat32Array(dataSegment.data.values)) {
      float32Array = dataSegment.data.values;
    } else if (WeavessTypes.isDataClaimCheck(dataSegment.data)) {
      float32Array = await this.convertDataClaimCheckToFloat32(
        this.props.getPositionBuffer,
        dataSegment.data
      );
    } else if (WeavessTypes.isDataBySampleRate(dataSegment.data)) {
      float32Array = this.convertDataBySampleRateToFloat32(dataSegment.data);
    } else {
      float32Array = this.convertDataByTimeToFloat32(dataSegment.data);
    }

    // If values were returned then add it
    // Note: Measure Window might not be in this segments window
    if (float32Array == null) {
      return undefined;
    }
    if (float32Array.length > 0) {
      const timeRange = findDataSegmentTimeRange(dataSegment);

      if (timeRange) {
        // Update the max / min gl units found
        return {
          isSelected: isChannelSegmentSelected,
          color: dataSegment.color,
          displayType: dataSegment.displayType,
          pointSize: dataSegment.pointSize,
          float32Array,
          startTimeSecs: timeRange.startTimeSecs,
          endTimeSecs: timeRange.endTimeSecs
        };
      }
    }
    return undefined;
  };

  /**
   * Converts each Data Segment to Float32ArrayData
   *
   * @param channelSegments
   * @returns Float32ArrayData in an array
   */
  private readonly convertWaveformDataFloat32 = async (
    channelSegments: WeavessTypes.ChannelSegment[]
  ): Promise<Float32ArrayData[]> => {
    // Convert Waveform data to Float32ArrayData data
    const processedSegments: Float32ArrayData[] = [];
    // Build list of data segments to process
    await Promise.all(
      channelSegments.map(async cs => {
        await Promise.all(
          cs.dataSegments.map(async dataSegment => {
            const float32ArrayData = await this.convertDataSegmentDataFloat32(
              cs.isSelected,
              dataSegment
            );
            if (float32ArrayData) {
              processedSegments.push(float32ArrayData);
            }
          })
        );
      })
    );
    return processedSegments;
  };

  /**
   * Filter data segment values for amplitude values for time range
   *
   * @param dataSegment
   * @param timeRange
   * @returns amplitude values
   */
  private readonly amplitudeValuesFromDataSegment = async (
    dataSegment: WeavessTypes.DataSegment,
    timeRange: WeavessTypes.TimeRange
  ): Promise<Float32Array | number[]> => {
    let values: Float32Array | number[];

    // If claim check will need to retrieve from props.getPositionBuffer
    const valuesToFilter =
      !dataSegment.data.values && WeavessTypes.isDataClaimCheck(dataSegment.data)
        ? await this.convertDataClaimCheckToFloat32(this.props.getPositionBuffer, dataSegment.data)
        : dataSegment.data.values;

    // populate amplitude values array based on the data segment types
    if (!valuesToFilter) {
      values = [];
    } else if (
      WeavessTypes.isDataByTime(dataSegment.data) &&
      WeavessTypes.isTimeValuePairArray(valuesToFilter)
    ) {
      const filteredValues: number[] = [];
      valuesToFilter.forEach(v => {
        if (isWithinTimeRange(v.timeSecs, timeRange)) {
          filteredValues.push(v.value);
        }
      });
      values = filteredValues;
    } else if (
      WeavessTypes.isDataClaimCheck(dataSegment.data) ||
      WeavessTypes.isDataBySampleRate(dataSegment.data)
    ) {
      values = filterValuesForDataSampleRate(dataSegment.data, timeRange, valuesToFilter);
    } else {
      values = valuesToFilter as number[];
    }
    return values;
  };

  /**
   * Given a channel segment and id creates the Channel Segment Boundaries
   *
   * @param channelSegment
   * @param channelSegmentId
   * @returns ChannelSegmentBoundaries
   */
  private readonly createChannelSegmentBoundaries = async (
    channelSegment: WeavessTypes.ChannelSegment,
    channelSegmentId: string,
    timeRange: WeavessTypes.TimeRange
  ): Promise<WeavessTypes.ChannelSegmentBoundaries | undefined> => {
    let topMax = -Infinity;
    let bottomMax = Infinity;
    let totalValue = 0;
    let totalValuesCount = 0;

    if (!channelSegment?.dataSegments) {
      return undefined;
    }
    await Promise.all(
      channelSegment.dataSegments.map(async dataSegment => {
        const values = await this.amplitudeValuesFromDataSegment(dataSegment, timeRange);
        values.forEach(sample => {
          totalValue += sample;
          if (sample > topMax) topMax = sample;
          if (sample < bottomMax) bottomMax = sample;
        });
        totalValuesCount += values.length;
      })
    );

    if (topMax === -Infinity || bottomMax === Infinity) {
      // When there is no data in the channel set offset to 1 (to avoid infinity)
      this.cameraTopMax = 1;
      this.cameraBottomMax = -1;
      return undefined;
    }

    return {
      topMax: Math.ceil(topMax),
      bottomMax: Math.floor(bottomMax),
      channelAvg: totalValue / totalValuesCount,
      samplesCount: totalValuesCount,
      offset: Math.max(Math.abs(topMax), Math.abs(bottomMax)),
      channelSegmentId
    };
  };

  /**
   * Render the Masks to the display.
   *
   * @param masks The masks (as Mask[]) to render
   */
  private readonly renderChannelMasks = (masks: WeavessTypes.Mask[]) => {
    /** if we're being passed empty data,
     *  Dont have a valid height,
     *  Or are already rendering
     *  don't try to add masks just clear out the existing ones */
    if (
      this.buildingMasks ||
      recordLength(this.props.channelSegmentsRecord) === 0 ||
      this.cameraTopMax === -Infinity
    ) {
      this.renderedMaskRefs.forEach(m => {
        if (this.scene) {
          this.scene.remove(m);
        }
      });
      this.renderedMaskRefs.length = 0; // delete all references

      this.renderedMaskPointRefs.forEach(m => {
        if (this.scene) {
          this.scene.remove(m);
        }
      });
      this.renderedMaskPointRefs.length = 0; // delete all references
      return;
    }

    // set the tracker so we dont have multiple concurrent build attempts
    this.buildingMasks = true;
    const timeToGlScale = WeavessUtil.scaleLinear(
      [this.props.displayInterval.startTimeSecs, this.props.displayInterval.endTimeSecs],
      [this.props.glMin, this.props.glMax]
    );

    // TODO move sorting to happen elsewhere and support re-sorting when new masks are added
    // TODO consider passing comparator for mask sorting as an argument to weavess

    sortBy(
      sortBy(masks, (mask: WeavessTypes.Mask) => -(mask.endTimeSecs - mask.startTimeSecs)),
      (mask: WeavessTypes.Mask) => mask.isProcessingMask
    ).forEach(mask => {
      this.buildMaskPlaneObject(mask, timeToGlScale);
      this.buildMaskPointsObject(mask, timeToGlScale);
    });

    // Wipe out existing masks
    this.renderedMaskRefs.forEach(m => {
      if (this.scene) {
        this.scene.remove(m);
      }
    });
    this.renderedMaskRefs.length = 0; // delete all references

    this.renderedMaskPointRefs.forEach(m => {
      if (this.scene) {
        this.scene.remove(m);
      }
    });
    this.renderedMaskPointRefs.length = 0; // delete all references

    if (this.scene && this.tempRenderedMaskRefs.length > 0) {
      // adding masks to the scene

      this.scene.add(...this.tempRenderedMaskRefs);
      this.scene.add(...this.tempRenderedMaskPointRefs);
      // force a render due to async possibly finishing after render
      this.props.renderWaveforms({ shouldCallAnimationLoopEnd: false });

      // store the temp and wipe out temp
      this.tempRenderedMaskRefs.forEach(m => this.renderedMaskRefs.push(m));
      this.tempRenderedMaskPointRefs.forEach(m => this.renderedMaskPointRefs.push(m));
      this.tempRenderedMaskRefs.length = 0; // delete all temp references
      this.tempRenderedMaskPointRefs.length = 0; // delete all temp references
    }
    // clear the tracker
    this.buildingMasks = false;
  };

  /**
   * Builds a plane to layer over the waveform data in order to color it.  Stores the plane in the tempRenderedMaskRefs variable
   *
   * @param mask mask to build a plane for
   * @param timeToGlScale the scale used by the waveform
   * @returns void.  Mask plane is stored in class level object
   */
  private readonly buildMaskPlaneObject = (
    mask: WeavessTypes.Mask,
    timeToGlScale: (num: number) => number
  ): void => {
    const maskStartTime = mask.startTimeSecs;
    const maskEndTime = mask.endTimeSecs;
    // if the mask length is 0 we can't draw a mask and the dot is all that is needed
    if (maskEndTime - maskStartTime === 0) {
      return;
    }
    const width = timeToGlScale(maskEndTime) - timeToGlScale(maskStartTime);
    const midpoint = timeToGlScale(maskStartTime + (maskEndTime - maskStartTime) / 2);

    const planeGeometry = new THREE.PlaneGeometry(width, this.maskHeight * 2);
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: mask.color as THREE.ColorRepresentation,
      side: THREE.DoubleSide,
      transparent: true
    });
    planeMaterial.blending = THREE.CustomBlending;
    planeMaterial.blendEquation = THREE.AddEquation;
    planeMaterial.blendSrc = THREE.DstAlphaFactor;
    planeMaterial.blendDst = THREE.ZeroFactor;
    planeMaterial.depthFunc = THREE.EqualDepth;

    const plane: THREE.Mesh = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.position.x = midpoint;

    this.tempRenderedMaskRefs.push(plane);
  };

  /**
   * Builds ThreeJS points to place at the start and end of the mask.  Stores the points in the tempRenderedMaskPointRefs variable
   *
   * @param mask mask to build points for
   * @param timeToGlScale the scale used by the waveform
   * @returns void.  Mask points is stored in class level object
   */
  private readonly buildMaskPointsObject = (
    mask: WeavessTypes.Mask,
    timeToGlScale: (num: number) => number
  ): void => {
    const material = new THREE.PointsMaterial({
      size: 8,
      sizeAttenuation: true,
      alphaTest: 0.5,
      map: this.MASK_SPRITE,
      transparent: false,
      color: mask.color as THREE.ColorRepresentation
    });
    material.blending = THREE.CustomBlending;
    material.depthFunc = THREE.AlwaysDepth;
    material.blendEquation = THREE.AddEquation;
    material.blendSrc = THREE.OneFactor;
    material.blendDst = THREE.ZeroFactor;
    const pointsArray: number[] = [];
    const maskStartTime = mask.startTimeSecs;
    const maskEndTime = mask.endTimeSecs;
    if (
      this.props.viewableInterval.startTimeSecs <= mask.startTimeSecs &&
      this.props.viewableInterval.endTimeSecs >= mask.startTimeSecs
    ) {
      pointsArray.push(timeToGlScale(maskStartTime));
      pointsArray.push(this.findAmplitudeAtTime(maskStartTime));
    }

    if (
      this.props.viewableInterval.startTimeSecs <= mask.endTimeSecs &&
      this.props.viewableInterval.endTimeSecs >= mask.endTimeSecs
    ) {
      pointsArray.push(timeToGlScale(maskEndTime));
      pointsArray.push(this.findAmplitudeAtTime(maskEndTime));
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pointsArray), 2));

    const points = new THREE.Points(geo, material);
    points.position.z = -3;
    this.tempRenderedMaskPointRefs.push(points);
  };

  /**
   * set the y-axis bounds for a particular channel
   *
   * @param min The y minimum axis value
   * @param max The y maximum axis value
   */
  private readonly setYAxisBounds = (min: number | undefined, max: number | undefined) => {
    // don't update channel y-axis if unmount has been called
    if (!this.shuttingDown) {
      if (min != null && max != null) {
        if (this.props.onSetAmplitude) {
          const axisOffset: number = Math.max(Math.abs(max), Math.abs(min));

          const bounds: WeavessTypes.ChannelSegmentBoundaries = {
            channelSegmentId: this.props.channelName,
            topMax: max,
            bottomMax: min,
            channelAvg: 0,
            offset: Number.isNaN(axisOffset) ? 0 : axisOffset
          };
          this.props.onSetAmplitude(this.props.channelName, bounds, this.props.isMeasureWindow);
        }
      }
      this.props.setYAxisBounds(min, max);
    }
  };

  /**
   * Find the data segment for a given time
   *
   * @param time the time in seconds to find the data segment for
   * @returns the data segment that spans the time requested
   */
  private readonly findDataSegmentForTime = (
    time: number
  ): WeavessTypes.DataSegment | undefined => {
    const channelSegments = this.getThisChannelSegments();

    if (!channelSegments) {
      return undefined;
    }

    const dataSegments = channelSegments.flatMap(cs => cs.dataSegments);

    return dataSegments.find(ds => {
      if (ds.data === null) return false;
      if (WeavessTypes.isDataByTime(ds.data)) {
        if (WeavessTypes.isFloat32Array(ds.data.values)) {
          return ds.data.values[0] <= time && ds.data.values[ds.data.values.length - 2] >= time;
        }

        return (
          ds.data.values[0].timeSecs <= time && ds.data[ds.data.values.length - 1].timeSecs >= time
        );
      }
      if (WeavessTypes.isDataBySampleRate(ds.data) || WeavessTypes.isDataClaimCheck(ds.data)) {
        return ds.data.startTimeSecs <= time && ds.data.endTimeSecs >= time;
      }
      return undefined;
    });
  };

  /**
   * Find the waveform amplitude for a given time from the DataClaimCheck
   *
   * @param time the time in seconds to find the amplitude for
   * @param data WeavessTypes.DataClaimCheck containing the amplitudes
   * @returns the amplitude of the beam at the given time
   */
  private readonly findAmplitudeFromDataClaimCheck = (
    time: number,
    data: WeavessTypes.DataClaimCheck
  ): number => {
    let index = -1;

    if (data.startTimeSecs < this.props.displayInterval.startTimeSecs) {
      index = Math.round((time - this.props.displayInterval.startTimeSecs) * data.sampleRate);
    } else {
      index = Math.round((time - data.startTimeSecs) * data.sampleRate);
    }
    // If this is a data claim check it will be cached
    const cachedSegment = this.processedSegmentCache.get(this.props.channelSegmentId);
    const { float32Array } = cachedSegment?.find(
      fad => fad.startTimeSecs <= time && fad.endTimeSecs >= time
    ) ?? { float32Array: undefined };

    if (!float32Array) {
      return 0;
    }
    if (index * 2 + 1 < float32Array.length) return float32Array[index * 2 + 1];
    return 0;
  };

  /**
   * Find the waveform amplitude for a given time
   *
   * @param time the time in seconds to find the amplitude for
   * @returns the amplitude of the beam at the given time
   */
  public readonly findAmplitudeAtTime = (time: number): number => {
    const dataSegment = this.findDataSegmentForTime(time);
    if (dataSegment === undefined) {
      return 0;
    }
    if (WeavessTypes.isDataClaimCheck(dataSegment.data)) {
      return this.findAmplitudeFromDataClaimCheck(time, dataSegment.data);
    }
    if (WeavessTypes.isDataByTime(dataSegment.data)) {
      if (WeavessTypes.isFloat32Array(dataSegment.data.values)) {
        // Return the value in the field after the requested time since data is in time, value sequence
        return dataSegment.data.values[dataSegment.data.values.findIndex(f32 => f32 === time) + 1];
      }
      return dataSegment.data.values.find(tvPair => tvPair.timeSecs === time)?.value || 0;
    }
    if (WeavessTypes.isDataBySampleRate(dataSegment.data)) {
      const index = (time - dataSegment.data.startTimeSecs) * dataSegment.data.sampleRate;
      if (index < dataSegment.data.values.length) return dataSegment.data.values[index];
      return 0;
    }
    return 0;
  };

  // eslint-disable-next-line react/sort-comp
  public render() {
    return null;
  }

  /**
   * Remove the scene children
   */
  private readonly clearScene = (): void => {
    while (this.scene && this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }
  };
}
