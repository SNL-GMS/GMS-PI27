package gms.shared.signalfeaturemeasurement.controller;

import static gms.shared.frameworks.common.ContentType.MSGPACK_NAME;

import gms.shared.frameworks.service.InvalidInputException;
import gms.shared.signalfeaturemeasurement.api.request.AmplitudeMeasurementConditioningTemplateRequest;
import gms.shared.signalfeaturemeasurement.api.request.AmplitudeMeasurementTypeRequest;
import gms.shared.signalfeaturemeasurement.coi.AmplitudeMeasurementConditioningTemplateByStationByType;
import gms.shared.signalfeaturemeasurement.coi.AmplitudeMeasurementDefinition;
import gms.shared.signalfeaturemeasurement.coi.StationsByFeatureMeasurementType;
import gms.shared.signalfeaturemeasurement.service.SignalFeatureMeasurementConfigurationService;
import io.swagger.v3.oas.annotations.Operation;
import java.util.Collection;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(
    value = "/signal-feature-measurement-configuration",
    produces = {MediaType.APPLICATION_JSON_VALUE, MSGPACK_NAME})
public class SignalFeatureMeasurementConfigurationController {
  public static final int CUSTOM_PARTIAL_RESPONSE_CODE = 209;
  public static final String LIST_INPUT_STRING =
      "Provided AmplitudeMeasurementTypes List must not be empty";

  private final SignalFeatureMeasurementConfigurationService
      signalFeatureMeasurementConfigurationService;

  @Autowired
  public SignalFeatureMeasurementConfigurationController(
      SignalFeatureMeasurementConfigurationService signalFeatureMeasurementConfigurationService) {
    this.signalFeatureMeasurementConfigurationService =
        signalFeatureMeasurementConfigurationService;
  }

  @PostMapping(value = "/default-stations-by-amplitude-type")
  @Operation(summary = "retrieves stations to measure by amplitude type")
  public StationsByFeatureMeasurementType getDefaultStationsToMeasureByAmplitudeType(
      @io.swagger.v3.oas.annotations.parameters.RequestBody(
              description = "A list of feature measurement types")
          @RequestBody
          AmplitudeMeasurementTypeRequest amplitudeMeasurementTypeRequest) {
    if (amplitudeMeasurementTypeRequest.amplitudeMeasurementTypes().isEmpty()) {
      throw new InvalidInputException(LIST_INPUT_STRING);
    }
    SignalFeatureMeasurementConfigurationService.validateAmplitudeMeasurementInputs(
        amplitudeMeasurementTypeRequest.amplitudeMeasurementTypes());
    return signalFeatureMeasurementConfigurationService.getDefaultStationsToMeasureByAmplitudeType(
        amplitudeMeasurementTypeRequest);
  }

  @PostMapping(value = "/amplitude-measurement-definition")
  @Operation(summary = "retrieves amplitude measurement definitions by amplitude type")
  public Collection<AmplitudeMeasurementDefinition> getAmplitudeMeasurementDefinitions(
      @io.swagger.v3.oas.annotations.parameters.RequestBody(
              description = "A list of feature measurement types")
          @RequestBody
          AmplitudeMeasurementTypeRequest amplitudeMeasurementTypeRequest) {
    if (amplitudeMeasurementTypeRequest.amplitudeMeasurementTypes().isEmpty()) {
      throw new InvalidInputException(LIST_INPUT_STRING);
    }
    SignalFeatureMeasurementConfigurationService.validateAmplitudeMeasurementInputs(
        amplitudeMeasurementTypeRequest.amplitudeMeasurementTypes());
    return signalFeatureMeasurementConfigurationService.getAmplitudeMeasurementDefinitions(
        amplitudeMeasurementTypeRequest);
  }

  @PostMapping(value = "/amplitude-measurement-conditioning-template")
  @Operation(
      summary =
          "Retrieves the AmplitudeMeasurementConditioningTemplate for each Station, "
              + "FeatureMeasurementType in the AmplitudeMeasurementConditioningTemplateRequest")
  public ResponseEntity<AmplitudeMeasurementConditioningTemplateByStationByType>
      getAmplitudeMeasurementConditioningTemplates(
          @io.swagger.v3.oas.annotations.parameters.RequestBody(
                  description =
                      "Request containing the parameter lists of AmplitudeMeasurementTypes and"
                          + " Stations")
              @RequestBody
              AmplitudeMeasurementConditioningTemplateRequest
                  amplitudeMeasurementConditioningTemplateRequest) {

    if (amplitudeMeasurementConditioningTemplateRequest.amplitudeMeasurementTypes().isEmpty()) {
      throw new InvalidInputException(LIST_INPUT_STRING);
    } else if (amplitudeMeasurementConditioningTemplateRequest.stations().isEmpty()) {
      throw new InvalidInputException("Provided Stations List must not be empty");
    } else {
      SignalFeatureMeasurementConfigurationService.validateAmplitudeMeasurementInputs(
          amplitudeMeasurementConditioningTemplateRequest.amplitudeMeasurementTypes());
    }
    var responseCode = HttpStatus.OK.value();

    var configData =
        signalFeatureMeasurementConfigurationService.getAmplitudeMeasurementConditioningTemplates(
            amplitudeMeasurementConditioningTemplateRequest);

    if (isPartialResponse(amplitudeMeasurementConditioningTemplateRequest, configData)) {
      responseCode = CUSTOM_PARTIAL_RESPONSE_CODE;
    }

    return ResponseEntity.status(responseCode).body(configData);
  }

  private static boolean isPartialResponse(
      AmplitudeMeasurementConditioningTemplateRequest request,
      AmplitudeMeasurementConditioningTemplateByStationByType configData) {
    var requestStations = request.stations().stream().map(station -> station.getName()).toList();

    var configDataStations =
        configData.table().columnKeySet().stream().map(station -> station.getName()).toList();

    return !requestStations.equals(configDataStations);
  }
}
