import { ChannelTypes, FilterTypes, SignalDetectionTypes } from '@gms/common-model';
import {
  DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION,
  dateToString,
  toDate
} from '@gms/common-util';
import { FormTypes } from '@gms/ui-core-components';
import flatten from 'lodash/flatten';

import { messageConfig } from '~analyst-ui/config/message-config';
import { formatNumberForDisplayFixedThreeDecimalPlaces } from '~common-ui/common/table-utils';

import type { SignalDetectionHistoryRow } from './types';

/**
 * Generate the table row data for the detection history.
 */
export function generateDetectionHistoryTableRows(
  detection: SignalDetectionTypes.SignalDetection
): SignalDetectionHistoryRow[] {
  const rows = flatten(
    detection.signalDetectionHypotheses
      .map(signalDetectionHypo => {
        const phaseFMValue = SignalDetectionTypes.Util.findPhaseFeatureMeasurementValue(
          signalDetectionHypo?.featureMeasurements
        );
        const arrivalTimeFM = SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurement(
          signalDetectionHypo?.featureMeasurements
        );
        const arrivalTimeFMValue = SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurementValue(
          signalDetectionHypo?.featureMeasurements
        );
        return {
          id: signalDetectionHypo.id.id,
          versionId: signalDetectionHypo.id.id, // TODO: what should the version be? (hypo number?)
          creationTimestamp: -1, // TODO: change when field is available for now -1 translates to 'TBD'
          phase: phaseFMValue.value,
          arrivalTimeMeasurementFeatureType:
            SignalDetectionTypes.FeatureMeasurementType.ARRIVAL_TIME,
          arrivalTimeMeasurementTimestamp: arrivalTimeFMValue.arrivalTime.value,
          arrivalTimeMeasurementUncertaintySec: arrivalTimeFMValue.arrivalTime.standardDeviation,
          channelSegmentType: ChannelTypes.Util.parseWaveformChannelType(
            arrivalTimeFM.channel.name
          ),
          authorName: 'TBD',
          deleted: signalDetectionHypo?.deleted ? 'True' : 'False'
        };
      })
      .sort((a, b) => b.arrivalTimeMeasurementTimestamp - a.arrivalTimeMeasurementTimestamp)
  );
  rows[0]['first-in-table'] = true;
  return rows;
}

/**
 * Given a signalDetection, build a list of {@link FormTypes.FormItem}s to be used
 * in the Signal Detection Details menu
 *
 * @param signalDetection Signal Detection to build against
 * @param filterDefinitionByFilterDefinitionUsage Optional filter definitions being used
 * @returns
 */
export function buildSdDetailFormItems(
  signalDetection: SignalDetectionTypes.SignalDetection,
  filterDefinitionByFilterDefinitionUsage?: FilterTypes.FilterDefinitionByFilterDefinitionUsage
): FormTypes.FormItem[] {
  const formItems: FormTypes.FormItem[] = [];
  const sdHypothesis = SignalDetectionTypes.Util.getCurrentHypothesis(
    signalDetection.signalDetectionHypotheses
  );
  const arrivalTimeFM = SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurement(
    sdHypothesis?.featureMeasurements
  );
  const arrivalTimeFMValue = SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurementValue(
    sdHypothesis?.featureMeasurements
  );
  const fmPhase = SignalDetectionTypes.Util.findPhaseFeatureMeasurementValue(
    sdHypothesis?.featureMeasurements
  );

  // Build the arrival uncertainty formatted string
  let arrivalTimeUncertainty = formatNumberForDisplayFixedThreeDecimalPlaces(
    arrivalTimeFMValue.arrivalTime.standardDeviation
  );
  // If a valid fields add 's' seconds unit
  if (arrivalTimeUncertainty !== messageConfig.invalidCellText) {
    arrivalTimeUncertainty = `${arrivalTimeUncertainty}s`;
  }

  formItems.push(
    {
      itemKey: 'Station',
      labelText: 'Station',
      itemType: FormTypes.ItemType.Display,
      displayText: signalDetection.station.name
    },
    {
      itemKey: 'Creation time',
      labelText: 'Creation time',
      itemType: FormTypes.ItemType.Display,
      displayText: 'TBD'
      // displayTextFormat: FormTypes.TextFormats.Time
    },
    {
      itemKey: 'Phase',
      labelText: 'Phase',
      displayText: fmPhase.value ?? 'Unknown',
      itemType: FormTypes.ItemType.Display
    },
    {
      itemKey: 'Detection time',
      labelText: 'Detection time',
      itemType: FormTypes.ItemType.Display,
      className: 'monospace',
      displayText: `${dateToString(
        toDate(arrivalTimeFMValue?.arrivalTime.value),
        DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION
      )} ± ${arrivalTimeUncertainty}`,
      displayTextFormat: FormTypes.TextFormats.Time
    },
    {
      itemKey: 'Channel segment type',
      labelText: 'Channel segment type',
      itemType: FormTypes.ItemType.Display,
      displayText: ChannelTypes.Util.parseWaveformChannelType(arrivalTimeFM.channel.name)
    },
    {
      itemKey: 'Author',
      labelText: 'Author',
      itemType: FormTypes.ItemType.Display,
      displayText: 'TBD'
    },
    {
      itemKey: 'Deleted',
      labelText: 'Deleted',
      itemType: FormTypes.ItemType.Display,
      displayText: SignalDetectionTypes.Util.getCurrentHypothesis(
        signalDetection.signalDetectionHypotheses
      )?.deleted
        ? 'True'
        : 'False'
    }
  );

  if (filterDefinitionByFilterDefinitionUsage) {
    formItems.push(
      {
        itemKey: 'Detection Filter',
        labelText: 'Detection Filter',
        itemType: FormTypes.ItemType.Display,
        displayText:
          filterDefinitionByFilterDefinitionUsage[FilterTypes.FilterDefinitionUsage.DETECTION].name
      },
      {
        itemKey: 'Onset Filter',
        labelText: 'Onset Filter',
        itemType: FormTypes.ItemType.Display,
        displayText:
          filterDefinitionByFilterDefinitionUsage[FilterTypes.FilterDefinitionUsage.ONSET].name
      },
      {
        itemKey: 'FK Filter',
        labelText: 'FK Filter',
        itemType: FormTypes.ItemType.Display,
        displayText:
          filterDefinitionByFilterDefinitionUsage[FilterTypes.FilterDefinitionUsage.FK].name
      }
    );
  }

  return formItems;
}
