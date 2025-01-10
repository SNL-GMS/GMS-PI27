import { ArrayUtil, FkTypes } from '@gms/common-model';
import type { Station } from '@gms/common-model/lib/station-definitions/station-definitions/station-definitions';
import type { FKStationTypeConfiguration } from '@gms/common-model/lib/ui-configuration/types';
import type { FormTypes, ValidationDefinition } from '@gms/ui-core-components';
import { FormGroup, NumericInput } from '@gms/ui-core-components';
import { useFkStationTypeConfigurations } from '@gms/ui-state';
import produce from 'immer';
import React from 'react';

import { StringSelect } from '~analyst-ui/common/forms/inputs/string-select';

/** Internal type */
interface FkSpectrumWindowSelectOptions {
  label: string;
  frequencyBand: FkTypes.FkFrequencyRange;
}

/** Props for {@link FkFrequencyBandSelect} */
export interface FkFrequencyBandSelectProps {
  station: Station;
  minFrequencyValidationDefs: ValidationDefinition<string, FormTypes.Message>[];
  setMinFrequencyValidationMessage: React.Dispatch<React.SetStateAction<FormTypes.Message>>;
  maxFrequencyValidationDefs: ValidationDefinition<string, FormTypes.Message>[];
  setMaxFrequencyValidationMessage: React.Dispatch<React.SetStateAction<FormTypes.Message>>;
  updatedFkConfiguration: FkTypes.FkSpectraTemplate;
  setUpdatedFkConfiguration: React.Dispatch<React.SetStateAction<FkTypes.FkSpectraTemplate>>;
}

/**
 * Form input for choosing the FK frequency band min/max values.
 * Includes preconfigured values as well as the option to set custom min/max.
 */
export function FkFrequencyBandSelect({
  station,
  minFrequencyValidationDefs,
  setMinFrequencyValidationMessage,
  maxFrequencyValidationDefs,
  setMaxFrequencyValidationMessage,
  updatedFkConfiguration,
  setUpdatedFkConfiguration
}: FkFrequencyBandSelectProps) {
  const fkStationTypeConfigurations = useFkStationTypeConfigurations();

  const configuredFkBandOptions = React.useMemo<FkSpectrumWindowSelectOptions[]>(() => {
    // Verify station type exists
    if (Object.keys(fkStationTypeConfigurations).includes(station.type)) {
      return (
        fkStationTypeConfigurations[station.type] as FKStationTypeConfiguration
      ).frequencyBands.map(freqBand => {
        return {
          label: FkTypes.Util.frequencyBandToString(freqBand),
          frequencyBand: freqBand
        };
      });
    }
    return [];
  }, [fkStationTypeConfigurations, station.type]);

  /**
   * Appends "Custom" if the selected window lead/duration is not
   * found in the preconfigured options
   */
  const getSelectFkBandLabel = React.useCallback(() => {
    const label = FkTypes.Util.frequencyBandToString(
      updatedFkConfiguration.fkSpectraParameters.fkFrequencyRange
    );
    return configuredFkBandOptions.find(fkBandOption => fkBandOption.label === label)
      ? label
      : `Custom: ${label}`;
  }, [configuredFkBandOptions, updatedFkConfiguration.fkSpectraParameters.fkFrequencyRange]);

  /**
   * Refentially stable items to pass to the {@link StringSelect} component.
   * This is necessary for proper highlighting within the popup.
   */
  const selectItems = React.useMemo(() => {
    return configuredFkBandOptions.map(freqBandOption => freqBandOption.label);
  }, [configuredFkBandOptions]);

  return (
    <FormGroup
      label="FK Band"
      helperText="Frequency range for the FK"
      nestedContent={
        <>
          <FormGroup helperText="The low end of the FK frequency band range" label="Low (Hz)">
            <NumericInput
              className="monospace"
              value={updatedFkConfiguration.fkSpectraParameters.fkFrequencyRange.lowFrequencyHz}
              minorStepSize={1}
              validationDefinitions={minFrequencyValidationDefs}
              onChange={val => {
                setUpdatedFkConfiguration(
                  produce(updatedFkConfiguration, draft => {
                    draft.fkSpectraParameters.fkFrequencyRange.lowFrequencyHz = val as number;
                  })
                );
              }}
              onError={setMinFrequencyValidationMessage}
              tooltip=""
            />
          </FormGroup>
          <FormGroup helperText="The high end of the FK frequency band range" label="High (Hz)">
            <NumericInput
              className="monospace"
              value={updatedFkConfiguration.fkSpectraParameters.fkFrequencyRange.highFrequencyHz}
              minorStepSize={1}
              validationDefinitions={maxFrequencyValidationDefs}
              onChange={val => {
                setUpdatedFkConfiguration(
                  produce(updatedFkConfiguration, draft => {
                    draft.fkSpectraParameters.fkFrequencyRange.highFrequencyHz = val as number;
                  })
                );
              }}
              onError={setMaxFrequencyValidationMessage}
              tooltip=""
            />
          </FormGroup>
        </>
      }
    >
      <StringSelect
        fill
        items={selectItems}
        selected={getSelectFkBandLabel()}
        setSelected={val => {
          const { frequencyBand } = ArrayUtil.findOrThrow(
            configuredFkBandOptions,
            freqBandOption => freqBandOption.label === val
          );
          setUpdatedFkConfiguration(
            produce(updatedFkConfiguration, draft => {
              draft.fkSpectraParameters.fkFrequencyRange = frequencyBand;
            })
          );
        }}
      />
    </FormGroup>
  );
}
