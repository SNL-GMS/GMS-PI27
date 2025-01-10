import { IconNames } from '@blueprintjs/icons';
import type { CommonTypes, SignalDetectionTypes } from '@gms/common-model';
import { Endpoints } from '@gms/common-model';
import { capitalizeFirstLetters } from '@gms/common-util';
import type { NonIdealStateDefinition } from '@gms/ui-core-components';
import {
  nonIdealStateWithError,
  nonIdealStateWithNoSpinner,
  nonIdealStateWithSpinner,
  nonIdealStateWithWarning
} from '@gms/ui-core-components';
import type {
  EventsFetchResult,
  OperationalTimePeriodConfigurationQueryProps,
  ProcessingAnalystConfigurationQueryProps,
  ProcessingStationGroupNamesConfigurationQueryProps,
  SignalDetectionFetchResult,
  StationGroupsByNamesQueryProps,
  StationQueryProps,
  UserProfileQuery
} from '@gms/ui-state';

import type { AzimuthSlownessNonIdealStateProps } from '~analyst-ui/components/azimuth-slowness/azimuth-slowness-component';
import type { FkDisplayOrNonIdealStateProps } from '~analyst-ui/components/azimuth-slowness/azimuth-slowness-panel';
import type { WaveformComponentProps } from '~analyst-ui/components/waveform/types';

export const STATUS_CODE_404 = '404';
export const STATUS_CODE_503 = '503';

/**
 * Non ideal state definitions for processingAnalystConfiguration query
 */
export const processingAnalystConfigNonIdealStateDefinitions: NonIdealStateDefinition<unknown>[] = [
  {
    condition: (props: ProcessingAnalystConfigurationQueryProps): boolean => {
      return props.processingAnalystConfigurationQuery?.isLoading;
    },
    element: nonIdealStateWithSpinner('Loading', 'Processing configuration')
  },
  {
    condition: (props: ProcessingAnalystConfigurationQueryProps): boolean => {
      return (
        props.processingAnalystConfigurationQuery?.isError &&
        (props.processingAnalystConfigurationQuery?.error?.message?.includes(STATUS_CODE_404) ||
          props.processingAnalystConfigurationQuery?.error?.message?.includes(STATUS_CODE_503))
      );
    },
    element: nonIdealStateWithError(
      'Error',
      `Unable to communicate with ${capitalizeFirstLetters(
        Endpoints.ProcessingConfigUrls.getProcessingConfiguration.friendlyName
      )} Service`
    )
  },
  {
    condition: (props: ProcessingAnalystConfigurationQueryProps): boolean => {
      return props.processingAnalystConfigurationQuery?.isError;
    },
    element: nonIdealStateWithError('Error', 'Problem loading processing configuration')
  }
];

/**
 * Non ideal state definitions for user profile query
 */
export const userProfileNonIdealStateDefinitions: NonIdealStateDefinition<unknown>[] = [
  {
    condition: (props: { userProfileQuery: UserProfileQuery }): boolean => {
      return props.userProfileQuery?.isLoading;
    },
    element: nonIdealStateWithSpinner('Loading', 'User profile')
  },
  {
    condition: (props: { userProfileQuery: UserProfileQuery }): boolean => {
      return (
        props.userProfileQuery?.isError &&
        (props.userProfileQuery?.error?.message?.includes(STATUS_CODE_404) ||
          props.userProfileQuery?.error?.message?.includes(STATUS_CODE_503))
      );
    },
    element: nonIdealStateWithError(
      'Error',
      `Unable to communicate with ${capitalizeFirstLetters(
        Endpoints.UserManagerServiceUrls.getUserProfile.friendlyName
      )} Service`
    )
  },
  {
    condition: (props: { userProfileQuery: UserProfileQuery }): boolean => {
      return props.userProfileQuery?.isError;
    },
    element: nonIdealStateWithError('Error', 'Problem loading user profile')
  }
];

/**
 * Non ideal state definitions for operationalTimePeriodConfiguration query
 */
