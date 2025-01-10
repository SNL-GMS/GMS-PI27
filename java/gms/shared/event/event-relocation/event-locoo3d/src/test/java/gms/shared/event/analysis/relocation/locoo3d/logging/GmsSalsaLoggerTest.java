package gms.shared.event.analysis.relocation.locoo3d.logging;

import static org.junit.jupiter.params.provider.Arguments.arguments;

import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

@ExtendWith(OutputCaptureExtension.class)
class GmsSalsaLoggerTest {

  @ParameterizedTest
  @MethodSource("loggingMessageLevels")
  void testLoggingMessageLevel(
      GmsSalsaLogger.LoggerLevel loggerLevel,
      String message,
      String prefix,
      CapturedOutput capturedOutput) {
    var logger = new GmsSalsaLogger("Logger", loggerLevel);
    logger.write(message);

    Assertions.assertTrue(capturedOutput.getOut().contains("Logger: " + message));
    Assertions.assertTrue(capturedOutput.getOut().contains(prefix));
  }

  private static Stream<Arguments> loggingMessageLevels() {
    return Stream.of(
        arguments(GmsSalsaLogger.LoggerLevel.INFO, "test message", "INFO"),
        arguments(GmsSalsaLogger.LoggerLevel.WARN, "test message", "WARN"),
        arguments(GmsSalsaLogger.LoggerLevel.ERROR, "test message", "ERROR"),
        arguments(GmsSalsaLogger.LoggerLevel.INFO, "test WARNING message", "WARN"),
        arguments(GmsSalsaLogger.LoggerLevel.INFO, "test ERROR message", "ERROR"));
  }

  @Test
  void testBlankMessage(CapturedOutput capturedOutput) {
    var logger = new GmsSalsaLogger("Logger", GmsSalsaLogger.LoggerLevel.ERROR);
    logger.write("     ");

    Assertions.assertTrue(capturedOutput.getOut().isEmpty());
  }
}
