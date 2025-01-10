import * as React from 'react';

export interface ResizeData {
  height: number;
  isResizing: boolean;
  containerHeight: number | undefined;
  setIsResizing(isIt: boolean): void;
  setHeight(height: number): void;
}

export const ResizeContext: React.Context<ResizeData> = React.createContext<ResizeData>({
  containerHeight: 0,
  height: 0,
  isResizing: false,
  setIsResizing: () => {
    throw new Error('Not Implemented');
  },
  setHeight: () => {
    throw new Error('Not Implemented');
  }
});
