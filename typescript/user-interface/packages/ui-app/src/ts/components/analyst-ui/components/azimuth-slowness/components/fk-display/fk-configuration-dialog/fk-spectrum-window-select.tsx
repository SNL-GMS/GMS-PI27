import type { FkTypes } from '@gms/common-model';
import { ArrayUtil } from '@gms/common-model';
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
  spectrumWindow: FkTypes.FkWindow;
}

/** Props for {@link FkSpectrumWindowSelect} */
export interface FkSpectrumWindowSelectProps {
  station: Station;
  leadValidationDefs: ValidationDefinition<string, FormTypes.Message>[];
  setWindowLeadValidationMsg: React.Dispatch<React.SetStateAction<FormTypes.Message>>;
  windowDurationValidationDefs: ValidationDefinition<string, FormTypes.Message>[];
  setWindowDurationValidationMessage: React.Dispatch<React.SetStateAction<FormTypes.Message>>;
  updatedFkConfiguration: FkTypes.FkSpectraTemplate;
  setUpdatedFkConfiguration: React.Dispatch<React.SetStateAction<FkTypes.FkSpectraTemplate>>;
}

/** Helper function to convert {@link FkTypes.FkWindow} to label */
const fkSpectrumWindowToString = (fkWindow: FkTypes.FkWindow) =>
  `Lead: ${fkWindow.lead}, Dur: ${fkWindow.duration}`;

/**
 * Form input for choosing the FK Spectrum Window lead/duration values.
 * Includes preconfigured values as well as the option to set custom lead/duration.
 */
export function FkSpectrumWindowSelect({
  station,
  leadValidationDefs,
  setWindowLeadValidationMsg,
  windowDurationValidationDefs,
  setWindowDurationValidationMessage,
  updatedFkConfiguration,
  setUpdatedFkConfiguration
}: FkSpectrumWindowSelectProps) {
  const fkStationTypeConfigurations = useFkStationTypeConfigurations();

  /** FK Spectrum Window definitions representation as strings for the selection dropdown */
  const configuredFkSpectrumWindowOptions = React.useMemo<FkSpectrumWindowSelectOptions[]>(() => {
    // Verify station type exists
    if (Object.keys(fkStationTypeConfigurations).includes(station.type)) {
      return (
        fkStationTypeConfigurations[station.type] as FKStationTypeConfiguration
      ).spectrumWindowDefinitions.map(fkSpectrumWindow => {
        return {
          label: fkSpectrumWindowToString(fkSpectrumWindow),
          spectrumWindow: fkSpectrumWindow
        };
      });
    }
    return [];
  }, [fkStationTypeConfigurations, station.type]);

  /**
   * Appends "Custom" if the selected window lead/duration is not
   * found in the preconfigured options
   */
  const getSelectFkSpectrumWindowLabel = React.useCallback(() => {
    const label = fkSpectrumWindowToString(
      updatedFkConfiguration.fkSpectraParameters.fkSpectrumWindow
    );
    return configuredFkSpectrumWindowOptions.find(fkWinOption => fkWinOption.label === label)
      ? label
      : `Custom: ${label}`;
  }, [
    configuredFkSpectrumWindowOptions,
    updatedFkConfiguration.fkSpectraParameters.fkSpectrumWindow
  ]);

  /**
   * Refentially stable items to pass to the {@link StringSelect} component.
   * This is necessary for proper highlighting within the popup.
   */
  const selectItems = React.useMemo(() => {
    return configuredFkSpectrumWindowOptions.map(fkWinOption => fkWinOption.label);
  }, [configuredFkSpectrumWindowOptions]);

  return (
    <FormGroup
      label="FK Spectrum Window"
      helperText="Defines the time range used for each FK Spectrum computation"
      nestedContent={
        <>
          <FormGroup helperText="FK Spectrum window lead time, in seconds" label="Lead (s)">
            <NumericInput
              className="monospace"
              value={updatedFkConfiguration.fkSpectraParameters.fkSpectrumWindow.lead}
              minorStepSize={1}
              validationDefinitions={leadValidationDefs}
              onChange={val => {
                setUpdatedFkConfiguration(
                  produce(updatedFkConfiguration, draft => {
                    draft.fkSpectraParameters.fkSpectrumWindow.lead = parseInt(val as string, 10);
                  })
                );
              }}
              onError={setWindowLeadValidationMsg}
              tooltip=""
            />
          </FormGroup>
          <FormGroup helperText="FK Spectrum window duration, in seconds" label="Duration (s)">
            <NumericInput
              className="monospace"
              value={updatedFkConfiguration.fkSpectraParameters.fkSpectrumWindow.duration}
              minorStepSize={1}
              validationDefinitions={windowDurationValidationDefs}
              onChange={val => {
                setUpdatedFkConfiguration(
                  produce(updatedFkConfiguration, draft => {
                    draft.fkSpectraParameters.fkSpectrumWindow.duration = parseInt(
                      val as string,
                      10
                    );
                  })
                );
              }}
              onError={setWindowDurationValidationMessage}
              tooltip=""
            />
          </FormGroup>
        </>
      }
    >
      <StringSelect
        fill
        items={selectItems}
        selected={getSelectFkSpectrumWindowLabel()}
        setSelected={val => {
          const { spectrumWindow } = ArrayUtil.findOrThrow(
            configuredFkSpectrumWindowOptions,
            fkWin => fkWin.label === val
          );
          setUpdatedFkConfiguration(
            produce(updatedFkConfiguration, draft => {
              draft.fkSpectraParameters.fkSpectrumWindow.lead = spectrumWindow.lead;
              draft.fkSpectraParameters.fkSpectrumWindow.duration = spectrumWindow.duration;
            })
          );
        }}
      />
    </FormGroup>
  );
}
