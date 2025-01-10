import { CommonTypes, LegacyEventTypes } from '@gms/common-model';
import type { AnalystWorkspaceTypes } from '@gms/ui-state';

export interface MaskDisplayFilter {
  color: string;
  visible: boolean;
  name: string;
}

/** Initial Mag type */
const initialMagType: AnalystWorkspaceTypes.DisplayedMagnitudeTypes = {};
initialMagType[LegacyEventTypes.MagnitudeType.MB] = true;
initialMagType[LegacyEventTypes.MagnitudeType.MBMLE] = true;
initialMagType[LegacyEventTypes.MagnitudeType.MS] = true;
initialMagType[LegacyEventTypes.MagnitudeType.MSMLE] = true;
Object.freeze(initialMagType);
export interface UserPreferences {
  initialMagType: AnalystWorkspaceTypes.DisplayedMagnitudeTypes;
  map: {
    icons: {
      event: string;
      eventScale: number;
      station: string;
      stationScale: number;
      scaleFactor: number;
      displayDistance: number;
      pixelOffset: number;
    };
    widths: {
      unselectedSignalDetection: number;
      selectedSignalDetection: number;
    };
    defaultTo3D: boolean;
  };
  defaultSignalDetectionPhase: string;
  signalDetectionList: {
    autoFilter: boolean;
    showIds: boolean;
  };
  eventList: {
    showIds: boolean;
    showAssocIds: boolean;
  };
  location: {
    preferredLocationSolutionRestraintOrder: LegacyEventTypes.DepthRestraintType[];
  };
  list: {
    minWidthPx: number;
    widthOfTableMarginsPx: number;
  };
  distanceUnits: CommonTypes.DistanceUnits;
}
export const userPreferences: UserPreferences = {
  initialMagType,
  map: {
    icons: {
      event: 'circle-transition.png',
      eventScale: 0.07,
      station: 'outlined-triangle.png',
      stationScale: 0.12,
      scaleFactor: 1.5,
      displayDistance: 1e6,
      pixelOffset: 15
    },
    widths: {
      unselectedSignalDetection: 1,
      selectedSignalDetection: 3
    },
    defaultTo3D: false
  },
  defaultSignalDetectionPhase: 'P',
  signalDetectionList: {
    autoFilter: true,
    showIds: true
  },
  eventList: {
    showIds: true,
    showAssocIds: false
  },
  location: {
    preferredLocationSolutionRestraintOrder: [
      LegacyEventTypes.DepthRestraintType.UNRESTRAINED,
      LegacyEventTypes.DepthRestraintType.FIXED_AT_SURFACE,
      LegacyEventTypes.DepthRestraintType.FIXED_AT_DEPTH
    ]
  },
  list: {
    minWidthPx: 60,
    widthOfTableMarginsPx: 16
  },
  distanceUnits: CommonTypes.DistanceUnits.degrees
};
