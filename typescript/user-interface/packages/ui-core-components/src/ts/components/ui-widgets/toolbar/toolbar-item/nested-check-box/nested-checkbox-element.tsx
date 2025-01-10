import { Checkbox, Classes, H6, MenuDivider } from '@blueprintjs/core';
import Immutable from 'immutable';
import React from 'react';

export interface NestedCheckboxListRecord {
  key: string;
  displayString?: string;
  children?: NestedCheckboxListRecord[];
}

export interface NestedCheckboxElementProps {
  element: NestedCheckboxListRecord;
  layer: number;
  keyToCheckedRecord: Record<string, boolean>;
  keyToColorRecord?: Record<string, string>;
  enumKeysToDividerMap?: Immutable.Map<string, boolean>;
  enumKeysToLabelMap?: Immutable.Map<string, string>;
  onChange(key: string);
}

const buildColorBox = (key: string, keyToColorRecord: Record<string, string>) => {
  if (keyToColorRecord) {
    return (
      <div
        className={`checkbox-list__legend-box${keyToColorRecord[key] ? ' null-color-swatch' : ''}`}
        style={{
          backgroundColor: keyToColorRecord[key]
        }}
      />
    );
  }
  return undefined;
};

const shouldRenderDivider = (
  key: string,
  enumKeysToDividerMap: Immutable.Map<string, boolean>
): boolean => {
  if (enumKeysToDividerMap) {
    return enumKeysToDividerMap.get(key) || false;
  }
  return false;
};

export function NestedCheckboxElement({
  element,
  layer,
  keyToColorRecord,
  onChange,
  enumKeysToDividerMap,
  enumKeysToLabelMap,
  keyToCheckedRecord
}: NestedCheckboxElementProps) {
  return (
    <React.Fragment key={`${element.key}rf`}>
      {enumKeysToLabelMap?.get(element.key) ? (
        <H6 className={Classes.HEADING}> {enumKeysToLabelMap.get(element.key)}</H6>
      ) : undefined}
      <div
        className="checkbox-list__row"
        key={element.key}
        style={{
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          paddingLeft: `${layer * 15}px`
        }}
      >
        <div className="checkbox-list__box-and-label">
          <Checkbox
            className="checkbox-list__checkbox"
            data-cy={`checkbox-list-${
              // eslint-disable-next-line no-restricted-globals
              isNaN(element.key as any) ? String(element.key) : element.key
            }`}
            data-testid={`checkbox-list-${
              // eslint-disable-next-line no-restricted-globals
              isNaN(element.key as any) ? String(element.key) : element.key
            }`}
            checked={keyToCheckedRecord[element.key]}
            onChange={() => onChange(element.key)}
          >
            <div className="checkbox-list__label">{element.displayString ?? element.key}</div>
            {buildColorBox(element.key, keyToColorRecord || {})}
          </Checkbox>
        </div>
      </div>
      {element.children
        ? element.children.map(childElement => (
            <NestedCheckboxElement
              key={childElement.key}
              element={childElement}
              layer={layer + 1}
              keyToColorRecord={keyToColorRecord}
              onChange={onChange}
              enumKeysToDividerMap={enumKeysToDividerMap}
              keyToCheckedRecord={keyToCheckedRecord}
            />
          ))
        : null}
      {shouldRenderDivider(element.key, enumKeysToDividerMap || Immutable.Map()) ? (
        <MenuDivider />
      ) : undefined}
    </React.Fragment>
  );
}
