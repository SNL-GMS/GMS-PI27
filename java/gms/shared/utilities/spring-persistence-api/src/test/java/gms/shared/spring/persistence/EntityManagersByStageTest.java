package gms.shared.spring.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import jakarta.persistence.EntityManager;
import java.util.Map;
import org.junit.jupiter.api.Test;

class EntityManagersByStageTest {

  @Test
  void testCommonMapMethods() {

    EntityManager emOne = mock(EntityManager.class);
    EntityManager emTwo = mock(EntityManager.class);
    EntityManager emThree = mock(EntityManager.class);

    String stageOne = "Stage1";
    String stageTwo = "Stage2";
    String stageThree = "Stage3";

    EntityManagersByStage emsByStage =
        new EntityManagersByStage(Map.of(stageOne, emOne, stageTwo, emTwo, stageThree, emThree));

    assertThat(emsByStage.size()).isEqualTo(3);

    assertThat(emsByStage.getStages()).containsExactlyInAnyOrder(stageOne, stageTwo, stageThree);
    assertThat(emsByStage.stages()).containsExactlyInAnyOrder(stageOne, stageTwo, stageThree);
    assertThat(emsByStage.getEntityManagers()).containsExactlyInAnyOrder(emOne, emTwo, emThree);
    assertThat(emsByStage.entityManagers()).containsExactlyInAnyOrder(emOne, emTwo, emThree);
    assertThat(emsByStage.entrySet())
        .containsExactlyInAnyOrder(
            Map.entry(stageOne, emOne), Map.entry(stageTwo, emTwo), Map.entry(stageThree, emThree));

    assertThat(emsByStage.containsStage(stageOne)).isTrue();
    assertThat(emsByStage.containsStage(stageTwo)).isTrue();
    assertThat(emsByStage.containsStage(stageThree)).isTrue();

    assertThat(emsByStage.get(stageOne)).contains(emOne);
    assertThat(emsByStage.get(stageTwo)).contains(emTwo);
    assertThat(emsByStage.get(stageThree)).contains(emThree);

    assertThat(emsByStage.containsStage("FakeStage")).isFalse();
    assertThat(emsByStage.get("FakeStage")).isEmpty();
  }
}
