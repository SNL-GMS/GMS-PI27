package gms.testtools.simulators.bridgeddatasourcesimulator.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.testtools.simulators.bridgeddatasourcesimulator.application.service.DataSimulatorStateMachine.State;
import java.util.Collection;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class DataSimulatorStateMachineTest {

  private DataSimulatorStateMachine simulatorStateMachine;

  @BeforeEach
  void setup() {
    this.simulatorStateMachine = new DataSimulatorStateMachine();
  }

  @Test
  void testFullStartupShutdownCycle() {
    assertDoesNotThrow(() -> simulatorStateMachine.transition(State.INITIALIZING));
    assertDoesNotThrow(() -> simulatorStateMachine.transition(State.INITIALIZED));
    assertDoesNotThrow(() -> simulatorStateMachine.transition(State.STARTED));
    assertDoesNotThrow(() -> simulatorStateMachine.transition(State.STOPPED));
    assertDoesNotThrow(() -> simulatorStateMachine.transition(State.UNINITIALIZING));
    assertDoesNotThrow(() -> simulatorStateMachine.transition(State.UNINITIALIZED));
  }

  @Test
  void testValidCleanupTransitions() {
    simulatorStateMachine.setCurrentState(State.UNINITIALIZED);
    assertDoesNotThrow(() -> simulatorStateMachine.transition(State.UNINITIALIZING));
    assertDoesNotThrow(() -> simulatorStateMachine.transition(State.UNINITIALIZED));

    simulatorStateMachine.setCurrentState(State.INITIALIZED);
    assertDoesNotThrow(() -> simulatorStateMachine.transition(State.UNINITIALIZING));
    assertDoesNotThrow(() -> simulatorStateMachine.transition(State.UNINITIALIZED));

    simulatorStateMachine.setCurrentState(State.STOPPED);
    assertDoesNotThrow(() -> simulatorStateMachine.transition(State.UNINITIALIZING));
    assertDoesNotThrow(() -> simulatorStateMachine.transition(State.UNINITIALIZED));
  }

  @Test
  void testStatesCanTransitionToErrored() {
    for (State state : State.values()) {
      if (!State.ERROR.equals(state)) {
        simulatorStateMachine.setCurrentState(state);
        assertDoesNotThrow(() -> simulatorStateMachine.transition(State.ERROR));
      }
    }
  }

  @Test
  void testTransitionsOutOfErrored() {
    for (State state : List.of(State.UNINITIALIZING, State.STOPPED)) {
      simulatorStateMachine.setCurrentState(State.ERROR);
      assertDoesNotThrow(() -> simulatorStateMachine.transition(state));
    }
  }

  @ParameterizedTest
  @MethodSource("invalidTransitionArguments")
  void testInvalidTransitionThrowsIllegalArgument(
      State currentState, Collection<State> nextStates) {
    simulatorStateMachine.setCurrentState(currentState);

    for (State nextState : nextStates) {
      var thrown =
          assertThrows(
              IllegalArgumentException.class, () -> simulatorStateMachine.transition(nextState));
      assertThat(thrown.getMessage()).contains(currentState.toString(), nextState.toString());
    }
  }

  private static Stream<Arguments> invalidTransitionArguments() {
    return Stream.of(
        arguments(State.UNINITIALIZED, List.of(State.INITIALIZED, State.STARTED, State.STOPPED)),
        arguments(
            State.INITIALIZING,
            List.of(State.UNINITIALIZED, State.STARTED, State.STOPPED, State.UNINITIALIZING)),
        arguments(
            State.INITIALIZED, List.of(State.UNINITIALIZED, State.INITIALIZING, State.STOPPED)),
        arguments(
            State.STARTED,
            List.of(
                State.UNINITIALIZED, State.INITIALIZING, State.INITIALIZED, State.UNINITIALIZING)),
        arguments(
            State.STOPPED, List.of(State.UNINITIALIZED, State.INITIALIZED, State.INITIALIZING)));
  }
}
