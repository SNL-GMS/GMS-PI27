package gms.shared.signaldetection.dao.css.converter;

import com.google.common.math.DoubleMath;
import jakarta.persistence.AttributeConverter;
import java.time.Duration;

public class DurationToDoubleConverter implements AttributeConverter<Duration, Double> {
  private static final long NANOS_PER_SECOND = 1_000_000_000;
  private static final double TOLERANCE = .00001;
  private static final double NULL_VALUE = -1.0;

  @Override
  public Double convertToDatabaseColumn(Duration attribute) {
    if (attribute == null) {
      return NULL_VALUE;
    }

    return (double) attribute.toNanos() / NANOS_PER_SECOND;
  }

  @Override
  public Duration convertToEntityAttribute(Double dbData) {
    if (DoubleMath.fuzzyEquals(NULL_VALUE, dbData, TOLERANCE)) {
      return null;
    }

    return Duration.ofNanos((long) (dbData * NANOS_PER_SECOND));
  }
}
