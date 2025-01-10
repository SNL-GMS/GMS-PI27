package gms.shared.signalenhancement.configuration;

import gms.shared.frameworks.cache.utils.CacheInfo;
import gms.shared.frameworks.cache.utils.IgniteConnectionManager;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.signaldetection.database.connector.config.SignalDetectionBridgeDefinition;
import gms.shared.signaldetection.database.connector.config.StagePersistenceDefinition;
import gms.shared.signaldetection.database.connector.config.WaveformTrimDefinition;
import gms.shared.stationdefinition.coi.channel.ChannelSegmentDescriptor;
import gms.shared.workflow.coi.WorkflowDefinition;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.apache.ignite.IgniteCache;
import org.apache.ignite.cache.CacheAtomicityMode;
import org.apache.ignite.cache.CacheMode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@ComponentScan(
    basePackages = {
      "gms.shared.signaldetection",
      "gms.shared.stationdefinition",
      "gms.shared.waveform",
      "gms.shared.spring",
      "gms.shared.emf.staged",
      "gms.shared.event"
    })
public class SignalEnhancementServiceConfiguration {

  private static final String JDBC_URL = "_jdbc_url";

  public static final CacheInfo CHANNEL_SEGMENT_DESCRIPTOR_WFIDS_CACHE =
      new CacheInfo(
          "channel-segment-descriptor-wfids-cache",
          CacheMode.PARTITIONED,
          CacheAtomicityMode.ATOMIC);

  private final String monitoringOrgConfig;

  private final String accountsByStageConfig;

  private final String orderedStagesConfig;

  private final String waveformLeadLagConfig;

  public SignalEnhancementServiceConfiguration(
      @Value("${monitoringOrgConfig}") String monitoringOrgConfig,
      @Value("${accountsByStageConfig}") String accountsByStageConfig,
      @Value("${orderedStagesConfig}") String orderedStagesConfig,
      @Value("${waveformLeadLagConfig}") String waveformLeadLagConfig) {
    this.monitoringOrgConfig = monitoringOrgConfig;
    this.accountsByStageConfig = accountsByStageConfig;
    this.orderedStagesConfig = orderedStagesConfig;
    this.waveformLeadLagConfig = waveformLeadLagConfig;
  }

  @Bean
  public IgniteCache<ChannelSegmentDescriptor, List<Long>> channelSegmentDescriptorWfidsCache() {
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
        workflowDefinition.getStageNames().stream().map(WorkflowDefinitionId::from).toList();

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
