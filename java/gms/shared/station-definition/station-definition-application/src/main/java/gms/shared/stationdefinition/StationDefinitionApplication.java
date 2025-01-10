package gms.shared.stationdefinition;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@ComponentScan(
    basePackages = {"gms.shared.spring", "gms.shared.stationdefinition", "gms.shared.event"})
public class StationDefinitionApplication {
  private static final Logger LOGGER = LoggerFactory.getLogger(StationDefinitionApplication.class);

  public static void main(String[] args) {
    LOGGER.info("Starting station-definition-service");

    new SpringApplicationBuilder(StationDefinitionApplication.class).run(args);
  }
}
