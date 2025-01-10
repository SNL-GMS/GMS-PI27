package gms.shared.event.analysis.relocation.controller;

import static gms.shared.frameworks.common.ContentType.MSGPACK_NAME;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.analysis.EventRelocationPredictorDefinition;
import gms.shared.event.analysis.EventRelocationProcessingDefinition;
import gms.shared.event.analysis.relocation.service.EventRelocationControl;
import gms.shared.event.api.DefiningFeatureMapByChannelAndPhaseType;
import gms.shared.event.api.DefiningFeatureMapRequest;
import gms.shared.event.coi.EventHypothesis;
import io.swagger.v3.oas.annotations.Operation;
import java.util.Collection;
import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(
    value = "/relocation",
    produces = {MediaType.APPLICATION_JSON_VALUE, MSGPACK_NAME})
public class EventRelocationServiceController {

  private final EventRelocationControl eventRelocationControl;

  @Autowired
  public EventRelocationServiceController(EventRelocationControl eventRelocationControl) {
    this.eventRelocationControl = eventRelocationControl;
  }

  @GetMapping(value = "/event-relocation-processing-definition")
  @Operation(summary = "Retrieve the default EventRelocationProcessingDefinition")
  @ResponseBody
  public EventRelocationProcessingDefinition getEventRelocationProcessingDefinition() {
    return eventRelocationControl.getEventRelocationProcessingDefinition();
  }

  @PostMapping(value = "/event-relocation-predictor-definition-by-phasetype")
  @Operation(
      summary =
          "Retrieves a mapping of event relocation predictor definitions by their associated phase"
              + " type")
  public Map<PhaseType, EventRelocationPredictorDefinition>
      getEventRelocationPredictorDefinitionByPhaseType(
          @io.swagger.v3.oas.annotations.parameters.RequestBody(
                  description =
                      "The phase types to retrieve event relocation predictor definitions for",
                  required = true)
              @RequestBody
              Set<PhaseType> phaseTypes) {
    return eventRelocationControl.getEventRelocationPredictorDefinitionByPhaseType(phaseTypes);
  }

  @PostMapping(value = "/default-defining-feature-maps")
  @Operation(summary = "Retrieves a defining feature map by channel and phase type object")
  public DefiningFeatureMapByChannelAndPhaseType getDefaultDefiningFeatureMaps(
      @io.swagger.v3.oas.annotations.parameters.RequestBody(
              description = "The phase types and channels to retrieve defining feature map for",
              required = true)
          @RequestBody
          DefiningFeatureMapRequest request) {
    return eventRelocationControl.getDefiningFeatureMaps(request);
  }

  @PostMapping(value = "/relocate")
  @Operation(summary = "Performs relocation on a set of event hypotheses")
  public Collection<EventHypothesis> relocate(
      @io.swagger.v3.oas.annotations.parameters.RequestBody(
              description =
                  "Contains the event hypotheses to relocate as keys to event relocation"
                      + " definiions, as well as other processing paramters.",
              required = true)
          @RequestBody
          EventRelocationRequest request) {

    return eventRelocationControl.relocate(
        request.eventRelocationDefinitionByEventHypothesis(),
        request.eventRelocationPredictorDefinitionByPhaseType(),
        request.eventRelocationProcessingDefinition());
  }
}
