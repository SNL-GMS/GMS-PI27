package gms.testtools.simulators.bridgeddatasourcesimulator.application.controller;

import static com.google.common.base.Preconditions.checkArgument;
import static com.google.common.base.Preconditions.checkNotNull;
import static com.google.common.base.Preconditions.checkState;

import com.google.common.annotations.VisibleForTesting;
import gms.shared.spring.utilities.webmvc.GmsMediaType;
import gms.testtools.simulators.bridgeddatasourceintervalsimulator.SourceInterval;
import gms.testtools.simulators.bridgeddatasourcesimulator.api.util.DataSimulatorSpec;
import gms.testtools.simulators.bridgeddatasourcesimulator.application.dto.ExceptionSummary;
import gms.testtools.simulators.bridgeddatasourcesimulator.application.service.BridgedDataSourceSimulatorService;
import gms.testtools.simulators.bridgeddatasourcesimulator.application.service.DataSimulatorErrors;
import gms.testtools.simulators.bridgeddatasourcesimulator.application.service.DataSimulatorResult;
import gms.testtools.simulators.bridgeddatasourcesimulator.application.service.DataSimulatorStateMachine;
import gms.testtools.simulators.bridgeddatasourcesimulator.application.service.DataSimulatorStateMachine.State;
import gms.testtools.simulators.bridgeddatasourcesimulator.application.service.SimulatorNotFoundException;
import gms.testtools.simulators.bridgeddatasourcestationsimulator.Site;
import gms.testtools.simulators.bridgeddatasourcestationsimulator.SiteChan;
import io.swagger.v3.oas.annotations.Operation;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicReference;
import org.apache.commons.lang3.Validate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * This is the backing implementation of the restful api defined in {@link DataSimulatorController}
 * and is used the start the Bridged Data Source Simulator Service in {@link
 * BridgedDataSourceSimulatorApplication}.
 */
@RestController
public class BridgedDataSourceSimulatorController {

  private static final Logger logger =
      LoggerFactory.getLogger(BridgedDataSourceSimulatorController.class);

  private final AtomicReference<DataSimulatorErrors> simulatorErrors;
  private final DataSimulatorStateMachine stateMachine;
  private final BridgedDataSourceSimulatorService simulatorService;

  public BridgedDataSourceSimulatorController(
      DataSimulatorStateMachine stateMachine, BridgedDataSourceSimulatorService simulatorService) {
    this.simulatorErrors = new AtomicReference<>(DataSimulatorErrors.empty());
    this.stateMachine = stateMachine;
    this.simulatorService = simulatorService;
  }

  /**
   * Verifies that the state machine can be transitioned to the {@link
   * BridgedDataSourceSimulatorStatus#INITIALIZED} state using the {@link
   * BridgedDataSourceSimulatorTransition#INITIALIZE} transition.
   * BridgedDataSourceSimulatorStateMachine}. If the transition is allowed, then {@link
   * BridgedDataSourceDataSimulator#initialize(BridgedDataSourceSimulatorSpec)} is called on each
   * {@link DataSimulatorController#dataSimulators}
   *
   * @param bridgedDataSourceSimulatorSpec - An {@link DataSimulatorSpec} to provided the simulation
   *     specification details.
   */
  @PostMapping(value = "/initialize", consumes = MediaType.APPLICATION_JSON_VALUE)
  @Operation(summary = "Initializes a simulation based on the provided specification details")
  public void initialize(@RequestBody DataSimulatorSpec bridgedDataSourceSimulatorSpec) {
    checkState(
        stateMachine.isValidTransition(State.INITIALIZING),
        "Cannot initialize simulator in current state %s",
        stateMachine.getCurrentState());

    logger.info("Simulator State Update: Initializing Simulator...");
    stateMachine.transition(State.INITIALIZING);
    simulatorService
        .initialize(bridgedDataSourceSimulatorSpec)
        .collectList()
        .subscribe(
            results ->
                handleResults(
                    results, "initialize", () -> stateMachine.transition(State.INITIALIZED)),
            this::handleError);
  }

