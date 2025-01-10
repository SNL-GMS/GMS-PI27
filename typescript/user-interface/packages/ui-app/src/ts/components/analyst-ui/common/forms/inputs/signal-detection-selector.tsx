import type { SignalDetectionTypes } from '@gms/common-model';
import { FormGroup } from '@gms/ui-core-components';
import React from 'react';

import { getSignalDetectionLabel } from '~analyst-ui/common/utils/signal-detection-util';

import { StringMultiSelect } from './string-multi-select';

/**
 * The type of the props for the {@link SignalDetectionSelector} component
 */
export interface SignalDetectionSelectorProps {
  disabled?: boolean;
  helperText: string;
  placeholder: string;
  validSignalDetections: SignalDetectionTypes.SignalDetection[];
  selectedSignalDetections: SignalDetectionTypes.SignalDetection[];
  onChange: (selection: SignalDetectionTypes.SignalDetection[]) => void;
}

/**
 * A multiselect input for signal detections
 */
export function SignalDetectionSelector({
  disabled,
  helperText,
  placeholder,
  validSignalDetections,
  selectedSignalDetections,
  onChange
}: SignalDetectionSelectorProps) {
  return (
    <FormGroup helperText={helperText} label="Input Signal Detections">
      <StringMultiSelect
        disabled={disabled}
        values={React.useMemo(
          () => validSignalDetections?.map(getSignalDetectionLabel) ?? [],
          [validSignalDetections]
        )}
        selected={React.useMemo(
          () => selectedSignalDetections?.map(getSignalDetectionLabel) ?? [],
          [selectedSignalDetections]
        )}
        onChange={React.useCallback(
          selection => {
            onChange(
              validSignalDetections.filter(s => selection.includes(getSignalDetectionLabel(s)))
            );
          },
          [onChange, validSignalDetections]
        )}
        placeholder={placeholder}
      />
    </FormGroup>
  );
}
