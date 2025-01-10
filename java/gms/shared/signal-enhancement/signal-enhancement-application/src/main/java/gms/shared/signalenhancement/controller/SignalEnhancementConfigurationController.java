package gms.shared.signalenhancement.controller;

import static gms.shared.frameworks.common.ContentType.MSGPACK_NAME;

import com.google.common.collect.Table;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.derivedchannel.coi.BeamformingTemplate;
import gms.shared.signalenhancement.api.BeamformingTemplatesRequest;
import gms.shared.signalenhancement.api.FilterDefinitionByUsageByChannelSegment;
import gms.shared.signalenhancement.api.FilterDefinitionByUsageBySignalDetectionHypothesis;
import gms.shared.signalenhancement.api.FilterDefinitionByUsageForChannelSegmentsRequest;
import gms.shared.signalenhancement.api.FilterDefinitionByUsageForSignalDetectionHypothesesRequest;
import gms.shared.signalenhancement.api.FilterDefintionByUsageMapRequest;
import gms.shared.signalenhancement.api.FkSpectraTemplatesRequest;
import gms.shared.signalenhancement.api.ProcessingMaskDefinitionByPhaseByChannel;
import gms.shared.signalenhancement.api.ProcessingMaskDefinitionRequest;
import gms.shared.signalenhancement.api.RotationTemplateByPhaseByStation;
import gms.shared.signalenhancement.api.RotationTemplateRequest;
import gms.shared.signalenhancement.api.webclient.FkReviewablePhasesRequest;
import gms.shared.signalenhancement.coi.filter.FilterDefinitionForDistanceRange;
import gms.shared.signalenhancement.coi.filter.FilterDefsByUsageTable;
import gms.shared.signalenhancement.coi.filter.FilterListDefinition;
import gms.shared.signalenhancement.coi.fk.FkSpectraTemplate;
import gms.shared.signalenhancement.coi.types.FilterDefinitionUsage;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.station.Station;
import io.swagger.v3.oas.annotations.Operation;
import java.util.EnumSet;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(
    value = "/signal-enhancement-configuration",
    produces = {MediaType.APPLICATION_JSON_VALUE, MSGPACK_NAME})
public class SignalEnhancementConfigurationController {

  public static final int CUSTOM_PARTIAL_RESPONSE_CODE = 209;

  private final SignalEnhancementConfigurationService signalEnhancementConfigurationService;

  @Autowired
  public SignalEnhancementConfigurationController(
      SignalEnhancementConfigurationService signalEnhancementConfigurationService) {
    this.signalEnhancementConfigurationService = signalEnhancementConfigurationService;
  }

  /**
   * Finds {@link FilterListDefinition} and returns serialized json response
   *
   * @return
   */
  @GetMapping(value = "/filter-lists-definition")
  @Operation(summary = "retrieves filter lists definition")
  public FilterListDefinition getFilterListsDefinition() {
    return signalEnhancementConfigurationService.filterListDefinition();
  }

  /**
   * Resolves default FilterDefinitions for each of the provided ChannelSegment objects for each
   * FilterDefinitionUsage literal
   *
   * @param request
   * @return {@link FilterDefinitionByUsageByChannelSegments}
   */
  @PostMapping(value = "/default-filter-definitions-for-channel-segments")
  @Operation(summary = "retrieves filter lists definition")
  public ResponseEntity<FilterDefinitionByUsageByChannelSegment>
      getDefaultFilterDefinitionByUsageForChannelSegments(
          @io.swagger.v3.oas.annotations.parameters.RequestBody(
                  description = "List of Channel Segments and an optional event hypothesis")
              @RequestBody
              FilterDefinitionByUsageForChannelSegmentsRequest request) {

    var pair =
        signalEnhancementConfigurationService.getDefaultFilterDefinitionByUsageForChannelSegments(
            request);

    var responseCode =
        Boolean.TRUE.equals(pair.getValue()) ? CUSTOM_PARTIAL_RESPONSE_CODE : HttpStatus.OK.value();

    return ResponseEntity.status(responseCode).body(pair.getLeft());
  }

