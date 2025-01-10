package gms.shared.event.analysis.relocation.locoo3d.configuration;

import com.google.common.base.Preconditions;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.analysis.EventRelocationPredictorDefinition;
import gms.shared.event.analysis.EventRelocationProcessingDefinition;
import gms.shared.event.analysis.relocation.locoo3d.utility.ConverterUtility;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Properties;

public record EventRelocationProcessingDefinitionSettings(
    EventRelocationProcessingDefinition eventRelocationProcessingDefinition,
    Map<PhaseType, List<EventRelocationPredictorDefinition>> eventRelocationDefinitionByPhaseType)
    implements PropertiesSetter {

  public EventRelocationProcessingDefinitionSettings {
    Preconditions.checkNotNull(eventRelocationProcessingDefinition);
    Preconditions.checkNotNull(eventRelocationDefinitionByPhaseType);
  }

  @Override
  public Properties setProperties(Properties properties) {
    var residualDefinition = eventRelocationProcessingDefinition.residualDefinition();
    var optionalLocationUncertaintyDefinition =
        eventRelocationProcessingDefinition.locationUncertaintyDefinitions().stream().findFirst();
    properties.setProperty(
        "gen_allow_big_residuals", Boolean.toString(residualDefinition.allowBigResidual()));
    properties.setProperty(
        "gen_big_residual_threshold", Double.toString(residualDefinition.bigResidualThreshold()));
    properties.setProperty(
        "gen_big_residual_max_fraction", Double.toString(residualDefinition.maxFraction()));

    properties.setProperty(
        "loc_predictor_type",
        ConverterUtility.createLocPredictorTypeValue(
            eventRelocationDefinitionByPhaseType, eventRelocationProcessingDefinition));

    if (optionalLocationUncertaintyDefinition.isPresent()) {
      var locationUncertaintyDefinition = optionalLocationUncertaintyDefinition.get();
      properties.setProperty(
          "gen_error_ellipse_type", locationUncertaintyDefinition.scalingFactorType().toString());
      properties.setProperty(
          "gen_jordan_sverdrup_k", Double.toString(locationUncertaintyDefinition.kWeight()));

      Optional.ofNullable(locationUncertaintyDefinition.aprioriStandardError())
          .ifPresent(
              value ->
                  properties.setProperty("gen_apriori_standard_error", Double.toString(value)));

      properties.setProperty(
          "gen_confidence_level", Double.toString(locationUncertaintyDefinition.confidenceLevel()));
    }

    return properties;
  }
}
