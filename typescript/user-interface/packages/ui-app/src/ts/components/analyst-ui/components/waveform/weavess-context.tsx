import type { WeavessInstance } from '@gms/weavess-core/lib/types';
import * as React from 'react';

export interface WeavessContextData {
  /** Reference to Weavess */
  weavessRef: WeavessInstance | undefined;
  setWeavessRef: ((weavess: WeavessInstance) => void) | undefined;
}

const initialContextData: WeavessContextData = {
  weavessRef: undefined,
  setWeavessRef: undefined
};

export const WeavessContext: React.Context<WeavessContextData> =
  React.createContext<WeavessContextData>(initialContextData);
