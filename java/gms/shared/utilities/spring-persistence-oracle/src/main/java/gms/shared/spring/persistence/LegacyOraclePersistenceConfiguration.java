package gms.shared.spring.persistence;

import gms.shared.utilities.javautilities.objectmapper.OracleLivenessCheck;
import jakarta.persistence.EntityManagerFactory;
import java.util.stream.Stream;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration to help with legacy code not relying on spring-persistence-oracle to build the
 * application's persistence beans
 */
@Configuration
@ConditionalOnProperty(prefix = "gms.persistence.oracle", name = "legacy")
public class LegacyOraclePersistenceConfiguration {

  // note: There could be a situation where an application connects to both Postgres and Oracle, in
  // this case no EMFs would come up until both DBs are ready
  @Bean
  public BeanFactoryPostProcessor dependsOnPostProcessor() {
    return (ConfigurableListableBeanFactory bf) -> {
      // Let beans that need the database depend on the DatabaseStartupValidator
      // like the JPA EntityManagerFactory
      String[] jpa = bf.getBeanNamesForType(EntityManagerFactory.class);
      Stream.of(jpa)
          .map(bf::getBeanDefinition)
          .forEach(it -> it.setDependsOn("oracleSingleDataSourceStartupValidator"));

      String[] oracle = bf.getBeanNamesForType(OracleLivenessCheck.class);
      Stream.of(oracle)
          .map(bf::getBeanDefinition)
          .forEach(it -> it.setDependsOn("oracleSingleDataSourceStartupValidator"));
    };
  }
}
