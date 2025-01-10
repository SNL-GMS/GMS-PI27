package gms.shared.signalenhancement;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SignalEnhancementConfigurationApplication {
  private static final Logger LOGGER =
      LoggerFactory.getLogger(SignalEnhancementConfigurationApplication.class);

  public static void main(String[] args) {
    LOGGER.info("Starting signal enhancement configuration service");

    new SpringApplicationBuilder(SignalEnhancementConfigurationApplication.class).run(args);
  }
}
