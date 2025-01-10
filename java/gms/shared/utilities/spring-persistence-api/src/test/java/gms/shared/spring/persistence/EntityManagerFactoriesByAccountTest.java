package gms.shared.spring.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import java.util.Map;
import org.junit.jupiter.api.Test;

class EntityManagerFactoriesByAccountTest {

  @Test
  void testCommonMapMethods() {

    EntityManagerFactory emfOne = mock(EntityManagerFactory.class);
    EntityManagerFactory emfTwo = mock(EntityManagerFactory.class);
    EntityManagerFactory emfThree = mock(EntityManagerFactory.class);

    String accountOne = "Account1";
    String accountTwo = "Account2";
    String accountThree = "Account3";

    EntityManagerFactoriesByAccount emfsByAccount =
        new EntityManagerFactoriesByAccount(
            Map.of(accountOne, emfOne, accountTwo, emfTwo, accountThree, emfThree));

    assertThat(emfsByAccount.size()).isEqualTo(3);

    assertThat(emfsByAccount.getAccounts())
        .containsExactlyInAnyOrder(accountOne, accountTwo, accountThree);
    assertThat(emfsByAccount.accounts())
        .containsExactlyInAnyOrder(accountOne, accountTwo, accountThree);
    assertThat(emfsByAccount.getEntityManagerFactories())
        .containsExactlyInAnyOrder(emfOne, emfTwo, emfThree);
    assertThat(emfsByAccount.entityManagerFactories())
        .containsExactlyInAnyOrder(emfOne, emfTwo, emfThree);
    assertThat(emfsByAccount.entrySet())
        .containsExactlyInAnyOrder(
            Map.entry(accountOne, emfOne),
            Map.entry(accountTwo, emfTwo),
            Map.entry(accountThree, emfThree));

    assertThat(emfsByAccount.containsAccount(accountOne)).isTrue();
    assertThat(emfsByAccount.containsAccount(accountTwo)).isTrue();
    assertThat(emfsByAccount.containsAccount(accountThree)).isTrue();

    assertThat(emfsByAccount.get(accountOne)).contains(emfOne);
    assertThat(emfsByAccount.get(accountTwo)).contains(emfTwo);
    assertThat(emfsByAccount.get(accountThree)).contains(emfThree);

    assertThat(emfsByAccount.containsAccount("FakeAccount")).isFalse();
    assertThat(emfsByAccount.get("FakeAccount")).isEmpty();
  }

  @Test
  void testCreateEntityManagers() {
    EntityManagerFactory emfOne = mock(EntityManagerFactory.class);
    EntityManagerFactory emfTwo = mock(EntityManagerFactory.class);
    EntityManagerFactory emfThree = mock(EntityManagerFactory.class);

    EntityManager emOne = mock(EntityManager.class);
    EntityManager emTwo = mock(EntityManager.class);
    EntityManager emThree = mock(EntityManager.class);

    given(emfOne.createEntityManager()).willReturn(emOne);
    given(emfTwo.createEntityManager()).willReturn(emTwo);
    given(emfThree.createEntityManager()).willReturn(emThree);

    String accountOne = "Account1";
    String accountTwo = "Account2";
    String accountThree = "Account3";

    EntityManagerFactoriesByAccount emfsByAccount =
        new EntityManagerFactoriesByAccount(
            Map.of(accountOne, emfOne, accountTwo, emfTwo, accountThree, emfThree));

    EntityManagersByAccount emsByAccount = emfsByAccount.createEntityManagers();
    assertThat(emsByAccount.entries())
        .containsExactlyInAnyOrder(
            Map.entry(accountOne, emOne),
            Map.entry(accountTwo, emTwo),
            Map.entry(accountThree, emThree));
  }
}