  /**
   * Verifies that the the state machine can be transitioned to the {@link
   * BridgedDataSourceSimulatorStatus#STARTED} state using the {@link
   * BridgedDataSourceSimulatorTransition#START} transition. If the transition is allowed, then
   * {@link BridgedDataSourceDataSimulator#start(String)} is called on each {@link
   * DataSimulatorController#dataSimulators}
   */
  @PostMapping("/start")
  @Operation(summary = "Start an initialized simulation")
  public void start() {
    checkState(
        stateMachine.isValidTransition(State.STARTED),
        "Cannot start simulator in current state %s",
        stateMachine.getCurrentState());

    logger.info("Simulator State Update: Starting Simulator...");
    simulatorService
        .start()
        .collectList()
        .subscribe(
            results ->
                handleResults(results, "start", () -> stateMachine.transition(State.STARTED)),
            this::handleError);
  }

  /**
   * Verifies that the the state machine can be transitioned to the {@link
   * BridgedDataSourceSimulatorStatus#STOPPED} state using the {@link
   * BridgedDataSourceSimulatorTransition#STOP} transition. If the transition is allowed, then
   * {@link BridgedDataSourceDataSimulator#stop(String)} is called on each {@link
   * DataSimulatorController#dataSimulators}
   */
  @PostMapping("/stop")
  @Operation(summary = "Stop a started simulation")
  public void stop() {
    checkState(
        stateMachine.isValidTransition(State.STOPPED),
        "Cannot stop simulator in current state %s",
        stateMachine.getCurrentState());
    logger.info("Simulator State Update: Stopping Simulator...");
    simulatorService
        .stop()
        .collectList()
        .subscribe(
            results -> handleResults(results, "stop", () -> stateMachine.transition(State.STOPPED)),
            this::handleError);
  }

  /**
   * Verifies that the the state machine can be transitioned to the {@link
   * BridgedDataSourceSimulatorStatus#UNINITIALIZED} state using the {@link
   * BridgedDataSourceSimulatorTransition#CLEANUP} transition. If the transition is allowed, then
   * {@link BridgedDataSourceDataSimulator#cleanup(String)} is called on each {@link
   * DataSimulatorController#dataSimulators}
   */
  @PostMapping("/cleanup")
  @Operation(summary = "Cleans up an initialized, non running, simulation")
  public void cleanup() {
    checkState(
        stateMachine.isValidTransition(State.UNINITIALIZING),
        "Cannot clean up simulator in current state %s",
        stateMachine.getCurrentState());
    logger.info("Simulator State Update: Cleaning Up Simulator...");
    stateMachine.transition(State.UNINITIALIZING);
    simulatorService
        .cleanup()
        .collectList()
        .subscribe(
            results ->
                handleResults(
                    results, "cleanup", () -> stateMachine.transition(State.UNINITIALIZED)),
            this::handleError);
  }

  @GetMapping(value = "/status", produces = MediaType.APPLICATION_JSON_VALUE)
  @Operation(summary = "Returns the current status of the simulation")
  public State status() {
    logger.info(
        "Simulator State Update: Simulation Status Requested. Status [{}]",
        stateMachine.getCurrentState());
    return stateMachine.getCurrentState();
  }

  @GetMapping(value = "/errors", produces = MediaType.APPLICATION_JSON_VALUE)
  @Operation(summary = "Returns any errors that occurred in the simulator")
  public DataSimulatorErrors errors() {
    logger.info("Simulation Errors Requested.");
    return simulatorErrors.get();
  }

  @PostMapping(
      value = "/store-intervals",
      consumes = {MediaType.APPLICATION_JSON_VALUE, GmsMediaType.APPLICATION_MSGPACK_VALUE})
  @Operation(summary = "Stores the provided intervals in the simulation database")
  public void storeIntervals(@RequestBody List<SourceInterval> intervalList) {
    try {
      simulatorService.storeIntervals(intervalList).block();
    } catch (SimulatorNotFoundException ex) {
      throw new IllegalStateException(ex);
    }
  }

