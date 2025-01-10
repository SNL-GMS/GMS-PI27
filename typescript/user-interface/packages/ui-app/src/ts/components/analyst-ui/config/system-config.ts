import { LegacyEventTypes, SignalDetectionTypes } from '@gms/common-model';
import type { AnalystWorkspaceTypes } from '@gms/ui-state';
import { WeavessConfiguration, WeavessTypes } from '@gms/weavess-core';
import Immutable from 'immutable';

export enum MagnitudeCategory {
  SURFACE = 'Surface Wave Magnitudes',
  BODY = 'Body Wave Magnitudes'
}

export interface SystemConfig {
  defaultQueuePriority: number;
  defaultSdPhases: string[];
  defaultTablePrecision: number;
  // Phases to display at top of phase selection list
  prioritySdPhases: string[];
  // Phases that should not be displayed in the phase selection list
  excludedSdPhases: string[];
  nonFkSdPhases: string[];
  defaultWeavessConfiguration: WeavesConfiguration;
  additionalSubscriptionTime: number;
  maxCurrentIntervalSecs: number;
  numberOfDefiningLocationBehaviorsRequiredForLocate: number;
  marginForToolbarPx: number;
  measurementMode: MeasurementModeConfig;
  amplitudeTypeForPhase: Map<string, SignalDetectionTypes.AmplitudeType>;
  amplitudeTypeForMagnitude: Map<
    LegacyEventTypes.MagnitudeType,
    SignalDetectionTypes.AmplitudeType
  >;
  magnitudeTypesForPhase: Map<string, LegacyEventTypes.MagnitudeType[]>;
  magnitudeTypeToDisplayName: Map<LegacyEventTypes.MagnitudeType, string>;
  amplitudeTypeToDisplayName: Map<SignalDetectionTypes.AmplitudeType, string>;
  displayedMagnitudesForCategory: Immutable.Map<
    MagnitudeCategory,
    AnalystWorkspaceTypes.DisplayedMagnitudeTypes
  >;
  interactionDelay: {
    extraFast: number;
    fast: number;
    medium: number;
    slow: number;
    extraSlow: number;
  };
  sdUncertainty: {
    fractionDigits: number;
    minUncertainty: number;
  };
}

export interface AmplitudeFilter {
  filterType: string;
  filterPassBandType: string;
  lowFrequencyHz: number;
  highFrequencyHz: number;
}

export interface WeavesConfiguration {
  stationHeightPx: number;
}

export interface EventConfig {
  numberOfWaveforms: number;
  sortType: AnalystWorkspaceTypes.WaveformSortType;
  // specifies the additional data (in seconds) to load
  // when the interval is initially loaded for the event type
  // this only effects the view time interval
  additionalDataToLoad: number;
  additionalEventDataToLoad: number;
}

/**
 * Defines the configuration for the measurement mode
 * within the waveform display.
 */
export interface MeasurementModeConfig {
  phases: string[];
  amplitudeFilter: AmplitudeFilter;
  // In measurement mode, selecting a signal detection automatically zooms in on a ~20
  // second (configurable) time range around that detection in the measure window
  // 7.5 seconds before the detection and 12.5 seconds after
  displayTimeRange: {
    startTimeOffsetFromSignalDetection: number;
    endTimeOffsetFromSignalDetection: number;
  };
  // A ~5 second (configurable) window, determined by lead and lag from the selected signal
  // detection, that indicates the portion of the waveform within which measurements can be made
  selection: {
    id: string;
    startTimeOffsetFromSignalDetection: number;
    endTimeOffsetFromSignalDetection: number;
    lineStyle: WeavessTypes.LineStyle;
    borderColor: string;
    color: string;
    isMoveable: boolean;
  };
  peakTroughSelection: {
    id: string;
    lineStyle: WeavessTypes.LineStyle;
    nonMoveableLineStyle: WeavessTypes.LineStyle;
    borderColor: string;
    color: string;
    isMoveable: boolean; // and the mode is in MEASUREMENT
    warning: {
      // The analyst is warned if they select a peak/trough that
      // is not within the specified range.
      min: number;
      max: number;
      borderColor: string;
      color: string;
      textColor: string;
    };
  };
}
const amplitudeTypeForPhase = new Map<string, SignalDetectionTypes.AmplitudeType>([
  ['P', SignalDetectionTypes.AmplitudeType.AMPLITUDE_A5_OVER_2],
  ['LR', SignalDetectionTypes.AmplitudeType.AMPLITUDE_ALR_OVER_2]
]);
const amplitudeTypeForMagnitude = new Map<
  LegacyEventTypes.MagnitudeType,
  SignalDetectionTypes.AmplitudeType
