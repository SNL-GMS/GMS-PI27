package gms.testtools.mocksignaldetection.application;

import gms.shared.frameworks.service.ServiceGenerator;
import gms.shared.frameworks.systemconfig.SystemConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MockSignalDetectionApplication {

  private static final Logger logger =
      LoggerFactory.getLogger(MockSignalDetectionApplication.class);

  private MockSignalDetectionApplication() {}

  public static void main(String[] args) {
    logger.info("Starting mock-signal-detection-service");

    final var config = SystemConfig.create("mock-signal-detection-service");

    ServiceGenerator.runService(MockSignalDetectionController.create(), config);
  }
}
