package gms.shared.signaldetection.api;

import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signalenhancement.api.FilterDefinitionByUsageBySignalDetectionHypothesis;
import java.util.Collection;
import org.apache.commons.lang3.tuple.Pair;

/** The SignalDetectionAccessorBehavior interface definition */
public interface SignalDetectionAccessorBehavior {

  /**
   * Uses the passed in {@link SignalDetectionHypothesis} objects to return a {@link
   * FilterDefinitionByUsageBySignalDetectionHypothesis} object with FilterDefinitions for each
   * provided SignalDetectionHypothesis.
   *
   * @param signalDetectionHypothesis the {@link SignalDetectionHypothesis} objects to pair with
   *     FilterDefinitons
   * @return A {@link Pair<{@link FilterDefinitionByUsageBySignalDetectionHypothesis},Boolean}>}
   *     containing the FilterDefinitionByUsageBySignalDetectionHypothesis and the Boolean flag
   *     whether this found partial results
   */
  Pair<FilterDefinitionByUsageBySignalDetectionHypothesis, Boolean>
      findFilterDefinitionsForSignalDetectionHypotheses(
          Collection<SignalDetectionHypothesis> signalDetectionHypothesis);
}
