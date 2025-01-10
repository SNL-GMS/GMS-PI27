import type { ServiceDefinition } from '@gms/ui-workers';

import { prioritizeRequests, RequestPriorities } from '../../../src/ts/app/api/request-priority';

describe('RequestPriority', () => {
  describe('prioritizeRequests', () => {
    it('logs a warning if it has no defined priority', () => {
      const requestsWithNoMatch: Record<string, ServiceDefinition> = {
        requestNameWithNoPrioritySet: {
          requestConfig: {
            method: 'get',
            url: 'test/endpoint',
            headers: {
              accept: 'application/json',
              'content-type': 'application/json'
            },
            proxy: false,
            timeout: 60000
          },
          friendlyName: 'Test Endpoint'
        }
      };
      const warnSpy = jest.spyOn(console, 'warn');
      prioritizeRequests(requestsWithNoMatch);
      expect(warnSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        `GMS_LOG_REQUEST_PRIORITY Request to ${requestsWithNoMatch.requestNameWithNoPrioritySet.requestConfig.url} does not have an explicit priority. It will be made with the default priority of 4.`
      );
    });
    it('returns the correct priority for a request that has a defined priority', () => {
      expect(
        prioritizeRequests({
          getSignalEnhancementConfiguration: {
            requestConfig: {
              method: 'get',
              url: 'foo/bar',
              headers: {
                accept: 'application/json',
                'content-type': 'application/json'
              },
              proxy: false,
              timeout: 60000
            },
            friendlyName: 'Foo Bar'
          }
        }).getSignalEnhancementConfiguration.requestConfig.priority
      ).toEqual(RequestPriorities.getSignalEnhancementConfiguration);
      expect(RequestPriorities.getSignalEnhancementConfiguration).toBeDefined();
    });
    it('returns the same object it was given, but with an added priority for a request that has a defined priority', () => {
      const matchingService: Record<string, ServiceDefinition> = {
        getSignalEnhancementConfiguration: {
          requestConfig: {
            method: 'get',
            url: 'foo/bar',
            headers: {
              accept: 'application/json',
              'content-type': 'application/json'
            },
            proxy: false,
            timeout: 60000
          },
          friendlyName: 'Foo Bar'
        }
      };
      expect(prioritizeRequests(matchingService)).toMatchObject(matchingService);
    });
  });
});
