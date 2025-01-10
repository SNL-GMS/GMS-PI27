package gms.shared.emf.staged;

import com.google.common.base.Functions;
import com.google.common.collect.ImmutableMap;
import gms.shared.emf.util.OracleSpringUtilities;
import gms.shared.utilities.javautilities.objectmapper.OracleLivenessCheck;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;

@Configuration
public class OracleStageEmfBeans {

  private static final Logger LOGGER = LoggerFactory.getLogger(OracleStageEmfBeans.class);

  @Bean
  public OracleLivenessCheck oracleLivenessCheck() {
    var oracleLivenessCheck = OracleLivenessCheck.create();

    if (!oracleLivenessCheck.isLive()) {
      LOGGER.info("Could not establish database liveness.  Exiting.");
      System.exit(1);
    }

    return oracleLivenessCheck;
  }

  @Bean
  @DependsOn("oracleLivenessCheck")
  public EntityManagerFactoriesByStageId stageIdEmfMap(
      Map<WorkflowDefinitionId, String> databaseAccountsByStage,
      @Value("${signalDetectionPersistenceUnitName}") String signalDetectionPersistenceUnitName,
      @Value("${gms.persistence.connection_pool_size:2}") int connectionPoolSize) {

    var currMap =
        databaseAccountsByStage.keySet().stream()
            .collect(
                ImmutableMap.toImmutableMap(
                    Functions.identity(),
                    (WorkflowDefinitionId stage) -> {
                      var emf =
                          OracleSpringUtilities.createEntityManagerFactory(
                              OracleSpringUtilities.getDataSource(
                                  databaseAccountsByStage.get(stage)),
                              signalDetectionPersistenceUnitName,
                              connectionPoolSize);
                      emf.afterPropertiesSet();
                      return emf.getNativeEntityManagerFactory();
                    }));

    return EntityManagerFactoriesByStageId.builder().setStageIdEmfMap(currMap).build();
  }
}
