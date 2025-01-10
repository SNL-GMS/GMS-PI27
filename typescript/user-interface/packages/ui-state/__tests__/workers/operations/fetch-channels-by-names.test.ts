import type { Channel } from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import type { AxiosResponse } from 'axios';
import Axios from 'axios';

import { fetchChannelsByNamesTimeRange } from '../../../src/ts/workers/waveform-worker/operations/fetch-channels-by-names-timerange';
import { testChannel } from '../../__data__/channel-data';

describe('Channels Query', () => {
  it('has defined exports', () => {
    expect(fetchChannelsByNamesTimeRange).toBeDefined();
  });
  it('fetchChannelsByNamesTimeRange returns channels', async () => {
    const response: AxiosResponse<Channel[]> = {
      status: 200,
      config: {},
      headers: {},
      statusText: '',
      data: [testChannel]
    };
    Axios.request = jest.fn().mockImplementation(async () => Promise.resolve(response));
    const params = { baseURL: '/baseURL' };
    const result = await fetchChannelsByNamesTimeRange(params);
    expect(result).toMatchObject([testChannel]);
  });

  it('fetchChannelsByNamesTimeRange returns error if there is a major config issue', async () => {
    const params = { baseURL: undefined };
    await expect(fetchChannelsByNamesTimeRange(params)).rejects.toThrow(
      'Cannot make a request on the worker without a baseUrl in the config'
    );
  });
});
