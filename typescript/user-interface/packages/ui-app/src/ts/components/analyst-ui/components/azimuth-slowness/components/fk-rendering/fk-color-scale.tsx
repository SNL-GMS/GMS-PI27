import { FkTypes } from '@gms/common-model';
import { useColorMap } from '@gms/ui-state';
import * as d3 from 'd3';
import React, { useEffect } from 'react';

import { gmsColors } from '~scss-config/color-preferences';

import { createColorScaleImageBitmap } from '../fk-util';

/**
 * FkColorScale Props
 */
export interface FkColorScaleProps {
  minSlow: number;
  maxSlow: number;
  fkUnits: FkTypes.FkUnits;
}

/**
 * The color scale size.
 */
export interface ColorScaleSize {
  width: number;
  height: number;
}

/**
 * FkColorScale Functional Component
 */
export function FkColorScale(props: FkColorScaleProps) {
  const padding = 25;

  /** The color scale size. */
  const colorScaleSize: ColorScaleSize = { width: 80, height: 240 };

  /** Reference to the canvas to draw the color scale. */
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  /** The x-axis div container. */
  const xAxisContainerRef = React.useRef<HTMLDivElement | null>(null);

  /** Get user preferred color map */
  const [colorMap] = useColorMap();

  const canvasWidth = 202;
  /**
   * sets parameters and updates bitmap
   */

  const { fkUnits, minSlow, maxSlow } = props;

  useEffect(() => {
    /**
     * Create and draw the x-axis.
     */
    function createXAxis() {
      if (!xAxisContainerRef.current) return;
      xAxisContainerRef.current.innerHTML = '';

      const svg = d3
        .select(xAxisContainerRef.current)
        .append('svg')
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        .attr('width', 252)
        .attr('height', xAxisContainerRef.current.clientHeight)
        .style('fill', gmsColors.gmsMain);

      const svgAxis = svg.append('g').attr('class', 'fk-axis');
      const x =
        fkUnits === FkTypes.FkUnits.FSTAT
          ? d3
              .scaleLinear()
              .domain([minSlow, maxSlow])
              .range([padding, xAxisContainerRef.current.clientWidth - padding])
          : d3
              .scaleLog()
              .domain([minSlow, maxSlow])
              .range([padding, xAxisContainerRef.current.clientWidth - padding]);
      const range = maxSlow - minSlow;
      const tickSize = 7;
      const rangeOfScaleInRealPx = xAxisContainerRef.current.clientWidth - padding - padding;
      const logarithmicHalfOfScale = rangeOfScaleInRealPx / 2;
      const logarithmicQuarterOfScale = rangeOfScaleInRealPx / 4;
      const logarithmicThreeQuarterOfScale = (rangeOfScaleInRealPx * 3) / 4;

      const xAxis =
        fkUnits === FkTypes.FkUnits.FSTAT
          ? d3
              .axisBottom(x)
              .tickSize(tickSize)
              .tickValues([
                minSlow,
                minSlow + range / 4,
                minSlow + range / 2,
                minSlow + (range * 3) / 4,
                maxSlow
              ])
              .tickFormat(d3.format('.2'))
          : d3
              .axisBottom(x)
              .tickSize(tickSize)
              .tickValues([
                x.invert(padding),
                x.invert(padding + logarithmicQuarterOfScale),
                x.invert(padding + logarithmicHalfOfScale),
                x.invert(padding + logarithmicThreeQuarterOfScale),
                x.invert(xAxisContainerRef.current.clientWidth - padding)
              ])
              .tickFormat(d3.format('.2'));
      svgAxis.call(xAxis);
    }

    /**
     * Draws the image to the context
     */
    function draw(ctx: CanvasRenderingContext2D, currentImage: ImageBitmap) {
      if (canvasRef.current) {
        const height = 50;
        canvasRef.current.width = canvasWidth;
        canvasRef.current.height = height;
        ctx.drawImage(currentImage, 0, 0, canvasRef.current.width, height);

        createXAxis();
      }
    }

    async function updateBitmap() {
      /** Canvas rendering context used to draw the color scale. */
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) {
        throw new Error('Unable to get 2D CanvasRenderingObject');
      }
      ctx.imageSmoothingEnabled = true;

      /** The current color scale represented as an ImageBitmap. */
      const currentImage: ImageBitmap = await createColorScaleImageBitmap(
        colorScaleSize.width,
        colorScaleSize.height,
        colorMap
      );
      draw(ctx, currentImage);
    }
    if (xAxisContainerRef.current) {
      updateBitmap().catch(console.error);
    }
  }, [colorMap, colorScaleSize.height, colorScaleSize.width, fkUnits, maxSlow, minSlow]);

  return (
    <div className="fk-color-scale">
      <canvas
        className="fk-color-scale__canvas"
        ref={ref => {
          canvasRef.current = ref;
        }}
      />
      <div
        className="fk-color-scale__xaxis"
        ref={ref => {
          xAxisContainerRef.current = ref;
        }}
      />
      <div className="fk-color-scale__units">
        {fkUnits === FkTypes.FkUnits.FSTAT ? 'Fstat' : 'Power (dB)'}
      </div>
    </div>
  );
}
