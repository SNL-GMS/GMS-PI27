/* eslint-disable jest/expect-expect */
import {
  useGetUserProfileQuery,
  userManagerApiSlice,
  useSetUserProfileMutation
} from '../../../../src/ts/app/api/user-manager';
import { expectQueryHookToMakeAxiosRequest } from '../query-test-util';

describe('User Manager Profile', () => {
  it('provides', () => {
    expect(useGetUserProfileQuery).toBeDefined();
    expect(useSetUserProfileMutation).toBeDefined();
    expect(userManagerApiSlice).toBeDefined();
  });

  it('hook queries for user profile', async () => {
    await expectQueryHookToMakeAxiosRequest(useGetUserProfileQuery);
  });
});
