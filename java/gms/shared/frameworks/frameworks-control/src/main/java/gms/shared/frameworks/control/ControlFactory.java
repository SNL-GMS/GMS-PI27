package gms.shared.frameworks.control;

import gms.shared.frameworks.common.annotations.Component;
import jakarta.ws.rs.Path;
import java.util.Objects;

/**
 * Main entry facade for instantiating control classes and running them as services via the control
 * framework.
 */
public final class ControlFactory {

  private static ControlFactoryWorker worker = new ControlFactoryWorker();

  private ControlFactory() {}

  /**
   * Sets the worker that this factory uses.
   *
   * <p>The usage of a worker makes this facade have a few convenience static methods and aids
   * testing of the implementation by testing it's worker (which has non-static methods).
   *
   * @param w the worker to use
   */
  protected static void setWorker(ControlFactoryWorker w) {
    worker = Objects.requireNonNull(w, "ControlFactory requires non-null worker");
  }

  /**
   * Runs a service based on the provided controlClass. The controlClass contains handler operations
   * accessed by the HttpService's {@link gms.shared.frameworks.service.Route}s. The controlClass
   * must be annotated with {@link Component}. The controlClass instance is created by invoking the
   * public static factory operation which accepts a {@link ControlContext} and returns an instance
   * of the control class. The factory is invoked using a {@link ControlContext} constructed
   * entirely from default framework implementations. The HttpService has a Route for each {@link
   * Path} annotated operation in the controlClass. The service will be stopped when the
   * application's JVM shuts down.
   *
   * @param <T> control class type
   * @param controlClass type of control to instantiate and wrap in a service (using the {@link
   *     Path} annotated operations), not null
   * @return The control objec generated from starting the control service
   * @throws IllegalArgumentException if the controlClass or HttpService instances can't be created
   * @throws IllegalArgumentException if the controlClass is not annotated with {@link Component}
   */
  public static <T> T runService(Class<T> controlClass) {
    return worker.runService(controlClass);
  }

  /**
   * Obtains a new instance of the provided controlClass. The controlClass must be annotated with
   * {@link Component}. The controlClass instance is created by invoking the public static factory
   * operation which accepts a {@link ControlContext} and returns an instance of the control class.
   * The factory is invoked using a {@link ControlContext} constructed entirely from default
   * framework implementations.
   *
   * @param controlClass type of control to instantiate using the Control annotation, not null
   * @param <T> control class type
   * @return instance of the control class, not null
   * @throws IllegalArgumentException if the controlClass instance can't be created using the class'
   *     factory operation or the correct factory operation doesn't exist in the class
   * @throws IllegalArgumentException if the controlClass is not annotated with {@link Component}
   */
  public static <T> T createControl(Class<T> controlClass) {
    return worker.createControl(controlClass);
  }
}
