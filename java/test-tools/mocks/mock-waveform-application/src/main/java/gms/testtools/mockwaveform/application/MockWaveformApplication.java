package gms.testtools.mockwaveform.application;

import gms.shared.frameworks.service.ServiceGenerator;
import gms.shared.frameworks.systemconfig.SystemConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MockWaveformApplication {
  private static final Logger logger = LoggerFactory.getLogger(MockWaveformApplication.class);

  private MockWaveformApplication() {}

  public static void main(String[] args) {
    logger.info("Starting mock-waveform-service");

    final var systemConfig = SystemConfig.create("mock-waveform-service");
    ServiceGenerator.runService(MockWaveformController.create(), systemConfig);
  }
}
