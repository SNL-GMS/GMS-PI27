import type { SignalDetectionTypes } from '@gms/common-model';
import { getCurrentHypothesis } from '@gms/common-model/lib/signal-detection/util';
import { UILogger } from '@gms/ui-util';
import type { WritableDraft } from 'immer/dist/internal';

const logger = UILogger.create('GMS_SIGNAL_DETECTION', process.env.GMS_SIGNAL_DETECTION);

/**
 * Returns true if there is a working signal detection hypothesis for the provided signal detection.
 *
 * @param signalDetection the signal detection to check if it has a working hypothesis.
 * @returns true if the signal detection has a working hypothesis; false otherwise
 */
export const hasWorkingSignalDetectionHypothesis = (
  signalDetection: SignalDetectionTypes.SignalDetection
): boolean => {
  return signalDetection._uiHasUnsavedChanges !== undefined;
};

/**
 * Returns the working signal detection hypothesis for the provided signal detection.
 * !throws an exception if the event does not have a working hypothesis
 *
 * @param signalDetection the signal detection to retrieve its working event hypothesis
 * @returns the working hypothesis
 */
export const getWorkingSignalDetectionHypothesis = (
  signalDetection: WritableDraft<SignalDetectionTypes.SignalDetection>
): WritableDraft<SignalDetectionTypes.SignalDetectionHypothesis> => {
  if (hasWorkingSignalDetectionHypothesis(signalDetection)) {
    const signalDetectionHypothesis = getCurrentHypothesis(
      signalDetection.signalDetectionHypotheses
    );
    if (!signalDetectionHypothesis) {
      logger.error(
        `Failed to find Signal Detection Hypothesis ${signalDetection.id} in state cannot update signal detection.`,
        signalDetection
      );
      throw new Error(
        `Failed to find Signal Detection Hypothesis ${signalDetection.id} in state cannot update signal detection.`
      );
    }
    return signalDetectionHypothesis;
  }

  logger.error(`Failed to get working event hypothesis`, signalDetection);
  throw new Error(`Failed to get working event hypothesis: ${signalDetection.id}`);
};
