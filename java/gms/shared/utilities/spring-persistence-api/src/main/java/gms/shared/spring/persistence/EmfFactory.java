package gms.shared.spring.persistence;

import static java.lang.String.format;
import static java.util.stream.Collectors.toMap;

import jakarta.persistence.EntityManagerFactory;
import java.util.Map;
import java.util.function.Supplier;
import javax.sql.DataSource;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;

public interface EmfFactory {

  LocalContainerEntityManagerFactoryBean createBean(
      DataSource dataSource, String persistenceUnitName, int connectionPoolSize);

  default EntityManagerFactory create(
      DataSource dataSource, String persistenceUnitName, int connectionPoolSize) {

    LocalContainerEntityManagerFactoryBean emfBean =
        createBean(dataSource, persistenceUnitName, connectionPoolSize);

    return emfBean.getNativeEntityManagerFactory();
  }

  default EntityManagerFactoriesByStage tryCreateForStages(
      AccountsByStage accountsByStage,
      DataSourcesByAccount dataSourcesByAccount,
      String persistenceUnitName,
      int connectionPoolSize) {
    return tryCreateForStages(
        accountsByStage,
        createForAccounts(dataSourcesByAccount, persistenceUnitName, connectionPoolSize));
  }

  default EntityManagerFactoriesByStage tryCreateForStages(
      AccountsByStage accountsByStage, EntityManagerFactoriesByAccount emfsByAccount) {

    var delegate =
        accountsByStage
            .entries()
            .collect(
                toMap(
                    Map.Entry::getKey,
                    entry ->
                        emfsByAccount
                            .get(entry.getValue())
                            .orElseThrow(noEmfForAccount(entry.getValue()))));

    return new EntityManagerFactoriesByStage(delegate);
  }

  default EntityManagerFactoriesByAccount createForAccounts(
      DataSourcesByAccount dataSourcesByAccount,
      String persistenceUnitName,
      int connectionPoolSize) {
    var delegate =
        dataSourcesByAccount
            .entries()
            .collect(
                toMap(
                    Map.Entry::getKey,
                    entry -> create(entry.getValue(), persistenceUnitName, connectionPoolSize)));

    return new EntityManagerFactoriesByAccount(delegate);
  }

  static Supplier<IllegalStateException> noEmfForAccount(String account) {
    return () ->
        new IllegalStateException(
            format("Error mapping EntityManagerFactory: No EMF found for account %s", account));
  }
}
