import React, { useEffect } from 'react';

import { gmsColors } from '~scss-config/color-preferences';

import * as fkUtil from '../fk-util';

/**
 * Class that renders the FK Display legend which describes peak, predicted, and analyst
 */
export function FkLegend() {
  /** Reference to the canvas to draw different dots for the legend */
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  /**
   * Invoked when the component mounted.
   */
  useEffect(() => {
    /**
     * Draws the fk display legend
     */
    function drawFkLegend(ctx: CanvasRenderingContext2D) {
      if (!canvasRef.current) return;
      const xForDots = 6;
      const yForAnalystDot = 12;
      const yForPredictedDot = 28;
      const yForCrossHairDot = 44;
      const canvasHeight = 80;
      const canvasWidth = 20;

      canvasRef.current.width = canvasWidth;
      canvasRef.current.height = canvasHeight;

      fkUtil.drawCircle(
        ctx,
        xForDots,
        yForAnalystDot,
        [fkUtil.markerRadiusSize],
        gmsColors.gmsRecessed,
        true
      );
      fkUtil.drawCircle(
        ctx,
        xForDots,
        yForPredictedDot,
        [fkUtil.markerRadiusSize],
        gmsColors.gmsMain,
        true
      );
      fkUtil.drawCircle(
        ctx,
        xForDots,
        yForCrossHairDot,
        [fkUtil.markerRadiusSize],
        gmsColors.gmsMain,
        true
      );
      fkUtil.drawCrosshairDot(
        ctx,
        xForDots,
        yForCrossHairDot,
        gmsColors.gmsRecessed,
        fkUtil.markerRadiusSize
      );
    }

    /** Canvas rendering context used to draw different dots for the legend */
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) {
      throw new Error('Unable to get 2D CanvasRenderingObject');
    }
    drawFkLegend(ctx);
  }, [canvasRef]);

  /**
   * Renders the component.
   */
  return (
    <div className="fk-legend">
      <canvas
        className="fk-legend__canvas"
        ref={ref => {
          canvasRef.current = ref;
        }}
      />
      <div className="fk-legend-labels">
        <div className="fk-legend-labels__analyst">Measured</div>
        <div className="fk-legend-labels__peak">Peak</div>
        <div className="fk-legend-labels__predicted">Predicted</div>
      </div>
    </div>
  );
}
