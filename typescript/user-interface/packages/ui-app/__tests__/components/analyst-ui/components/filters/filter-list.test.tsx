/* eslint-disable @typescript-eslint/no-magic-numbers */
import {
  cascadeFilter,
  linearFilter,
  unfilteredFilter
} from '@gms/common-model/__tests__/__data__';
import { BandType, FilterType, LinearFilterType } from '@gms/common-model/lib/filter/types';
import { analystActions, getStore } from '@gms/ui-state';
import React from 'react';
import { Provider } from 'react-redux';
import renderer from 'react-test-renderer';

import {
  buildHandleKeyDown,
  FilterListOrNonIdealState
} from '../../../../../src/ts/components/analyst-ui/components/filters/filter-list';

const mockSetSelectedFilter = jest.fn();
jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  return {
    ...actual,
    useUiTheme: () => [
      {
        colors: {
          gmsSelection: '#123123',
          gmsMain: '#BADBAD',
          gmsMainInverted: '#DABDAB',
          gmsBackground: '#000000'
        }
      },
      jest.fn()
    ],
    useSelectedFilter: () => ({
      selectedFilterList: {
        withinHotKeyCycle: true,
        unfiltered: true,
        namedFilter: null,
        filterDefinition: null
      },
      setSelectedFilter: mockSetSelectedFilter
    }),
    useSelectedFilterIndex: jest.fn(() => 0),
    useHotkeyCycle: () => ({
      hotkeyCycle: [true, false, true],
      setIsFilterWithinHotkeyCycle: jest.fn()
    })
  };
});

