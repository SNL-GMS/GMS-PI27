import {
  chunkRange,
  chunkRanges,
  determineExcludedRanges,
  mergeRanges
} from '../../src/ts/common-util/range-util';

describe('range utils', () => {
  it('chunkRange returns an array of ranges', () => {
    expect(chunkRange).toBeDefined();
    const range = { start: 1, end: 5 };
    const maxsize = 1;
    expect(chunkRange(undefined, maxsize)).toMatchInlineSnapshot(`[]`);
    expect(chunkRange(range, 0)).toMatchInlineSnapshot(`
      [
        {
          "end": 5,
          "start": 1,
        },
      ]
    `);
    expect(chunkRange(range, maxsize)).toMatchInlineSnapshot(`
      [
        {
          "end": 2,
          "start": 1,
        },
        {
          "end": 3,
          "start": 2,
        },
        {
          "end": 4,
          "start": 3,
        },
        {
          "end": 5,
          "start": 4,
        },
      ]
    `);
  });

  it('chunkRanges returns the merged ranges', () => {
    expect(chunkRanges).toBeDefined();
    const ranges = [
      { start: 3, end: 5 },
      { start: 2, end: 7 },
      { start: 1, end: 2 },
      { start: 9, end: 10 }
    ];
    const maxsize = 2;
    expect(chunkRanges(undefined, maxsize)).toMatchInlineSnapshot(`[]`);
    expect(chunkRanges(ranges, 0)).toMatchInlineSnapshot(`
      [
        {
          "end": 5,
          "start": 3,
        },
        {
          "end": 7,
          "start": 2,
        },
        {
          "end": 2,
          "start": 1,
        },
        {
          "end": 10,
          "start": 9,
        },
      ]
    `);
    expect(chunkRanges(ranges, maxsize)).toMatchInlineSnapshot(`
      [
        {
          "end": 5,
          "start": 3,
        },
        {
          "end": 4,
          "start": 2,
        },
        {
          "end": 6,
          "start": 4,
        },
        {
          "end": 7,
          "start": 6,
        },
        {
          "end": 2,
          "start": 1,
        },
        {
          "end": 10,
          "start": 9,
        },
      ]
    `);
  });

  it('exits', () => {
    expect(mergeRanges).toBeDefined();
  });

  it('can merge ranges', () => {
    expect(mergeRanges([])).toEqual([]);
    expect(mergeRanges(undefined)).toEqual([]);

    expect(mergeRanges([{ start: 1, end: 5 }])).toEqual([{ start: 1, end: 5 }]);

    expect(
      mergeRanges([
        { start: 1, end: 5 },
        { start: 1, end: 5 }
      ])
    ).toEqual([{ start: 1, end: 5 }]);

    expect(
      mergeRanges([
        { start: 0, end: 5 },
        { start: 1, end: 5 }
      ])
    ).toEqual([{ start: 0, end: 5 }]);

    expect(
      mergeRanges([
        { start: 1, end: 5 },
        { start: 1, end: 8 }
      ])
    ).toEqual([{ start: 1, end: 8 }]);

    expect(
      mergeRanges([
        { start: 11, end: 12 },
        { start: 1, end: 5 },
        { start: 1, end: 8 },
        { start: -1, end: 10 },
        { start: 3, end: 4 }
      ])
    ).toEqual([
      { start: -1, end: 10 },
      { start: 11, end: 12 }
    ]);
  });

  it('can find outside ranges', () => {
    expect(determineExcludedRanges(undefined, undefined)).toEqual([]);
    expect(determineExcludedRanges(undefined, { start: 1, end: 5 })).toEqual([
      { start: 1, end: 5 }
    ]);
    expect(determineExcludedRanges([{ start: 1, end: 5 }], undefined)).toEqual([]);

    expect(determineExcludedRanges([{ start: 1, end: 5 }], { start: 1, end: 5 })).toEqual([]);
    expect(determineExcludedRanges([{ start: 1, end: 5 }], { start: 2, end: 4 })).toEqual([]);

    expect(determineExcludedRanges([{ start: 1, end: 5 }], { start: 0, end: 1 })).toEqual([
      { start: 0, end: 1 }
    ]);
    expect(determineExcludedRanges([{ start: 1, end: 5 }], { start: 5, end: 6 })).toEqual([
      { start: 5, end: 6 }
    ]);

    expect(determineExcludedRanges([{ start: 1, end: 5 }], { start: 0, end: 6 })).toEqual([
      { start: 0, end: 1 },
      { start: 5, end: 6 }
    ]);
  });
});
