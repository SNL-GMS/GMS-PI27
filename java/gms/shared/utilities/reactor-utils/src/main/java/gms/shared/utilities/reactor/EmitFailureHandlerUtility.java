package gms.shared.utilities.reactor;

import java.util.concurrent.locks.LockSupport;
import org.apache.commons.math3.random.RandomDataGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import reactor.core.publisher.SignalType;
import reactor.core.publisher.Sinks;

public final class EmitFailureHandlerUtility implements Sinks.EmitFailureHandler {

  private static final Logger LOGGER = LoggerFactory.getLogger(EmitFailureHandlerUtility.class);

  private static final RandomDataGenerator sinkFuzzer = new RandomDataGenerator();

  private static final long MIN_PARK_NANOS = 100;
  private static final long MAX_PARK_NANOS = 1000;

  private static EmitFailureHandlerUtility instance = new EmitFailureHandlerUtility();

  private EmitFailureHandlerUtility() {}

  /**
   * Returns an instance of the EmitFailureHandlerUtility
   *
   * @return the EmitFailureHandlerUtility
   */
  public static EmitFailureHandlerUtility getInstance() {
    return instance;
  }

  /**
   * A common EmitFailure handler for reactor Sinks emmitNext
   *
   * @param signalType The signalType
   * @param emitResult The emitResult
   * @return boolean if the operation should be retried
   */
  @Override
  public boolean onEmitFailure(SignalType signalType, Sinks.EmitResult emitResult) {
    if (Sinks.EmitResult.FAIL_NON_SERIALIZED == emitResult) {
      LOGGER.debug("Concurrent emission occurred, parking and retrying...");
      LockSupport.parkNanos(sinkFuzzer.nextLong(MIN_PARK_NANOS, MAX_PARK_NANOS));
      return true;
    } else {
      LOGGER.debug("Error {} encountered while emitting", emitResult);
      return false;
    }
  }
}
