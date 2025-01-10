package gms.shared.event.analysis.relocation.locoo3d.configuration;

import com.fasterxml.jackson.core.JsonProcessingException;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.analysis.EventRelocationPredictorDefinition;
import gms.shared.event.analysis.EventRelocationProcessingDefinition;
import gms.shared.event.analysis.LocationUncertaintyDefinition;
import gms.shared.event.analysis.ResidualDefinition;
import gms.shared.event.coi.LocationRestraint;
import gms.shared.event.coi.RestraintType;
import gms.shared.event.coi.ScalingFactorType;
import gms.shared.utilities.test.JsonTestUtilities;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class EventRelocationProcessingDefinitionSettingsTest {

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
              .setAprioriStandardError(10.0)
              .setConfidenceLevel(0.5)
              .setEllipsoid(true)
              .setKWeight(Double.POSITIVE_INFINITY)
              .setScalingFactorType(ScalingFactorType.COVERAGE)
              .build());

  private static ResidualDefinition residualDefinition =
      ResidualDefinition.builder()
          .setAllowBigResidual(true)
          .setBigResidualThreshold(0.0)
          .setMaxFraction(0.0)
          .build();

  private static EventRelocationProcessingDefinition erpd =
      EventRelocationProcessingDefinition.builder()
          .setDefaultPredictorDefinition(defaultPredictorDefinition)
          .setEventRelocationPredictorDefinitions(List.of())
          .setEventRelocator("event relocator")
          .setLocationRestraints(locationRestraints)
          .setLocationUncertaintyDefinitions(locationUncertaintyDefinitions)
          .setResidualDefinition(residualDefinition)
          .build();

  private static Map<PhaseType, List<EventRelocationPredictorDefinition>>
      eventRelocationDefinitionByPhaseType =
          Map.of(PhaseType.Pn, List.of(defaultPredictorDefinition));

  private static EventRelocationProcessingDefinitionSettings erpds =
      new EventRelocationProcessingDefinitionSettings(erpd, eventRelocationDefinitionByPhaseType);

  @Test
  void testSerialization() throws JsonProcessingException {
    JsonTestUtilities.assertSerializes(erpds, EventRelocationProcessingDefinitionSettings.class);
  }

  @Test
  void testPropertiesPopulation() {
    Properties properties = new Properties();
    erpds.setProperties(properties);
    Assertions.assertEquals(8, properties.size());
  }
}
