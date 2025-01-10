package gms.testtools.simulators.bridgeddatasourcesimulator.application.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;

import gms.testtools.simulators.bridgeddatasourceintervalsimulator.SourceInterval;
import gms.testtools.simulators.bridgeddatasourcesimulator.application.dto.ExceptionSummary;
import gms.testtools.simulators.bridgeddatasourcesimulator.application.fixtures.BridgedDataTestFixtures;
import gms.testtools.simulators.bridgeddatasourcesimulator.application.service.BridgedDataSourceSimulatorService;
import gms.testtools.simulators.bridgeddatasourcesimulator.application.service.DataSimulatorErrors;
import gms.testtools.simulators.bridgeddatasourcesimulator.application.service.DataSimulatorStateMachine;
import gms.testtools.simulators.bridgeddatasourcesimulator.application.service.DataSimulatorStateMachine.State;
import gms.testtools.simulators.bridgeddatasourcesimulator.application.service.SimulatorNotFoundException;
import gms.testtools.simulators.bridgeddatasourcestationsimulator.Site;
import gms.testtools.simulators.bridgeddatasourcestationsimulator.SiteChan;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@ExtendWith(MockitoExtension.class)
class BridgedDataSourceSimulatorControllerTest {

  @Mock private DataSimulatorStateMachine stateMachine;

  @Mock private BridgedDataSourceSimulatorService simulatorService;

  private BridgedDataSourceSimulatorController simulatorController;

  @BeforeEach
  void setup() {
    simulatorController = new BridgedDataSourceSimulatorController(stateMachine, simulatorService);
  }

  @Test
  void testInitialize() {
    var simulatorSpec = BridgedDataTestFixtures.simulatorSpec();
    given(stateMachine.isValidTransition(State.INITIALIZING)).willReturn(true);
    given(simulatorService.initialize(simulatorSpec)).willReturn(Flux.empty());
    assertDoesNotThrow(() -> simulatorController.initialize(simulatorSpec));
    verify(stateMachine).transition(State.INITIALIZING);
    verify(simulatorService).initialize(simulatorSpec);
    verifyNoMoreInteractions(simulatorService);
  }

  @Test
  void testStart() {
    given(stateMachine.isValidTransition(State.STARTED)).willReturn(true);
    given(simulatorService.start()).willReturn(Flux.empty());
    assertDoesNotThrow(() -> simulatorController.start());
    verify(simulatorService).start();
    verifyNoMoreInteractions(simulatorService);
  }

  @Test
  void testStop() {
    given(stateMachine.isValidTransition(State.STOPPED)).willReturn(true);
    given(simulatorService.stop()).willReturn(Flux.empty());
    assertDoesNotThrow(() -> simulatorController.stop());
    verify(simulatorService).stop();
    verifyNoMoreInteractions(simulatorService);
  }

  @Test
  void testCleanup() {
    given(stateMachine.isValidTransition(State.UNINITIALIZING)).willReturn(true);
    given(simulatorService.cleanup()).willReturn(Flux.empty());
    assertDoesNotThrow(() -> simulatorController.cleanup());
    verify(stateMachine).transition(State.UNINITIALIZING);
    verify(simulatorService).cleanup();
    verifyNoMoreInteractions(simulatorService);
  }

  @ParameterizedTest
  @MethodSource("getStoreSiteVersionArguments")
  void testStoreNewSiteVersionsValidation(
      Consumer<DataSimulatorStateMachine> mockSetup,
      Class<? extends Exception> expectedException,
      String expectedMessage,
      List<Site> sites) {

    mockSetup.accept(stateMachine);
    Exception exception =
        assertThrows(expectedException, () -> simulatorController.storeNewSiteVersions(sites));
    assertEquals(expectedMessage, exception.getMessage());
    verifyNoMoreInteractions(simulatorService);
  }

  static Stream<Arguments> getStoreSiteVersionArguments() {
    Consumer<DataSimulatorStateMachine> invalidStateSetup =
        stateMachine -> given(stateMachine.getCurrentState()).willReturn(State.UNINITIALIZED);
    Consumer<DataSimulatorStateMachine> validStatusSetup =
        stateMachine -> given(stateMachine.getCurrentState()).willReturn(State.INITIALIZED);

    return Stream.of(
        arguments(
            invalidStateSetup,
            IllegalStateException.class,
            "Cannot store new site versions if simulator is uninitialized.",
            BridgedDataTestFixtures.sites()),
        arguments(validStatusSetup, NullPointerException.class, "Cannot store null sites", null),
        arguments(
            validStatusSetup,
            IllegalArgumentException.class,
            "Cannot store empty sites",
            List.of()));
  }

