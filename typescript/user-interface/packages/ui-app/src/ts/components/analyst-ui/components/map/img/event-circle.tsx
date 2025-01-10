import React from 'react';
import ReactDOMServer from 'react-dom/server';

import { monoFontStyleNoSize } from '~common-ui/components/map/constants';

/**
 * Function to generate a string for Cesium to display a billboard for event circles using a svg
 *
 * @param eventColor
 * @param strokeOpacity
 * @param fillOpacity
 * @param geoOverlappingEvents
 * @returns cesium friendly encoded svg
 */
export function buildEventCircle(
  eventColor = '#ffffff',
  strokeOpacity = 1,
  fillOpacity = 1,
  geoOverlappingEvents = undefined
): string {
  return `data:image/svg+xml,${encodeURIComponent(
    ReactDOMServer.renderToStaticMarkup(
      <svg
        id="event_circle"
        data-name="Event Circle"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 124 124"
        height="124"
        width="124"
      >
        <circle
          cx="62.71"
          cy="62.25"
          r="57.07"
          style={{
            fill: eventColor,
            stroke: 'black',
            strokeWidth: 8,
            strokeOpacity,
            fillOpacity
          }}
        />
        <text
          x="62.71"
          y="85"
          fontFamily={monoFontStyleNoSize}
          fontWeight="bold"
          fontSize="70"
          textAnchor="middle"
          fill="black"
        >
          {geoOverlappingEvents}
        </text>
      </svg>
    )
  )}`;
}
