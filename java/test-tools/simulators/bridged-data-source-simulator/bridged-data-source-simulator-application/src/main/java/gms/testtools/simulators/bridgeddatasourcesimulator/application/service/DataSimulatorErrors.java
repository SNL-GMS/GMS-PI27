package gms.testtools.simulators.bridgeddatasourcesimulator.application.service;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.google.auto.value.AutoValue;
import gms.testtools.simulators.bridgeddatasourcesimulator.application.dto.ExceptionSummary;
import java.util.Collections;
import java.util.Map;

/**
 * DTO Class for /errors endpoint, informing clients of errors that have occurred in asynchronous
 * simulator commands
 */
@AutoValue
public abstract class DataSimulatorErrors {

  private static final DataSimulatorErrors EMPTY = create("N/A", Collections.emptyMap());

  public abstract String getCommand();

  public abstract Map<String, ExceptionSummary> getExceptionSummariesBySimulator();

  @JsonCreator
  public static DataSimulatorErrors create(
      String command, Map<String, ExceptionSummary> exceptionSummariesBySimulator) {
    return new AutoValue_DataSimulatorErrors(command, Map.copyOf(exceptionSummariesBySimulator));
  }

  public static DataSimulatorErrors empty() {
    return EMPTY;
  }
}
