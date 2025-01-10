package gms.shared.spring.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import java.util.Map;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;

class DataSourcesByAccountTest {

  @Test
  void testCommonMapMethods() {

    DataSource dataSourceOne = mock(DataSource.class);
    DataSource dataSourceTwo = mock(DataSource.class);
    DataSource dataSourceThree = mock(DataSource.class);
    String accountOne = "Account1";
    String accountTwo = "Account2";
    String accountThree = "Account3";

    DataSourcesByAccount dataSourcesByAccount =
        new DataSourcesByAccount(
            Map.of(
                accountOne,
                dataSourceOne,
                accountTwo,
                dataSourceTwo,
                accountThree,
                dataSourceThree));

    assertThat(dataSourcesByAccount.size()).isEqualTo(3);

    assertThat(dataSourcesByAccount.getAccounts())
        .containsExactlyInAnyOrder(accountOne, accountTwo, accountThree);
    assertThat(dataSourcesByAccount.accounts())
        .containsExactlyInAnyOrder(accountOne, accountTwo, accountThree);
    assertThat(dataSourcesByAccount.getDataSources())
        .containsExactlyInAnyOrder(dataSourceOne, dataSourceTwo, dataSourceThree);
    assertThat(dataSourcesByAccount.dataSources())
        .containsExactlyInAnyOrder(dataSourceOne, dataSourceTwo, dataSourceThree);
    assertThat(dataSourcesByAccount.entrySet())
        .containsExactlyInAnyOrder(
            Map.entry(accountOne, dataSourceOne),
            Map.entry(accountTwo, dataSourceTwo),
            Map.entry(accountThree, dataSourceThree));

    assertThat(dataSourcesByAccount.containsAccount(accountOne)).isTrue();
    assertThat(dataSourcesByAccount.containsAccount(accountTwo)).isTrue();
    assertThat(dataSourcesByAccount.containsAccount(accountThree)).isTrue();

    assertThat(dataSourcesByAccount.get(accountOne)).contains(dataSourceOne);
    assertThat(dataSourcesByAccount.get(accountTwo)).contains(dataSourceTwo);
    assertThat(dataSourcesByAccount.get(accountThree)).contains(dataSourceThree);

    assertThat(dataSourcesByAccount.containsAccount("FakeAccount")).isFalse();
    assertThat(dataSourcesByAccount.get("FakeAccount")).isEmpty();
  }
}
