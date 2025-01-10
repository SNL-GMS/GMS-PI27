import { recordLength, sortRecordByKeys } from '../../src/ts/common-util';

describe('record utils', () => {
  test('return correct number of entries in record', () => {
    expect(recordLength(undefined)).toEqual(0);
    expect(recordLength(null)).toEqual(0);
    const someRecord: Record<string, number> = {};
    expect(recordLength(someRecord)).toEqual(0);
    someRecord.foo = 34;
    expect(recordLength(someRecord)).toEqual(1);
  });
  describe('sortRecordByKeys', () => {
    test('returns an object with the keys in sorted order', () => {
      expect(
        JSON.stringify(
          sortRecordByKeys({
            b: 'bar',
            a: 'foo',
            c: 'baz'
          })
        )
      ).toBe('{"a":"foo","b":"bar","c":"baz"}');
    });
    test('returns an object with nested keys in sorted order', () => {
      expect(
        JSON.stringify(
          sortRecordByKeys({
            b: 'bar',
            a: {
              z: {
                q: 'a',
                p: 'b'
              },
              y: 'ofo',
              x: 'oof'
            },
            c: 'baz'
          })
        )
      ).toBe('{"a":{"x":"oof","y":"ofo","z":{"p":"b","q":"a"}},"b":"bar","c":"baz"}');
    });
    test('returns an object with nested keys in sorted order even if given arrays', () => {
      expect(
        JSON.stringify(
          sortRecordByKeys({
            b: 'bar',
            a: ['x', 'y', 'z']
          })
        )
      ).toBe('{"a":["x","y","z"],"b":"bar"}');
    });
    test('sorts objects with numeric keys as expected', () => {
      expect(
        JSON.stringify(
          sortRecordByKeys({
            b: 'bar',
            a: ['x', 'y', 'z'],
            1: 'one',
            2: 'two'
          })
        )
      ).toBe('{"1":"one","2":"two","a":["x","y","z"],"b":"bar"}');
    });
    test('throws if given a function', () => {
      expect(() => sortRecordByKeys((() => '💣') as any)).toThrow(
        'Invalid input: sortRecordByKeys requires an object that only contains strings or numbers as keys'
      );
    });
  });
});
