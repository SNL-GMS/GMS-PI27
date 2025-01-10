package gms.shared.spring.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import java.util.Map;
import org.junit.jupiter.api.Test;

class EntityManagerFactoriesByStageTest {

  @Test
  void testCommonMapMethods() {

    EntityManagerFactory emfOne = mock(EntityManagerFactory.class);
    EntityManagerFactory emfTwo = mock(EntityManagerFactory.class);
    EntityManagerFactory emfThree = mock(EntityManagerFactory.class);

    String stageOne = "Stage1";
    String stageTwo = "Stage2";
    String stageThree = "Stage3";

    EntityManagerFactoriesByStage emfsByStage =
        new EntityManagerFactoriesByStage(
            Map.of(stageOne, emfOne, stageTwo, emfTwo, stageThree, emfThree));

    assertThat(emfsByStage.size()).isEqualTo(3);

    assertThat(emfsByStage.getStages()).containsExactlyInAnyOrder(stageOne, stageTwo, stageThree);
    assertThat(emfsByStage.stages()).containsExactlyInAnyOrder(stageOne, stageTwo, stageThree);
    assertThat(emfsByStage.getEntityManagerFactories())
        .containsExactlyInAnyOrder(emfOne, emfTwo, emfThree);
    assertThat(emfsByStage.entityManagerFactories())
        .containsExactlyInAnyOrder(emfOne, emfTwo, emfThree);
    assertThat(emfsByStage.entrySet())
        .containsExactlyInAnyOrder(
            Map.entry(stageOne, emfOne),
            Map.entry(stageTwo, emfTwo),
            Map.entry(stageThree, emfThree));

    assertThat(emfsByStage.containsStage(stageOne)).isTrue();
    assertThat(emfsByStage.containsStage(stageTwo)).isTrue();
    assertThat(emfsByStage.containsStage(stageThree)).isTrue();

    assertThat(emfsByStage.get(stageOne)).contains(emfOne);
    assertThat(emfsByStage.get(stageTwo)).contains(emfTwo);
    assertThat(emfsByStage.get(stageThree)).contains(emfThree);

    assertThat(emfsByStage.containsStage("FakeStage")).isFalse();
    assertThat(emfsByStage.get("FakeStage")).isEmpty();
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

    String stageOne = "Stage1";
    String stageTwo = "Stage2";
    String stageThree = "Stage3";

    EntityManagerFactoriesByStage emfsByStage =
        new EntityManagerFactoriesByStage(
            Map.of(stageOne, emfOne, stageTwo, emfTwo, stageThree, emfThree));

    EntityManagersByStage emsByStage = emfsByStage.createEntityManagers();
    assertThat(emsByStage.entries())
        .containsExactlyInAnyOrder(
            Map.entry(stageOne, emOne), Map.entry(stageTwo, emTwo), Map.entry(stageThree, emThree));
  }
}
