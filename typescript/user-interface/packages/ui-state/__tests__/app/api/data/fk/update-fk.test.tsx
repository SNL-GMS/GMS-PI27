/* eslint-disable @typescript-eslint/no-magic-numbers */
import type { FkTypes } from '@gms/common-model';

import { updateFkMetadata } from '../../../../../src/ts/app/api/data/fk/update-fk-util';
import { fkInput, getTestFkCoiData } from '../../../../__data__';

const fkSpectraCoi = getTestFkCoiData(2000);
describe('Update Fk after computeFkSpectra call', () => {
  it('update Fk COI', () => {
    const result = updateFkMetadata(fkSpectraCoi as FkTypes.FkSpectra, fkInput.configuration);
    const resultWithoutValues = {
      ...result,
      values: []
    };
    expect(resultWithoutValues).toMatchSnapshot();
  });
});