export const operationalTimePeriodConfigNonIdealStateDefinitions: NonIdealStateDefinition<unknown>[] =
  [
    {
      condition: (props: OperationalTimePeriodConfigurationQueryProps): boolean => {
        return props.operationalTimePeriodConfigurationQuery?.isLoading;
      },
      element: nonIdealStateWithSpinner('Loading', 'Operational time period configuration')
    },
    {
      condition: (props: OperationalTimePeriodConfigurationQueryProps): boolean => {
        return (
          props.operationalTimePeriodConfigurationQuery?.isError &&
          (props.operationalTimePeriodConfigurationQuery?.error?.message?.includes(
            STATUS_CODE_404
          ) ||
            props.operationalTimePeriodConfigurationQuery?.error?.message?.includes(
              STATUS_CODE_503
            ))
        );
      },
      element: nonIdealStateWithError(
        'Error',
        `Unable to communicate with ${capitalizeFirstLetters(
          Endpoints.ProcessingConfigUrls.getProcessingConfiguration.friendlyName
        )} Service`
      )
    },
    {
      condition: (props: OperationalTimePeriodConfigurationQueryProps): boolean => {
        return props.operationalTimePeriodConfigurationQuery?.isError;
      },
      element: nonIdealStateWithError(
        'Error',
        'Unable to load operational time period configuration'
      )
    },
    {
      condition: (props: OperationalTimePeriodConfigurationQueryProps): boolean => {
        return (
          props.operationalTimePeriodConfigurationQuery?.isSuccess &&
          (props.operationalTimePeriodConfigurationQuery.data?.operationalPeriodStart ===
            undefined ||
            props.operationalTimePeriodConfigurationQuery.data?.operationalPeriodStart === null)
        );
      },
      element: nonIdealStateWithWarning(
        'Invalid Operational Time Period',
        'Start time is not configured'
      )
    },
    {
      condition: (props: OperationalTimePeriodConfigurationQueryProps): boolean => {
        return (
          props.operationalTimePeriodConfigurationQuery?.isSuccess &&
          props.operationalTimePeriodConfigurationQuery.data?.operationalPeriodEnd == null
        );
      },
      element: nonIdealStateWithWarning(
        'Invalid Operational Time Period',
        'End time is not configured'
      )
    },
    {
      condition: (props: OperationalTimePeriodConfigurationQueryProps): boolean => {
        return (
          props.operationalTimePeriodConfigurationQuery?.isSuccess &&
          props.operationalTimePeriodConfigurationQuery.data?.operationalPeriodStart ===
            props.operationalTimePeriodConfigurationQuery.data?.operationalPeriodEnd
        );
      },
      element: nonIdealStateWithWarning(
        'Invalid Operational Time Period',
        'Start time and end time are equal'
      )
    }
  ];

/**
 * Non ideal state definitions for station group query
 */
export const processingStationGroupNamesConfigurationQueryNonIdealStateDefinitions: NonIdealStateDefinition<unknown>[] =
  [
    {
      condition: (props: ProcessingStationGroupNamesConfigurationQueryProps): boolean => {
        return props.processingStationGroupNamesConfigurationQuery?.isLoading;
      },
      element: nonIdealStateWithSpinner('Loading', 'Station GroupNames Configuration')
    },
    {
      condition: (props: ProcessingStationGroupNamesConfigurationQueryProps): boolean => {
        return (
          props.processingStationGroupNamesConfigurationQuery?.isError &&
          (props.processingStationGroupNamesConfigurationQuery?.error?.message?.includes(
            STATUS_CODE_404
          ) ||
            props.processingStationGroupNamesConfigurationQuery?.error?.message?.includes(
              STATUS_CODE_503
            ))
        );
      },
      element: nonIdealStateWithError(
        'Error',
        `Unable to communicate with ${capitalizeFirstLetters(
          Endpoints.ProcessingConfigUrls.getProcessingConfiguration.friendlyName
        )} Service`
      )
    },
    {
      condition: (props: ProcessingStationGroupNamesConfigurationQueryProps): boolean => {
        return props.processingStationGroupNamesConfigurationQuery?.isError;
      },
      element: nonIdealStateWithSpinner(
        'Error',
        'Problem Loading Station Group Names Configuration'
      )
    }
  ];

/**
 * Non ideal state definitions for station group query
 */
export const stationGroupQueryNonIdealStateDefinitions: NonIdealStateDefinition<unknown>[] = [
  {
    condition: (props: StationGroupsByNamesQueryProps): boolean => {
      return props.stationsGroupsByNamesQuery?.isLoading;
    },
    element: nonIdealStateWithSpinner('Loading', 'Station Groups')
  },
  {
    condition: (props: StationGroupsByNamesQueryProps): boolean => {
      return (
        props.stationsGroupsByNamesQuery?.isError &&
        (props.stationsGroupsByNamesQuery?.error?.message?.includes(STATUS_CODE_404) ||
          props.stationsGroupsByNamesQuery?.error?.message?.includes(STATUS_CODE_503))
      );
    },
    element: nonIdealStateWithError(
      'Error',
      `Unable to communicate with ${capitalizeFirstLetters(
        Endpoints.StationDefinitionUrls.getStationGroupsByNames.friendlyName
      )} Service`
    )
  },
  {
    condition: (props: StationGroupsByNamesQueryProps): boolean => {
      return props.stationsGroupsByNamesQuery?.isError;
    },
    element: nonIdealStateWithSpinner('Error', 'Problem Loading Station Groups')
  }
];

