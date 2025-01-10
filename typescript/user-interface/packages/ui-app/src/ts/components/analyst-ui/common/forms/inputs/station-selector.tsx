import type { Intent } from '@blueprintjs/core';
import type { StationTypes } from '@gms/common-model';
import { FormGroup } from '@gms/ui-core-components';
import React from 'react';

import { StringMultiSelect } from './string-multi-select';
/**
 * The type of the props for the {@link StationSelector} component
 */
export interface StationSelectorProps {
  disabled?: boolean;
  helperText: string;
  intent?: Intent | ((value: string, index: number) => Intent);
  placeholder: string;
  validStations: StationTypes.Station[];
  selectedStations: StationTypes.Station[];
  onChange: (selection: StationTypes.Station[]) => void;
}

/**
 * A multiselect input for stations
 */
export function StationSelector({
  disabled,
  helperText,
  intent,
  placeholder,
  validStations,
  selectedStations,
  onChange
}: StationSelectorProps) {
  return (
    <FormGroup helperText={helperText} label="Input Stations">
      <StringMultiSelect
        disabled={disabled}
        intent={intent}
        values={React.useMemo(
          () => validStations?.map(station => station.name) ?? [],
          [validStations]
        )}
        selected={React.useMemo(
          () => selectedStations?.map(station => station.name) ?? [],
          [selectedStations]
        )}
        onChange={React.useCallback(
          selection => {
            const selectableStations = Array.from(new Set([...validStations, ...selectedStations]));
            onChange(selectableStations.filter(s => selection.includes(s.name)));
          },
          [onChange, selectedStations, validStations]
        )}
        placeholder={placeholder}
      />
    </FormGroup>
  );
}
