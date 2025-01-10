package gms.shared.signaldetection.accessor.behavior;

import static java.util.stream.Collectors.toSet;

import com.google.common.collect.ImmutableTable;
import com.google.common.collect.Table;
import gms.shared.signaldetection.api.SignalDetectionAccessorBehavior;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.repository.BridgedSignalDetectionRepository;
import gms.shared.signalenhancement.api.FilterDefinitionByUsageBySignalDetectionHypothesis;
import gms.shared.stationdefinition.repository.BridgedFilterDefinitionRepository;
import java.util.Collection;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import org.apache.commons.lang3.tuple.Pair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Implementation of the SignalDetectionAccessorBehavior utilizing bridged repository components and
 * logic
 */
@Component
public class BridgedSignalDetectionAccessorBehavior implements SignalDetectionAccessorBehavior {

  private static final Logger LOGGER =
      LoggerFactory.getLogger(BridgedSignalDetectionAccessorBehavior.class);
  private final BridgedSignalDetectionRepository bridgedSignalDetectionRepository;
  private final BridgedFilterDefinitionRepository bridgedFilterDefinitionRepository;

  @Autowired
  public BridgedSignalDetectionAccessorBehavior(
      BridgedSignalDetectionRepository bridgedSignalDetectionRepository,
      BridgedFilterDefinitionRepository bridgedFilterDefinitionRepository) {
    this.bridgedFilterDefinitionRepository = bridgedFilterDefinitionRepository;
    this.bridgedSignalDetectionRepository = bridgedSignalDetectionRepository;
  }

  @Override
  public Pair<FilterDefinitionByUsageBySignalDetectionHypothesis, Boolean>
      findFilterDefinitionsForSignalDetectionHypotheses(
          Collection<SignalDetectionHypothesis> signalDetectionHypothesis) {

    if (signalDetectionHypothesis.isEmpty()) {
      return Pair.of(FilterDefinitionByUsageBySignalDetectionHypothesis.from(List.of()), true);
    }
    var partialResults = new AtomicBoolean(false);

    // get all the FilterRecordIdAndUsage records from the signalDetectionHypotheses
    var filterIdBatchResults =
        bridgedSignalDetectionRepository.findFilterRecordsForSignalDetectionHypotheses(
            signalDetectionHypothesis);

    setPartialResultsFlag(partialResults, filterIdBatchResults.isPartial());
    var filterIdsBySdhAndUsage = filterIdBatchResults.results();

    // get all the possible DefinitionByIdsˆ
    var filterIds = filterIdsBySdhAndUsage.values().stream().collect(toSet());

    // TODO: migrate filter method to return BatchResults
    var filterDefinitionByIds =
        bridgedFilterDefinitionRepository.loadFilterDefinitionsForFilterIds(filterIds);
    setPartialResultsFlag(partialResults, filterDefinitionByIds.size() != filterIds.size());

    // for each of the FilterRecordIdAndUsage get the FilterRecordIdAndUsage records
    var filterDefinitionsBySdhAndUsage =
        filterIdsBySdhAndUsage.cellSet().stream()
            .filter(cell -> filterDefinitionByIds.containsKey(cell.getValue()))
            .collect(
                ImmutableTable.toImmutableTable(
                    Table.Cell::getRowKey,
                    Table.Cell::getColumnKey,
                    cell -> filterDefinitionByIds.get(cell.getValue())));

    return Pair.of(
        FilterDefinitionByUsageBySignalDetectionHypothesis.fromTable(
            filterDefinitionsBySdhAndUsage),
        partialResults.get());
  }

  // helper method to make sure atomic boolean is only set to true once
  // given that it is false, and not set again to false
  private static void setPartialResultsFlag(AtomicBoolean partialResults, boolean isPartial) {
    if (!partialResults.get() && isPartial) {
      partialResults.set(isPartial);
    }
  }
}
