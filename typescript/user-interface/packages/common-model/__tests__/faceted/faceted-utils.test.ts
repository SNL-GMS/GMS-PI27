import type { EntityReference, Faceted, VersionReference } from '../../src/ts/faceted';
import {
  convertToEntityReference,
  convertToVersionReference,
  uniqSortEntityOrVersionReference
} from '../../src/ts/faceted';

describe('Faceted utils', () => {
  interface Foo extends Faceted {
    otherStuff: 'goes here';
  }

  test('can sort and unique an Entity or Version reference', () => {
    const stationsEntity: EntityReference<'name'>[] = [
      { name: 'testB' },
      { name: 'testA' },
      { name: 'testA' }
    ];

    const stationsVersion: VersionReference<'name'>[] = [
      { name: 'testB', effectiveAt: 1 },
      { name: 'testA', effectiveAt: 4 },
      { name: 'testA', effectiveAt: 1 }
    ];

    expect(uniqSortEntityOrVersionReference(stationsEntity)).toMatchInlineSnapshot(`
      [
        {
          "name": "testA",
        },
        {
          "name": "testB",
        },
      ]
    `);
    expect(uniqSortEntityOrVersionReference(stationsVersion)).toMatchInlineSnapshot(`
      [
        {
          "effectiveAt": 1,
          "name": "testA",
        },
        {
          "effectiveAt": 1,
          "name": "testB",
        },
      ]
    `);
  });

  test('can covert full object to version reference', () => {
    const version: VersionReference<'name'> = {
      name: 'test name',
      effectiveAt: 100
    };

    const populated: Foo = {
      name: 'test name',
      effectiveAt: 100,
      otherStuff: 'goes here'
    };

    expect(convertToVersionReference(populated, 'name')).toEqual(version);
  });

  test('can covert full object to entity reference', () => {
    const entity: EntityReference<'name'> = {
      name: 'test name'
    };

    const populated: Foo = {
      name: 'test name',
      effectiveAt: 100,
      otherStuff: 'goes here'
    };

    expect(convertToEntityReference(populated, 'name')).toEqual(entity);
  });
});
