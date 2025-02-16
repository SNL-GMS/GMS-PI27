package gms.shared.signaldetection.converter.measurementvalues;

import gms.shared.signaldetection.coi.values.AmplitudeMeasurementValue;
import gms.shared.signaldetection.converter.measurementvalue.specs.MeasurementValueSpec;
import gms.shared.signaldetection.dao.css.AmplitudeDao;
import gms.shared.signaldetection.dao.css.enums.AmplitudeUnits;
import gms.shared.stationdefinition.coi.utils.Units;
import java.time.Duration;
import java.util.EnumMap;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class AmplitudeMeasurementValueConverter
    implements MeasurementValueConverter<AmplitudeMeasurementValue> {

  private static EnumMap<AmplitudeUnits, Units> ampUnitsToUnitsMap =
      new EnumMap<>(AmplitudeUnits.class);
  private static final long NANO_SECOND_PER_SECOND = TimeUnit.SECONDS.toNanos(1);
  private static final Logger LOGGER =
      LoggerFactory.getLogger(AmplitudeMeasurementValueConverter.class);

  static {
    ampUnitsToUnitsMap.put(AmplitudeUnits.NM, Units.NANOMETERS);
    ampUnitsToUnitsMap.put(AmplitudeUnits.PASCALS, Units.PASCALS);
    ampUnitsToUnitsMap.put(AmplitudeUnits.HERTZ, Units.HERTZ);
    ampUnitsToUnitsMap.put(AmplitudeUnits.LOG_NM, Units.LOG_NM);
    ampUnitsToUnitsMap.put(AmplitudeUnits.NA, Units.UNITLESS);
  }

  private AmplitudeMeasurementValueConverter() {
    // Hide implicit public constructor
  }

  public static AmplitudeMeasurementValueConverter create() {
    return new AmplitudeMeasurementValueConverter();
  }

  @Override
  public Optional<AmplitudeMeasurementValue> convert(
      MeasurementValueSpec<AmplitudeMeasurementValue> spec) {
    var amplitudeDaoOptional = spec.getAmplitudeDao();
    if (amplitudeDaoOptional.isEmpty()) {
      LOGGER.debug("No amplitude dao found to create AmplitudeMeasurementValue.");
      return Optional.empty();
    } else {
      var amplitudeDao = amplitudeDaoOptional.orElseThrow();
      return buildAmplitudeMeasurementValue(amplitudeDao);
    }
  }

  private static Optional<AmplitudeMeasurementValue> buildAmplitudeMeasurementValue(
      AmplitudeDao amplitudeDao) {
    var units = ampUnitsToUnitsMap.get(amplitudeDao.getUnits());
    if (units == null) {
      LOGGER.debug("No appropriate units found for amplitude.");
      return Optional.empty();
    }

    long periodNanoSeconds = (long) (amplitudeDao.getPeriod() * NANO_SECOND_PER_SECOND);
    var periodDuration = Duration.ofNanos(periodNanoSeconds);
    if (periodDuration.isZero()) {
      LOGGER.debug("Period duration of amplitude dao is zero.");
      return Optional.empty();
    }
    var period = Optional.of(periodDuration);

    var measurementTime = getValueOrEmptyOptional(amplitudeDao::getAmplitudeTime);
    var measurementWindowStart = getValueOrEmptyOptional(amplitudeDao::getTime);
    var measurementWindowDuration = getValueOrEmptyOptional(amplitudeDao::getDuration);

    Optional<Boolean> clipped = Optional.empty();
    var ampClip = amplitudeDao.getClip();
    if (null == ampClip) {
      // if the ClipFlag is not specified, leave it as Optional.empty(); take no action
    } else {
      switch (ampClip) {
        case CLIPPED -> clipped = Optional.of(true);
        case NOT_CLIPPED -> clipped = Optional.of(false);
        default -> {
          // if the ClipFlag is not specified, leave it as Optional.empty(); take no action
        }
      }
    }

    var amplitude = amplitudeDao.getAmplitude();

    return Optional.of(
        AmplitudeMeasurementValue.from(
            amplitude,
            units,
            period,
            measurementTime,
            measurementWindowStart,
            measurementWindowDuration,
            clipped));
  }

  private static <T> Optional<T> getValueOrEmptyOptional(Supplier<T> source) {

    var val = source.get();

    if (val == null) {
      return Optional.empty();
    }
    return Optional.of(val);
  }
}
