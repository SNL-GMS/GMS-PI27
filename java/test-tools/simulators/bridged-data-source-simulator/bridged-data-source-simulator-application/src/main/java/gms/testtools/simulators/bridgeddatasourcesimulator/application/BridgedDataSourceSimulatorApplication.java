package gms.testtools.simulators.bridgeddatasourcesimulator.application;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/** This is the main class used to the start a Bridged Data Source Simulator Service */
@SpringBootApplication
public class BridgedDataSourceSimulatorApplication {

  public static void main(String[] args) {
    SpringApplication.run(BridgedDataSourceSimulatorApplication.class, args);
  }
}
