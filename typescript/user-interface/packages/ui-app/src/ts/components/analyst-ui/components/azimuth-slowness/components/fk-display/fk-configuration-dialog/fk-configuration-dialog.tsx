import type { DialogProps } from '@blueprintjs/core';
import {
  Button,
  ButtonGroup,
  Dialog,
  DialogBody,
  DialogFooter,
  Intent,
  Switch
} from '@blueprintjs/core';
import type { FkTypes, SignalDetectionTypes } from '@gms/common-model';
import { ArrayUtil } from '@gms/common-model';
import type { Filter } from '@gms/common-model/lib/filter';
import type { FormTypes, ValidationDefinition } from '@gms/ui-core-components';
import {
  DialogTitle,
  FormContent,
  FormGroup,
  FormMessage,
  NumericInput
} from '@gms/ui-core-components';
import {
  useEffectiveTime,
  useFkStationTypeConfigurations,
  useGetAllStationsQuery,
  useGetFkSpectraTemplate,
  useLegacyComputeFk
} from '@gms/ui-state';
import { UILogger } from '@gms/ui-util';
import produce from 'immer';
import isEqual from 'lodash/isEqual';
import React from 'react';

import { ChannelSelector } from '~analyst-ui/common/forms/inputs/channel-selector';

import { FkFrequencyBandSelect } from './fk-frequency-band-select';
import { FkPrefilterSelector } from './fk-prefilter-select';
import { FkSpectrumWindowSelect } from './fk-spectrum-window-select';

const logger = UILogger.create(
  'GMS_FK_CONFIGURATION_DIALOG_LOGGER',
  process.env.GMS_FK_CONFIGURATION_DIALOG_LOGGER
);

function DialogWrapper({ isOpen, title, onClose, children, ...rest }: DialogProps) {
  return (
    <Dialog
      canEscapeKeyClose
      canOutsideClickClose
      enforceFocus={false}
      isCloseButtonShown
      isOpen={isOpen}
      onClose={onClose}
      shouldReturnFocusOnClose
      title={title}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...rest}
    >
      {children}
    </Dialog>
  );
}

const isValidConfig = (config: FkTypes.FkSpectraTemplate): config is FkTypes.FkSpectraTemplate => {
  if (typeof config.fkSpectraWindow.duration === 'string') {
    return false;
  }
  if (typeof config.fkSpectraWindow.lead === 'string') {
    return false;
  }
  if (typeof config.fkSpectraParameters.fkFrequencyRange.lowFrequencyHz === 'string') {
    return false;
  }
  if (typeof config.fkSpectraParameters.fkFrequencyRange.highFrequencyHz === 'string') {
    return false;
  }
  // TODO: more validation!
  return true;
};

const useNumericValidator = (
  displayName: string,
  otherValidators: ValidationDefinition<string>[] = []
): [
  FormTypes.Message | undefined,
  React.Dispatch<React.SetStateAction<FormTypes.Message | undefined>>,
  ValidationDefinition<string>[]
] => {
  const [validationMessage, setValidationMessage] = React.useState<FormTypes.Message | undefined>(
    undefined
  );
  const validationDefinitions: ValidationDefinition<string>[] = [
    {
      valueIsInvalid: val => {
        return Number.isNaN(parseFloat(val));
      },
      invalidMessage: {
        summary: `Invalid ${displayName}. Value must be numeric.`,
        intent: 'danger'
      }
    },
    ...otherValidators
  ];
  return [validationMessage, setValidationMessage, validationDefinitions];
};

/**
 * The type of the props for the {@link FkConfigurationDialog} component
 */
export interface FkConfigurationDialogProps {
  readonly displayedSignalDetection: SignalDetectionTypes.SignalDetection;
  readonly isOpen: boolean;
  readonly displayedFkConfiguration: FkTypes.FkSpectraTemplate; // this should be current displayed fk configuration, not from fk-display local state changes
  readonly phase: string;
  readonly setIsOpen: (isOpen: boolean) => void;
}

/**
 * Creates a dialog popup that allows the user to control the configuration for the FK display
 */
