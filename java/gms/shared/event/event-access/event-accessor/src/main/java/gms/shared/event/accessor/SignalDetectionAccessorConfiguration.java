package gms.shared.event.accessor;

import gms.shared.frameworks.cache.utils.CacheInfo;
import gms.shared.frameworks.cache.utils.IgniteConnectionManager;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.signaldetection.database.connector.config.SignalDetectionBridgeDefinition;
import gms.shared.signaldetection.database.connector.config.StagePersistenceDefinition;
import gms.shared.signaldetection.database.connector.config.WaveformTrimDefinition;
import gms.shared.stationdefinition.cache.configuration.CacheAccessorConfiguration;
import gms.shared.stationdefinition.coi.channel.ChannelSegmentDescriptor;
import gms.shared.workflow.coi.WorkflowDefinition;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.apache.ignite.IgniteCache;
import org.apache.ignite.cache.CacheAtomicityMode;
import org.apache.ignite.cache.CacheMode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Lazy;

/**
 * Provides configured beans to be autowired into the {@link
 * gms.shared.signaldetection.api.SignalDetectionAccessor}
 */
@Configuration
@ComponentScan(
    basePackages = {
      "gms.shared.signaldetection",
      "gms.shared.stationdefinition",
      "gms.shared.waveform",
      "gms.shared.emf"
    })
@Lazy
@Import(CacheAccessorConfiguration.class)
public class SignalDetectionAccessorConfiguration {
  private static final Logger LOGGER =
      LoggerFactory.getLogger(SignalDetectionAccessorConfiguration.class);

  private static final String JDBC_URL = "_jdbc_url";

  public static final CacheInfo CHANNEL_SEGMENT_DESCRIPTOR_WFIDS_CACHE =
      new CacheInfo(
          "channel-segment-descriptor-wfids-cache",
          CacheMode.PARTITIONED,
          CacheAtomicityMode.ATOMIC);

  @Value("${stationDefinitionPersistenceUnitName}")
  private String stationDefinitionPersistenceUnitName;

  @Value("${monitoringOrgConfig}")
  private String monitoringOrgConfig;

  @Value("${accountsByStageConfig}")
  private String accountsByStageConfig;

  @Value("${orderedStagesConfig}")
  private String orderedStagesConfig;

  @Value("${waveformLeadLagConfig}")
  private String waveformLeadLagConfig;

  @Bean
  public IgniteCache<ChannelSegmentDescriptor, List<Long>> channelSegmentDescriptorWfidsCache(
      @Autowired SystemConfig systemConfig) {

    try {
      IgniteConnectionManager.initialize(
          systemConfig, List.of(CHANNEL_SEGMENT_DESCRIPTOR_WFIDS_CACHE));
    } catch (IllegalStateException ex) {
      LOGGER.warn("Channel Segment cache already initialized", ex);
    }
    return IgniteConnectionManager.getOrCreateCache(CHANNEL_SEGMENT_DESCRIPTOR_WFIDS_CACHE);
  }

  @Autowired
  @Bean
  public SignalDetectionBridgeDefinition signalDetectionBridgeDefinition(
      ConfigurationConsumerUtility configurationConsumerUtility) {

    var workflowDefinition =
        configurationConsumerUtility.resolve(
            orderedStagesConfig, List.of(), WorkflowDefinition.class);

    var orderedAccountByStage =
        workflowDefinition.getStageNames().stream()
            .map(WorkflowDefinitionId::from)
            .collect(Collectors.toList());

    var stagePersistenceDefinition =
        configurationConsumerUtility.resolve(
            accountsByStageConfig, List.of(), StagePersistenceDefinition.class);

    var waveformTrimDefinition =
        configurationConsumerUtility.resolve(
            waveformLeadLagConfig, List.of(), WaveformTrimDefinition.class);

    var monitoringOrganization =
        (String)
            configurationConsumerUtility
                .resolve(monitoringOrgConfig, List.of())
                .get("monitoringOrganization");

    return SignalDetectionBridgeDefinition.builder()
        .setDatabaseAccountByStage(stagePersistenceDefinition.getDatabaseAccountsByStageMap())
        .setMonitoringOrganization(monitoringOrganization)
        .setOrderedStages(orderedAccountByStage)
        .setMeasuredWaveformLeadDuration(waveformTrimDefinition.getMeasuredWaveformLeadDuration())
        .setMeasuredWaveformLagDuration(waveformTrimDefinition.getMeasuredWaveformLagDuration())
        .build();
  }

  @Bean
  public Map<WorkflowDefinitionId, String> databaseAccountsByStage(
      SystemConfig systemConfig, SignalDetectionBridgeDefinition signalDetectionBridgeDefinition) {

    var globalConfig = SystemConfig.create("global");

    return signalDetectionBridgeDefinition.getDatabaseAccountByStage().entrySet().stream()
        .collect(
            Collectors.toMap(
                Map.Entry::getKey, entry -> globalConfig.getValue(entry.getValue() + JDBC_URL)));
  }
}
