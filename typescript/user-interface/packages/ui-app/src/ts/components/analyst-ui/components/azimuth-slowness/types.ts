import type { FkTypes, SignalDetectionTypes } from '@gms/common-model';
import type GoldenLayout from '@gms/golden-layout';

/**
 * Used to return a super set of the fk configuration from the fk config popover
 */
export interface FkConfigurationWithUnits {
  fkUnitToDisplay: FkTypes.FkUnits;
}

/**
 * Props for the top-level Azimuth Slowness Container
 */
export interface AzimuthSlownessProps {
  /** passed in from golden-layout */
  glContainer?: GoldenLayout.Container;
}

export interface SubscriptionAction {
  (
    list: SignalDetectionTypes.SignalDetection[],
    index: number,
    prev: SignalDetectionTypes.SignalDetection[],
    currentIteree: SignalDetectionTypes.SignalDetection
  ): void;
}

/**
 * State of the AzimuthSlownessPanel
 */
export interface AzimuthSlownessPanelState {
  currentMovieSpectrumIndex: number;
  selectedFkUnit: FkTypes.FkUnits;
  phaseMenuVisibility: boolean;
  draggingDivider: boolean;
  dividerStartX: number;
  minDividerX: number;
  maxDividerX: number;
}
