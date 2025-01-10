package gms.shared.waveform.qc.mask.accessor.config;

import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;

import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.frameworks.systemconfig.SystemConfig;
import java.time.Duration;
import java.time.LocalTime;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class QcSegmentBridgeConfigurationTest {

  private QcSegmentBridgeConfiguration configuration;
  private QcSegmentBridgeDefinition qcSegmentBridgeDefinition;

  @Mock private ConfigurationConsumerUtility configurationConsumerUtility;

  @Mock private SystemConfig systemConfig;

  private static final String QC_DURATION_TIME_CONFIG = "qc-mask.qc-duration-time-parameters";
  private static final String QC_JDBC_URL_CONFIG = "qc-mask.jdbc_url";

  @BeforeEach
  public void setUp() {
    qcSegmentBridgeDefinition =
        QcSegmentBridgeDefinition.create(Duration.ofHours(1), LocalTime.now(), Duration.ofHours(2));
    configuration =
        new QcSegmentBridgeConfiguration(
            QC_DURATION_TIME_CONFIG,
            QC_JDBC_URL_CONFIG,
            configurationConsumerUtility,
            systemConfig);
  }

  /** Test the creation of the QcSegmentBridgeDefinition bean */
  @Test
  void testQcSegmentBridgeDefinitionBean() {
    Mockito.when(
            configurationConsumerUtility.resolve(
                eq(QC_DURATION_TIME_CONFIG), anyList(), eq(QcSegmentBridgeDefinition.class)))
        .thenReturn(qcSegmentBridgeDefinition);

    QcSegmentBridgeDefinition definition = configuration.qcSegmentBridgeDefinition();
    Assertions.assertNotNull(definition);
    definition.equals(qcSegmentBridgeDefinition);
  }
}
