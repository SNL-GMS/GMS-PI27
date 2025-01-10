package gms.shared.stationdefinition.coi.filter;

import static org.junit.jupiter.api.Assertions.assertThrows;

import gms.shared.stationdefinition.testfixtures.FilterDefinitionTestFixtures;
import gms.shared.stationdefinition.testfixtures.FilterParametersTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class CascadeFilterDescriptionTest {

  @Test
  void testSerialization() {
    var description =
        (CascadeFilterDescription)
            FilterDefinitionTestFixtures.CASCADE__CAUSAL.getFilterDescription();
    JsonTestUtilities.assertSerializes(description, CascadeFilterDescription.class);
    JsonTestUtilities.assertSerializes(
        description.withParameters(FilterParametersTestFixtures.CASCADE),
        CascadeFilterDescription.class);
  }

  @Test
  void testCascadeCausallIsFalse() {
    var description =
        build(
            List.of(
                FilterDefinitionTestFixtures.B__LP__0_0__4_2__1__NON_CAUSAL.getFilterDescription(),
                FilterDefinitionTestFixtures.H__LP__0_0__4_2__48__NON_CAUSAL
                    .getFilterDescription()));
    Assertions.assertFalse(description.isCausal());

    description =
        build(
            List.of(
                FilterDefinitionTestFixtures.B__LP__0_0__4_2__1__NON_CAUSAL.getFilterDescription(),
                FilterDefinitionTestFixtures.B__HP__0_3__0_0__2__CAUSAL.getFilterDescription()));
    Assertions.assertFalse(description.isCausal());
  }

  @Test
  void testCascadeCausalIsTrue() {
    var description =
        build(
            List.of(
                FilterDefinitionTestFixtures.B__BP__2_0__4_0__4__CAUSAL.getFilterDescription(),
                FilterDefinitionTestFixtures.H__BP__0_4__3_5__48__CAUSAL.getFilterDescription()));

    Assertions.assertTrue(description.isCausal());
  }

  @Test
  void testFilterDescriptionListErrorWhenLessThanTwo() {
    var description =
        List.of(FilterDefinitionTestFixtures.B__BP__2_0__4_0__4__CAUSAL.getFilterDescription());
    IllegalArgumentException thrown =
        assertThrows(IllegalArgumentException.class, () -> build(description));

    Assertions.assertEquals(
        "List of filter descriptions must be greater than one", thrown.getMessage());
  }

  private CascadeFilterDescription build(List<FilterDescription> descriptions) {
    return CascadeFilterDescription.from(
        Optional.of("Test Cascade Filter Description Comment"),
        Optional.empty(),
        descriptions,
        Optional.empty());
  }
}