export function FkConfigurationDialog({
  isOpen,
  setIsOpen,
  displayedSignalDetection,
  displayedFkConfiguration,
  phase
}: FkConfigurationDialogProps) {
  // local state
  const [updatedFkConfiguration, setUpdatedFkConfiguration] =
    React.useState<FkTypes.FkSpectraTemplate>(displayedFkConfiguration);

  const displayedFkDefaultConfiguration = React.useRef<FkTypes.FkSpectraTemplate | undefined>(
    undefined
  );

  const getFkSpectraTemplate = useGetFkSpectraTemplate();

  React.useEffect(() => {
    setUpdatedFkConfiguration(displayedFkConfiguration);
  }, [displayedFkConfiguration]);

  React.useEffect(() => {
    getFkSpectraTemplate(displayedSignalDetection)
      .then(result => {
        displayedFkDefaultConfiguration.current = result;
      })
      .catch(() =>
        logger.error(
          `Could not load default fk template for displayed sd, ID: ${displayedSignalDetection.id}`
        )
      );
    // ! Only want to do this once when the id changes or the phase changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedSignalDetection.id, phase]);

  const effectiveAt = useEffectiveTime();
  const stationsQuery = useGetAllStationsQuery(effectiveAt);
  const station = ArrayUtil.findOrThrow(
    stationsQuery.data ?? [],
    sta => sta.name === displayedSignalDetection.station.name
  );
  const computeFk = useLegacyComputeFk();

  const fkStationTypeConfigurations = useFkStationTypeConfigurations();
  const filtersByStationType: Filter[] = fkStationTypeConfigurations[`${station?.type}`]?.filters;
  const [windowLeadInvalidMsg, setWindowLeadValidationMsg, leadValidationDefs] =
    useNumericValidator('Lead Time');
  const [
    windowDurationValidationMessage,
    setWindowDurationValidationMessage,
    windowDurationValidationDefs
  ] = useNumericValidator('Window Duration');
  const [
    minFrequencyValidationMessage,
    setMinFrequencyValidationMessage,
    minFrequencyValidationDefs
  ] = useNumericValidator('Low Frequency');
  const [
    maxFrequencyValidationMessage,
    setMaxFrequencyValidationMessage,
    maxFrequencyValidationDefs
  ] = useNumericValidator('High Frequency');
  const [maxSlownessMsg, setMaxSlownessMsg, slownessValidationDefs] = useNumericValidator(
    'Maximum Slowness',
    [
      {
        valueIsInvalid: val => {
          return parseFloat(val) <= 0;
        },
        invalidMessage: {
          summary: 'Invalid maximum slowness. Maximum slowness must be a positive number',
          intent: 'danger'
        }
      }
    ]
  );

  const [numPointsValidationMessage, setNumPointsValidationMessage, numPointsValidationDefs] =
    useNumericValidator('Number of Points', [
      {
        valueIsInvalid: val => {
          return parseFloat(val) % 2 === 0;
        },
        invalidMessage: {
          summary: 'Invalid Number of Points. Value must be odd.',
          intent: 'danger'
        }
      }
    ]);

  const [leadFkSpectrumMsg, setLeadFkSpectrumMsg, leadFkSpectrumValidationDefs] =
    useNumericValidator('FK Spectrum Lead Time', [
      {
        valueIsInvalid: val => {
          return parseFloat(val) < 0;
        },
        invalidMessage: {
          summary:
            'Warning! FK Spectrum Lead Time is negative. This will result in a start time after the reference point.',
          intent: 'warning'
        }
      }
    ]);

  const [fkSpectrumDurationMsg, setFkSpectrumDurationMsg, fkSpectrumDurationValidationDefs] =
    useNumericValidator('FK Spectrum Duration', [
      {
        valueIsInvalid: val => {
          return parseFloat(val) <= 0;
        },
        invalidMessage: {
          summary: 'Invalid FK Spectrum Duration. Value must be positive.',
          intent: 'danger'
        }
      }
    ]);

  const [stepSizeMsg, setStepSizeMsg, stepSizeValidationDefs] = useNumericValidator(
    'FK Spectrum Step Size',
    [
      {
        valueIsInvalid: val => {
          return parseFloat(val) <= 0;
        },
        invalidMessage: {
          summary: 'Invalid FK Spectrum Step Size. Value must be positive.',
          intent: 'danger'
        }
      }
    ]
  );

  const formMessage =
    windowLeadInvalidMsg ??
    windowDurationValidationMessage ??
    minFrequencyValidationMessage ??
    maxFrequencyValidationMessage ??
    maxSlownessMsg ??
    numPointsValidationMessage ??
    fkSpectrumDurationMsg ??
    stepSizeMsg ??
    leadFkSpectrumMsg; // warning message

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleInvalidConfig = (config: FkTypes.FkSpectraTemplate) => {
    // TODO: implement validation and create new error Messages to display
    throw new Error('not yet implemented');
  };

  const onSubmitClickHandler = React.useCallback(async () => {
    if (isValidConfig(updatedFkConfiguration)) {
      await computeFk(updatedFkConfiguration, displayedSignalDetection);
    } else {
      handleInvalidConfig(updatedFkConfiguration);
    }
    setIsOpen(false);
  }, [computeFk, displayedSignalDetection, setIsOpen, updatedFkConfiguration]);

  const onCloseHandler = React.useCallback(() => {
    setUpdatedFkConfiguration(displayedFkConfiguration);
    setIsOpen(false);
  }, [displayedFkConfiguration, setIsOpen]);

  const getSelectedFilter = React.useCallback(() => {
    return filtersByStationType?.find(
      filter =>
        filter.filterDefinition?.name ===
        updatedFkConfiguration?.fkSpectraParameters?.preFilter?.name
    );
  }, [filtersByStationType, updatedFkConfiguration?.fkSpectraParameters?.preFilter?.name]);

  const validChannels = React.useMemo(
    () => displayedFkDefaultConfiguration?.current?.inputChannels ?? [],
    // ! Manually wanting this to fire when input channels change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [displayedFkDefaultConfiguration?.current?.inputChannels]
  );

  const selectedChannels = React.useMemo(
    () =>
      displayedFkDefaultConfiguration?.current?.inputChannels.filter(chan =>
        updatedFkConfiguration.inputChannels.find(inputChan => inputChan.name === chan.name)
      ) ?? [],
    // ! Manually wanting this to fire when input channels change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updatedFkConfiguration.inputChannels, displayedFkDefaultConfiguration?.current?.inputChannels]
  );

  return (
    <DialogWrapper
      isOpen={isOpen}
      onClose={onCloseHandler}
      title={
        <DialogTitle
          titleText="FK Parameters"
          tooltipContent={
            <p>
              Create FK spectra using manually adjusted parameters for the viewable FK. By default,
              FK parameters are set to system configured values for the station and phase.
              Otherwise, FK parameters are updated to last computed values.
            </p>
          }
        />
      }
    >
      <DialogBody className="fk-config-dialog">
        <FormContent className="fk-config-dialog__content">
          {/* Channels */}
          <FormGroup helperText="Channels used to generate the FK." label="Channels">
            <ChannelSelector
              intent={Intent.NONE}
              validChannels={validChannels}
              selectedChannels={selectedChannels}
              onChange={selection => {
                setUpdatedFkConfiguration(
                  produce(updatedFkConfiguration, draft => {
                    draft.inputChannels = selection;
                  })
                );
              }}
            />
          </FormGroup>

          {/* FK Spectrum Window Lead/Duration */}
          <FkSpectrumWindowSelect
            station={station}
            leadValidationDefs={leadValidationDefs}
            setWindowLeadValidationMsg={setWindowLeadValidationMsg}
            windowDurationValidationDefs={windowDurationValidationDefs}
            setWindowDurationValidationMessage={setWindowDurationValidationMessage}
            updatedFkConfiguration={updatedFkConfiguration}
            setUpdatedFkConfiguration={setUpdatedFkConfiguration}
          />

          {/* Prefilter */}
          <FormGroup helperText="Filter to apply before generating FK" label="Prefilter">
            <FkPrefilterSelector
              options={filtersByStationType}
              selectedFilter={getSelectedFilter()}
              setSelectedFilter={filter =>
                setUpdatedFkConfiguration(
                  produce(updatedFkConfiguration, draft => {
                    draft.fkSpectraParameters.preFilter = filter.filterDefinition;
                  })
                )
              }
            />
          </FormGroup>

          {/* Normalize */}
          <FormGroup helperText="Normalize waveforms" label="Normalize">
            <Switch
              checked={updatedFkConfiguration.fkSpectraParameters.normalizeWaveforms}
              label="Normalize"
              onChange={() =>
                setUpdatedFkConfiguration(
                  produce(updatedFkConfiguration, draft => {
                    draft.fkSpectraParameters.normalizeWaveforms =
                      !updatedFkConfiguration.fkSpectraParameters.normalizeWaveforms;
                  })
                )
              }
            />
          </FormGroup>

          {/* FK Band */}
          <FkFrequencyBandSelect
            station={station}
            minFrequencyValidationDefs={minFrequencyValidationDefs}
            setMinFrequencyValidationMessage={setMinFrequencyValidationMessage}
            maxFrequencyValidationDefs={maxFrequencyValidationDefs}
            setMaxFrequencyValidationMessage={setMaxFrequencyValidationMessage}
            updatedFkConfiguration={updatedFkConfiguration}
            setUpdatedFkConfiguration={setUpdatedFkConfiguration}
          />

          {/* Grid Max Slowness/Points */}
          <FormGroup
            label="FK Slowness Grid"
            helperText="A square grid, equally sized and spaced, centered at 0. Min slowness is -max slowness."
          >
            <FormGroup
              helperText="Defines size (max/min) of FK slowness grid"
              label="Max Slowness (s/°)"
            >
              <NumericInput
                className="monospace"
                value={updatedFkConfiguration.fkSpectraParameters.slownessGrid.maxSlowness}
                minorStepSize={1}
                validationDefinitions={slownessValidationDefs}
                onChange={val => {
                  setUpdatedFkConfiguration(
                    produce(updatedFkConfiguration, draft => {
                      draft.fkSpectraParameters.slownessGrid.maxSlowness = parseInt(
                        val as string,
                        10
                      );
                    })
                  );
                }}
                onError={setMaxSlownessMsg}
                tooltip=""
              />
            </FormGroup>
            <FormGroup
              helperText="Determines the resolution of FK slowness grid. Must be odd."
              label="Number of Points"
            >
              <NumericInput
                className="monospace"
                value={updatedFkConfiguration.fkSpectraParameters.slownessGrid.numPoints}
                minorStepSize={1}
                validationDefinitions={numPointsValidationDefs}
                onChange={val => {
                  setUpdatedFkConfiguration(
                    produce(updatedFkConfiguration, draft => {
                      draft.fkSpectraParameters.slownessGrid.numPoints = parseInt(
                        val as string,
                        10
                      );
                    })
                  );
                }}
                onError={setNumPointsValidationMessage}
                tooltip=""
              />
            </FormGroup>
          </FormGroup>

          {/* FK Beam and Traces */}
          <FormGroup
            label="FK Spectra and Beam"
            helperText="The time, duration, and spacing of FK Spectra and beam"
          >
            <FormGroup
              helperText="The start of time range for FK spectra relative to the reference time"
              label="Lead (s)"
            >
              <NumericInput
                className="monospace"
                value={updatedFkConfiguration.fkSpectraWindow.lead}
                minorStepSize={1}
                validationDefinitions={leadFkSpectrumValidationDefs}
                onChange={val => {
                  setUpdatedFkConfiguration(
                    produce(updatedFkConfiguration, draft => {
                      draft.fkSpectraWindow.lead = parseInt(val as string, 10);
                    })
                  );
                }}
                onError={setLeadFkSpectrumMsg}
                tooltip=""
              />
            </FormGroup>
            <FormGroup
              helperText="The duration of time, starting from the lead time for FK Spectra"
              label="Duration (s)"
            >
              <NumericInput
                className="monospace"
                value={updatedFkConfiguration.fkSpectraWindow.duration}
                minorStepSize={1}
                validationDefinitions={fkSpectrumDurationValidationDefs}
                onChange={val => {
                  setUpdatedFkConfiguration(
                    produce(updatedFkConfiguration, draft => {
                      draft.fkSpectraWindow.duration = parseInt(val as string, 10);
                    })
                  );
                }}
                onError={setFkSpectrumDurationMsg}
                tooltip=""
              />
            </FormGroup>
            <FormGroup
              helperText="The time between sequential FK Spectrum in an FK Spectra. Recommended to be less than the FK Spectrum Window Duration"
              label="Step Size (s)"
            >
              <NumericInput
                className="monospace"
                value={updatedFkConfiguration.fkSpectraParameters.spectrumStepDuration}
                minorStepSize={1}
                validationDefinitions={stepSizeValidationDefs}
                onChange={val => {
                  setUpdatedFkConfiguration(
                    produce(updatedFkConfiguration, draft => {
                      draft.fkSpectraParameters.spectrumStepDuration = parseInt(val as string, 10);
                    })
                  );
                }}
                onError={setStepSizeMsg}
                tooltip=""
              />
            </FormGroup>
          </FormGroup>
        </FormContent>
      </DialogBody>

      <DialogFooter
        minimal
        actions={
          <>
            <Button
              className="dialog-footer__button--left"
              disabled={isEqual(updatedFkConfiguration, displayedFkDefaultConfiguration.current)}
              onClick={() => {
                if (displayedFkDefaultConfiguration.current)
                  setUpdatedFkConfiguration(displayedFkDefaultConfiguration.current);
              }}
            >
              Reset To Default
            </Button>
            <ButtonGroup>
              <Button onClick={onCloseHandler}>Cancel</Button>
              <Button
                intent={formMessage?.intent === 'danger' ? 'danger' : 'primary'}
                type="submit"
                disabled={
                  formMessage?.intent === 'danger' ||
                  isEqual(updatedFkConfiguration, displayedFkConfiguration)
                }
                onClick={onSubmitClickHandler}
                title="Update Configuration"
              >
                Compute FK
              </Button>
            </ButtonGroup>
          </>
        }
      >
        {formMessage && <FormMessage message={formMessage} />}
      </DialogFooter>
    </DialogWrapper>
  );
}
