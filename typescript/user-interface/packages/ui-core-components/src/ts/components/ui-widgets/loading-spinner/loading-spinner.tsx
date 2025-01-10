/* eslint-disable react/destructuring-assignment */
import { Intent, Spinner, SpinnerSize } from '@blueprintjs/core';
import React from 'react';

import type { LoadingSpinnerProps } from './types';
// A loading spinner widget to be used in toolbars the world over
export function LoadingSpinner(props: LoadingSpinnerProps) {
  const spinnerValue = props.itemsLoaded ? props.itemsLoaded / props.itemsToLoad : undefined;
  const spinnerLoading = props.hideTheWordLoading ? '' : 'Loading';
  const spinnerCount = props.hideOutstandingCount ? props.itemsToLoad : '';
  const onlyShowSpinnerText = props.onlyShowSpinner ? null : (
    <span>
      {spinnerLoading}
      {spinnerCount}
      ...
    </span>
  );
  const loading =
    props.itemsToLoad > 0 ? (
      <span>
        <Spinner intent={Intent.PRIMARY} size={SpinnerSize.SMALL} value={spinnerValue} />
        {onlyShowSpinnerText}
      </span>
    ) : null;
  return (
    <div
      className="loading-spinner__container"
      style={{
        minWidth: `${props.widthPx}px`
      }}
    >
      {loading}
    </div>
  );
}
