import { Logger } from '@gms/common-util';

import { selectUsername } from '../state';
import { useAppSelector } from './react-redux-hooks';

const logger = Logger.create('GMS_LOG_USER_SESSION', process.env.GMS_LOG_USER_SESSION);

/**
 * gets the username out of redux. If not found, logs the warning: `Username not found`
 *
 * @returns the user's username
 */
export const useUsername = (): string => {
  const username = useAppSelector(selectUsername);
  if (!username) {
    logger.warn('Username not found');
  }
  return username;
};