>([
  [LegacyEventTypes.MagnitudeType.MB, SignalDetectionTypes.AmplitudeType.AMPLITUDE_A5_OVER_2],
  [LegacyEventTypes.MagnitudeType.MBMLE, SignalDetectionTypes.AmplitudeType.AMPLITUDE_A5_OVER_2],
  [LegacyEventTypes.MagnitudeType.MS, SignalDetectionTypes.AmplitudeType.AMPLITUDE_ALR_OVER_2],
  [LegacyEventTypes.MagnitudeType.MSMLE, SignalDetectionTypes.AmplitudeType.AMPLITUDE_ALR_OVER_2]
]);
const magnitudeTypesForPhase = new Map<string, LegacyEventTypes.MagnitudeType[]>([
  ['P', [LegacyEventTypes.MagnitudeType.MB, LegacyEventTypes.MagnitudeType.MBMLE]],
  ['LR', [LegacyEventTypes.MagnitudeType.MS, LegacyEventTypes.MagnitudeType.MSMLE]]
]);

const categoryBody: AnalystWorkspaceTypes.DisplayedMagnitudeTypes = {};
categoryBody[LegacyEventTypes.MagnitudeType.MB] = true;
categoryBody[LegacyEventTypes.MagnitudeType.MBMLE] = true;
categoryBody[LegacyEventTypes.MagnitudeType.MS] = false;
categoryBody[LegacyEventTypes.MagnitudeType.MSMLE] = false;
Object.freeze(categoryBody);

const categorySurface: AnalystWorkspaceTypes.DisplayedMagnitudeTypes = {};
categorySurface[LegacyEventTypes.MagnitudeType.MB] = false;
categorySurface[LegacyEventTypes.MagnitudeType.MBMLE] = false;
categorySurface[LegacyEventTypes.MagnitudeType.MS] = true;
categorySurface[LegacyEventTypes.MagnitudeType.MSMLE] = true;
Object.freeze(categorySurface);

const displayedMagnitudesForCategory = Immutable.Map<
  MagnitudeCategory,
  AnalystWorkspaceTypes.DisplayedMagnitudeTypes
>([
  [MagnitudeCategory.BODY, categoryBody],
  [MagnitudeCategory.SURFACE, categorySurface]
]);

const magnitudeTypeToDisplayName = new Map<LegacyEventTypes.MagnitudeType, string>([
  [LegacyEventTypes.MagnitudeType.MB, 'Mb'],
  [LegacyEventTypes.MagnitudeType.MBMLE, 'Mb MLE'],
  [LegacyEventTypes.MagnitudeType.MS, 'Ms'],
  [LegacyEventTypes.MagnitudeType.MSMLE, 'Ms MLE']
]);

const amplitudeTypeToDisplayName = new Map<SignalDetectionTypes.AmplitudeType, string>([
  [SignalDetectionTypes.AmplitudeType.AMPLITUDE_A5_OVER_2, 'A5/2'],
  [SignalDetectionTypes.AmplitudeType.AMPLITUDE_ALR_OVER_2, 'ARL/2']
]);
/**
 * TODO: Need to rethink SystemConfig and WeavessConfiguration as far where the default configuration
 * values are set, might make sense to look at a common-configuration package
 */