  /**
   * Resolves default FilterDefinitions for each of the provided SignalDetectionHypothesis objects
   * for each FilterDefinitionUsage literal
   *
   * @param request
   * @return {@link FilterDefinitionByUsageBySignalDetectionHypothesis}
   */
  @PostMapping("/default-filter-definitions-for-signal-detection-hypotheses")
  @Operation(
      summary =
          "Resolves default FilterDefinitions for each of the "
              + "provided SignalDetectionHypothesis objects for each "
              + "FilterDefinitionUsage literal")
  public ResponseEntity<FilterDefinitionByUsageBySignalDetectionHypothesis>
      getByDefaultFilterDefinitionByUsageForSignalDetectionHypotheses(
          @io.swagger.v3.oas.annotations.parameters.RequestBody(
                  description =
                      "List of Signal Detection Hypotheses and an optional event hypothesis")
              @RequestBody
              FilterDefinitionByUsageForSignalDetectionHypothesesRequest request) {

    var pair =
        signalEnhancementConfigurationService
            .getDefaultFilterDefinitionByUsageForSignalDetectionHypothesis(request);

    var responseCode =
        Boolean.TRUE.equals(pair.getValue()) ? CUSTOM_PARTIAL_RESPONSE_CODE : HttpStatus.OK.value();

    return ResponseEntity.status(responseCode).body(pair.getLeft());
  }

  /**
   * Finds a collection of ProcessingMaskDefinitions
   *
   * @param request {@link ProcessingMaskDefinitionsRequest}
   * @return {@link ProcessingMaskDefinitionByPhaseByChannel}
   */
  @PostMapping(value = "/processing-mask-definitions")
  @Operation(
      summary =
          "Retrieves processing mask definitions based on the Channels, "
              + "PhaseTypes, and Operations in the request")
  public ResponseEntity<ProcessingMaskDefinitionByPhaseByChannel> getProcessingMaskDefinitions(
      @io.swagger.v3.oas.annotations.parameters.RequestBody(
              description = "Channels, PhaseTypes, and Processing Operations")
          @RequestBody
          ProcessingMaskDefinitionRequest request) {

    var processingMaskDefinitionByPhaseByChannel =
        signalEnhancementConfigurationService.getProcessingMaskDefinitions(request);

    int responseCode = HttpStatus.OK.value();

    if (!request.getInvalidPhaseTypes().isEmpty()
        || !request.getInvalidProcessingOperations().isEmpty()
        || processingMaskDefinitionByPhaseByChannel
            .getProcessingMaskDefinitionByPhaseByChannel()
            .stream()
            .parallel()
            .anyMatch(item -> item.getProcessingMaskDefinitionByPhase().isEmpty())) {
      responseCode = CUSTOM_PARTIAL_RESPONSE_CODE;
    }

    return ResponseEntity.status(responseCode).body(processingMaskDefinitionByPhaseByChannel);
  }

