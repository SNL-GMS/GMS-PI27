package gms.testtools.simulators.bridgeddatasourcesimulator.application.service;

/**
 * Help exception denoting a simulator of a particular type was not found when attempting to run
 * simulator-specific commands at the service level of an application.
 */
public class SimulatorNotFoundException extends Exception {

  public SimulatorNotFoundException(String message) {
    super(message);
  }
}
