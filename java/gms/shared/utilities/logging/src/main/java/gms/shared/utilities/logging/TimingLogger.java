package gms.shared.utilities.logging;

import gms.shared.frameworks.utilities.functionalinterfaces.TriFunction;
import java.util.Arrays;
import java.util.function.BiFunction;
import java.util.function.Supplier;
import net.logstash.logback.argument.StructuredArguments;
import net.logstash.logback.marker.Markers;
import org.slf4j.Logger;

public final class TimingLogger<T>
    implements BiFunction<String, Supplier<T>, T>, TriFunction<String, Supplier<T>, String[], T> {

  private static final long MAX_ELAPSED_TIME = 10;
  private final Logger logger;

  private TimingLogger(Logger logger) {
    this.logger = logger;
  }

  public static <T> TimingLogger<T> create(Logger logger) {
    return new TimingLogger<>(logger);
  }

  @Override
  public T apply(String timedMethod, Supplier<T> supplier) {
    long start = System.currentTimeMillis();
    var t = supplier.get();
    long end = System.currentTimeMillis();
    long elapsedTime = end - start;
    if (elapsedTime > MAX_ELAPSED_TIME) {
      logger.info(
          Markers.aggregate(Markers.append("startTime", start), Markers.append("endTime", end)),
          "{} ran in {} milliseconds",
          StructuredArguments.v("methodName", timedMethod),
          StructuredArguments.v("elapsedTime", elapsedTime));
    }
    return t;
  }

  @Override
  public T apply(String timedMethod, Supplier<T> supplier, String[] activeProfiles) {
    if (Arrays.asList(activeProfiles).contains("timing")) {
      return this.apply(timedMethod, supplier);
    }
    return supplier.get();
  }
}
