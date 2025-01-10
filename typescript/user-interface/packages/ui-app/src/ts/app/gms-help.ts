/* eslint-disable no-param-reassign */
import { IS_NODE_ENV_PRODUCTION } from '@gms/common-util';
import { uiStateHelp } from '@gms/ui-state';
import { ServiceWorkerMessages } from '@gms/ui-workers';

const codeStyle = 'font-family: monospace; font-size: 1.2em;';
const textStyle = `font-family: inherit; font-size: 1.2em;`;
const h1Style = `font-family: inherit; font-size: 2em;`;
const h2Style = `font-family: inherit; font-size: 1.5em;`;

function toggleWorkboxLogs() {
  navigator?.serviceWorker?.controller?.postMessage(ServiceWorkerMessages.toggleWorkboxLogs);
}

export function attachGmsHelp() {
  if (!IS_NODE_ENV_PRODUCTION) {
    (window as any).gmsHelp = (window as any).gmsHelp || {};
    (function setGmsHelp(gmsHelp) {
      gmsHelp.please = () => {
        console.log(
          `
%cgmsHelp
%c----------


  The gmsHelp object is available in development mode (only).
  It is an object containing various help functions. 

  %cHow do I use it?%c
  - - - - - - - -
  Just call any of the functions defined within it:

  %c  gmsHelp.please() %c
  

  %cHelp functions%c
  - - - - - - - -

  please ()
    Print help info. "commands", "help", and "ls" are all aliased to this help function.

  toggleWorkboxLogs ()
    Toggle the service worker (workbox) logs. This takes effect immediately, and affects the state of the service worker. 
  ${uiStateHelp.please()}

  `,
          h1Style,
          textStyle,
          h2Style,
          textStyle,
          codeStyle,
          textStyle,
          h2Style,
          textStyle
        );
      };

      // assign ui-app functions
      gmsHelp.toggleWorkboxLogs = toggleWorkboxLogs;

      // aliases
      gmsHelp.help = gmsHelp.please;
      gmsHelp.ls = gmsHelp.please;
      gmsHelp.commands = gmsHelp.please;
      gmsHelp.toggleServiceWorkerLogs = gmsHelp.toggleWorkboxLogs;
      gmsHelp.toggleSwLogs = gmsHelp.toggleWorkboxLogs;

      // assign help functions from other packages
      Object.assign(gmsHelp, uiStateHelp.getHelpFunctions() ?? {});

      // log the help
      gmsHelp.please();
    })((window as any).gmsHelp);
  }
}
