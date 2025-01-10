import { Popover, PopoverInteractionKind, Position } from '@blueprintjs/core';
import type {
  ColorTypes,
  ConfigurationTypes,
  EventTypes,
  SignalDetectionTypes
} from '@gms/common-model';
import { FkTypes } from '@gms/common-model';
import {
  useAllStations,
  useGetFkMeasuredValues,
  useProcessingAnalystConfiguration,
  useSetFkMeasuredValues
} from '@gms/ui-state';
import type { Point } from '@gms/ui-util';
import isEqual from 'lodash/isEqual';
import React from 'react';

import * as fkUtil from '../fk-util';
import { getConstantVelocityRingsForStationType } from '../fk-util';
import { FkColorScale } from './fk-color-scale';
import { FkLegend } from './fk-legend';
import { FkRenderingFooter } from './fk-rendering-footer';

/**
 * FkRendering Props
 */
export interface FkRenderingProps {
  featurePredictionsForDisplayedSignalDetection: EventTypes.FeaturePrediction[];
  selectedFkUnit: FkTypes.FkUnits;
  setSelectedFkUnit: (fkUnit: FkTypes.FkUnits) => void;
  fkRenderingWidth: number;
  currentMovieSpectrumIndex: number;
  displayedFk: FkTypes.FkSpectra;
  colorMap: ColorTypes.ColorMapName;
  displayedSignalDetection: SignalDetectionTypes.SignalDetection;
}

/**
 * FkRendering Component
 */