/**
 * Non ideal state definitions for events query
 */
export const eventNonIdealStateDefinitions: NonIdealStateDefinition<{
  eventResults: EventsFetchResult;
}>[] = [
  {
    condition: (props: { eventResults: EventsFetchResult }): boolean => {
      return props.eventResults?.isLoading;
    },
    element: nonIdealStateWithSpinner('Loading', 'Events')
  },
  {
    condition: (props: { eventResults: EventsFetchResult }): boolean => {
      const errors = props.eventResults?.error?.map(e => e.code).join(';') ?? '';
      return (
        props.eventResults?.isError &&
        (errors.includes(STATUS_CODE_404) || errors.includes(STATUS_CODE_503))
      );
    },
    element: nonIdealStateWithError(
      'Error',
      `Unable to communicate with ${capitalizeFirstLetters(
        Endpoints.EventManagerUrls.getEventsWithDetectionsAndSegmentsByTime.friendlyName
      )} Service`
    )
  },
  {
    condition: (props: { eventResults: EventsFetchResult }): boolean => {
      return props.eventResults?.isError;
    },
    element: nonIdealStateWithError('Error', 'Problem loading events')
  },
  {
    condition: (props: { eventResults: EventsFetchResult }): boolean => {
      return props.eventResults.data === undefined || props.eventResults.data.length < 1;
    },
    element: nonIdealStateWithNoSpinner(
      'No Event Data',
      'There is no event data available for this interval',
      'exclude-row'
    )
  }
];

/**
 * Non ideal state definitions for signalDetection query
 */
export const signalDetectionsNonIdealStateDefinitions: NonIdealStateDefinition<
  {
    signalDetectionResults: SignalDetectionFetchResult;
  },
  {
    signalDetections: SignalDetectionTypes.SignalDetection[];
  }
>[] = [
  {
    condition: (props: { signalDetectionResults: SignalDetectionFetchResult }): boolean => {
      const errors = props.signalDetectionResults?.error?.map(e => e.code).join(';') ?? '';
      return (
        props.signalDetectionResults?.isError &&
        (errors.includes(STATUS_CODE_404) || errors.includes(STATUS_CODE_503))
      );
    },
    element: nonIdealStateWithError(
      'Error',
      `Unable to communicate with ${capitalizeFirstLetters(
        Endpoints.SignalDetectionManagerUrls.getDetectionsWithSegmentsByStationsAndTime.friendlyName
      )} Service`
    )
  },
  {
    condition: (props: { signalDetectionResults: SignalDetectionFetchResult }): boolean => {
      return props.signalDetectionResults.isError;
    },
    element: nonIdealStateWithError('Error', 'Problem loading signal detections'),
    converter: (props: {
      signalDetectionResults: SignalDetectionFetchResult;
    }): {
      signalDetections: SignalDetectionTypes.SignalDetection[];
    } => {
      return {
        ...props,
        signalDetections: props.signalDetectionResults.data ?? []
      };
    }
  }
];

/**
 * Non ideal state definitions for waveform intervals: viewableInterval
 */
export const waveformIntervalsNonIdealStateDefinitions: NonIdealStateDefinition<unknown>[] = [
  {
    condition: (props: { viewableInterval: CommonTypes.TimeRange }): boolean => {
      return !props.viewableInterval;
    },
    element: nonIdealStateWithSpinner('Initializing', 'Waveform viewable interval')
  }
];

/**
 * Non ideal state definitions for station definition query
 */
export const stationDefinitionNonIdealStateDefinitions: NonIdealStateDefinition<unknown>[] = [
  {
    condition: (props: StationQueryProps): boolean => {
      return props.stationsQuery?.isLoading;
    },
    element: nonIdealStateWithSpinner('Loading', 'Station definitions')
  },
  {
    condition: (props: StationQueryProps): boolean => {
      return (
        props.stationsQuery?.isError &&
        (props.stationsQuery?.error?.message?.includes(STATUS_CODE_404) ||
          props.stationsQuery?.error?.message?.includes(STATUS_CODE_503))
      );
    },
    element: nonIdealStateWithError(
      'Error',
      `Unable to communicate with ${capitalizeFirstLetters(
        Endpoints.StationDefinitionUrls.getStations.friendlyName
      )} Service`
    )
  },
  {
    condition: (props: StationQueryProps): boolean => {
      return props.stationsQuery?.isError;
    },
    element: nonIdealStateWithError('Error', 'Problem loading station definitions')
  },
  {
    condition: (props: StationQueryProps): boolean => {
      return props.stationsQuery.data === undefined || props.stationsQuery.data.length < 1;
    },
    element: nonIdealStateWithNoSpinner(
      'No Station Data',
      'There is no station data available for this interval'
    )
  }
];

