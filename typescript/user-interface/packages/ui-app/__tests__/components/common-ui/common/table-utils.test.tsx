/* eslint-disable @typescript-eslint/no-magic-numbers */
// eslint-disable @typescript-eslint/no-magic-numbers
import { formatTimeForDisplay } from '@gms/common-util';
import { HotkeyListener } from '@gms/ui-util';
import type { RowClickedEvent } from 'ag-grid-community';
import type { AgGridReact } from 'ag-grid-react';

import { messageConfig } from '../../../../src/ts/components/analyst-ui/config/message-config';
import {
  caseInsensitiveComparator,
  formatNumberForDisplayFixedThreeDecimalPlaces,
  formatNumberForDisplayMaxThreeDecimalPlaces,
  getHeaderHeight,
  getMultiLineHeaderHeight,
  getRowHeightWithBorder,
  getTableCellStringValue,
  handleSelection,
  numericStringComparator,
  setRowNodeSelection,
  singleDecimalComparator,
  updateRowSelection
} from '../../../../src/ts/components/common-ui/common/table-utils';

describe('Table Utils', () => {
  const expectedResultForInvalidInput = messageConfig.invalidCellText;

  test('functions are exported', () => {
    expect(formatNumberForDisplayFixedThreeDecimalPlaces).toBeDefined();
    expect(formatNumberForDisplayMaxThreeDecimalPlaces).toBeDefined();
    expect(getHeaderHeight).toBeDefined();
    expect(getMultiLineHeaderHeight).toBeDefined();
    expect(getRowHeightWithBorder).toBeDefined();
    expect(getTableCellStringValue).toBeDefined();
    expect(numericStringComparator).toBeDefined();
    expect(singleDecimalComparator).toBeDefined();
    expect(caseInsensitiveComparator).toBeDefined();
    expect(setRowNodeSelection).toBeDefined();
    expect(updateRowSelection).toBeDefined();
  });

  describe('Cell value getter/helper functions', () => {
    describe('getTableCellStringValue', () => {
      test('returns valid string when passed valid string', () => {
        const validString = 'nthoaetnhaoeu23';
        const result = getTableCellStringValue(validString);
        expect(result).toEqual(validString);
      });

      test('returns Unknown when passed a null value', () => {
        const actualResult = getTableCellStringValue(null);
        expect(actualResult).toEqual(expectedResultForInvalidInput);
      });

      test('returns Unknown when passed an undefined value', () => {
        const actualResult = getTableCellStringValue(undefined);
        expect(actualResult).toEqual(expectedResultForInvalidInput);
      });

      test('returns Unknown when passed an empty string', () => {
        const actualResult = getTableCellStringValue('');
        expect(actualResult).toEqual(expectedResultForInvalidInput);
      });
    });

    describe('formatNumberForDisplay', () => {
      test('returns a number (in a string) to at most three decimal places when given a valid integer', () => {
        const one = 1;
        const oneFormatted = '1';
        const oneResult = formatNumberForDisplayMaxThreeDecimalPlaces(one);
        expect(oneResult).toEqual(oneFormatted);

        const integer = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        const expectedResult = `${integer}`;
        const result2 = formatNumberForDisplayMaxThreeDecimalPlaces(integer);
        expect(result2).toEqual(expectedResult);
      });

      test('rounds decimal up when needed', () => {
        const longDecimal = 234.203998;
        const longDecimalFormatted = '234.204';
        const longDecimalResult: string = formatNumberForDisplayMaxThreeDecimalPlaces(longDecimal);
        expect(longDecimalResult).toEqual(longDecimalFormatted);
      });

      test('does not round decimal when not needed', () => {
        const longDecimal = 234.203398;
        const longDecimalFormatted = '234.203';
        const longDecimalResult: string = formatNumberForDisplayMaxThreeDecimalPlaces(longDecimal);
        expect(longDecimalResult).toEqual(longDecimalFormatted);
      });

      test('works with negative values', () => {
        const negativeOne = -1;
        const negativeOneFormatted = '-1';
        const negativeOneResult = formatNumberForDisplayMaxThreeDecimalPlaces(negativeOne);
        expect(negativeOneResult).toEqual(negativeOneFormatted);

        const negativeLongDecimal = -234.203398;
        const negativeLongDecimalFormatted = '-234.203';
        const negativeLongDecimalResult: string =
          formatNumberForDisplayMaxThreeDecimalPlaces(negativeLongDecimal);
        expect(negativeLongDecimalResult).toEqual(negativeLongDecimalFormatted);

        const negativeLongDecimalToRound = -234.203398;
        const negativeLongDecimalToRoundFormatted = '-234.203';
        const negativeLongDecimalToRoundResult: string =
          formatNumberForDisplayMaxThreeDecimalPlaces(negativeLongDecimalToRound);
        expect(negativeLongDecimalToRoundResult).toEqual(negativeLongDecimalToRoundFormatted);
      });

      test('returns Unknown when passed a null value', () => {
        const result = formatNumberForDisplayMaxThreeDecimalPlaces(null);
        expect(result).toEqual(expectedResultForInvalidInput);
      });

      test('returns Unknown when passed an undefined value', () => {
        const result = formatNumberForDisplayMaxThreeDecimalPlaces(undefined);
        expect(result).toEqual(expectedResultForInvalidInput);
      });
    });

    describe('formatNumberToFixedThreeDecimalPlaces', () => {
      test('returns a number (in a string) to at exactly three decimal places when given a valid integer', () => {
        const one = 1;
        const oneFormatted = '1.000';
        const oneResult = formatNumberForDisplayFixedThreeDecimalPlaces(one);
        expect(oneResult).toEqual(oneFormatted);

        const integer = 893403452;
        const expectedResult = `893,403,452.000`;
        const result2 = formatNumberForDisplayFixedThreeDecimalPlaces(integer);
        expect(result2).toEqual(expectedResult);
      });

      test('rounds decimal up when needed', () => {
        const longDecimal = 234.203998;
        const longDecimalFormatted = '234.204';
        const longDecimalResult: string =
          formatNumberForDisplayFixedThreeDecimalPlaces(longDecimal);
        expect(longDecimalResult).toEqual(longDecimalFormatted);
      });

      test('does not round decimal when not needed', () => {
        const longDecimal = 234.203398;
        const longDecimalFormatted = '234.203';
        const longDecimalResult: string =
          formatNumberForDisplayFixedThreeDecimalPlaces(longDecimal);
        expect(longDecimalResult).toEqual(longDecimalFormatted);
      });

      test('works with negative values', () => {
        const negativeOne = -1;
        const negativeOneFormatted = '-1.000';
        const negativeOneResult = formatNumberForDisplayFixedThreeDecimalPlaces(negativeOne);
        expect(negativeOneResult).toEqual(negativeOneFormatted);

        const negativeLongDecimal = -234.203398;
        const negativeLongDecimalFormatted = '-234.203';
        const negativeLongDecimalResult: string =
          formatNumberForDisplayFixedThreeDecimalPlaces(negativeLongDecimal);
        expect(negativeLongDecimalResult).toEqual(negativeLongDecimalFormatted);

        const negativeLongDecimalToRound = -234.203398;
        const negativeLongDecimalToRoundFormatted = '-234.203';
        const negativeLongDecimalToRoundResult: string =
          formatNumberForDisplayFixedThreeDecimalPlaces(negativeLongDecimalToRound);
        expect(negativeLongDecimalToRoundResult).toEqual(negativeLongDecimalToRoundFormatted);
      });

      test('returns Unknown when passed a null value', () => {
        const result = formatNumberForDisplayFixedThreeDecimalPlaces(null);
        expect(result).toEqual(expectedResultForInvalidInput);
      });

      test('returns Unknown when passed an undefined value', () => {
        const result = formatNumberForDisplayFixedThreeDecimalPlaces(undefined);
        expect(result).toEqual(expectedResultForInvalidInput);
      });
    });

    describe('formatTimeForDisplay', () => {
      test('valid time parse', () => {
        const expectedResult = '1970-01-01 00:00:00';
        const actualResult = formatTimeForDisplay('1970-01-01T00:00:00Z');
        expect(actualResult).toEqual(expectedResult);
      });

      test('null time returns Unknown', () => {
        const actualResult = formatTimeForDisplay(null);
        expect(actualResult).toEqual(expectedResultForInvalidInput);
      });

      test('undefined time string returns Unknown', () => {
        const actualResult = formatTimeForDisplay(undefined);
        expect(actualResult).toEqual(expectedResultForInvalidInput);
      });

      test('empty time string returns Unknown', () => {
        const actualResult = formatTimeForDisplay('');
        expect(actualResult).toEqual(expectedResultForInvalidInput);
      });

      test('malformed time string returns Unknown', () => {
        const actualResult = formatTimeForDisplay('aoeu');
        expect(actualResult).toEqual(expectedResultForInvalidInput);
      });
    });
  });

  describe('numericStringComparator', () => {
    test('ranks valid inputs correctly', () => {
      expect(numericStringComparator('1', '2')).toBeLessThan(0);
      expect(numericStringComparator('1', '10')).toBeLessThan(0);
      expect(numericStringComparator('1', '100')).toBeLessThan(0);
      expect(numericStringComparator('0.1', '100')).toBeLessThan(0);
      expect(numericStringComparator('5', '100')).toBeLessThan(0);
      expect(numericStringComparator('2', '1')).toBeGreaterThan(0);
      expect(numericStringComparator('1.0', '1')).toEqual(0);
      expect(numericStringComparator('-1.0', '-1')).toEqual(0);
      expect(numericStringComparator('-1.0', '1')).toBeLessThan(0);

      const integer = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
      expect(numericStringComparator(`-${integer}`, `${integer}`)).toBeLessThan(0);
      expect(numericStringComparator(`${integer}`, `-${integer}`)).toBeGreaterThan(0);
      expect(numericStringComparator(`-${integer}`, `-${integer}`)).toEqual(0);
    });

    test('fancy tax checker', () => {
      expect(numericStringComparator('-200', '1')).toBeLessThan(0);
      expect(numericStringComparator('-200', '199')).toBeLessThan(0);
      expect(numericStringComparator('-200', '2000')).toBeLessThan(0);

      expect(numericStringComparator('1', '-200')).toBeGreaterThan(0);
      expect(numericStringComparator('199', '-200')).toBeGreaterThan(0);
      expect(numericStringComparator('2000', '-200')).toBeGreaterThan(0);
    });

    test('properly ranks "Unknown" input lowest', () => {
      expect(numericStringComparator('1', messageConfig.invalidCellText)).toBeGreaterThan(0);
      expect(numericStringComparator(messageConfig.invalidCellText, '-345789438')).toBeLessThan(0);
      expect(
        numericStringComparator(messageConfig.invalidCellText, messageConfig.invalidCellText)
      ).toEqual(0);
    });

    test('properly ranks empty input lowest', () => {
      expect(numericStringComparator('1', '')).toBeGreaterThan(0);
      expect(numericStringComparator('', '-345789438')).toBeLessThan(0);
      expect(numericStringComparator('', '')).toEqual(0);
    });

    test('properly ranks null/undefined input lowest', () => {
      expect(numericStringComparator('1', undefined)).toBeGreaterThan(0);
      expect(numericStringComparator(undefined, '-345789438')).toBeLessThan(0);
      expect(numericStringComparator(undefined, undefined)).toEqual(0);

      expect(numericStringComparator('1', null)).toBeGreaterThan(0);
      expect(numericStringComparator(null, '-345789438')).toBeLessThan(0);
      expect(numericStringComparator(null, null)).toEqual(0);
    });

    test('properly ranks null/undefined/unknown/empty input as equivalently low rank', () => {
      expect(numericStringComparator(undefined, null)).toEqual(0);
      expect(numericStringComparator(undefined, '')).toEqual(0);
      expect(numericStringComparator(undefined, messageConfig.invalidCellText)).toEqual(0);
      expect(numericStringComparator(messageConfig.invalidCellText, null)).toEqual(0);
      expect(numericStringComparator(messageConfig.invalidCellText, '')).toEqual(0);
      expect(numericStringComparator(messageConfig.invalidCellText, 'eoui345oeui')).toEqual(0);
    });
  });
  describe('caseInsensitiveComparator', () => {
    test('ranks valid inputs correctly', () => {
      expect(caseInsensitiveComparator('b', 'ab')).toBeGreaterThan(0);
      expect(caseInsensitiveComparator('B', 'a')).toBeGreaterThan(0);
      expect(caseInsensitiveComparator('BA', 'b')).toBeGreaterThan(0);
      expect(caseInsensitiveComparator('a', 'A')).toEqual(0);
      expect(caseInsensitiveComparator('A', 'a')).toEqual(0);
      expect(caseInsensitiveComparator('a', 'AB')).toBeLessThan(0);
      expect(caseInsensitiveComparator('A', 'ab')).toBeLessThan(0);
      expect(caseInsensitiveComparator('A', 'Ab')).toBeLessThan(0);
    });
  });
  describe('singleDecimalComparator', () => {
    test('ranks valid inputs correctly', () => {
      expect(singleDecimalComparator(6.1, 6)).toBeGreaterThan(0);
      expect(singleDecimalComparator(6.12, 6)).toBeGreaterThan(0);
      expect(singleDecimalComparator(6.1, 6.03)).toBeGreaterThan(0);
      expect(singleDecimalComparator(6.0, 6)).toEqual(0);
      expect(singleDecimalComparator(6.1, 6.1)).toEqual(0);
      expect(singleDecimalComparator(6.12, 6.13)).toEqual(0);
      expect(singleDecimalComparator(6.1, 6.13)).toEqual(0);
      expect(singleDecimalComparator(6.12, 6.1)).toEqual(0);
      expect(singleDecimalComparator(6, 6.1)).toBeLessThan(0);
      expect(singleDecimalComparator(6.12, 6.3)).toBeLessThan(0);
      expect(singleDecimalComparator(6.1, 6.23)).toBeLessThan(0);
    });
  });

  describe('updateRowSelection', () => {
    const mockForEachNode = jest.fn(n => n.map);
    const tableRef = { current: { api: { forEachNode: mockForEachNode } } };
    const selectedSdIds = ['ASAR', 'RASAR', 'RACECAR', 'LASAR'];

    test('updates rows', () => {
      updateRowSelection(tableRef as unknown as React.MutableRefObject<AgGridReact>, selectedSdIds);
      expect(mockForEachNode).toHaveBeenCalled();
    });
  });

  describe('handleSelection', () => {
    let subscriptionId: string;
    beforeEach(() => {
      subscriptionId = HotkeyListener.subscribeToGlobalHotkeyListener();
    });
    afterEach(() => {
      HotkeyListener.unsubscribeFromGlobalHotkeyListener(subscriptionId);
    });
    it('Selects a range of rows (shift key)', () => {
      const mockForEachNode = jest.fn();
      const mockMouseEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        shiftKey: true
      });

      const mockRowClickedEvent = {
        api: {
          getSelectedNodes: jest.fn().mockReturnValue([
            {
              id: 'test-row-0',
              rowIndex: 0
            }
          ]),
          getEditingCells: jest.fn().mockReturnValue([]),
          forEachNode: mockForEachNode
        },
        node: {
          id: 'test-row-3',
          rowIndex: 3,
          isSelected: jest.fn(() => true)
        },
        event: mockMouseEvent
      };
      handleSelection(mockRowClickedEvent as unknown as RowClickedEvent);

      expect(mockForEachNode).toHaveBeenCalledTimes(1);
    });

    it('Selects multiple rows (ctrl/meta key)', () => {
      const mockSetSelected = jest.fn();
      const mockMouseEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        ctrlKey: true
      });

      // Call twice to select multiple rows
      handleSelection({
        api: {
          getSelectedNodes: jest.fn().mockReturnValue([]),
          getEditingCells: jest.fn().mockReturnValue([])
        },
        node: {
          id: 'test-row-0',
          rowIndex: 0,
          isSelected: jest.fn(() => false),
          setSelected: mockSetSelected
        },
        event: mockMouseEvent
      } as unknown as RowClickedEvent);

      handleSelection({
        api: {
          getSelectedNodes: jest.fn().mockReturnValue([
            {
              id: 'test-row-0',
              rowIndex: 0
            }
          ]),
          getEditingCells: jest.fn().mockReturnValue([])
        },
        node: {
          id: 'test-row-1',
          rowIndex: 1,
          isSelected: jest.fn(() => false),
          setSelected: mockSetSelected
        },
        event: mockMouseEvent
      } as unknown as RowClickedEvent);

      expect(mockSetSelected).toHaveBeenCalledTimes(2);
    });

    it('Selects with other rows already selected (no modifier keys)', () => {
      const mockIsSelected = jest.fn(() => true);
      const mockSetSelected = jest.fn();
      const mockMouseEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });

      const mockRowClickedEvent = {
        api: {
          getSelectedNodes: jest.fn().mockReturnValue([
            {
              id: 'test-row-0',
              rowIndex: 0,
              isSelected: mockIsSelected,
              setSelected: mockSetSelected
            },
            {
              id: 'test-row-1',
              rowIndex: 1,
              isSelected: mockIsSelected,
              setSelected: mockSetSelected
            }
          ]),
          getEditingCells: jest.fn().mockReturnValue([])
        },
        node: {
          id: 'test-row-2',
          rowIndex: 2,
          isSelected: mockIsSelected,
          setSelected: mockSetSelected
        },
        event: mockMouseEvent
      };
      handleSelection(mockRowClickedEvent as unknown as RowClickedEvent);

      expect(mockSetSelected).toHaveBeenCalledWith(true, true);
    });

    it('Selects a cell that is being edited (no modifier keys)', () => {
      const mockIsSelected = jest.fn(() => true);
      const mockSetSelected = jest.fn();
      const mockMouseEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });

      const mockRowClickedEvent = {
        api: {
          // No nodes selected
          getSelectedNodes: jest.fn().mockReturnValue([]),
          // No IS being edited
          getEditingCells: jest.fn().mockReturnValue([
            {
              rowIndex: 2
            }
          ])
        },
        node: {
          id: 'test-row-2',
          rowIndex: 2,
          isSelected: mockIsSelected,
          setSelected: mockSetSelected
        },
        event: mockMouseEvent
      };
      handleSelection(mockRowClickedEvent as unknown as RowClickedEvent);

      expect(mockSetSelected).toHaveBeenCalledWith(true);
    });

    it('Selects a row (no modifier keys)', () => {
      const mockIsSelected = jest.fn(() => false);
      const mockSetSelected = jest.fn();
      const mockMouseEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });

      const mockRowClickedEvent = {
        api: {
          // No nodes selected
          getSelectedNodes: jest.fn().mockReturnValue([]),
          // No IS being edited
          getEditingCells: jest.fn().mockReturnValue([])
        },
        node: {
          id: 'test-row-2',
          rowIndex: 2,
          isSelected: mockIsSelected,
          setSelected: mockSetSelected
        },
        event: mockMouseEvent
      };
      handleSelection(mockRowClickedEvent as unknown as RowClickedEvent);

      expect(mockSetSelected).toHaveBeenCalledWith(true);
    });

    it('Deselects a row (no modifier keys)', () => {
      const mockIsSelected = jest.fn(() => true);
      const mockSetSelected = jest.fn();
      const mockMouseEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });

      const mockNode = {
        id: 'test-row-2',
        rowIndex: 2,
        isSelected: mockIsSelected,
        setSelected: mockSetSelected
      };

      const mockRowClickedEvent = {
        api: {
          // No nodes selected
          getSelectedNodes: jest.fn().mockReturnValue([mockNode]),
          // No IS being edited
          getEditingCells: jest.fn().mockReturnValue([])
        },
        node: mockNode,
        event: mockMouseEvent
      };
      handleSelection(mockRowClickedEvent as unknown as RowClickedEvent);

      expect(mockSetSelected).toHaveBeenCalledWith(false);
    });
  });
});
