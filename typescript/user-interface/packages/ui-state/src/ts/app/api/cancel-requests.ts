import { ServiceWorkerMessages } from '@gms/ui-workers';

/**
 * Posts a message to the service worker to cancel all requests marked to cancel on interval close.
 */
export const cancelRequestsOnIntervalClose = () => {
  if (navigator?.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage(ServiceWorkerMessages.cancelOnIntervalClose);
  }
};
