import { DeprecatedToolbar, DeprecatedToolbarTypes } from '@gms/ui-core-components';
import type { AnalystWorkspaceTypes } from '@gms/ui-state';
import React from 'react';

import { MagnitudeConfiguration } from './magnitude-configuration';

const MARGINS_FOR_TOOLBAR_PX = 16;

export interface MagnitudeToolbarProps {
  displayedMagnitudeTypes: AnalystWorkspaceTypes.DisplayedMagnitudeTypes;
  widthPx: number;
  setDisplayedMagnitudeTypes(
    this: void,
    displayedMagnitudeTypes: AnalystWorkspaceTypes.DisplayedMagnitudeTypes
  ): void;
}

/**
 * Generates the toolbar to be used in the magnitude display
 *
 * @param props of type MagnitudeToolbarProps
 */
export function MagnitudeToolbar(props: MagnitudeToolbarProps) {
  const { displayedMagnitudeTypes, setDisplayedMagnitudeTypes, widthPx } = props;
  const dropdownContent = (
    <MagnitudeConfiguration
      displayedMagnitudeTypes={displayedMagnitudeTypes}
      setCategoryAndTypes={types => {
        setDisplayedMagnitudeTypes(types);
      }}
    />
  );
  const dropdownItem: DeprecatedToolbarTypes.PopoverItem = {
    popoverContent: dropdownContent,
    label: 'Magnitude Configuration',
    rank: 1,
    widthPx: 204,
    tooltip: 'Configure the displayed magnitude types',
    type: DeprecatedToolbarTypes.ToolbarItemType.Popover,
    onPopoverDismissed: () => {
      // This empty arrow function is intentional.  This comment satisfies removing a SonarQube's critical issue
    }
  };
  const toolBarItems: DeprecatedToolbarTypes.ToolbarItem[] = [dropdownItem];
  return (
    <DeprecatedToolbar
      toolbarWidthPx={widthPx - MARGINS_FOR_TOOLBAR_PX}
      itemsRight={toolBarItems}
    />
  );
}
