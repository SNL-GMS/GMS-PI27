/* eslint-disable @typescript-eslint/no-magic-numbers */
import { renderHook } from '@testing-library/react';
import includes from 'lodash/includes';

import type { RangeTuple, SearchSet } from '../../src/ts/ui-util/search-util';
import {
  highlightRanges,
  useSearch,
  useSearchResultSelectionManager,
  useVanillaSearch,
  vanillaSearch,
  wrapSelectedIndices
} from '../../src/ts/ui-util/search-util';

const matches = (element: string, searchTerm: string) => includes(element, searchTerm);
const searchSet: SearchSet<string> = [
  'the cat jumped the moon',
  'the chicken crossed the road',
  'the sun is bright'
];

describe('Search utils', () => {
  it('to be defined', () => {
    expect(highlightRanges).toBeDefined();
    expect(vanillaSearch).toBeDefined();
    expect(useSearchResultSelectionManager).toBeDefined();
    expect(useSearch).toBeDefined();
    expect(useVanillaSearch).toBeDefined();
    expect(wrapSelectedIndices).toBeDefined();
  });

  it('vanilla search', () => {
    expect(vanillaSearch(searchSet, 'hi', matches)).toMatchInlineSnapshot(`
      [
        {
          "item": "the chicken crossed the road",
          "refIndex": 1,
        },
      ]
    `);

    expect(vanillaSearch(searchSet, 'ball', matches)).toMatchInlineSnapshot(`[]`);
  });

  it('useSearch', () => {
    const { result } = renderHook(() =>
      useSearch((searchTerm: string) => vanillaSearch(searchSet, searchTerm, matches))
    );
    expect(result.current).toMatchInlineSnapshot(`
      [
        undefined,
        [Function],
        [Function],
      ]
    `);
  });

  it('useVanillaSearch', () => {
    const { result } = renderHook(() => useVanillaSearch(searchSet, matches));

    expect(result.current).toMatchInlineSnapshot(`
      [
        undefined,
        [Function],
        [Function],
      ]
    `);
  });

  it('useSearchResultSelectionManager', () => {
    const search = vanillaSearch(searchSet, 'h', matches) || [];
    const { result } = renderHook(() => useSearchResultSelectionManager(search)) as any;

    expect(result.current).toMatchInlineSnapshot(`
      {
        "getSelectedResult": [Function],
        "resetSelection": [Function],
        "selectNext": [Function],
        "selectPrevious": [Function],
      }
    `);

    expect(result.current.getSelectedResult()).toMatchInlineSnapshot(`
      {
        "item": "the cat jumped the moon",
        "refIndex": 0,
      }
    `);
    result.current.selectNext();
    expect(result.current.getSelectedResult()).toMatchInlineSnapshot(`
      {
        "item": "the cat jumped the moon",
        "refIndex": 0,
      }
    `);
    result.current.selectPrevious();
    expect(result.current.getSelectedResult()).toMatchInlineSnapshot(`
      {
        "item": "the cat jumped the moon",
        "refIndex": 0,
      }
    `);
    result.current.resetSelection();
    expect(result.current.getSelectedResult()).toMatchInlineSnapshot(`
      {
        "item": "the cat jumped the moon",
        "refIndex": 0,
      }
    `);
  });

  it('highlight ranges', () => {
    const str = 'the chicken crossed the road';
    let tuple: RangeTuple[] = [[0, str.length]];

    expect(highlightRanges(str, tuple)).toMatchInlineSnapshot(`
      <React.Fragment>
        
        <span
          className="is-highlighted"
        >
          the chicken crossed the road
        </span>
        
      </React.Fragment>
    `);

    tuple = [
      [0, 2],
      [str.length - 4, str.length]
    ];
    expect(highlightRanges(str, tuple)).toMatchInlineSnapshot(`
      <React.Fragment>
        <React.Fragment>
          
          <span
            className="is-highlighted"
          >
            
          </span>
          
        </React.Fragment>
        <span
          className="is-highlighted"
        >
          the
        </span>
         chicken crossed the road
      </React.Fragment>
    `);
  });

  it('wrapSelectedIndices', () => {
    expect(wrapSelectedIndices(0, 0, 0)).toEqual(0);
    expect(wrapSelectedIndices(0, 1, 10)).toEqual(10);
    expect(wrapSelectedIndices(5, 5, 12)).toEqual(5);
    expect(wrapSelectedIndices(13, 8, 12)).toEqual(8);
  });
});
