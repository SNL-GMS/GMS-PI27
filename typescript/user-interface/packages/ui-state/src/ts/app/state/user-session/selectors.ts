import type { AppState } from '../../store';

/**
 * Select the username out of the authentication state.
 *
 * @example const username = useAppSelector(selectUsername)
 */
export const selectUsername = (state: AppState) =>
  state.app.userSession.authenticationStatus.userName;
