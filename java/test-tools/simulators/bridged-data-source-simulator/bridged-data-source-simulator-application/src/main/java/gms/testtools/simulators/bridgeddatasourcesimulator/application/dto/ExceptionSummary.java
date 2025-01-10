package gms.testtools.simulators.bridgeddatasourcesimulator.application.dto;

import static com.google.common.base.Preconditions.checkArgument;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import java.time.Instant;
import org.apache.commons.lang3.StringUtils;

@AutoValue
public abstract class ExceptionSummary {

  public abstract Instant getExceptionTime();

  public abstract String getExceptionType();

  public abstract String getMessage();

  public static ExceptionSummary create(Throwable throwable) {
    return create(Instant.now(), throwable.getClass().getName(), throwable.getMessage());
  }

  public static ExceptionSummary create(Instant exceptionTime, Throwable throwable) {
    return create(exceptionTime, throwable.getClass().getName(), throwable.getMessage());
  }

  @JsonCreator
  public static ExceptionSummary create(
      @JsonProperty("exceptionTime") Instant exceptionTime,
      @JsonProperty("exceptionType") String exceptionType,
      @JsonProperty("message") String message) {

    checkArgument(StringUtils.isNotBlank(exceptionType), "Exception type cannot be blank");
    checkArgument(StringUtils.isNotBlank(message), "Message cannot be blank");
    return new AutoValue_ExceptionSummary(exceptionTime, exceptionType, message);
  }
}
