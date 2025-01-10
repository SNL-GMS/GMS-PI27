/* eslint-disable react/destructuring-assignment */
import { classList } from '@gms/ui-util';
import * as React from 'react';

import type { ResizeContainerProps } from '.';
import type { ResizeData } from './resize-context';
import { ResizeContext } from './resize-context';

const defaultHeightPx = 360;
export function ResizeContainer(props: React.PropsWithChildren<ResizeContainerProps>) {
  const [height, setHeight] = React.useState(defaultHeightPx);
  const [isResizing, setIsResizing] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>();

  const resizeContextData: ResizeData = React.useMemo(
    () => ({
      isResizing,
      height,
      containerHeight: containerRef?.current?.clientHeight,
      setIsResizing,
      setHeight
    }),
    [height, isResizing]
  );

  return (
    <div
      className={classList(
        {
          'resize-container': true,
          'resize-container--resizing': isResizing
        },
        props.className
      )}
      data-cy={props.dataCy}
      ref={ref => {
        if (ref) {
          containerRef.current = ref;
        }
      }}
    >
      <ResizeContext.Provider value={resizeContextData}>{props.children}</ResizeContext.Provider>
    </div>
  );
}
