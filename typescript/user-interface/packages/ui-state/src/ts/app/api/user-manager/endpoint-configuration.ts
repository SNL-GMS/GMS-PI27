import { Endpoints } from '@gms/common-model';
import { UI_URL } from '@gms/common-util';
import type { RequestConfig, ServiceDefinition } from '@gms/ui-workers';

import { createServiceDefinition } from '../create-service-definition';
import { prioritizeRequests } from '../request-priority';

/**
 * User manager request config definition
 */
export interface UserManagerRequestConfig extends RequestConfig {
  readonly user: {
    readonly baseUrl: string;
    readonly services: {
      readonly getUserProfile: ServiceDefinition;
      readonly setUserProfile: ServiceDefinition;
    };
  };
}

const baseUrl = `${UI_URL}${Endpoints.UserManagerServiceUrls.baseUrl}`;

/**
 * The user manager request config for all services.
 */
export const config: UserManagerRequestConfig = {
  user: {
    baseUrl,
    services: prioritizeRequests({
      getUserProfile: createServiceDefinition({
        baseUrl,
        url: Endpoints.UserManagerServiceUrls.getUserProfile.url,
        friendlyName: Endpoints.UserManagerServiceUrls.getUserProfile.friendlyName,
        accept: 'application/json',
        contentType: 'text/plain',
        data: `"defaultUser"`
      }),
      setUserProfile: createServiceDefinition({
        baseUrl,
        url: Endpoints.UserManagerServiceUrls.setUserProfile.url,
        friendlyName: Endpoints.UserManagerServiceUrls.setUserProfile.friendlyName,
        accept: 'application/json'
      })
    })
  }
};

export type UserManagerServices = keyof typeof config.user.services;
