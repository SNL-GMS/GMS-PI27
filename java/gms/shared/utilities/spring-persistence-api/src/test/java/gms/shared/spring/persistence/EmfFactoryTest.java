package gms.shared.spring.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willReturn;
import static org.mockito.Mockito.mock;

import jakarta.persistence.EntityManagerFactory;
import java.util.Map;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;

@ExtendWith(MockitoExtension.class)
class EmfFactoryTest {

  @Mock(answer = Answers.CALLS_REAL_METHODS)
  EmfFactory emfFactory;

  @Test
  void testTryCreateForStages() {
    String stageOne = "Stage1";
    String stageTwo = "Stage2";
    String accountOne = "Account1";
    String accountTwo = "Account2";

    DataSource dataSourceOne = mock(DataSource.class);
    DataSource dataSourceTwo = mock(DataSource.class);

    AccountsByStage accountsByStage =
        new AccountsByStage(Map.of(stageOne, accountOne, stageTwo, accountTwo));
    DataSourcesByAccount dataSourcesByAccount =
        new DataSourcesByAccount(Map.of(accountOne, dataSourceOne, accountTwo, dataSourceTwo));

    String persistenceUnitName = "test-persistence-unit";
    int connectionPoolSize = 5;

    LocalContainerEntityManagerFactoryBean emfBeanOne =
        mock(LocalContainerEntityManagerFactoryBean.class);
    EntityManagerFactory emfOne = mock(EntityManagerFactory.class);
    given(emfBeanOne.getNativeEntityManagerFactory()).willReturn(emfOne);

    LocalContainerEntityManagerFactoryBean emfBeanTwo =
        mock(LocalContainerEntityManagerFactoryBean.class);
    EntityManagerFactory emfTwo = mock(EntityManagerFactory.class);
    given(emfBeanTwo.getNativeEntityManagerFactory()).willReturn(emfTwo);

    willReturn(emfBeanOne)
        .given(emfFactory)
        .createBean(dataSourceOne, persistenceUnitName, connectionPoolSize);
    willReturn(emfBeanTwo)
        .given(emfFactory)
        .createBean(dataSourceTwo, persistenceUnitName, connectionPoolSize);

    EntityManagerFactoriesByStage emfsByStage =
        emfFactory.tryCreateForStages(
            accountsByStage, dataSourcesByAccount, persistenceUnitName, connectionPoolSize);
    assertThat(emfsByStage.stages()).containsExactlyInAnyOrder(stageOne, stageTwo);
    assertThat(emfsByStage.get(stageOne)).contains(emfOne);
    assertThat(emfsByStage.get(stageTwo)).contains(emfTwo);
  }

  @Test
  void testTryCreateForStagesMissingDataSourceThrowsIllegalStateException() {
    String stageOne = "Stage1";
    String stageTwo = "Stage2";
    String accountOne = "Account1";
    String accountTwo = "Account2";

    DataSource dataSourceOne = mock(DataSource.class);

    AccountsByStage accountsByStage =
        new AccountsByStage(Map.of(stageOne, accountOne, stageTwo, accountTwo));
    DataSourcesByAccount dataSourcesByAccount =
        new DataSourcesByAccount(Map.of(accountOne, dataSourceOne));

    String persistenceUnitName = "test-persistence-unit";
    int connectionPoolSize = 5;

    LocalContainerEntityManagerFactoryBean emfBeanOne =
        mock(LocalContainerEntityManagerFactoryBean.class);
    EntityManagerFactory emfOne = mock(EntityManagerFactory.class);
    given(emfBeanOne.getNativeEntityManagerFactory()).willReturn(emfOne);

    willReturn(emfBeanOne)
        .given(emfFactory)
        .createBean(dataSourceOne, persistenceUnitName, connectionPoolSize);

    assertThatIllegalStateException()
        .isThrownBy(
            () ->
                emfFactory.tryCreateForStages(
                    accountsByStage, dataSourcesByAccount, persistenceUnitName, connectionPoolSize))
        .withMessage("Error mapping EntityManagerFactory: No EMF found for account Account2");
  }
}
