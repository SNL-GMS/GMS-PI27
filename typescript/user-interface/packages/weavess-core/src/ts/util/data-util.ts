import flatMap from 'lodash/flatMap';

import { MILLISECONDS_IN_SECOND } from '../constants';
import type { DataByTime } from '../types';

/**
 * Given the values, determine if there is a step value when a value goes up or down;
 * There is not a step value then add the step value to ensure `steps` when the
 * values increase or decrease.
 *
 * @param values the values provided to chart
 */
export const createStepPoints = (values: number[][]): DataByTime => ({
  values: flatMap(
    values.map((p, indx) => {
      let points = [
        {
          timeSecs: p[0] / MILLISECONDS_IN_SECOND,
          value: p[1]
        }
      ];
      if (indx > 0) {
        if (values[indx - 1][1] !== p[1]) {
          points = [
            {
              timeSecs: values[indx - 1][0] / MILLISECONDS_IN_SECOND,
              value: p[1]
            },
            ...points
          ];
        }
      }
      return points;
    })
  )
});

/**
 * Creates a linear scaling function
 *
 * @param domain the domain from which to scale (input)
 * @param range the range to which to scale (output)
 * @returns a scaling function that maps the domain to the range
 */
export const scaleLinear =
  (domain: [number, number], range: [number, number]) => (numSecs: number) =>
    ((numSecs - domain[0]) * (range[1] - range[0])) / (domain[1] - domain[0]) + range[0];
