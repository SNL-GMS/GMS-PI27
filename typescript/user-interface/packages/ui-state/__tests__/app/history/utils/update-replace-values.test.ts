import { enablePatches, produceWithPatches } from 'immer';
import cloneDeep from 'lodash/cloneDeep';

import {
  combineKeys,
  updateReplaceValues
} from '../../../../src/ts/app/history/utils/update-replace-values';

const initial = {
  top: { value: 1 },
  values: {
    sampleNumber: 5,
    sampleString: 'test string',
    sampleArray: [
      { a: 1, b: 2 },
      { a: 3, b: 4 },
      { a: 5, b: 6 }
    ],
    deep: {
      level1: {
        level2: {
          level3: {
            sampleRecord: {
              data1: {
                sampleArray: [1, 2, 3, 4, 5]
              }
            }
          }
        }
      }
    }
  }
};

enablePatches();

describe('history util', () => {
  it('exists', () => {
    expect(combineKeys).toBeDefined();
    expect(updateReplaceValues).toBeDefined();
  });

  it('combineKeys - combines keys successfully', () => {
    const sampleChange = {
      ...cloneDeep(initial),
      values: {
        ...cloneDeep(initial.values),
        sampleString: 'updated',
        sampleArray: [],
        newValue1: 3,
        newValue2: undefined
      }
    };

    expect(combineKeys(initial.values, sampleChange.values)).toMatchInlineSnapshot(`
      [
        "deep",
        "sampleArray",
        "sampleString",
      ]
    `);
  });

  it('updateReplaceValues - simple modify', () => {
    const sampleChange = {
      ...cloneDeep(initial),
      values: {
        ...cloneDeep(initial.values),
        sampleString: 'updated'
      }
    };

    const result = produceWithPatches(initial, draft => {
      updateReplaceValues(draft, sampleChange);
    });
    expect(result[0]).toEqual(sampleChange);
    expect(result[1]).toMatchInlineSnapshot(`
      [
        {
          "op": "replace",
          "path": [
            "values",
            "sampleString",
          ],
          "value": "updated",
        },
      ]
    `);
  });

  it('updateReplaceValues - value added', () => {
    const sampleAddValue = {
      ...cloneDeep(initial),
      values: {
        ...cloneDeep(initial.values),
        valueAdded: 'added',
        sampleArray: [
          { a: 1, b: 2 },
          { a: 3, b: 4 },
          { a: 5, b: 6 }
        ]
      },
      valueAdded: 'added a new value'
    };

    const result = produceWithPatches(initial, draft => {
      updateReplaceValues(draft, sampleAddValue);
    });
    expect(result[0]).toEqual(sampleAddValue);
    expect(result[1]).toMatchInlineSnapshot(`
      [
        {
          "op": "add",
          "path": [
            "values",
            "valueAdded",
          ],
          "value": "added",
        },
        {
          "op": "add",
          "path": [
            "valueAdded",
          ],
          "value": "added a new value",
        },
      ]
    `);
  });

  it('updateReplaceValues - value removed', () => {
    const sampleRemoveValue = {
      values: {
        ...cloneDeep(initial.values),
        sampleString: undefined,
        sampleArray: [
          { a: 1, b: 2 },
          { a: 5, b: 6 }
        ],
        emptyArray: [],
        deep: {
          ...cloneDeep(initial.values.deep)
        }
      }
    };

    const result = produceWithPatches(initial, draft => {
      updateReplaceValues(draft, sampleRemoveValue);
    });
    expect(result[0]).toEqual(sampleRemoveValue);
    expect(result[1]).toMatchInlineSnapshot(`
      [
        {
          "op": "replace",
          "path": [
            "values",
            "sampleString",
          ],
          "value": undefined,
        },
        {
          "op": "replace",
          "path": [
            "values",
            "sampleArray",
          ],
          "value": [
            {
              "a": 1,
              "b": 2,
            },
            {
              "a": 5,
              "b": 6,
            },
          ],
        },
        {
          "op": "add",
          "path": [
            "values",
            "emptyArray",
          ],
          "value": [],
        },
        {
          "op": "remove",
          "path": [
            "top",
          ],
        },
      ]
    `);
  });
});
