package gms.shared.signaldetection.api.request;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.google.common.collect.ImmutableList;
import gms.shared.utilities.test.JsonTestUtilities;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class DetectionsWithSegmentsByIdsRequestTest {

  private static final WorkflowDefinitionId STAGE_ID = WorkflowDefinitionId.from("test");

  @ParameterizedTest
  @MethodSource("getCreateValidationArguments")
  void testCreateValidation(
      Class<? extends Exception> expectedException,
      ImmutableList<UUID> detectionIds,
      WorkflowDefinitionId stageId) {

    assertThrows(
        expectedException, () -> DetectionsWithSegmentsByIdsRequest.create(detectionIds, stageId));
  }

  static Stream<Arguments> getCreateValidationArguments() {
    return Stream.of(
        arguments(IllegalStateException.class, ImmutableList.<UUID>builder().build(), STAGE_ID));
  }

  @Test
  void testSerialization() throws JsonProcessingException {
    DetectionsWithSegmentsByIdsRequest request =
        DetectionsWithSegmentsByIdsRequest.create(
            ImmutableList.<UUID>builder()
                .add(UUID.fromString("10000000-100-0000-1000-100000000048"))
                .build(),
            STAGE_ID);
    JsonTestUtilities.assertSerializes(request, DetectionsWithSegmentsByIdsRequest.class);
  }
}
