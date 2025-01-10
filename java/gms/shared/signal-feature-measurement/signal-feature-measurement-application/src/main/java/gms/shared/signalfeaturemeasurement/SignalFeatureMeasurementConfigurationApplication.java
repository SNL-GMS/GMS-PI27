package gms.shared.signalfeaturemeasurement;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;

@SpringBootApplication
public class SignalFeatureMeasurementConfigurationApplication {
  private static final Logger LOGGER =
      LoggerFactory.getLogger(SignalFeatureMeasurementConfigurationApplication.class);

  public static void main(String[] args) {
    LOGGER.info("Starting signal feature measurement configuration service");

    new SpringApplicationBuilder(SignalFeatureMeasurementConfigurationApplication.class).run(args);
  }
}
