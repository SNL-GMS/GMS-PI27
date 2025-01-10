import { Logger } from '@gms/common-util';
import { nonIdealStateWithNoSpinner, nonIdealStateWithSpinner } from '@gms/ui-core-components';
import { analystActions, useAppDispatch } from '@gms/ui-state';
import type { RequestTrackerMessage } from '@gms/ui-workers';
import { ServiceWorkerMessages } from '@gms/ui-workers';
import { registerServiceWorker } from '@gms/ui-workers/lib/register-service-worker';
import throttle from 'lodash/throttle';
import React from 'react';

import { ServiceWorkerAlert } from './service-worker-alert';

const logger = Logger.create('GMS_SW_LOG', process.env.GMS_SW_LOG);

const LOADING_BAR_UPDATE_THROTTLE_MS = 250;

/**
 * This creates a number of variables used in the management of the service worker
 * 1. isAlertOpen, a boolean which controls the state of the alert.
 * 2. refreshCallback, a referentially stable function that
 * is provided to the registerServiceWorker function, which triggers the alert popup in case the service worker
 * registration detects that a new service worker needs to be installed
 * 3. skipWaitingFunctionRef, which is a ref that will contain the returned callback that should refresh the page.
 * In this case, we use a ref so that we don't capture an old value.
 * 4. toggleAlert, which is a referentially stable function that toggles whether the alert is open or not.
 */
const useAlert = () => {
  const skipWaitingFunctionRef = React.useRef<() => void>();
  const [isAlertOpen, setIsAlertOpen] = React.useState<boolean>(false);
  const toggleAlert = React.useCallback(() => setIsAlertOpen(isOpen => !isOpen), []);
  const refreshCallback = React.useCallback(
    (cb: () => void) => {
      skipWaitingFunctionRef.current = cb;
      toggleAlert();
    },
    [toggleAlert]
  );
  return { isAlertOpen, refreshCallback, skipWaitingFunctionRef, toggleAlert };
};

/**
 * Creates throttled update functions that store and eventually dispatch redux changes with the collected request
 * tracking messages.
 *
 * @returns referentially stable functions:
 * `addPendingRequest` adds a request to the queue, and schedules a throttled call to update the state. This is both a leading and trailing throttled call.
 * `addCompletedRequest` adds a request to the queue, and schedules a throttled call to update the state. This is just a trailing throttled call.
 */
const useRequestTracking = () => {
  const dispatch = useAppDispatch();
  const pendingRequestsRef = React.useRef<RequestTrackerMessage[]>([]);
  const completedRequestsRef = React.useRef<RequestTrackerMessage[]>([]);
  // dependencies should be kept exhaustive, however, eslint can't see through the throttle
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const dispatchPendingRequests = React.useCallback(
    throttle(
      () => {
        dispatch(analystActions.trackPendingRequests(pendingRequestsRef.current));
        pendingRequestsRef.current = [];
      },
      LOADING_BAR_UPDATE_THROTTLE_MS,
      { leading: true, trailing: true }
    ),
    [dispatch]
  );
  // dependencies should be kept exhaustive, however, eslint can't see through the throttle
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const dispatchCompletedRequests = React.useCallback(
    throttle(() => {
      dispatch(analystActions.trackCompletedRequests(completedRequestsRef.current));
      completedRequestsRef.current = [];
    }, LOADING_BAR_UPDATE_THROTTLE_MS),
    [dispatch]
  );
  const addPendingRequest = React.useCallback(
    (req: RequestTrackerMessage) => {
      pendingRequestsRef.current.push(req);
      dispatchPendingRequests();
    },
    [dispatchPendingRequests]
  );
  const addCompletedRequest = React.useCallback(
    (req: RequestTrackerMessage) => {
      completedRequestsRef.current.push(req);
      dispatchCompletedRequests();
    },
    [dispatchCompletedRequests]
  );
  return {
    addPendingRequest,
    addCompletedRequest
  };
};

