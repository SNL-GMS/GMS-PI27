package gms.testtools.simulators.bridgeddatasourcesimulator.application.configuration.analysis;

import java.util.Set;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AnalysisSimulatorConfig {

  public static final String SOCCPRO_KEY = "soccpro";
  public static final String AL1_KEY = "al1";
  public static final String AL2_KEY = "al2";

  @Bean
  @Qualifier("stages") public Set<String> stages() {
    return Set.of(SOCCPRO_KEY, AL1_KEY, AL2_KEY);
  }
}