describe('FilterList', () => {
  const store = getStore();
  store.dispatch(analystActions.setSelectedFilterIndex(0));
  store.dispatch(analystActions.setSelectedFilterList('test'));
  store.dispatch(
    analystActions.setFilterHotkeyCycleOverridesForCurrentFilterList({
      0: false,
      1: true,
      2: true
    })
  );

  const nonIdeal = renderer.create(
    <Provider store={store}>
      <FilterListOrNonIdealState filterList={undefined} />
    </Provider>
  );
  it('matches a non ideal state snapshot when given no filter list', () => {
    expect(nonIdeal.toJSON()).toMatchSnapshot();
  });
  const tree = renderer.create(
    <Provider store={store}>
      <FilterListOrNonIdealState
        filterList={{
          name: 'test',
          defaultFilterIndex: 0,
          filters: [
            {
              filterDefinition: {
                name: 'filter def name 1',
                comments: 'the comments 1',
                filterDescription: {
                  causal: false,
                  comments: 'the description comments 1',
                  filterType: FilterType.LINEAR,
                  linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
                  highFrequencyHz: 1,
                  lowFrequencyHz: 0.5,
                  order: 1,
                  parameters: {
                    sosDenominatorCoefficients: [0.1, 1.0],
                    sosNumeratorCoefficients: [1.1, 1.2],
                    groupDelaySec: 3,
                    sampleRateHz: 40,
                    sampleRateToleranceHz: 2
                  },
                  passBandType: BandType.BAND_PASS,
                  zeroPhase: false
                }
              },
              withinHotKeyCycle: true
            },
            {
              filterDefinition: {
                name: 'filter def name 2',
                comments: 'the comments 2',
                filterDescription: {
                  causal: true,
                  comments: 'the description comments 2',
                  filterType: FilterType.LINEAR,
                  linearFilterType: LinearFilterType.IIR_BUTTERWORTH,
                  highFrequencyHz: 2,
                  lowFrequencyHz: 0.25,
                  order: 1,
                  parameters: {
                    sosDenominatorCoefficients: [0.2, 2.0],
                    sosNumeratorCoefficients: [2, 2.2],
                    groupDelaySec: 2,
                    sampleRateHz: 20,
                    sampleRateToleranceHz: 22
                  },
                  passBandType: BandType.BAND_PASS,
                  zeroPhase: true
                }
              },
              withinHotKeyCycle: false
            },
            {
              filterDefinition: undefined,
              unfiltered: true,
              withinHotKeyCycle: true
            }
          ]
        }}
      />
    </Provider>
  );
  it('matches a snapshot', () => {
    expect(tree.toJSON()).toMatchSnapshot();
  });
  describe('buildHandleKeyDown', () => {
    const mockSetActiveIndex = jest.fn();
    const mockScrollIntoView = jest.fn();
    const mockHandleBlur = jest.fn();
    const mockSetSelectedFilter2 = jest.fn(); // 2 because we have one with the same name above
    const mockFilterList = { filters: [linearFilter, cascadeFilter, unfilteredFilter] };

    const testHandleKeyDown = buildHandleKeyDown(
      mockSetActiveIndex,
      mockScrollIntoView,
      mockHandleBlur,
      mockSetSelectedFilter2,
      mockFilterList,
      0
    );
    beforeEach(() => {
      mockSetActiveIndex.mockClear();
      mockScrollIntoView.mockClear();
      mockHandleBlur.mockClear();
      mockSetSelectedFilter2.mockClear();
    });
    test('calls handleBlur when the escape key is pressed', () => {
      testHandleKeyDown({ key: 'Escape', preventDefault: jest.fn(), stopPropagation: jest.fn() });
      expect(mockHandleBlur).toHaveBeenCalled();
    });
    test('sets the selected active filter index when enter is pressed', () => {
      testHandleKeyDown({ key: 'Enter', preventDefault: jest.fn(), stopPropagation: jest.fn() });
      expect(mockSetSelectedFilter2).toHaveBeenCalledWith(linearFilter);
    });
    test('sets the previous index when ArrowUp key is pressed', () => {
      testHandleKeyDown({ key: 'ArrowUp', preventDefault: jest.fn(), stopPropagation: jest.fn() });
      const setterFn = mockSetActiveIndex.mock.calls[mockSetActiveIndex.mock.calls.length - 1][0];
      expect(typeof setterFn).toBe('function');
      expect(setterFn(2)).toBe(1);
      expect(setterFn(1)).toBe(0);
      expect(setterFn(0)).toBe(2);
    });
    test('calls scrollIntoView with the previous index when ArrowUp key is pressed', () => {
      testHandleKeyDown({ key: 'ArrowUp', preventDefault: jest.fn(), stopPropagation: jest.fn() });
      const setterFn = mockSetActiveIndex.mock.calls[mockSetActiveIndex.mock.calls.length - 1][0];
      expect(typeof setterFn).toBe('function');
      setterFn(2);
      expect(mockScrollIntoView).toHaveBeenLastCalledWith(1);
      setterFn(1);
      expect(mockScrollIntoView).toHaveBeenLastCalledWith(0);
      setterFn(0);
      expect(mockScrollIntoView).toHaveBeenLastCalledWith(2);
    });
    test('sets the previous index when Shift + Tab is pressed', () => {
      testHandleKeyDown({
        key: 'Tab',
        shiftKey: true,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      });
      const setterFn = mockSetActiveIndex.mock.calls[mockSetActiveIndex.mock.calls.length - 1][0];
      expect(typeof setterFn).toBe('function');
      expect(setterFn(2)).toBe(1);
      expect(setterFn(1)).toBe(0);
      expect(setterFn(0)).toBe(2);
    });
    test('sets the next index when ArrowDown key is pressed', () => {
      testHandleKeyDown({
        key: 'ArrowDown',
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      });
      const setterFn = mockSetActiveIndex.mock.calls[mockSetActiveIndex.mock.calls.length - 1][0];
      expect(typeof setterFn).toBe('function');
      expect(setterFn(2)).toBe(0);
      expect(setterFn(1)).toBe(2);
      expect(setterFn(0)).toBe(1);
    });
    test('calls scrollIntoView when the next index when ArrowDown key is pressed', () => {
      testHandleKeyDown({
        key: 'ArrowDown',
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      });
      const setterFn = mockSetActiveIndex.mock.calls[mockSetActiveIndex.mock.calls.length - 1][0];
      expect(typeof setterFn).toBe('function');
      setterFn(2);
      expect(mockScrollIntoView).toHaveBeenLastCalledWith(0);
      setterFn(1);
      expect(mockScrollIntoView).toHaveBeenLastCalledWith(2);
      setterFn(0);
      expect(mockScrollIntoView).toHaveBeenLastCalledWith(1);
    });
    test('sets the next index when Tab key is pressed', () => {
      testHandleKeyDown({
        key: 'Tab',
        shiftKey: false,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      });
      const setterFn = mockSetActiveIndex.mock.calls[mockSetActiveIndex.mock.calls.length - 1][0];
      expect(typeof setterFn).toBe('function');
      expect(setterFn(2)).toBe(0);
      expect(setterFn(1)).toBe(2);
      expect(setterFn(0)).toBe(1);
    });
  });
});
