package gms.shared.frameworks.configuration.repository.client;

/**
 * Exception type for classifying failures related to configuration resolution.
 *
 * <p>This can include: - Configuration object resolution failure (JSON -> Java) - Failure in
 * converting resolved configuration objects into internal COI (Java -> Java)
 */
public class ConfigurationResolutionException extends RuntimeException {

  private static final String UNKNOWN_CONTEXT = "UNKNOWN";

  private final String ctx;

  private ConfigurationResolutionException() {
    ctx = UNKNOWN_CONTEXT;
  }

  /**
   * Constructs an instance of <code>ConfigurationResolutionException</code> with the specified
   * detail message and cause.
   *
   * @param msg the detail message.
   * @param context Context for the failed configuration resolution e.g.
   *     'configuration.context.specific-configuration'
   */
  public ConfigurationResolutionException(String msg, String context) {
    super(msg);
    ctx = context;
  }

  /**
   * Constructs an instance of <code>ConfigurationResolutionException</code> with the specified
   * detail message and cause.
   *
   * @param msg the detail message.
   * @param cause the cause of the exception.
   * @param context Context for the failed configuration resolution e.g.
   *     'configuration.context.specific-configuration'
   */
  public ConfigurationResolutionException(String msg, Throwable cause, String context) {
    super(msg, cause);
    ctx = context;
  }

  /**
   * Constructs an instance of <code>ConfigurationResolutionException</code> with the specified
   * cause.
   *
   * @param cause the cause of the exception.
   * @param context Context for the failed configuration resolution e.g.
   *     'configuration.context.specific-configuration'
   */
  public ConfigurationResolutionException(Throwable cause, String context) {
    super("Configuration resolution failure", cause);
    ctx = context;
  }

  /**
   * Constructs an instance of <code>ConfigurationResolutionException</code> with the specified
   * detail message and cause.
   *
   * @param msg the detail message.
   */
  public ConfigurationResolutionException(String msg) {
    super(msg);
    ctx = UNKNOWN_CONTEXT;
  }

  /**
   * Constructs an instance of <code>ConfigurationResolutionException</code> with the specified
   * detail message and cause.
   *
   * @param msg the detail message.
   * @param cause the cause of the exception.
   */
  public ConfigurationResolutionException(String msg, Throwable cause) {
    super(msg, cause);
    ctx = UNKNOWN_CONTEXT;
  }

  /**
   * Constructs an instance of <code>ConfigurationResolutionException</code> with the specified
   * cause.
   *
   * @param cause the cause of the exception.
   */
  public ConfigurationResolutionException(Throwable cause) {
    super("Configuration resolution failure", cause);
    ctx = UNKNOWN_CONTEXT;
  }

  public String getContext() {
    return ctx;
  }
}
