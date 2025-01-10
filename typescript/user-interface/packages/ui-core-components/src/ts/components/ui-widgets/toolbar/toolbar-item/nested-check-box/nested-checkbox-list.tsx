import type Immutable from 'immutable';
import React from 'react';

import type { ToolbarItemElement } from '../../types';
import type { NestedCheckboxListRecord } from './nested-checkbox-element';
import { NestedCheckboxElement } from './nested-checkbox-element';

export interface NestedCheckboxListProps {
  checkBoxElements: NestedCheckboxListRecord[];
  keyToCheckedRecord: Record<string, boolean>;
  keyToColorRecord?: Record<any, string>;
  keysToDividerMap?: Immutable.Map<string, boolean>;
  enumKeysToLabelMap?: Immutable.Map<string, string>;
  onChange: (map: Record<string, boolean>) => void;
}

const buildListOfKeys = (element: NestedCheckboxListRecord): string[] => {
  const keys: string[] = [element.key];
  const childrenKeys: string[] | undefined = element.children?.flatMap(child =>
    buildListOfKeys(child)
  );
  return childrenKeys ? keys.concat(childrenKeys) : keys;
};

const shouldChangeParentValue = (
  value: boolean,
  element: NestedCheckboxListRecord,
  keyToCheckedRecord: Record<string, boolean>,
  changedChild: string
) => {
  if (value) {
    // if value is true then we need to add the parent tree to the list
    return true;
  }
  if (!value) {
    // if value is false then we need to check if all other children are false before setting the parent to false
    let shouldParentBeFalse = true;
    element?.children?.forEach(otherChild => {
      if (otherChild.key !== changedChild && keyToCheckedRecord[otherChild.key]) {
        shouldParentBeFalse = false;
      }
    });
    return shouldParentBeFalse;
  }
  return false;
};

const recursiveKeyUpdate = (
  key: string,
  keyToCheckedRecord: Record<string, boolean>,
  element: NestedCheckboxListRecord
): [keys: string[], value: boolean] => {
  let keysToUpdate: string[] = [];
  // if the key is found update the value and all the children
  if (element.key === key) {
    keysToUpdate = buildListOfKeys(element);
    return [keysToUpdate, !keyToCheckedRecord[key]];
  }
  // if there are children search it breaking once we find something
  const keys: string[] = [];
  let value = false;
  if (element.children && element.children.length !== 0) {
    element.children.forEach(child => {
      const [childKeys, newValue] = recursiveKeyUpdate(key, keyToCheckedRecord, child);

      if (childKeys && childKeys.length !== 0) {
        keys.push(...childKeys);
        value = newValue;
        if (shouldChangeParentValue(value, element, keyToCheckedRecord, child.key))
          keys.push(element.key);
      }
    });
  }

  // if no children exist return empty we hit the end of the branch
  return [keys, value];
};

const handleChange = (
  key: string,
  keyToCheckedRecord: Record<string, boolean>,
  checkBoxElements: NestedCheckboxListRecord[],
  setCheckedRecord: (record: Record<string, boolean>) => void,
  onChange: (record: Record<string, boolean>) => void
) => {
  const updatedRecord = { ...keyToCheckedRecord };
  checkBoxElements.forEach(child => {
    const [keys, value] = recursiveKeyUpdate(key, keyToCheckedRecord, child);
    // use withMutations to bundle all these sets into one update
    if (keys && keys.length !== 0)
      keys.forEach(k => {
        updatedRecord[k] = value;
      });
  });
  setCheckedRecord(updatedRecord);
  if (onChange) {
    onChange(updatedRecord);
  }
};

export function NestedCheckboxList({
  checkBoxElements,
  keyToColorRecord,
  keysToDividerMap,
  keyToCheckedRecord,
  enumKeysToLabelMap,
  onChange
}: NestedCheckboxListProps): ToolbarItemElement {
  const [checkedRecord, setCheckedRecord] = React.useState(keyToCheckedRecord);

  const changeHandler = React.useCallback(
    key => handleChange(key, checkedRecord, checkBoxElements, setCheckedRecord, onChange),
    [checkBoxElements, checkedRecord, onChange]
  );

  return (
    <div className="checkbox-list__body">
      {checkBoxElements.map(element => (
        <NestedCheckboxElement
          key={element.key}
          element={element}
          layer={0}
          keyToColorRecord={keyToColorRecord}
          onChange={changeHandler}
          enumKeysToDividerMap={keysToDividerMap}
          keyToCheckedRecord={checkedRecord}
          enumKeysToLabelMap={enumKeysToLabelMap}
        />
      ))}
    </div>
  );
}
