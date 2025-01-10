package gms.shared.signalfeaturemeasurement.service;

import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableTable;
import com.google.common.collect.Table;
import com.google.common.collect.Tables;
import gms.shared.frameworks.service.InvalidInputException;
import gms.shared.signaldetection.coi.types.AmplitudeMeasurementType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signalfeaturemeasurement.api.SignalMeasurementConfigService;
import gms.shared.signalfeaturemeasurement.api.request.AmplitudeMeasurementConditioningTemplateRequest;
import gms.shared.signalfeaturemeasurement.api.request.AmplitudeMeasurementTypeRequest;
import gms.shared.signalfeaturemeasurement.coi.AmplitudeMeasurementConditioningTemplate;
import gms.shared.signalfeaturemeasurement.coi.AmplitudeMeasurementConditioningTemplateByStationByType;
import gms.shared.signalfeaturemeasurement.coi.AmplitudeMeasurementDefinition;
import gms.shared.signalfeaturemeasurement.coi.StationsByFeatureMeasurementType;
import gms.shared.stationdefinition.coi.station.Station;
import java.util.Collection;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.apache.commons.lang3.tuple.Pair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.stereotype.Service;

@Service
@ComponentScan(basePackages = {"gms.shared.signalfeaturemeasurement", "gms.shared.spring"})
public class SignalFeatureMeasurementConfigurationService
    implements SignalMeasurementConfigService {

  private static final Logger LOGGER =
      LoggerFactory.getLogger(SignalFeatureMeasurementConfigurationService.class);

  private final SignalFeatureMeasurementConfigurationResolver
      signalFeatureMeasurementConfigurationResolver;

  @Autowired
  public SignalFeatureMeasurementConfigurationService(
      SignalFeatureMeasurementConfigurationResolver signalFeatureMeasurementConfigurationResolver) {
    this.signalFeatureMeasurementConfigurationResolver =
        signalFeatureMeasurementConfigurationResolver;
  }

  @Override
  public StationsByFeatureMeasurementType getDefaultStationsToMeasureByAmplitudeType(
      AmplitudeMeasurementTypeRequest amplitudeMeasurementTypeRequest) {
    var amplitudeMeasurementTypes = amplitudeMeasurementTypeRequest.amplitudeMeasurementTypes();

    Preconditions.checkArgument(
        !amplitudeMeasurementTypes.isEmpty(), "Must provide at least one AmplitudeMeasurementType");
    validateAmplitudeMeasurementInputs(amplitudeMeasurementTypes);
    var dataMap =
        amplitudeMeasurementTypes.stream()
            .map(
                type ->
                    Pair.of(
                        type,
                        this.signalFeatureMeasurementConfigurationResolver
                            .getDefaultStationsToMeasure(type)))
            .collect(Collectors.toMap(Pair::getLeft, Pair::getRight));

    return new StationsByFeatureMeasurementType(dataMap);
  }

  @Override
  public Collection<AmplitudeMeasurementDefinition> getAmplitudeMeasurementDefinitions(
      AmplitudeMeasurementTypeRequest amplitudeMeasurementTypeRequest) {
    var amplitudeMeasurementTypes = amplitudeMeasurementTypeRequest.amplitudeMeasurementTypes();

    Preconditions.checkArgument(
        !amplitudeMeasurementTypes.isEmpty(), "Must provide at least one AmplitudeMeasurementType");
    validateAmplitudeMeasurementInputs(amplitudeMeasurementTypes);
    return amplitudeMeasurementTypes.stream()
        .map(this.signalFeatureMeasurementConfigurationResolver::getAmplitudeMeasurementDefinition)
        .distinct()
        .toList();
  }

  @Override
  public AmplitudeMeasurementConditioningTemplateByStationByType
      getAmplitudeMeasurementConditioningTemplates(
          AmplitudeMeasurementConditioningTemplateRequest
              amplitudeMeasurementConditioningTemplateRequest) {

    var amplitudeMeasurementTypesList =
        amplitudeMeasurementConditioningTemplateRequest.amplitudeMeasurementTypes();
    var stationsList = amplitudeMeasurementConditioningTemplateRequest.stations();

    validateAmplitudeMeasurementInputs(amplitudeMeasurementTypesList);

    var configTable =
        amplitudeMeasurementTypesList.stream()
            .parallel()
            .map(
                (AmplitudeMeasurementType measureItem) ->
                    stationsList.stream()
                        .parallel()
                        .map(
                            (Station stationItem) ->
                                signalFeatureMeasurementConfigurationResolver
                                    .getAmplitudeMeasurementConditioningTemplate(
                                        stationItem, measureItem)
                                    .map(
                                        template ->
                                            Tables
                                                .<AmplitudeMeasurementType, Station,
                                                    AmplitudeMeasurementConditioningTemplate>
                                                    immutableCell(
                                                        measureItem, stationItem, template))))
            .flatMap(Function.identity())
            .flatMap(Optional::stream)
            .collect(
                ImmutableTable.toImmutableTable(
                    Table.Cell::getRowKey, Table.Cell::getColumnKey, Table.Cell::getValue));
    return new AmplitudeMeasurementConditioningTemplateByStationByType(configTable);
  }

  public static void validateAmplitudeMeasurementInputs(
      Iterable<AmplitudeMeasurementType> amplitudeMeasurementTypesList) {

    for (FeatureMeasurementType<?> input : amplitudeMeasurementTypesList) {
      var typeValidation =
          FeatureMeasurementTypes.getTypeInstance(input.getFeatureMeasurementTypeName())
              .orElseThrow(
                  () ->
                      new InvalidInputException(
                          "Encountered type ["
                              + input.getFeatureMeasurementTypeName()
                              + "] that isn't a recognized FeatureMeasurementType"));
      if (typeValidation != null && !(typeValidation instanceof AmplitudeMeasurementType)) {
        var msgString =
            "Encountered type ["
                + typeValidation.getFeatureMeasurementTypeName()
                + "] that isn't a recognized AmplitudeMeasurementType";
        LOGGER.error(msgString);
        throw new InvalidInputException(msgString);
      } else if (typeValidation == null) {
        LOGGER.error("Unable to determine type from inputs {}", input);
        throw new InvalidInputException("Unable to determine type from inputs");
      } else {
        // no other case to verify
      }
    }
  }
}