  /**
   * Verifies that simulator is not in {@link BridgedDataSourceSimulatorStatus#UNINITIALIZED} state
   * so that {@link DataSimulatorController#storeNewChannelVersions(Collection<SiteChan>)} can be
   * called
   *
   * @param chans - A collections of SiteChan.
   */
  @PostMapping(
      value = "/store-new-channel-versions",
      consumes = {MediaType.APPLICATION_JSON_VALUE, GmsMediaType.APPLICATION_MSGPACK_VALUE})
  @Operation(summary = "Stores new version of channels")
  public void storeNewChannelVersions(@RequestBody Collection<SiteChan> chans) {
    State currentState = stateMachine.getCurrentState();
    checkState(
        currentState != State.UNINITIALIZED,
        "Cannot store new channel versions if simulator is uninitialized.");
    checkState(
        currentState != State.ERROR,
        "Simulator currently in ERROR state, please see /errors endpoint");
    checkNotNull(chans, "Cannot store null channel versions");
    checkArgument(!chans.isEmpty(), "Cannot store empty channel versions");

    try {
      simulatorService.storeNewChannelVersions(chans).block();
    } catch (SimulatorNotFoundException ex) {
      throw new IllegalStateException(ex);
    }

    logger.info("New Channel Versions stored.");
  }

  /**
   * Verifies that simulator is not in {@link BridgedDataSourceSimulatorStatus#UNINITIALIZED} state
   * so that {@link DataSimulatorController#storeNewSiteVersions(Collection<Site>)} can be called
   *
   * @param sites - A collections of Sites.
   */
  @PostMapping(
      value = "/store-new-site-versions",
      consumes = {MediaType.APPLICATION_JSON_VALUE, GmsMediaType.APPLICATION_MSGPACK_VALUE})
  @Operation(summary = "Stores new version of sites")
  public void storeNewSiteVersions(@RequestBody Collection<Site> sites) {
    var currentState = stateMachine.getCurrentState();
    checkState(
        currentState != State.UNINITIALIZED,
        "Cannot store new site versions if simulator is uninitialized.");
    checkState(
        currentState != State.ERROR,
        "Simulator currently in ERROR state, please see /errors endpoint");
    Objects.requireNonNull(sites, "Cannot store null sites");
    Validate.isTrue(!sites.isEmpty(), "Cannot store empty sites");

    try {
      simulatorService.storeNewSiteVersions(sites).block();
    } catch (SimulatorNotFoundException ex) {
      throw new IllegalStateException(ex);
    }

    logger.info("New Site Versions stored.");
  }

  private <T> void handleResults(
      Collection<DataSimulatorResult<T>> results, String command, Runnable onSuccess) {
    Map<String, ExceptionSummary> errorMap =
        results.stream().collect(DataSimulatorResult.toExceptionSummaryMap());

    if (errorMap.isEmpty()) {
      logger.info("Successfully completed {} command", command);
      resetErrors();
      onSuccess.run();
    } else {
      logger.error("Error(s) running {} command. See /errors endpoint for more details.", command);
      setErrors(DataSimulatorErrors.create(command, errorMap));
      stateMachine.transition(State.ERROR);
    }
  }

  private void handleError(Throwable e) {
    logger.error("Uncaught exception in simulator.", e);
    setErrors(DataSimulatorErrors.create("Runtime", Map.of("Runtime", ExceptionSummary.create(e))));
  }

  @VisibleForTesting
  protected void setErrors(DataSimulatorErrors errors) {
    simulatorErrors.set(errors);
  }

  @VisibleForTesting
  protected void resetErrors() {
    simulatorErrors.set(DataSimulatorErrors.empty());
  }
}
