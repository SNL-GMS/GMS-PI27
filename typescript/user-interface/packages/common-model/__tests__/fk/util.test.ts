import { degreeToKmApproximate, kmToDegreesApproximate } from '../../src/ts/fk/util';

test('kmToDegreesApproximate', () => {
  const km = 125;
  expect(kmToDegreesApproximate(km)).toMatchInlineSnapshot(`1.124152007398413`);
});

test('degreeToKmApproximate', () => {
  const degrees = 0.3;
  expect(degreeToKmApproximate(degrees)).toMatchInlineSnapshot(`33.35847799336762`);
});
