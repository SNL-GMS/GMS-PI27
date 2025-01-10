import { IconNames } from '@blueprintjs/icons';
import type { AnalystWorkspaceTypes } from '@gms/ui-state';
import { getFriendlyNames } from '@gms/ui-state';
import memoizeOne from 'memoize-one';

const memoizedGetFriendlyNames = memoizeOne(getFriendlyNames);

/**
 * Get a human readable (friendly) name from the defined friendly names per request, if the url
 * provided matches any of the requests that have a friendly name defined.
 *
 * If no friendly name is found, returns the path from the URL.
 *
 * @param url A url to attempt to match to a friendly name
 * @returns a human readable friendly name, or url path
 */
export const getFriendlyNameFromRequest = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  const friendlyNames = memoizedGetFriendlyNames();
  if (friendlyNames[url]) return friendlyNames[url];
  const match = url?.match(/^https?:\/\/[A-Za-z0-9:.]*(\/.*\/?)$/);
  return match?.[1]; // index 1 is the matched substring
};

/**
 * String representing the error icon name
 */
export const ErrorIcon = IconNames.ISSUE;

/**
 * String representing the completed icon name
 */
export const CompleteIcon = IconNames.TICK;

/**
 * Returns the icon name for error or completed requests, or undefined.
 */
export function getIconName(
  requestStatus: AnalystWorkspaceTypes.RequestStatus | AnalystWorkspaceTypes.ClientActionStatus
) {
  if (requestStatus.error) {
    return ErrorIcon;
  }
  if (requestStatus.isComplete) {
    return CompleteIcon;
  }
  return undefined;
}
