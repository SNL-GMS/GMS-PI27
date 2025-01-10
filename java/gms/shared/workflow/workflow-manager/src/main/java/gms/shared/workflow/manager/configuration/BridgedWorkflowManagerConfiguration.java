package gms.shared.workflow.manager.configuration;

import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.workflow.cache.IgniteIntervalCache;
import gms.shared.workflow.cache.IntervalCache;
import gms.shared.workflow.cache.util.WorkflowCacheFactory;
import gms.shared.workflow.coi.IntervalId;
import gms.shared.workflow.coi.StageInterval;
import gms.shared.workflow.coi.Workflow;
import java.util.concurrent.ScheduledExecutorService;
import org.apache.ignite.cache.eviction.lru.LruEvictionPolicy;
import org.apache.ignite.configuration.NearCacheConfiguration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

/**
 * Configuration used for deploying the {@link gms.shared.workflow.manager.WorkflowManager}
 * application in bridged mode.
 */
@Configuration("workflow-managerConfiguration")
@ConditionalOnProperty(
    prefix = "service.run-state",
    name = "manager-config",
    havingValue = "bridged",
    matchIfMissing = true)
@ComponentScan(
    basePackages = {"gms.shared.workflow", "gms.shared.spring", "gms.shared.system.events"})
public class BridgedWorkflowManagerConfiguration {

  private static final Logger LOGGER =
      LoggerFactory.getLogger(BridgedWorkflowManagerConfiguration.class);

  /**
   * Provides the configured {@link Workflow} definition
   *
   * @param workflowConfiguration configuration to retrieve definition from
   * @return {@link Workflow} definition configured
   */
  @Bean
  @Autowired
  public Workflow workflow(WorkflowManagerConfigurationUtility workflowConfiguration) {
    return workflowConfiguration.resolveWorkflowDefinition();
  }

  /**
   * Sets up and returns a new {@link IgniteIntervalCache} ready for use
   *
   * @param systemConfig System configuration used to set up the cache
   * @return A new, initialized {@link IgniteIntervalCache}
   */
  @Bean
  @Autowired
  public IntervalCache intervalCache(SystemConfig systemConfig) {
    try {
      WorkflowCacheFactory.setUpCache(systemConfig);
    } catch (IllegalStateException e) {
      LOGGER.warn("Cache already initialized: ", e);
    }
    NearCacheConfiguration<IntervalId, StageInterval> nearCacheConfig =
        new NearCacheConfiguration<>();
    nearCacheConfig.setNearEvictionPolicyFactory(() -> new LruEvictionPolicy<>());

    return IgniteIntervalCache.createWithNearCache(nearCacheConfig);
  }

  /**
   * Bean to provide delegate task scheduler for async runners
   *
   * @return A single-threaded {@link ScheduledExecutorService}
   */
  @Bean
  public TaskScheduler taskScheduler() {
    return new ThreadPoolTaskScheduler();
  }
}
