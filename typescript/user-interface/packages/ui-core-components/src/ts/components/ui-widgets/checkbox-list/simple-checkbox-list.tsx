/* eslint-disable react/destructuring-assignment */
import { Button } from '@blueprintjs/core';
import * as React from 'react';

import { ButtonCheckboxEntry } from './button-checkbox-entry';
import { CheckboxEntry } from './checkbox-entry';
import { ElementCheckboxEntry } from './element-checkbox-entry';
import { IconCheckboxEntry } from './icon-checkbox-entry';
import type { CheckboxListEntry, SimpleCheckboxListProps, SimpleCheckboxListState } from './types';
import {
  isCheckboxListEntryButton,
  isCheckboxListEntryElement,
  isCheckboxListEntryIcon
} from './types';

/**
 * Creates a list of checkboxes with a label and optional color
 */
export class SimpleCheckboxList extends React.Component<
  SimpleCheckboxListProps,
  SimpleCheckboxListState
> {
  public constructor(props: SimpleCheckboxListProps) {
    super(props);
    this.state = {
      checkboxEntriesMap: {}
    };
  }

  // ***************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ***************************************

  /**
   * React lifecycle method that triggers on mount, populates the map state class variable
   */
  public componentDidMount(): void {
    const tempCheckboxEntriesMap: Record<string, CheckboxListEntry> = {};
    this.props.checkBoxListEntries.forEach(entry => {
      tempCheckboxEntriesMap[entry.name] = entry;
    });
    this.setState({ checkboxEntriesMap: tempCheckboxEntriesMap });
  }

  // eslint-disable-next-line react/sort-comp
  public render(): JSX.Element {
    return (
      <div className="checkbox-list__body">
        {this.props.deselectAll ? (
          <Button onClick={() => this.handleDeselectAll()}>Deselect All</Button>
        ) : undefined}
        {this.props.checkBoxListEntries.map(entry => {
          const isChecked = this.state.checkboxEntriesMap[entry.name]
            ? this.state.checkboxEntriesMap[entry.name].isChecked
            : entry.isChecked;
          if (isCheckboxListEntryButton(entry)) {
            return (
              <ButtonCheckboxEntry
                key={entry.name}
                entry={entry}
                isChecked={isChecked}
                onChange={this.updateCheckboxEntriesMap}
              />
            );
          }
          if (isCheckboxListEntryIcon(entry)) {
            return (
              <IconCheckboxEntry
                key={entry.name}
                entry={entry}
                isChecked={isChecked}
                onChange={this.updateCheckboxEntriesMap}
              />
            );
          }
          if (isCheckboxListEntryElement(entry)) {
            return (
              <ElementCheckboxEntry
                key={entry.name}
                entry={entry}
                isChecked={isChecked}
                onChange={this.updateCheckboxEntriesMap}
              />
            );
          }
          return (
            <CheckboxEntry
              key={entry.name}
              entry={entry}
              isChecked={isChecked}
              onChange={this.updateCheckboxEntriesMap}
            />
          );
        })}
      </div>
    );
  }
  // ***************************************
  // END REACT COMPONENT LIFECYCLE METHODS
  // ***************************************

  /**
   * Updates the state and triggers a on change call back to the parent
   *
   * @param entryName name of the text for the checkbox
   * @returns void
   */
  private readonly updateCheckboxEntriesMap = (entryName: string): void => {
    const entry = this.state.checkboxEntriesMap[entryName];
    entry.isChecked = !entry.isChecked;

    if (this.props.onChange) {
      this.props.onChange(entryName);
    }

    this.setState(prevState => {
      const { checkboxEntriesMap } = prevState;
      checkboxEntriesMap[entryName] = entry;
      return { checkboxEntriesMap };
    });
  };

  private readonly handleDeselectAll = (): void => {
    if (this.props.deselectAll) {
      this.props.deselectAll();
    }
  };

  /**
   * Determines currently checked entries names
   * ! Used outside of the class, lint error is not correct
   *
   * @returns string array of checked entry names
   */
  public checkedEntriesNames(): string[] {
    return Object.keys(this.state.checkboxEntriesMap).filter(
      entry => this.state.checkboxEntriesMap[entry].isChecked
    );
  }

  /**
   * Determines currently checked entries ids
   * ! Used outside of the class, lint error is not correct
   *
   * @returns string array of checked entry ids
   */
  public checkedEntriesIds(): string[] {
    const checkedKeys = Object.keys(this.state.checkboxEntriesMap).filter(
      entry => this.state.checkboxEntriesMap[entry].isChecked
    );
    const checkedKeysIds: string[] = [];
    checkedKeys.forEach(key => {
      const checkedKeyId = this.state.checkboxEntriesMap?.[key]?.id;
      if (checkedKeyId !== undefined) {
        checkedKeysIds.push(checkedKeyId);
      }
    });
    return checkedKeysIds;
  }

  /**
   * Determines currently unchecked entries ids
   * ! Used outside of the class, lint error is not correct
   *
   * @returns string array of unchecked entry ids
   */
  public unCheckedEntriesIds(): string[] {
    const unCheckedKeys = Object.keys(this.state.checkboxEntriesMap).filter(
      entry => !this.state.checkboxEntriesMap[entry].isChecked
    );
    const uncheckedKeysIds: string[] = [];
    unCheckedKeys.forEach(key => {
      const uncheckedKeyId = this.state.checkboxEntriesMap?.[key]?.id;
      if (uncheckedKeyId !== undefined) {
        uncheckedKeysIds.push(uncheckedKeyId);
      }
    });
    return uncheckedKeysIds;
  }
}
