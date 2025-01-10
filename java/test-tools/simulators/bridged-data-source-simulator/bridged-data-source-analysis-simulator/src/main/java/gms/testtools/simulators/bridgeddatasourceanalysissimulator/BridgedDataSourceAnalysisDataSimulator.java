package gms.testtools.simulators.bridgeddatasourceanalysissimulator;

import gms.testtools.simulators.bridgeddatasourcesimulator.api.DataSimulator;
import gms.testtools.simulators.bridgeddatasourcesimulator.api.util.DataSimulatorSpec;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import reactor.core.Disposable;
import reactor.core.publisher.Flux;

/**
 * The Bridged Data Source Analysis Data Simulator is responsible for loading analysis data -
 * including waveforms, arrivals, origins, etc. - into the simulation database for a specified
 * simulation by copying and modifying records from the pre-installed seed data set into the
 * simulation data set. The Simulator loads an initial copy of the specified analysis data from the
 * seed set when the simulation is initialized. Once the simulation is started, the Simulator
 * periodically loads additional copies of the specified analysis data from the seed data set to
 * simulate ongoing data processing and storage.
 */
@Component
@Qualifier("analysis") public class BridgedDataSourceAnalysisDataSimulator implements DataSimulator {

  private static final Logger logger =
      LoggerFactory.getLogger(BridgedDataSourceAnalysisDataSimulator.class);

  private final Set<String> orderedStages;
  private List<AnalysisDataSimulator> analysisDataSimulators;
  private final WaveformDataSimulator waveformDataSimulator;
  private final OriginDataSimulator originDataSimulator;
  private final ArrivalDataSimulator arrivalDataSimulator;
  private AnalysisDataIdMapper analysisDataIdMapper;
  private Instant lastDataLoadEndTime;

  private DataSimulatorSpec bridgedDataSourceSimulatorSpec;
  private Disposable loadingDisposable;

  public BridgedDataSourceAnalysisDataSimulator(
      @Qualifier("stages") Set<String> orderedStages,
      WaveformDataSimulator waveformDataSimulator,
      OriginDataSimulator originDataSimulator,
      ArrivalDataSimulator arrivalDataSimulator) {

    this.loadingDisposable = null;
    this.orderedStages = orderedStages;
    this.waveformDataSimulator = waveformDataSimulator;
    this.originDataSimulator = originDataSimulator;
    this.arrivalDataSimulator = arrivalDataSimulator;
  }

  /**
   * Initialize analysis data - including waveforms, arrivals, origins, etc. - for the specified
   * simulation based on the provided spec, copying and modifying data from the seed data set.
   *
   * @param bridgeSimulatorSpec - An {@link DataSimulatorSpec} to provided the simulation
   *     specification details.
   */
  @Override
  public void initialize(DataSimulatorSpec bridgeSimulatorSpec) {

    analysisDataSimulators = new ArrayList<>();
    analysisDataIdMapper = new AnalysisDataIdMapper();

    analysisDataSimulators.add(this.arrivalDataSimulator);
    analysisDataSimulators.add(this.originDataSimulator);

    logger.info("Initializing BridgedDataSourceAnalysisDataSimulator...");
    bridgedDataSourceSimulatorSpec = bridgeSimulatorSpec;

    final Instant seedDataStartTime = bridgedDataSourceSimulatorSpec.getSeedDataStartTime();
    final Instant seedDataEndTime = bridgedDataSourceSimulatorSpec.getSeedDataEndTime();
    final Instant simulationStartTime = bridgeSimulatorSpec.getSimulationStartTime();
    final Duration operationalTimePeriod = bridgeSimulatorSpec.getOperationalTimePeriod();

    final var seedDataSetLength = Duration.between(seedDataStartTime, seedDataEndTime);
    final Duration calibUpdateFrequency = bridgeSimulatorSpec.getCalibUpdateFrequency();
    final var start = Instant.now();

    logger.info(
        "Seed data start time: {} ({})", seedDataStartTime, seedDataStartTime.toEpochMilli());
    logger.info("Seed data end time: {} ({})", seedDataEndTime, seedDataEndTime.toEpochMilli());
    logger.info(
        "Seed data duration: {}ms (={}s ={}m ={}h)",
        seedDataSetLength.toMillis(),
        seedDataSetLength.toSeconds(),
        seedDataSetLength.toMinutes(),
        seedDataSetLength.toHours());
    logger.info(
        "Simulation start time: {} ({})", simulationStartTime, simulationStartTime.toEpochMilli());
    logger.info(
        "Operational time period: {}ms (={}s ={}m ={}h)",
        operationalTimePeriod.toMillis(),
        operationalTimePeriod.toSeconds(),
        operationalTimePeriod.toMinutes(),
        operationalTimePeriod.toHours());
    logger.info(
        "Calibration update frequency: {}ms (={}s ={}m ={}h)",
        calibUpdateFrequency.toMillis(),
        calibUpdateFrequency.toSeconds(),
        calibUpdateFrequency.toMinutes(),
        calibUpdateFrequency.toHours());

    logger.info("Preloading Wfdiscs.");
    waveformDataSimulator.preloadData(
        seedDataStartTime,
        seedDataEndTime,
        simulationStartTime,
        operationalTimePeriod,
        calibUpdateFrequency);

    logger.info("Preload of Wfdiscs into simulation database completed.");

    Instant timeCursor = simulationStartTime;

    logger.info("Loading analysis data up to current wall clock time.");
    while (timeCursor.isBefore(Instant.now())) {
      loadData(seedDataStartTime, seedDataEndTime, timeCursor);
      timeCursor = timeCursor.plus(seedDataSetLength);
    }

    logger.info("Loaded analysis data up to current wall clock time.");
    final var end = Instant.now();
    final var totalTime = Duration.between(start, end);
    logger.info("Initialization completed in {}ms", totalTime.toMillis());
  }

