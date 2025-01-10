/* eslint-disable react/destructuring-assignment */
import { H4 } from '@blueprintjs/core';
import React from 'react';

import type { TitleBarProps } from './types';

export function TitleBar(props: React.PropsWithChildren<TitleBarProps>) {
  return (
    <div className={`top-bar ${props.className ? props.className : ''}`}>
      <H4 className="top-bar__title">{props.title}</H4>
      {props.children}
    </div>
  );
}
