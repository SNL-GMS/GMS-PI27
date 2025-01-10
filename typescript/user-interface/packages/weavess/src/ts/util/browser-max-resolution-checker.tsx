import React from 'react';

/**
 * The type of the props for the {@link BrowserMaxResolutionChecker} component
 */
export interface BrowserMaxResolutionCheckerProps {
  maxSizePx: number;
  setMaxElementResolution: (sigFigs: number) => void;
}

const areTheSameSize = (
  element1: React.MutableRefObject<HTMLElement | null>,
  element2: React.MutableRefObject<HTMLElement | null>
) => {
  const ele1 = element1.current;
  const ele2 = element2.current;
  if (!ele1 || !ele2) {
    return false;
  }
  return window.getComputedStyle(ele1).width === window.getComputedStyle(ele2).width;
};

/**
 * Finds the point at which the size does not change when adding 1 to an element
 */
export const BrowserMaxResolutionChecker = React.memo(function BrowserSigFigChecker({
  maxSizePx,
  setMaxElementResolution
}: BrowserMaxResolutionCheckerProps) {
  const smallerElement = React.useRef<HTMLElement | null>(null);
  const middleElement = React.useRef<HTMLElement | null>(null);
  const largerElement = React.useRef<HTMLElement | null>(null);
  const [startPx, setStartPx] = React.useState(0);
  const [endPx, setEndPx] = React.useState(Number.MAX_SAFE_INTEGER);
  const midpointPx = startPx + Math.floor((endPx - startPx) / 2);
  //! useEffect updates local state
  React.useEffect(() => {
    if (maxSizePx > 0 && maxSizePx < Number.MAX_SAFE_INTEGER) {
      if (midpointPx === startPx) {
        setMaxElementResolution(midpointPx);
      } else if (startPx === 0 && endPx === Number.MAX_SAFE_INTEGER) {
        setEndPx(maxSizePx);
      } else if (
        areTheSameSize(smallerElement, middleElement) ||
        areTheSameSize(largerElement, middleElement)
      ) {
        // we are so large that we cannot change the width by 1px, meaning we are past the number of sig figs
        setEndPx(midpointPx);
      } else {
        // we are smaller than the point at which we cannot resize it, so we need to try something larger
        setStartPx(midpointPx);
      }
    }
  }, [endPx, maxSizePx, midpointPx, setMaxElementResolution, startPx]);

  return (
    <aside className="browser-sig-fig-checker">
      <div
        className="browser-sig-fig-checker--small"
        ref={ref => {
          if (ref) {
            smallerElement.current = ref;
          }
        }}
        style={{
          width: `${midpointPx - 1}px`,
          height: '1px',
          position: 'absolute',
          pointerEvents: 'none',
          background: 'none'
        }}
      />
      <div
        className="browser-sig-fig-checker--medium"
        ref={ref => {
          if (ref) {
            middleElement.current = ref;
          }
        }}
        style={{
          width: `${midpointPx}px`,
          height: '1px',
          position: 'absolute',
          pointerEvents: 'none',
          background: 'none'
        }}
      />
      <div
        className="browser-sig-fig-checker--large"
        ref={ref => {
          if (ref) {
            largerElement.current = ref;
          }
        }}
        style={{
          width: `${midpointPx + 1}px`,
          height: '1px',
          position: 'absolute',
          pointerEvents: 'none',
          background: 'none'
        }}
      />
    </aside>
  );
});
