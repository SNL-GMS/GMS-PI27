package gms.shared.event.analysis;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.event.coi.LocationRestraint;
import gms.shared.event.coi.RestraintType;
import gms.shared.event.coi.ScalingFactorType;
import gms.shared.utilities.test.JsonTestUtilities;
import java.util.Collection;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class EventRelocationProcessingDefinitionTest {

  private static EventRelocationPredictorDefinition defaultPredictorDefinition =
      EventRelocationPredictorDefinition.builder()
          .setPredictor("default")
          .setEarthModel("default earth model")
          .build();

  private static Collection<EventRelocationPredictorDefinition>
      eventRelocationPredictorDefinitions =
          List.of(
              EventRelocationPredictorDefinition.builder()
                  .setPredictor("predictor 1")
                  .setEarthModel("earth model 1")
                  .build());

  private static Collection<LocationRestraint> locationRestraints =
      List.of(
          LocationRestraint.builder()
              .setDepthRestraintType(RestraintType.UNRESTRAINED)
              .setPositionRestraintType(RestraintType.UNRESTRAINED)
              .setTimeRestraintType(RestraintType.UNRESTRAINED)
              .build());

  private static Collection<LocationUncertaintyDefinition> locationUncertaintyDefinitions =
      List.of(
          LocationUncertaintyDefinition.builder()
              .setConfidenceLevel(0.5)
              .setEllipsoid(true)
              .setKWeight(0.0)
              .setScalingFactorType(ScalingFactorType.CONFIDENCE)
              .build());

  private static ResidualDefinition residualDefinition =
      ResidualDefinition.builder()
          .setAllowBigResidual(true)
          .setBigResidualThreshold(0.0)
          .setMaxFraction(0.0)
          .build();

  @ParameterizedTest
  @MethodSource("preconditionsArguments")
  void testPreconditions(EventRelocationProcessingDefinition.Builder erpdBuilder) {
    Assertions.assertThrows(IllegalArgumentException.class, () -> erpdBuilder.build());
  }

  private static Stream<Arguments> preconditionsArguments() {
    var erpd =
        EventRelocationProcessingDefinition.builder()
            .setDefaultPredictorDefinition(defaultPredictorDefinition)
            .setEventRelocationPredictorDefinitions(List.of())
            .setEventRelocator("event relocator")
            .setLocationRestraints(locationRestraints)
            .setLocationUncertaintyDefinitions(locationUncertaintyDefinitions)
            .setResidualDefinition(residualDefinition)
            .build();

    return Stream.of(
        arguments(erpd.toBuilder().setLocationRestraints(List.of())),
        arguments(erpd.toBuilder().setLocationUncertaintyDefinitions(List.of())),
        arguments(erpd.toBuilder().setEventRelocator("")),
        arguments(
            EventRelocationProcessingDefinition.builder(erpd)
                .setEventRelocationPredictorDefinitions(
                    List.of(
                        EventRelocationPredictorDefinition.builder()
                            .setPredictor("predictor 1")
                            .setEarthModel("earth model 1")
                            .build(),
                        EventRelocationPredictorDefinition.builder()
                            .setPredictor("predictor 1")
                            .setEarthModel("earth model 2")
                            .build()))));
  }

  @Test
  void testGetDefinition() {
    var erpd =
        EventRelocationProcessingDefinition.builder()
            .setDefaultPredictorDefinition(defaultPredictorDefinition)
            .setEventRelocationPredictorDefinitions(eventRelocationPredictorDefinitions)
            .setEventRelocator("event relocator")
            .setLocationRestraints(locationRestraints)
            .setLocationUncertaintyDefinitions(locationUncertaintyDefinitions)
            .setResidualDefinition(residualDefinition)
            .build();

    assertEquals(
        defaultPredictorDefinition, erpd.getEventRelocationPredictorDefinition("predictor 2"));
    assertEquals(
        eventRelocationPredictorDefinitions.toArray()[0],
        erpd.getEventRelocationPredictorDefinition("predictor 1"));
  }

  @Test
  void testSerialization() {
    var erpd =
        EventRelocationProcessingDefinition.builder()
            .setDefaultPredictorDefinition(defaultPredictorDefinition)
            .setEventRelocationPredictorDefinitions(eventRelocationPredictorDefinitions)
            .setEventRelocator("event relocator")
            .setLocationRestraints(locationRestraints)
            .setLocationUncertaintyDefinitions(locationUncertaintyDefinitions)
            .setResidualDefinition(residualDefinition)
            .build();

    JsonTestUtilities.assertSerializes(erpd, EventRelocationProcessingDefinition.class);
  }
}