/**
 * Non ideal state definitions for predicted phases query
 */
export const predictedPhasesNonIdealStateDefinitions: NonIdealStateDefinition<unknown>[] = [
  {
    condition: (props: WaveformComponentProps): boolean => {
      return !!props.currentOpenEventId && props.featurePredictionQuery?.isLoading;
    },
    element: nonIdealStateWithSpinner('Loading', 'Feature predictions')
  },
  {
    condition: (props: StationQueryProps): boolean => {
      return (
        props.stationsQuery?.isError &&
        (props.stationsQuery?.error?.message?.includes(STATUS_CODE_404) ||
          props.stationsQuery?.error?.message?.includes(STATUS_CODE_503))
      );
    },
    element: nonIdealStateWithError(
      'Error',
      `Unable to communicate with ${capitalizeFirstLetters(
        Endpoints.StationDefinitionUrls.getStations.friendlyName
      )} Service`
    )
  },
  {
    condition: (props: WaveformComponentProps): boolean => {
      return !!props.currentOpenEventId && props.featurePredictionQuery?.isError;
    },
    element: nonIdealStateWithError('Error', 'Problem loading feature predictions')
  },
  {
    condition: (props: WaveformComponentProps): boolean => {
      return (
        !!props.currentOpenEventId &&
        props.featurePredictionQuery?.data?.receiverLocationsByName === undefined
      );
    },
    element: nonIdealStateWithNoSpinner(
      'No Feature Prediction',
      'There is no feature predictions available for this event'
    )
  }
];

/**
 * Non ideal state definitions for the Azimuth Slowness display
 */
export const azimuthSlownessNonIdealStateDefinitions: NonIdealStateDefinition<unknown>[] = [
  {
    condition: (props: AzimuthSlownessNonIdealStateProps): boolean => {
      return (
        !props.openEvent &&
        props.unassociatedSignalDetectionIds.length === 0 &&
        props.associatedSignalDetectionIds.length === 0
      );
    },
    element: nonIdealStateWithNoSpinner(
      'No Open Event',
      "Open an event in the Event or Map Display or use 'Show FK' in the Waveform, " +
        'Signal Detections List, or Map Display to view FKs',
      IconNames.SYMBOL_CIRCLE
    )
  }
];

/**
 * Non ideal state definitions for the FK Display, a subset of the Azimuth Slowness display
 * responsible for showing a single signal detection's FK information
 */
export const fkDisplayNonIdealStateDefinitions: NonIdealStateDefinition<unknown>[] = [
  {
    condition: (props: FkDisplayOrNonIdealStateProps): boolean => {
      return !props.displayedSignalDetection;
    },
    element: nonIdealStateWithNoSpinner('No FK selected', undefined, IconNames.HEAT_GRID)
  },
  {
    condition: (props: FkDisplayOrNonIdealStateProps): boolean => {
      return props.isPending;
    },
    element: nonIdealStateWithSpinner('Loading', 'FK data')
  },
  {
    condition: (props: FkDisplayOrNonIdealStateProps): boolean => {
      return !props.displayedFk && !props.isPending;
    },
    element: nonIdealStateWithNoSpinner('No FK data available', undefined, IconNames.HEAT_GRID)
  }
];

/**
 * Non-ideal state definition for checking that a time range is set
 *
 * @param description optional string to represent data description to be displayed; defaults to `data`
 * @param field optional string to represent prop field to check the time range on; defaults to `timeRange`
 * @param additionalAction optional string to inform the user if they need to perform actions besides just
 * selecting an interval (open an event, select a station, etc)
 * @returns non ideal state
 */
export const timeRangeNonIdealStateDefinitions = (
  description = 'data',
  field = 'timeRange',
  additionalAction = ''
): NonIdealStateDefinition<unknown>[] => {
  const additionalActionMsg = additionalAction ? `and ${additionalAction.trimEnd()} ` : '';
  return [
    {
      condition: (props: { [key: string]: any }): boolean => {
        return (
          field === undefined ||
          field === null ||
          typeof props[field] === 'undefined' ||
          props[field] === undefined ||
          props[field] === null ||
          props[field].endTimeSecs === undefined ||
          props[field].endTimeSecs === null ||
          props[field].startTimeSecs === undefined ||
          props[field].startTimeSecs === null
        );
      },
      element: nonIdealStateWithNoSpinner(
        'No Interval Selected',
        `Select an interval in the Workflow Display ${additionalActionMsg}to view ${description}`,
        IconNames.Select
      )
    }
  ];
};