export function FkRendering({
  featurePredictionsForDisplayedSignalDetection,
  selectedFkUnit,
  setSelectedFkUnit,
  fkRenderingWidth,
  currentMovieSpectrumIndex,
  displayedFk,
  colorMap,
  displayedSignalDetection
}: FkRenderingProps) {
  /** Reference to the canvas to draw the fk. */
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  /** Reference to the y-axis div container. */
  const yAxisContainerRef = React.useRef<HTMLDivElement | null>(null);

  /** Reference to the x-axis div container. */
  const xAxisContainerRef = React.useRef<HTMLDivElement | null>(null);

  /** The current fk represented as an ImageBitmap. */
  const [currentImage, setCurrentImage] = React.useState<ImageBitmap | undefined>(undefined);
  const [minFkValue, setMinFkValue] = React.useState<number>(0);
  const [maxFkValue, setMaxFkValue] = React.useState<number>(1);
  const [currentFkDisplayData, setCurrentFkDisplayData] = React.useState<number[][]>([]);

  const stations = useAllStations();
  const processingAnalystConfig: ConfigurationTypes.ProcessingAnalystConfiguration =
    useProcessingAnalystConfiguration();
  const getFkMeasuredValues = useGetFkMeasuredValues();
  const setFkMeasuredValues = useSetFkMeasuredValues();
  const constantVelocityRings: number[] = getConstantVelocityRingsForStationType(
    stations,
    displayedSignalDetection,
    processingAnalystConfig
  );

  const analystMeasuredValues = React.useMemo<FkTypes.AzimuthSlownessValues>(
    () => getFkMeasuredValues(displayedSignalDetection),
    [displayedSignalDetection, getFkMeasuredValues]
  );

  /**
   * Draws the components for fk rendering
   *
   * @param predictedPoint
   * @param newSelectedPoint
   */
  const drawAllComponents = React.useCallback(
    (predictedPoint: FkTypes.AzimuthSlowness | undefined, newSelectedPoint: Point | undefined) => {
      if (!canvasRef.current || !currentImage) return;
      fkUtil.drawImage(canvasRef.current, currentImage);

      fkUtil.drawImageOverlay(
        canvasRef.current,
        displayedFk,
        predictedPoint,
        currentMovieSpectrumIndex,
        constantVelocityRings,
        newSelectedPoint,
        false
      );
      if (xAxisContainerRef.current && yAxisContainerRef.current) {
        // Draw the x and y axis
        fkUtil.createXAxis(displayedFk, xAxisContainerRef.current);
        fkUtil.createYAxis(displayedFk, yAxisContainerRef.current);
      }
    },
    [constantVelocityRings, currentImage, currentMovieSpectrumIndex, displayedFk]
  );

  /**
   * When primary fk is clicked, will draw black circle
   */
  const onPrimaryFkClick = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!displayedFk) return;

    const canvasBoundingRect = e.currentTarget.getBoundingClientRect();
    const x: number = e.clientX - canvasBoundingRect.left;
    const y: number = e.clientY - canvasBoundingRect.top;

    const [min, max] = fkUtil.computeMinMaxFkValues(currentFkDisplayData);
    setCurrentImage(await fkUtil.createFkImageBitmap(currentFkDisplayData, min, max, colorMap));

    // Converting x y point from graphics space to coordinate space
    const scaledXY = fkUtil.convertGraphicsXYtoCoordinate(
      x,
      y,
      displayedFk,
      canvasBoundingRect.width,
      canvasBoundingRect.height
    );

    const measuredValues: FkTypes.AzimuthSlownessValues = fkUtil.getMeasuredValueFromCartesian(
      +scaledXY.x,
      scaledXY.y
    );
    setFkMeasuredValues(displayedSignalDetection, measuredValues);
  };

  /**
   * Subsequent renders of FK
   *
   */
  //! useEffect updates local state
  React.useEffect(() => {
    if (!displayedFk || !canvasRef.current) return;

    const predictedPoint = fkUtil.getPredictedPoint(featurePredictionsForDisplayedSignalDetection);
    const newFkDisplayData = fkUtil.getFkHeatmapArrayFromFkSpectra(
      displayedFk.samples[currentMovieSpectrumIndex],
      selectedFkUnit
    );

    // async wrapper function for using inside useEffect
    async function asyncCreateFkImageBitmap(min, max) {
      setCurrentImage(await fkUtil.createFkImageBitmap(newFkDisplayData, min, max, colorMap));
    }

    if (!isEqual(currentFkDisplayData, newFkDisplayData)) {
      const [min, max] = fkUtil.computeMinMaxFkValues(newFkDisplayData);

      asyncCreateFkImageBitmap(min, max).catch(console.error);

      setMaxFkValue(max);
      setMinFkValue(min);
      setCurrentFkDisplayData(newFkDisplayData);
    }
    const measuredValuePoint: Point | undefined = analystMeasuredValues
      ? fkUtil.getCartesianFromMeasuredValue(
          displayedFk,
          analystMeasuredValues.azimuth,
          analystMeasuredValues.slowness,
          canvasRef.current.height
        )
      : undefined;
    drawAllComponents(predictedPoint, measuredValuePoint);

    // !drawAllComponents is removed due to causing infinite renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentFkDisplayData,
    featurePredictionsForDisplayedSignalDetection,
    colorMap,
    currentMovieSpectrumIndex,
    displayedFk,
    selectedFkUnit,
    displayedSignalDetection.id,
    analystMeasuredValues
  ]);

  return (
    <div
      className="fk"
      style={{
        width: `${fkRenderingWidth + FkTypes.Util.SIZE_OF_FK_RENDERING_AXIS_PX}px`
      }}
    >
      <div className="fk-rendering">
        <div className="fk-rendering__y-axis-label-container">
          <div className="fk-rendering__y-axis-label">Slowness Sy N-S (s/°)</div>
        </div>
        <div
          ref={yAxisContainerRef}
          className="fk-rendering__y-axis"
          style={{
            height: `${
              fkRenderingWidth +
              FkTypes.Util.FK_Y_AXIS_HEIGHT_OFFSET +
              FkTypes.Util.FK_RENDERING_HEIGHT_OFFSET
            }px`
          }}
        />
        <canvas
          className="fk-rendering__canvas"
          data-cy="primary-fk-rendering"
          width={fkRenderingWidth}
          height={fkRenderingWidth}
          ref={canvasRef}
          onClick={onPrimaryFkClick}
        />

        <div
          className="fk-rendering__x-axis"
          style={{
            width: `${fkRenderingWidth + FkTypes.Util.FK_X_AXIS_WIDTH_OFFSET}+px`
          }}
          ref={xAxisContainerRef}
        />
        <div className="fk-rendering__slowness">
          <div>Slowness Sx E-W (s/°)</div>
        </div>
        <div className="fk-rendering__legend">
          <Popover
            interactionKind={PopoverInteractionKind.CLICK}
            position={Position.BOTTOM}
            content={
              <div className="fk-rendering__slowness-label">
                <FkLegend />
                <FkColorScale minSlow={minFkValue} maxSlow={maxFkValue} fkUnits={selectedFkUnit} />
              </div>
            }
          >
            <div className="fk-color-scale__button">LEGEND</div>
          </Popover>
        </div>
        <FkRenderingFooter
          selectedFkUnit={selectedFkUnit}
          setSelectedFkUnit={setSelectedFkUnit}
          preFilter={displayedFk.configuration.fkSpectraParameters.preFilter}
          fkFrequencyRange={displayedFk.configuration.fkSpectraParameters.fkFrequencyRange}
        />
      </div>
    </div>
  );
}
