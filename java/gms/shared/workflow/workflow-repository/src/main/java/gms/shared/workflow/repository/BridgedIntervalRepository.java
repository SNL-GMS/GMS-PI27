package gms.shared.workflow.repository;

import static java.util.stream.Collectors.toSet;

import gms.shared.workflow.coi.StageInterval;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import gms.shared.workflow.dao.IntervalDao;
import gms.shared.workflow.repository.util.IntervalUtility;
import java.time.Instant;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.apache.commons.lang3.tuple.Pair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/** {@inheritDoc} */
@Component("interval-repository")
public class BridgedIntervalRepository implements IntervalRepository {

  private static final Logger LOGGER = LoggerFactory.getLogger(BridgedIntervalRepository.class);

  private final IntervalDatabaseConnector intervalConnector;
  private final IntervalConverter intervalConverter;

  /**
   * @param intervalConnector See {@link IntervalDatabaseConnector}
   * @param intervalConverter See {@link IntervalConverter}
   */
  @Autowired
  public BridgedIntervalRepository(
      IntervalDatabaseConnector intervalConnector, IntervalConverter intervalConverter) {
    this.intervalConnector = intervalConnector;
    this.intervalConverter = intervalConverter;
  }

  /** {@inheritDoc} */
  @Override
  public Map<String, List<StageInterval>> findStageIntervalsByStageIdAndTime(
      Instant startTime, Instant endTime, Collection<WorkflowDefinitionId> stageIds) {
    LOGGER.debug(
        "Received request to find stage intervals start:{} end:{} stageIds:{}",
        startTime,
        endTime,
        stageIds);

    LOGGER.debug("Retrieving name/type pairs for stage ids");
    var nameTypePairs = getNameTypePairs(stageIds);
    LOGGER.debug("Found {} name/type pairs", nameTypePairs);

    LOGGER.debug("Retrieving legacy intervals...");
    var timeSortedIntervalDaos =
        intervalConnector
            .findIntervalsByNameAndTimeRange(nameTypePairs, startTime, endTime)
            .stream()
            .sorted(
                Comparator.comparing(IntervalDao::getTime)
                    .thenComparing(IntervalDao::getType)
                    .thenComparing(IntervalDao::getName))
            .toList();
    LOGGER.debug("Retrieved {} intervals", timeSortedIntervalDaos.size());

    LOGGER.debug("Converting intervals...");
    Map<String, List<StageInterval>> convertedStageIntervals =
        intervalConverter.convert(timeSortedIntervalDaos, startTime, endTime);
    LOGGER.debug("Converted legacy intervals to {} COI intervals", convertedStageIntervals.size());
    return convertedStageIntervals;
  }

  /**
   * Retrieves {@link StageInterval}s from the database by name, that lie within a given time range,
   * and have been modified after a given time
   *
   * @param startTime Beginning of the time range for retrieval, inclusive
   * @param endTime End of the time range for retrieval, exclusive
   * @param stageIds {@link WorkflowDefinitionId} stage ids for which to retrieve StageIntervals
   * @param modifiedAfter Retrieves intervals modified after this time
   * @return {@link Map} from StageInterval names to StageIntervals
   */
  public Map<String, List<StageInterval>> findStageIntervalsByStageIdAndTime(
      Instant startTime,
      Instant endTime,
      Collection<WorkflowDefinitionId> stageIds,
      Instant modifiedAfter) {
    LOGGER.debug(
        "Received request to find stage intervals start:{} end:{} stageIds:{} modifiedAfter:{}",
        startTime,
        endTime,
        stageIds,
        modifiedAfter);

    LOGGER.debug("Retrieving name/type pairs for stage ids");
    var nameTypePairs = getNameTypePairs(stageIds);
    LOGGER.debug("Found {} name/type pairs", nameTypePairs);

    LOGGER.debug("Retrieving legacy intervals...");
    var timeSortedIntervalDaos =
        intervalConnector
            .findIntervalsByNameAndTimeRangeAfterModDate(
                nameTypePairs, startTime, endTime, modifiedAfter)
            .stream()
            .sorted(
                Comparator.comparing(IntervalDao::getTime)
                    .thenComparing(IntervalDao::getType)
                    .thenComparing(IntervalDao::getName))
            .toList();
    LOGGER.debug("Retrieved {} intervals", timeSortedIntervalDaos.size());

    LOGGER.debug("Converting intervals...");
    Map<String, List<StageInterval>> convertedStageIntervals =
        intervalConverter.convert(timeSortedIntervalDaos, startTime, endTime);
    LOGGER.debug("Converted legacy intervals to {} COI intervals", convertedStageIntervals.size());
    return convertedStageIntervals;
  }

  private static Set<Pair<String, String>> getNameTypePairs(
      Collection<WorkflowDefinitionId> stageIds) {
    return stageIds.stream()
        .map(WorkflowDefinitionId::getName)
        .map(IntervalUtility::getLegacyClassAndName)
        .flatMap(Optional::stream)
        .collect(toSet());
  }
}
