package gms.shared.spring.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.Test;

class AccountsByStageTest {

  @Test
  void testCommonMapMethods() {
    String stageOne = "Stage1";
    String stageTwo = "Stage2";
    String stageThree = "Stage3";
    String accountOne = "Account1";
    String accountTwo = "Account2";
    String accountThree = "Account3";

    AccountsByStage accountsByStage =
        new AccountsByStage(
            Map.of(stageOne, accountOne, stageTwo, accountTwo, stageThree, accountThree));

    assertThat(accountsByStage.size()).isEqualTo(3);

    assertThat(accountsByStage.getStages())
        .containsExactlyInAnyOrder(stageOne, stageTwo, stageThree);
    assertThat(accountsByStage.stages()).containsExactlyInAnyOrder(stageOne, stageTwo, stageThree);
    assertThat(accountsByStage.getAccounts())
        .containsExactlyInAnyOrder(accountOne, accountTwo, accountThree);
    assertThat(accountsByStage.accounts())
        .containsExactlyInAnyOrder(accountOne, accountTwo, accountThree);
    assertThat(accountsByStage.entrySet())
        .containsExactlyInAnyOrder(
            Map.entry(stageOne, accountOne),
            Map.entry(stageTwo, accountTwo),
            Map.entry(stageThree, accountThree));

    assertThat(accountsByStage.containsStage(stageOne)).isTrue();
    assertThat(accountsByStage.containsStage(stageTwo)).isTrue();
    assertThat(accountsByStage.containsStage(stageThree)).isTrue();

    assertThat(accountsByStage.get(stageOne)).contains(accountOne);
    assertThat(accountsByStage.get(stageTwo)).contains(accountTwo);
    assertThat(accountsByStage.get(stageThree)).contains(accountThree);

    assertThat(accountsByStage.containsStage("FakeStage")).isFalse();
    assertThat(accountsByStage.get("FakeStage")).isEmpty();
  }
}