  @Test
  void testStoreNewSiteVersions() throws SimulatorNotFoundException {
    List<Site> sites = BridgedDataTestFixtures.sites();
    given(stateMachine.getCurrentState()).willReturn(State.INITIALIZED);
    given(simulatorService.storeNewSiteVersions(sites)).willReturn(Mono.empty());

    simulatorController.storeNewSiteVersions(sites);
    verify(simulatorService).storeNewSiteVersions(sites);
    verifyNoMoreInteractions(simulatorService);
  }

  @ParameterizedTest
  @MethodSource("getStoreChannelVersionArguments")
  void testStoreChannelVersionsValidation(
      Consumer<DataSimulatorStateMachine> mockSetup,
      Class<? extends Exception> expectedException,
      String expectedMessage,
      List<SiteChan> siteChans) {

    mockSetup.accept(stateMachine);
    Exception exception =
        assertThrows(
            expectedException, () -> simulatorController.storeNewChannelVersions(siteChans));
    assertEquals(expectedMessage, exception.getMessage());
    verifyNoMoreInteractions(simulatorService);
  }

  static Stream<Arguments> getStoreChannelVersionArguments() {
    Consumer<DataSimulatorStateMachine> invalidStateSetup =
        stateMachine -> given(stateMachine.getCurrentState()).willReturn(State.UNINITIALIZED);
    Consumer<DataSimulatorStateMachine> validStatusSetup =
        stateMachine -> given(stateMachine.getCurrentState()).willReturn(State.INITIALIZED);

    return Stream.of(
        arguments(
            invalidStateSetup,
            IllegalStateException.class,
            "Cannot store new channel versions if simulator is uninitialized.",
            BridgedDataTestFixtures.siteChans()),
        arguments(
            validStatusSetup,
            NullPointerException.class,
            "Cannot store null channel versions",
            null),
        arguments(
            validStatusSetup,
            IllegalArgumentException.class,
            "Cannot store empty channel versions",
            List.of()));
  }

  @Test
  void testStoreNewChannelVersions() throws SimulatorNotFoundException {
    List<SiteChan> siteChans = BridgedDataTestFixtures.siteChans();
    given(stateMachine.getCurrentState()).willReturn(State.INITIALIZED);
    given(simulatorService.storeNewChannelVersions(siteChans)).willReturn(Mono.empty());
    simulatorController.storeNewChannelVersions(siteChans);
    verify(simulatorService).storeNewChannelVersions(siteChans);
    verifyNoMoreInteractions(simulatorService);
  }

  @Test
  void testStoreIntervals() throws SimulatorNotFoundException {
    List<SourceInterval> sourceIntervals = BridgedDataTestFixtures.sourceIntervals();
    given(simulatorService.storeIntervals(sourceIntervals)).willReturn(Mono.empty());
    simulatorController.storeIntervals(sourceIntervals);
    verify(simulatorService).storeIntervals(sourceIntervals);
    verifyNoMoreInteractions(simulatorService);
  }

  /** Test of status method, of class BridgedDataSourceSimulatorControllerImpl. */
  @Test
  public void testStatus() {
    given(stateMachine.getCurrentState()).willReturn(State.STARTED);
    assertThat(simulatorController.status()).isEqualTo(State.STARTED);
  }

  /** Test of errors method, of class BridgedDataSourceSimulatorControllerImpl. */
  @Test
  public void testErrors() {
    assertThat(simulatorController.errors()).isEqualTo(DataSimulatorErrors.empty());
    var errors =
        DataSimulatorErrors.create(
            "FAKE", Map.of("FAKE", ExceptionSummary.create(new IllegalArgumentException("FAKE"))));
    simulatorController.setErrors(errors);
    assertThat(simulatorController.errors()).isEqualTo(errors);
    simulatorController.resetErrors();
    assertThat(simulatorController.errors()).isEqualTo(DataSimulatorErrors.empty());
  }
}
