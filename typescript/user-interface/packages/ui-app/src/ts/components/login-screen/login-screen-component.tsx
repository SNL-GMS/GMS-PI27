import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { LoginScreenPanel } from './login-screen-panel';
import type { LoginScreenProps } from './types';

/**
 * Creates a functional login screen wrapper around the LoginScreenPanel component.
 * Builds the `from` object containing the path and search parameters
 */
export function LoginScreenComponent(props: LoginScreenProps) {
  const [searchParams] = useSearchParams();
  const { redirectUrl } = useParams();

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <LoginScreenPanel {...props} searchParams={searchParams} redirectPath={redirectUrl} />;
}
