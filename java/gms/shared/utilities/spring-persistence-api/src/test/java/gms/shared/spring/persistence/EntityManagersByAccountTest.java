package gms.shared.spring.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import jakarta.persistence.EntityManager;
import java.util.Map;
import org.junit.jupiter.api.Test;

class EntityManagersByAccountTest {

  @Test
  void testCommonMapMethods() {

    EntityManager emOne = mock(EntityManager.class);
    EntityManager emTwo = mock(EntityManager.class);
    EntityManager emThree = mock(EntityManager.class);

    String accountOne = "Account1";
    String accountTwo = "Account2";
    String accountThree = "Account3";

    EntityManagersByAccount emsByAccount =
        new EntityManagersByAccount(
            Map.of(accountOne, emOne, accountTwo, emTwo, accountThree, emThree));

    assertThat(emsByAccount.size()).isEqualTo(3);

    assertThat(emsByAccount.getAccounts())
        .containsExactlyInAnyOrder(accountOne, accountTwo, accountThree);
    assertThat(emsByAccount.accounts())
        .containsExactlyInAnyOrder(accountOne, accountTwo, accountThree);
    assertThat(emsByAccount.getEntityManagers()).containsExactlyInAnyOrder(emOne, emTwo, emThree);
    assertThat(emsByAccount.entityManagers()).containsExactlyInAnyOrder(emOne, emTwo, emThree);
    assertThat(emsByAccount.entrySet())
        .containsExactlyInAnyOrder(
            Map.entry(accountOne, emOne),
            Map.entry(accountTwo, emTwo),
            Map.entry(accountThree, emThree));

    assertThat(emsByAccount.containsAccount(accountOne)).isTrue();
    assertThat(emsByAccount.containsAccount(accountTwo)).isTrue();
    assertThat(emsByAccount.containsAccount(accountThree)).isTrue();

    assertThat(emsByAccount.get(accountOne)).contains(emOne);
    assertThat(emsByAccount.get(accountTwo)).contains(emTwo);
    assertThat(emsByAccount.get(accountThree)).contains(emThree);

    assertThat(emsByAccount.containsAccount("FakeAccount")).isFalse();
    assertThat(emsByAccount.get("FakeAccount")).isEmpty();
  }
}
