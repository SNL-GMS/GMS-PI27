package gms.testtools.simulators.bridgeddatasourcesimulator.application.configuration;

import gms.shared.frameworks.systemconfig.SystemConfig;
import java.util.Map;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

/** */
@Configuration
@ComponentScan(basePackages = {"gms.shared.spring", "gms.testtools.simulators"})
public class BridgedDataSourceSimulatorConfiguration {

  public static final String SEED_SYSTEM_CONFIG_ROOT = "bridged-data-source-simulator.seed";
  public static final String SIMULATION_SYSTEM_CONFIG_ROOT =
      "bridged-data-source-simulator.simulation";
  public static final String SEED_SOCCPRO_SYSTEM_CONFIG_ROOT =
      "bridged-data-source-simulator.seed-soccpro";
  public static final String SEED_AL1_SYSTEM_CONFIG_ROOT = "bridged-data-source-simulator.seed-al1";
  public static final String SEED_AL2_SYSTEM_CONFIG_ROOT = "bridged-data-source-simulator.seed-al2";
  public static final String SIMULATION_SOCCPRO_SYSTEM_CONFIG_ROOT =
      "bridged-data-source-simulator.sim-soccpro";
  public static final String SIMULATION_AL1_SYSTEM_CONFIG_ROOT =
      "bridged-data-source-simulator.sim-al1";
  public static final String SIMULATION_AL2_SYSTEM_CONFIG_ROOT =
      "bridged-data-source-simulator.sim-al2";

  @Bean
  public Map<String, SystemConfig> simulatorSystemConfigMap() {

    return Map.of(
        SEED_SYSTEM_CONFIG_ROOT,
        SystemConfig.create(SEED_SYSTEM_CONFIG_ROOT),
        SIMULATION_SYSTEM_CONFIG_ROOT,
        SystemConfig.create(SIMULATION_SYSTEM_CONFIG_ROOT),
        SIMULATION_SOCCPRO_SYSTEM_CONFIG_ROOT,
        SystemConfig.create(SIMULATION_SOCCPRO_SYSTEM_CONFIG_ROOT),
        SIMULATION_AL1_SYSTEM_CONFIG_ROOT,
        SystemConfig.create(SIMULATION_AL1_SYSTEM_CONFIG_ROOT),
        SIMULATION_AL2_SYSTEM_CONFIG_ROOT,
        SystemConfig.create(SIMULATION_AL2_SYSTEM_CONFIG_ROOT),
        SEED_SOCCPRO_SYSTEM_CONFIG_ROOT,
        SystemConfig.create(SEED_SOCCPRO_SYSTEM_CONFIG_ROOT),
        SEED_AL1_SYSTEM_CONFIG_ROOT,
        SystemConfig.create(SEED_AL1_SYSTEM_CONFIG_ROOT),
        SEED_AL2_SYSTEM_CONFIG_ROOT,
        SystemConfig.create(SEED_AL2_SYSTEM_CONFIG_ROOT));
  }
}
