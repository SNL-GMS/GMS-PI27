import { H5 } from '@blueprintjs/core';
import type { CheckboxListEntry } from '@gms/ui-core-components';
import { SimpleCheckboxList } from '@gms/ui-core-components';
import React from 'react';

/**
 * settingsEntries refers to an array of CheckboxListEntries that make up the body of the settings panel
 * onCheckedCallback takes the name of the checked/unchecked box as an argument
 */
export interface MapLayerSettingsPopoutProps {
  settingsEntries: CheckboxListEntry[];
  onCheckedCallback;
}

/**
 * Used to construct the layer settings popout content on the ian map
 *
 * @param props
 * @constructor
 */
export function MapLayerSettingsPopout(props: MapLayerSettingsPopoutProps) {
  const { settingsEntries, onCheckedCallback } = props;
  return (
    <div className="layer-panel-content__container">
      <div className="layer-panel-content--header">
        <H5>Layer Settings</H5>
      </div>
      <div className="layer-panel-content--checkbox-list">
        <SimpleCheckboxList checkBoxListEntries={settingsEntries} onChange={onCheckedCallback} />
      </div>
    </div>
  );
}