export const systemConfig: SystemConfig = {
  marginForToolbarPx: 16,
  defaultQueuePriority: 10,
  numberOfDefiningLocationBehaviorsRequiredForLocate: 4,
  defaultTablePrecision: 3,
  displayedMagnitudesForCategory,
  amplitudeTypeForPhase,
  amplitudeTypeForMagnitude,
  magnitudeTypesForPhase,
  magnitudeTypeToDisplayName,
  amplitudeTypeToDisplayName,
  defaultSdPhases: [
    'P3KPbc',
    'Pn',
    'Pn',
    'PKKPbc',
    'PKP3bc',
    'Sdiff',
    'PKPdf',
    'PKSbc',
    'SKKSac',
    'sSdiff',
    'PKP2ab',
    'pPdiff',
    'sSKSdf',
    'Pg',
    'PKKSab',
    'P5KPbc_B',
    'sPKPab',
    'P5KPdf_C',
    'Pb',
    'P5KPdf_B',
    'P4KPdf',
    'P7KPbc',
    'PKSab',
    'Pn',
    'SKKPdf',
    'pSKS',
    'pSKSac',
    'sSKS',
    'Sg',
    'P3KPdf',
    'Sb',
    'P7KPbc_B',
    'P7KPdf_C',
    'PKPbc',
    'P7KPbc_C',
    'P7KPdf_B',
    'P5KPbc',
    'Sn',
    'P7KPdf_D',
    'SKKPab',
    'Rg',
    'PKKPab',
    'PKP3ab',
    'sPdiff',
    'PKiKP',
    'PcP',
    'SKSdf',
    'PKPab',
    'PcS',
    'sPKP',
    'SKKPbc',
    'SKS2df',
    'PKP2df',
    'pPKP',
    'sSKSac',
    'PKKSdf',
    'sPKPdf',
    'pPKPdf',
    'P4KPbc',
    'SKSac',
    'pSdiff',
    'P5KPdf',
    'SnSn',
    'pSKSdf',
    'ScP',
    'ScS',
    'Lg',
    'SKPdf',
    'Pdiff',
    'PKP2bc',
    'P4KPdf_B',
    'PKKPdf',
    'PKP3df',
    'sPKiKP',
    'pPKiKP',
    'PKKSbc',
    'pPKPbc',
    'sPKPbc',
    'PKSdf',
    'SKKSac_B',
    'SKPab',
    'SKS2ac',
    'pPKPab',
    'P7KPdf',
    'SKiKP',
    'SKKSdf',
    'P3KPbc_B',
    'SKPbc',
    'PKP3df_B',
    'P3KPdf_B',
    'PmP',
    'SKKP',
    'PKPPKP',
    'SKKS',
    'PP_B',
    'PPP_B',
    'sP',
    'sS',
    'SKSSKS',
    'PKKP',
    'PKKS',
    'SSS_B',
    'SKS2',
    'PKP',
    'PKS',
    'nNL',
    'SP',
    'SS',
    'SKP',
    'SKS',
    'PKP2',
    'PKP3',
    'SSS',
    'SS_B',
    'PPS_B',
    'nP',
    'PPP',
    'PPS',
    'PS',
    'PP',
    'pS',
    'S',
    'P',
    'pP',
    'P3KP',
    'P7KP',
    'LR',
    'LQ',
    'P4KP',
    'N',
    'I',
    'L',
    'NP',
    'NP_1',
    'PP_1',
    'PS_1',
    'SP_1',
    'T',
    'P5KP',
    'tx',
    'Tx',
    'Sx',
    'Px',
    'IPx'
  ],
  prioritySdPhases: ['P', 'Pn', 'Pg', 'S', 'Sn', 'Lg', 'Rg', 'pP', 'sP'],
  excludedSdPhases: ['N', 'NP', 'nP', 'Tx', 'tx', 'Sx', 'IPx', 'PP_1', 'SP_1', 'NP_1'],
  nonFkSdPhases: [],
  defaultWeavessConfiguration: {
    stationHeightPx: 75
  },
  additionalSubscriptionTime: 1800,
  maxCurrentIntervalSecs: 21600, // 6 hours
  interactionDelay: {
    extraFast: 100,
    fast: 250,
    medium: 500,
    slow: 750,
    extraSlow: 1000
  },
  sdUncertainty: {
    fractionDigits: WeavessConfiguration.defaultConfiguration.sdUncertainty.fractionDigits,
    minUncertainty: WeavessConfiguration.defaultConfiguration.sdUncertainty.minUncertainty
  },
  measurementMode: {
    phases: ['P', 'Pg', 'Pn'],
    amplitudeFilter: {
      filterType: 'FIR_HAMMING',
      filterPassBandType: 'BAND_PASS',
      lowFrequencyHz: 1,
      highFrequencyHz: 3
    },
    displayTimeRange: {
      startTimeOffsetFromSignalDetection: -7.5, // 7.5 seconds before
      endTimeOffsetFromSignalDetection: 12.5 // 12.5 seconds
    },
    selection: {
      id: 'selection-measurement-selection-',
      startTimeOffsetFromSignalDetection: -0.5, // 0.5 seconds before
      endTimeOffsetFromSignalDetection: 5, // 5 seconds after
      lineStyle: WeavessTypes.LineStyle.SOLID,
      borderColor: 'rgba(150, 150, 150, 1)',
      color: 'rgba(150, 150, 150, 0.3)',
      isMoveable: false
    },
    peakTroughSelection: {
      id: 'selection-measurement-peaktrough-',
      lineStyle: WeavessTypes.LineStyle.DASHED,
      nonMoveableLineStyle: WeavessTypes.LineStyle.SOLID,
      borderColor: 'rgb(41, 166, 52, 1)', // $forest3 color
      color: 'rgb(41, 166, 52, 0.05)', // $forest3 color
      isMoveable: true,
      warning: {
        // The analyst is warned if they select a peak/trough that
        // is not within the specified range.
        min: 0.4,
        max: 1,
        borderColor: 'rgb(255, 255, 0, 1)',
        color: 'rgb(255, 255, 0, 0.05)',
        textColor: 'rgb(255, 255, 0, 1)'
      }
    }
  }
};
