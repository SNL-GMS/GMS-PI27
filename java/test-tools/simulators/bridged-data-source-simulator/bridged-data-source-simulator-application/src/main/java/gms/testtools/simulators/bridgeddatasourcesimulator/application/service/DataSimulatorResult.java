package gms.testtools.simulators.bridgeddatasourcesimulator.application.service;

import static java.util.stream.Collectors.filtering;
import static java.util.stream.Collectors.toMap;

import com.google.auto.value.AutoValue;
import gms.testtools.simulators.bridgeddatasourcesimulator.application.dto.ExceptionSummary;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collector;

@AutoValue
public abstract class DataSimulatorResult<T> {

  public abstract String getSimulatorName();

  public abstract Instant getTimestamp();

  public abstract Optional<T> getResult();

  public abstract Optional<Throwable> getThrowable();

  public static DataSimulatorResult<Void> success(String simulatorName) {
    return create(simulatorName, Instant.now(), Optional.empty(), Optional.empty());
  }

  public static <T> DataSimulatorResult<T> success(String simulatorName, T result) {
    return create(simulatorName, Instant.now(), Optional.of(result), Optional.empty());
  }

  public static <T> DataSimulatorResult<T> error(String simulatorName, Throwable throwable) {
    return create(simulatorName, Instant.now(), Optional.empty(), Optional.of(throwable));
  }

  public static <T> DataSimulatorResult<T> create(
      String simulatorName, Instant timestamp, Optional<T> result, Optional<Throwable> throwable) {
    return new AutoValue_DataSimulatorResult<>(simulatorName, timestamp, result, throwable);
  }

  public static <T>
      Collector<DataSimulatorResult<T>, ?, Map<String, ExceptionSummary>> toExceptionSummaryMap() {
    return filtering(
        result -> result.getThrowable().isPresent(),
        toMap(
            DataSimulatorResult::getSimulatorName,
            result ->
                ExceptionSummary.create(
                    result.getTimestamp(), result.getThrowable().orElseThrow())));
  }

  public static <T> Collector<DataSimulatorResult<T>, ?, Map<String, T>> toResultsMap() {
    return filtering(
        result -> result.getResult().isPresent(),
        toMap(DataSimulatorResult::getSimulatorName, result -> result.getResult().orElseThrow()));
  }
}
