/* eslint-disable react/destructuring-assignment */
import { classList, getDataAttributesFromProps } from '@gms/ui-util';
import * as React from 'react';

import type { ScrollBoxProps } from './types';

export function ScrollBox(props: React.PropsWithChildren<ScrollBoxProps>) {
  const dataAttributes = getDataAttributesFromProps(props);
  return (
    <div
      className={classList(
        {
          'scroll-box': true,
          'scroll-box--x': props.orientation === 'x',
          'scroll-box--y': props.orientation === 'y'
        },
        props.className
      )}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...dataAttributes}
    >
      {props.children}
    </div>
  );
}