  /**
   * initialize a timer to periodically load additional analysis data (waveforms, arrivals, origins,
   * etc.) into the simulation database from the seed data set.
   */
  @Override
  public void start() {

    Instant seedDataStartTime = bridgedDataSourceSimulatorSpec.getSeedDataStartTime();
    Instant seedDataEndTime = bridgedDataSourceSimulatorSpec.getSeedDataEndTime();

    final var seedDataSetLength = Duration.between(seedDataStartTime, seedDataEndTime);

    var waitBeforeFiring = Duration.between(Instant.now(), lastDataLoadEndTime);

    if (waitBeforeFiring.isNegative()) {
      waitBeforeFiring = Duration.ZERO;
    }

    loadingDisposable =
        Flux.interval(waitBeforeFiring, seedDataSetLength)
            .subscribe(
                value -> {
                  logger.info(
                      "Next load time for entry {} will be at {}",
                      value + 2,
                      lastDataLoadEndTime.plusSeconds(
                          Duration.between(seedDataStartTime, seedDataEndTime).toSeconds()));
                  loadData(seedDataStartTime, seedDataEndTime, Instant.now());
                });
  }

  /**
   * Cancel the timer that periodically loads additional simulation data into the simulation
   * database from the seed data set.
   */
  @Override
  public void stop() {

    if (loadingDisposable != null) {
      loadingDisposable.dispose();
      loadingDisposable = null;
    }
  }

  /**
   * clear the current BridgedDataSourceSimulationSpec and deletes the simulation analysis data
   * (waveforms, arrivals, origins, etc.) from the simulation database (the seed data set is
   * unaffected).
   */
  @Override
  public void cleanup() {

    if (analysisDataSimulators != null) {
      analysisDataSimulators.forEach(AnalysisDataSimulator::cleanup);
    }
    if (waveformDataSimulator != null) {
      waveformDataSimulator.cleanup();
    }
  }

  /**
   * loads Analysis record data into simulator database based on the given parameters.
   *
   * @param seedDataStartTime - start time of seed data to retrieve from bridged database
   * @param seedDataEndTime - end time of seed data to retrieve from bridged database
   * @param copiedDataStartTime - the new start time for the analysis data that will be loaded into
   *     the database
   */
  private void loadData(
      Instant seedDataStartTime, Instant seedDataEndTime, Instant copiedDataStartTime) {
    var copiedDataTimeShift = Duration.between(seedDataStartTime, copiedDataStartTime);

    // load data for new analysis simulators
    waveformDataSimulator.loadData(
        "", seedDataStartTime, seedDataEndTime, copiedDataTimeShift, analysisDataIdMapper);
    for (String stageId : orderedStages) {
      analysisDataSimulators.forEach(
          analysisDataSimulator ->
              analysisDataSimulator.loadData(
                  stageId,
                  seedDataStartTime,
                  seedDataEndTime,
                  copiedDataTimeShift,
                  analysisDataIdMapper));
    }

    lastDataLoadEndTime =
        copiedDataStartTime.plus(
            Duration.between(
                bridgedDataSourceSimulatorSpec.getSeedDataStartTime(),
                bridgedDataSourceSimulatorSpec.getSeedDataEndTime()));

    logger.info(
        "Copied seed data interval [{} to {}] to updated interval [{} to {}]",
        seedDataStartTime,
        seedDataEndTime,
        copiedDataStartTime,
        lastDataLoadEndTime);

    analysisDataIdMapper.clear();
  }
}
