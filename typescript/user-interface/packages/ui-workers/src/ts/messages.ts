import { CancelTokens } from './request-cancel-tokens';

export const clientConnectedMessage = 'CLIENT_CONNECTED' as const;
export const toggleWorkboxLogs = 'TOGGLE_WORKBOX_LOGS' as const;
export const listenersActiveMessage = 'LISTENERS_ACTIVE' as const;
export const skipWaitingMessage = 'SKIP_WAITING' as const;
export const requestInitiated = 'REQUEST_INITIATED' as const;
export const requestCompleted = 'REQUEST_COMPLETED' as const;
export const cancelOnIntervalClose = CancelTokens.CANCEL_ON_INTERVAL_CLOSE as const;
export const cancelOnDemand = CancelTokens.CANCEL_ON_DEMAND as const;

export type ServiceWorkerMessage =
  | typeof clientConnectedMessage
  | typeof listenersActiveMessage
  | typeof skipWaitingMessage
  | typeof cancelOnDemand
  | typeof cancelOnIntervalClose;