/**
 * Calls to register the service worker, and listens for a reply, indicating that it has started correctly.
 *
 * @param refreshCallback the callback function that should be called if we need to ask the user if we can refresh
 * @param setIsServiceWorkerRegistered the setter to disable the service worker registering non ideal state
 * @param setError to set whether an error has occurred
 */
const useServiceWorker = (
  refreshCallback: (cb: () => void) => void,
  setIsServiceWorkerRegistered: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<MessageEvent<string> | undefined>>
) => {
  const { addPendingRequest, addCompletedRequest } = useRequestTracking();
  //! useEffect updates redux state
  React.useEffect(() => {
    async function startTheEngines() {
      navigator.serviceWorker.addEventListener('message', message => {
        logger.debug('[main] received message from service worker', message);
        if (message.data === ServiceWorkerMessages.listenersActiveMessage) {
          setIsServiceWorkerRegistered(true);
        } else if (message.data === ServiceWorkerMessages.clientConnectedMessage) {
          // no-op
        } else if (message.data?.message === ServiceWorkerMessages.requestInitiated) {
          addPendingRequest(message.data);
        } else if (message.data?.message === ServiceWorkerMessages.requestCompleted) {
          addCompletedRequest(message.data);
        } else {
          logger.error(
            'Unknown service worker message type received. See the following error for message details.'
          );
          setError(message);
          throw new Error(message.data);
        }
      });
      await registerServiceWorker(refreshCallback);
      logger.info('[main] registered service worker');
      await navigator.serviceWorker.ready;
      logger.info('[main] service worker ready');
      if (navigator.serviceWorker.controller) {
        logger.info('[main] postMessage', ServiceWorkerMessages.clientConnectedMessage);
        navigator.serviceWorker.controller.postMessage(
          ServiceWorkerMessages.clientConnectedMessage
        );
      }
    }
    if (process.env.GMS_DISABLE_SW !== 'true') {
      startTheEngines().catch(e => logger.error(e));
    }
  }, [
    addCompletedRequest,
    addPendingRequest,
    refreshCallback,
    setError,
    setIsServiceWorkerRegistered
  ]);
};

function MaybeServiceWorkerNonIdealState({
  children,
  isError,
  isServiceWorkerRegistered
}: React.PropsWithChildren<{
  isError: MessageEvent<string> | undefined;
  isServiceWorkerRegistered: boolean;
}>) {
  if (process.env.GMS_DISABLE_SW !== 'true' && isError) {
    return nonIdealStateWithNoSpinner('Error Registering Service Worker', isError.data);
  }
  if (process.env.GMS_DISABLE_SW !== 'true' && !isServiceWorkerRegistered) {
    return nonIdealStateWithSpinner('Registering Service Worker', 'Please wait');
  }
  return children;
}

type ServiceWorkerControllerProps = React.PropsWithChildren<unknown>;

/**
 * Registers the service worker, and if it is not registered, returns a non ideal state until
 * we get a message from the service worker. If it has a service worker that sends the proper
 * message, this renders its children.
 */
export function ServiceWorkerController({ children }: ServiceWorkerControllerProps) {
  const [isError, setError] = React.useState<MessageEvent<string> | undefined>(undefined);
  const [isServiceWorkerRegistered, setIsServiceWorkerRegistered] = React.useState(false);
  const { isAlertOpen, refreshCallback, skipWaitingFunctionRef, toggleAlert } = useAlert();

  useServiceWorker(refreshCallback, setIsServiceWorkerRegistered, setError);

  return (
    <>
      {!process.env.GMS_DISABLE_SERVICE_WORKER_ALERT && (
        <ServiceWorkerAlert
          isAlertOpen={isAlertOpen}
          skipWaitingFunctionRef={skipWaitingFunctionRef}
          toggleAlert={toggleAlert}
        />
      )}
      <MaybeServiceWorkerNonIdealState
        isError={isError}
        isServiceWorkerRegistered={isServiceWorkerRegistered}
      >
        {children}
      </MaybeServiceWorkerNonIdealState>
    </>
  );
}
