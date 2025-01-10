package gms.shared.utilities.logging;

import static org.mockito.ArgumentMatchers.any;

import java.util.logging.Level;
import net.logstash.logback.argument.StructuredArgument;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;
import org.slf4j.Marker;

@ExtendWith(MockitoExtension.class)
class TimingLoggerTest {
  @Mock private Logger logger;
  @Captor ArgumentCaptor<String> argumentCaptorMessage;
  @Captor ArgumentCaptor<StructuredArgument> loggerArguments;

  @Test
  void testFunctionCalledAndReturned() {
    TimingLogger<Integer> timingLogger = TimingLogger.create(logger);
    Integer result = timingLogger.apply("Returns 50", () -> 50);
    Assertions.assertEquals(50, result);
  }

  @Test
  void testLoggerCalled() {
    TimingLogger<String> timingLogger = TimingLogger.create(logger);
    timingLogger.apply(
        "Method Name",
        () -> {
          try {
            // we only log methods that take longer than 10ms
            Thread.sleep(15);
          } catch (InterruptedException ex) {
            java.util.logging.Logger.getLogger(TimingLoggerTest.class.getName())
                .log(Level.SEVERE, null, ex);
          }
          return "result";
        });
    Mockito.verify(logger)
        .info(any(Marker.class), argumentCaptorMessage.capture(), loggerArguments.capture(), any());
    Assertions.assertEquals(
        "{} ran in {} milliseconds", argumentCaptorMessage.getAllValues().get(0));
    Assertions.assertEquals("Method Name", loggerArguments.getAllValues().get(0).toString());
  }

  @Test
  void testLoggerNotCalled() {
    TimingLogger<String> timingLogger = TimingLogger.create(logger);
    timingLogger.apply("Method Name", () -> "result");

    Assertions.assertEquals(
        0, argumentCaptorMessage.getAllValues().size(), "Ne lessages should be logged");
  }
}
