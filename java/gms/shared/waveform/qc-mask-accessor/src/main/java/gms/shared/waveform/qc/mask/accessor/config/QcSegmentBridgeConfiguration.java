package gms.shared.waveform.qc.mask.accessor.config;

import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.frameworks.systemconfig.SystemConfig;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

/** Retrieves QcSegmentBridgeDefinition from processing and system configuration */
@Configuration
@ComponentScan(basePackages = "gms.shared.spring")
public class QcSegmentBridgeConfiguration {

  private final String qcMaskDurationTimeConfig;
  private final ConfigurationConsumerUtility configurationConsumerUtility;

  /**
   * Creates a new QcSegmentBridgeConfiguration given a ConfigurationConsumerUtility used to resolve
   * processing configuration for the qc segment bridge and SystemConfig for resolving system
   * configuration
   *
   * @param qcMaskDurationTimeConfig autowired configuration value
   * @param qcMaskJdbcUrlConfig autowired configuration value
   * @param configurationConsumerUtility ConfigurationConsumerUtility for resolving processing and
   *     system configuration
   * @param systemConfig SystemConfiguration for resolving connection parameters
   */
  @Autowired
  public QcSegmentBridgeConfiguration(
      @Value("${qcMaskDurationTimeConfig}") String qcMaskDurationTimeConfig,
      @Value("${qcMaskJdbcUrlConfig}") String qcMaskJdbcUrlConfig,
      ConfigurationConsumerUtility configurationConsumerUtility,
      SystemConfig systemConfig) {
    this.qcMaskDurationTimeConfig = qcMaskDurationTimeConfig;
    this.configurationConsumerUtility = configurationConsumerUtility;
  }

  /**
   * QcSegmentBridgeDefinition created from processing configuration
   *
   * @return QcSegmentBridgeDefinition
   */
  @Bean
  public QcSegmentBridgeDefinition qcSegmentBridgeDefinition() {
    // resolve the QcSegmentBridgeDefinition from qc-mask processing config
    return configurationConsumerUtility.resolve(
        qcMaskDurationTimeConfig, List.of(), QcSegmentBridgeDefinition.class);
  }
}
