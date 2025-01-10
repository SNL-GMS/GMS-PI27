import React from 'react';

import { DropDown } from '../drop-down';
import { FilterableOptionList } from '../filterable-option-list';
import { TextArea } from '../text-area';
import type * as WidgetTypes from './types';

/**
 * Widget component.
 */
export function Widget({
  type,
  defaultValue,
  params,
  dataCy,
  onMaybeValue
}: WidgetTypes.WidgetProps) {
  const title = params && params.tooltip ? params.tooltip : '';
  const maxChar = params && params.maxChar ? params.maxChar : undefined;
  switch (type) {
    case 'DropDown':
      return (
        <DropDown
          value={defaultValue}
          dropDownItems={params.dropDownItems}
          dropDownText={params.dropDownText}
          onChange={onMaybeValue}
          title={title}
        />
      );
    case 'TextArea':
      return (
        <TextArea
          maxChar={maxChar}
          defaultValue={defaultValue}
          onMaybeValue={onMaybeValue}
          data-cy={dataCy}
          title={title}
        />
      );
    case 'FilterableOptionList':
      return (
        <FilterableOptionList
          options={params.options}
          priorityOptions={params.priorityOptions}
          defaultSelection={defaultValue}
          defaultFilter={params.defaultFilter}
          onSelection={onMaybeValue}
          widthPx={280}
        />
      );
    default:
  }
  return null;
}
