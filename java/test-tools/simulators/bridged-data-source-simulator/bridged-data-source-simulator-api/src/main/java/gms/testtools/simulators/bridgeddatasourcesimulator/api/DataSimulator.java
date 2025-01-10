package gms.testtools.simulators.bridgeddatasourcesimulator.api;

import gms.testtools.simulators.bridgeddatasourcesimulator.api.util.DataSimulatorSpec;

public interface DataSimulator {

  /**
   * Initializes the simulation data based off of the provided simulation specification.
   *
   * @param bridgedDataSourceSimulatorSpec - An {@link DataSimulatorSpec} to provided the simulation
   *     specification details.
   */
  void initialize(DataSimulatorSpec bridgedDataSourceSimulatorSpec);

  /**
   * Starts the replication process of the simulation based off of the provided simulation
   * specification.
   */
  void start();

  /** Stops the replication process of the simulation. */
  void stop();

  /** Cleans up the data created as part the the simulation. */
  void cleanup();
}
