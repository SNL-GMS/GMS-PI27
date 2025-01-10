import { Logger } from '@gms/common-util';

import { glContextData } from '../../../src/ts/app/ui-ian-app/golden-layout-config';

const logger = Logger.create('GMS_LOG_JEST', process.env.GMS_LOG_JEST);

jest.mock('../../../src/ts/components/analyst-ui/components', () => {
  return { IANMap: () => logger.debug('hi') };
});

describe('App', () => {
  it('matches a snapshot', () => {
    expect(glContextData()).toMatchSnapshot();
  });
});