  /**
   * Resolves a 2-dimensional mapping of {@link Station} name, to {@link PhaseType} name, to {@link
   * FkSpectraTemplate} for each combination of the provided {@link Station}s and {@link PhaseType}s
   * in a {@link BeamformingTemplatesRequest}, returning a response entity with this mapping as the
   * body.
   *
   * @param request {@link BeamformingTemplatesRequest} Request containing the {@link Station}s and
   *     {@link PhaseType}s to resolve templates for.
   * @return {@link ResponseEntity} containing in its body a 2-dimensional mapping of {@link
   *     Station} name, to {@link PhaseType} name, to {@link BeamformingTemplate} for every
   *     successfully resolved template, and with status 200 OK if all configurations resolved, 209
   *     otherwise
   */
  @PostMapping(value = "/beamforming-template")
  @Operation(summary = "retrieves beamforming templates by station, phase type and beam type")
  public ResponseEntity<Table<String, String, BeamformingTemplate>> getBeamformingTemplates(
      @io.swagger.v3.oas.annotations.parameters.RequestBody(
              description = "Station, PhaseTypes and BeamTypes")
          @RequestBody
          BeamformingTemplatesRequest request) {
    var beamFormingTemplates =
        signalEnhancementConfigurationService.getBeamformingTemplates(request);

    var requestedStationNames =
        request.getStations().stream().map(Station::getName).collect(Collectors.toSet());
    var requestedPhaseTypeStrings =
        request.getPhases().stream().map(PhaseType::toString).collect(Collectors.toSet());
    var resolvedStationNames = beamFormingTemplates.rowKeySet();
    var allPhaseTypesResolvedForAllStations =
        beamFormingTemplates.rowMap().values().stream()
                .map(Map::keySet)
                .filter(requestedPhaseTypeStrings::equals)
                .count()
            == beamFormingTemplates.rowMap().size();

    var responseCode =
        requestedStationNames.equals(resolvedStationNames) && allPhaseTypesResolvedForAllStations
            ? HttpStatus.OK.value()
            : CUSTOM_PARTIAL_RESPONSE_CODE;

    return ResponseEntity.status(responseCode).body(beamFormingTemplates);
  }

  /**
   * Resolves a 2-dimensional mapping of {@link Station} name, to {@link PhaseType} name, to {@link
   * FkSpectraTemplate} for each combination of the provided {@link Station}s and {@link PhaseType}s
   * in a {@link FkSpectratemplatesRequest}, returning a response entity with this mapping as the
   * body.
   *
   * @param request {@link fkSpectraTemplatesRequest} Request containing the {@link Station}s and
   *     {@link PhaseType}s to resolve templates for.
   * @return {@link ResponseEntity} containing in its body a 2-dimensional mapping of {@link
   *     Station} name, to {@link PhaseType} name, to {@link FkSpectraTemplate} for every
   *     successfully resolved template, and with status 200 OK if all configurations resolved, 209
   *     otherwise
   */
  @PostMapping(value = "/fk-spectra-templates")
  @Operation(summary = "retrieves FK Spectra templates by requested stations and phases")
  public ResponseEntity<Table<String, String, FkSpectraTemplate>> getFkSpectraTemplates(
      @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Stations, PhaseTypes")
          @RequestBody
          FkSpectraTemplatesRequest request) {
    var fkSpectraTemplates = signalEnhancementConfigurationService.getFkSpectraTemplates(request);

    var requestedStationNames =
        request.stations().stream().map(Station::getName).collect(Collectors.toSet());
    var requestedPhaseTypeStrings =
        request.phases().stream().map(PhaseType::toString).collect(Collectors.toSet());
    var resolvedStationNames = fkSpectraTemplates.rowKeySet();
    var allPhaseTypesResolvedForAllStations =
        fkSpectraTemplates.rowMap().values().stream()
                .map(Map::keySet)
                .filter(requestedPhaseTypeStrings::equals)
                .count()
            == fkSpectraTemplates.rowMap().size();

    var responseCode =
        requestedStationNames.equals(resolvedStationNames) && allPhaseTypesResolvedForAllStations
            ? HttpStatus.OK.value()
            : CUSTOM_PARTIAL_RESPONSE_CODE;

    return ResponseEntity.status(responseCode).body(fkSpectraTemplates);
  }

