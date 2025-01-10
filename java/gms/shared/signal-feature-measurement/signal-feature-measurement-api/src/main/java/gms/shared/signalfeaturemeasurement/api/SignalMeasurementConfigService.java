package gms.shared.signalfeaturemeasurement.api;

import gms.shared.signalfeaturemeasurement.api.request.AmplitudeMeasurementConditioningTemplateRequest;
import gms.shared.signalfeaturemeasurement.api.request.AmplitudeMeasurementTypeRequest;
import gms.shared.signalfeaturemeasurement.coi.AmplitudeMeasurementConditioningTemplateByStationByType;
import gms.shared.signalfeaturemeasurement.coi.AmplitudeMeasurementDefinition;
import gms.shared.signalfeaturemeasurement.coi.StationsByFeatureMeasurementType;
import java.util.Collection;

/**
 * SignalMeasurementConfigService defining SignalFeatureMeasurementConfigurationService for
 * configuration resolver operations
 */
public interface SignalMeasurementConfigService {

  /**
   * Resolve the {@link Station}s from the collection of {@link AmplitudeMeasurementType}s
   *
   * @param amplitudeMeasurementTypeRequest input request {@link AmplitudeMeasurementTypeRequest}
   * @return map of {@link StationsByFeatureMeasurementType}
   */
  StationsByFeatureMeasurementType getDefaultStationsToMeasureByAmplitudeType(
      AmplitudeMeasurementTypeRequest amplitudeMeasurementTypeRequest);

  /**
   * Resolve the {@link AmplitudeMeasurementDefinition} associated with the input request {@link
   * AmplitudeMeasurementTypeRequest}
   *
   * @param amplitudeMeasurementTypeRequest input request {@link AmplitudeMeasurementTypeRequest}
   * @return collection of {@link AmplitudeMeasurementDefinition}s
   */
  Collection<AmplitudeMeasurementDefinition> getAmplitudeMeasurementDefinitions(
      AmplitudeMeasurementTypeRequest amplitudeMeasurementTypeRequest);

  /**
   * Resolve the {@link AmplitudeMeasurementConditioningTemplateByStationByType} associated with the
   * input request {@link AmplitudeMeasurementConditioningTemplateRequest}
   *
   * @param amplitudeMeasurementConditioningTemplateRequest input of {@link
   *     AmplitudeMeasurementConditioningTemplateRequest}
   * @return {@link AmplitudeMeasurementConditioningTemplateByStationByType}
   */
  AmplitudeMeasurementConditioningTemplateByStationByType
      getAmplitudeMeasurementConditioningTemplates(
          AmplitudeMeasurementConditioningTemplateRequest
              amplitudeMeasurementConditioningTemplateRequest);
}
