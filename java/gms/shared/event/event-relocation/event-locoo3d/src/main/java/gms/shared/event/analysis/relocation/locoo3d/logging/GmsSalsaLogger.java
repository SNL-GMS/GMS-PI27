package gms.shared.event.analysis.relocation.locoo3d.logging;

import gov.sandia.gmp.util.logmanager.ScreenWriterOutput;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** */
public class GmsSalsaLogger extends ScreenWriterOutput {

  private static final Logger LOGGER = LoggerFactory.getLogger(GmsSalsaLogger.class);
  private final LoggerLevel defaultLoggerLevel;
  private final String loggerName;

  public GmsSalsaLogger(String loggerName, LoggerLevel defaultLoggerLevel) {
    super();

    this.defaultLoggerLevel = defaultLoggerLevel;
    this.loggerName = loggerName;
  }

  @Override
  /**
   * Writes the string s to the LOGGER at the level set by loggerLevel; hijacks the NativeOutput
   * logger to write to GMS log. If the message contains "WARNING" or "ERROR", those levels are used
   * instead. Calls super.write() so that the error log file is created. Only logs non-blank
   * strings; non-blank strings may be written to the text file, however.
   *
   * @param s String to be written
   */
  public void write(String s) {
    super.write(s);

    if (s.isBlank()) {
      return;
    }

    var messageLevel = defaultLoggerLevel;

    if (s.toLowerCase(Locale.ROOT).contains("warning")) {
      messageLevel = LoggerLevel.WARN;
    }

    if (s.toLowerCase(Locale.ROOT).contains("error")) {
      messageLevel = LoggerLevel.ERROR;
    }

    var message = loggerName + ": " + s;

    switch (messageLevel) {
      case INFO -> LOGGER.info(message);
      case WARN -> LOGGER.warn(message);
      case DEBUG -> LOGGER.debug(message);
      case ERROR -> LOGGER.error(message);
    }
  }

  /** Enum of possible logging levels */
  public enum LoggerLevel {
    INFO,
    WARN,
    DEBUG,
    ERROR;
  }
}