  /**
   * Resolves a mapping of {@link Station} names to reviewable {@link PhaseType}s given {@link
   * Station}s and an activity {@link gms.shared.workflow.coi.WorkflowDefinitionId}
   *
   * @param request {@link FkReviewablePhasesRequest}
   * @return A mapping of {@link Station} names to reviewable {@link PhaseType}s
   */
  @PostMapping(value = "/fk-reviewable-phases")
  @Operation(summary = "retrieves FK reviewable phases by station for given stations and activity")
  public ResponseEntity<Map<String, Set<PhaseType>>> getFkReviewablePhases(
      @io.swagger.v3.oas.annotations.parameters.RequestBody(
              description = "Station, Activity ID (WorkflowDefinitionId)")
          @RequestBody
          FkReviewablePhasesRequest request) {
    var fkReviewablePhases = signalEnhancementConfigurationService.getFkReviewablePhases(request);

    var requestedStationEntities =
        request.stations().stream().map(Station::toEntityReference).collect(Collectors.toSet());
    var resolvedStationEntities =
        fkReviewablePhases.keySet().stream()
            .map(Station::toEntityReference)
            .collect(Collectors.toSet());
    var responseCode =
        requestedStationEntities.equals(resolvedStationEntities)
            ? HttpStatus.OK.value()
            : CUSTOM_PARTIAL_RESPONSE_CODE;

    var response =
        fkReviewablePhases.entrySet().stream()
            .collect(Collectors.toMap(entry -> entry.getKey().getName(), Entry::getValue));

    return ResponseEntity.status(responseCode).body(response);
  }

  /**
   * Resolves a mapping of {@link Channel} to {@link PhaseType} to {@link FilterDefinitionUsage} by
   * {@link FilterDefinitionForDistanceRange} populated with channel and phase type requested.
   *
   * @param request the request to populate
   * @return A Table consisting of rows of Maps of {@link FilterDefinitionUsage} to List of {@link
   *     FilterDefinitionForDistanceRange}s
   */
  @PostMapping(value = "/default-filter-definitions-by-usage-map")
  @Operation(
      summary =
          "retrieves Filter Definitions by Usage map for all combinations of given phases and"
              + " channels")
  public ResponseEntity<FilterDefsByUsageTable> getDefaultFilterDefinitionsByUsageMap(
      @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Channels, Phases")
          @RequestBody
          FilterDefintionByUsageMapRequest request) {

    var updatedPhases = EnumSet.of(PhaseType.UNSET);
    updatedPhases.addAll(request.phases());
    request = new FilterDefintionByUsageMapRequest(request.channels(), updatedPhases);

    var responseCode = HttpStatus.OK.value();

    var filterDefinitionForDistanceRangeByUsageMap =
        signalEnhancementConfigurationService.getDefaultDefinitionByUsageMap(request);

    // validate for each channel and phase pair exists in the map, if it does not then return a 209
    for (Channel channel : request.channels()) {
      for (PhaseType phase : request.phases()) {
        if (!filterDefinitionForDistanceRangeByUsageMap
            .filterDefinitionIdsByUsage()
            .contains(channel.getName(), phase)) {
          responseCode = CUSTOM_PARTIAL_RESPONSE_CODE;
          break;
        }
      }
      // shortcutting outer for loop, if it already is partial break out
      if (responseCode == CUSTOM_PARTIAL_RESPONSE_CODE) {
        break;
      }
    }

    return ResponseEntity.status(responseCode).body(filterDefinitionForDistanceRangeByUsageMap);
  }

  /**
   * Resolves a {@link RotationTemplateByPhaseByStation} for all the combinations of {@link
   * Station}s and {@link PhaseType}s that are in the request
   *
   * @param request the request to populate
   * @return A Map of RotationTemplates By Phase By Station
   */
  @PostMapping(value = "/rotation-templates")
  @Operation(
      summary =
          "retrieves a RotationTemplates map By Phase and Station for all"
              + " combinations of given phases and stations")
  public ResponseEntity<RotationTemplateByPhaseByStation> getRotationTemplates(
      @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Stations, Phases")
          @RequestBody
          RotationTemplateRequest request) {

    return ResponseEntity.status(HttpStatus.OK.value())
        .body(
            new RotationTemplateByPhaseByStation(
                signalEnhancementConfigurationService.getRotationTemplates(request)));
  }
}
